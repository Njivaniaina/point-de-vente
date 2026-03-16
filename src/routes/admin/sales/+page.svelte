<script lang="ts">
  import type { PageData } from './$types.js';

  let { data } = $props() as any;
  let sales = $state(data.sales as any[]);
  let search = $state('');
  let selectedSale = $state<any>(null);
  let saleItems = $state<any[]>([]);
  let loadingPDF = $state(false);

  let filtered = $derived(sales.filter((s: any) =>
    s.invoice_ref.toLowerCase().includes(search.toLowerCase()) ||
    (s.client_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    s.pos_name.toLowerCase().includes(search.toLowerCase())
  ));


  async function viewSale(id: number) {
    const res = await fetch(`/api/sales/${id}`);
    const data = await res.json();
    selectedSale = data.sale;
    saleItems = data.items;
  }

  function downloadInvoice(data: { sale: any, items: any[], settings: any }) {
    const sale = data.sale;
    const items = data.items;
    let text = `${data.settings.shop_name} - FACTURE ${sale.invoice_ref}\n`;
    text += `==========================================\n`;
    text += `Date: ${new Date(sale.created_at).toLocaleString('fr-FR')}\n`;
    text += `Caisse: ${sale.pos_name}\n`;
    text += `Client: ${sale.client_name ?? 'Anonyme'}\n`;
    text += `Paiement: ${paymentLabels[sale.payment_method]}${sale.card_number ? ' (' + sale.card_number + ')' : ''}\n`;
    text += `------------------------------------------\n`;
    items.forEach((item: any) => {
      text += `${item.product_name.padEnd(25)} x${item.quantity}  ${formatPrice(item.subtotal)}\n`;
    });
    text += `------------------------------------------\n`;
    text += `TOTAL: ${formatPrice(sale.total_amount)}\n`;
    text += `==========================================\n`;
    text += `Merci de votre visite !\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture_${sale.invoice_ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportToPDF(invoiceRef: string) {
    const element = document.getElementById('thermal-ticket');
    if (!element) return;
    
    // @ts-ignore
    const html2pdf = window.html2pdf;
    if (!html2pdf) {
      alert("Erreur: Le module PDF n'est pas chargé. Veuillez patienter ou actualiser la page.");
      return;
    }

    loadingPDF = true;
    const opt = {
      margin:       5,
      filename:     `ticket_${invoiceRef}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      loadingPDF = false;
    }
  }

  const paymentLabels: Record<string, string> = { cash: 'Espèces', card: 'Carte' };

  let currencyFormat = $derived(new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: data.settings.currency || 'MGA',
    currencyDisplay: 'symbol'
  }));

  function formatPrice(amount: number, saleContext?: any) {
    const currency = saleContext ? (saleContext.currency || 'MGA') : (data.settings.currency || 'MGA');
    
    // For historical invoices, we use the stored rate if available
    const rate = saleContext 
      ? parseFloat(saleContext.exchange_rate || '1') 
      : parseFloat(data.settings[currency.toLowerCase() + '_rate'] || '1');

    if (currency === 'MGA') {
      return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
    }
    
    const converted = amount / (rate || 1);
    
    // Create a local formatter for the specific currency if it's historical
    const formatter = saleContext ? new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }) : currencyFormat;

    return formatter.format(converted);
  }
</script>

<style>
  @media print {
    :global(body) { background: white !important; }
    #thermal-ticket { 
      width: 80mm !important; 
      margin: 0 !important; 
      padding: 0 !important;
      position: absolute;
      top: 0;
      left: 0;
    }
    :global(.fixed) { position: absolute !important; }
  }
</style>

<svelte:head>
  <title>Ventes — ShopPOS</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Historique des ventes</h1>
    <p class="text-gray-500 text-sm mt-1">{filtered.length} vente(s)</p>
  </div>

  <div class="relative">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
    <input bind:value={search} placeholder="Rechercher par ref, client ou caisse..." class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>

  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Référence</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Caisse</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Client</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Paiement</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600">Montant</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600">Date</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each filtered as sale}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{sale.invoice_ref}</td>
              <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">{sale.pos_name}</td>
              <td class="px-4 py-3 text-gray-600 hidden md:table-cell">{sale.client_name ?? 'Anonyme'}</td>
              <td class="px-4 py-3 hidden lg:table-cell">
                <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{paymentLabels[sale.payment_method] ?? sale.payment_method}</span>
              </td>
              <td class="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatPrice(sale.total_amount, sale)}</td>
              <td class="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">{new Date(sale.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              <td class="px-4 py-3 text-right">
                <button onclick={() => viewSale(sale.id)} class="text-blue-600 hover:text-blue-800 text-xs font-semibold underline">Voir</button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="7" class="px-4 py-12 text-center text-gray-400">Aucune vente</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if selectedSale}
  <div 
    class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto" 
  >
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-[300px] overflow-hidden" onclick={(e) => e.stopPropagation()}>
      <!-- Modal Header (Controls) -->
      <div class="bg-gray-100 px-4 py-3 flex items-center justify-between border-b print:hidden">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Aperçu du ticket</span>
        <div class="flex gap-2">
          <button 
            type="button"
            onclick={() => exportToPDF(selectedSale.invoice_ref)} 
            disabled={loadingPDF}
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            {#if loadingPDF}
              <span class="animate-spin text-[10px]">⌛</span>
            {/if}
            PDF
          </button>
          <button 
            type="button"
            onclick={() => window.print()} 
            disabled={loadingPDF}
            class="bg-gray-800 hover:bg-gray-950 disabled:opacity-50 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            PRINT
          </button>
        </div>
      </div>

      <!-- Thermal Ticket Body -->
      <div id="thermal-ticket" class="bg-white p-6 font-mono text-[13px] text-gray-900 leading-tight print:p-0">
        <div class="text-center space-y-1 mb-6">
          <h2 class="font-black text-xl uppercase italic">{data.settings.shop_name}</h2>
          <p class="text-xs">{data.settings.shop_address}</p>
          <p class="text-xs">Tél: {data.settings.shop_phone}</p>
          <div class="border-b border-dashed border-gray-400 my-2 pt-2"></div>
          <p class="font-bold">FACTURÉ LE {new Date(selectedSale.created_at).toLocaleDateString('fr-FR')}</p>
          <p class="text-[11px]">{new Date(selectedSale.created_at).toLocaleTimeString('fr-FR')}</p>
        </div>

        <div class="space-y-1 mb-4">
          <div class="flex justify-between"><span>REF:</span><span class="font-bold">{selectedSale.invoice_ref}</span></div>
          <div class="flex justify-between"><span>CAISSE:</span><span>{selectedSale.pos_name}</span></div>
          <div class="flex justify-between"><span>CLIENT:</span><span>{selectedSale.client_name ?? 'Anonyme'}</span></div>
          <div class="flex justify-between uppercase">
            <span>PAIEMENT:</span>
            <span>
              {paymentLabels[selectedSale.payment_method]}
              {#if selectedSale.card_number}
                <br/><span class="text-[10px] text-gray-500 italic">#{selectedSale.card_number}</span>
              {/if}
            </span>
          </div>
        </div>

        <div class="border-b border-dashed border-gray-400 my-3"></div>

        <table class="w-full text-[12px] mb-4">
          <thead>
            <tr class="text-left"><th class="pb-1">ART</th><th class="pb-1 text-center font-normal">QTÉ</th><th class="pb-1 text-right font-normal">P.U</th><th class="pb-1 text-right">TOTAL</th></tr>
          </thead>
          <tbody class="divide-y divide-dashed divide-gray-200">
            {#each saleItems as item}
              <tr>
                <td class="py-1 uppercase font-bold text-[11px] truncate max-w-[100px]">{item.product_name}</td>
                <td class="py-1 text-center">{item.quantity}</td>
                <td class="py-1 text-right text-[11px]">{formatPrice(item.unit_price, selectedSale)}</td>
                <td class="py-1 text-right font-bold">{formatPrice(item.subtotal, selectedSale)}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <div class="border-t border-dashed border-gray-400 pt-3 space-y-1 mb-4 text-[12px]">
          <div class="flex justify-between uppercase">
            <span>SOUS-TOTAL</span>
            <span>{formatPrice(selectedSale.subtotal, selectedSale)}</span>
          </div>
          <div class="flex justify-between uppercase">
            <span>TAXE ({selectedSale.tax_rate}%)</span>
            <span>{formatPrice(selectedSale.tax_amount, selectedSale)}</span>
          </div>
        </div>

        <div class="border-t-2 border-double border-gray-900 pt-3 flex justify-between items-center mb-6">
          <span class="font-black text-sm uppercase">TOTAL HP</span>
          <span class="text-lg font-black">{formatPrice(selectedSale.total_amount, selectedSale)}</span>
        </div>

        <div class="text-center font-bold italic space-y-1">
          <p>MERCI DE VOTRE VISITE !</p>
          <p class="text-[10px] uppercase font-normal text-gray-500">A conserver - Ticket client</p>
        </div>
      </div>

      <div class="p-4 border-t bg-gray-50 flex justify-end print:hidden">
        <button 
          type="button"
          onclick={() => selectedSale = null} 
          disabled={loadingPDF}
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-8 py-2 rounded-lg text-xs transition-colors shadow-lg"
        >
          FERMER
        </button>
      </div>
    </div>
  </div>
{/if}
