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
  <title>Ventes — {data.settings.shop_name || 'ShopPOS'}</title>
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
      <div id="thermal-ticket" style="background-color: #ffffff; color: #000000; padding: 24px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; line-height: 1.25;" class="print:p-0">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-weight: 900; font-size: 20px; text-transform: uppercase; font-style: italic; margin: 0;">{data.settings.shop_name}</h2>
          <p style="font-size: 12px; margin: 4px 0 0 0;">{data.settings.shop_address}</p>
          <p style="font-size: 12px; margin: 4px 0 0 0;">Tél: {data.settings.shop_phone}</p>
          <div style="border-bottom: 1px dashed #9ca3af; margin: 8px 0; padding-top: 8px;"></div>
          <p style="font-weight: bold; margin: 0;">FACTURÉ LE {new Date(selectedSale.created_at).toLocaleDateString('fr-FR')}</p>
          <p style="font-size: 11px; margin: 0;">{new Date(selectedSale.created_at).toLocaleTimeString('fr-FR')}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between;"><span>REF:</span><span style="font-weight: bold;">{selectedSale.invoice_ref}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>CAISSE:</span><span>{selectedSale.pos_name}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>CLIENT:</span><span>{selectedSale.client_name ?? 'Anonyme'}</span></div>
          <div style="display: flex; justify-content: space-between; text-transform: uppercase;">
            <span>PAIEMENT:</span>
            <span style="text-align: right;">
              {paymentLabels[selectedSale.payment_method]}
              {#if selectedSale.card_number}
                <br/><span style="font-size: 10px; color: #6b7280; font-style: italic;">#{selectedSale.card_number}</span>
              {/if}
            </span>
          </div>
        </div>

        <div style="border-bottom: 1px dashed #9ca3af; margin: 12px 0;"></div>

        <table style="width: 100%; font-size: 12px; margin-bottom: 16px; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left;"><th style="padding-bottom: 4px;">ART</th><th style="padding-bottom: 4px; text-align: center; font-weight: normal;">QTÉ</th><th style="padding-bottom: 4px; text-align: right; font-weight: normal;">P.U</th><th style="padding-bottom: 4px; text-align: right;">TOTAL</th></tr>
          </thead>
          <tbody style="border-top: 1px dashed #e5e7eb;">
            {#each saleItems as item}
              <tr style="border-bottom: 1px dashed #e5e7eb;">
                <td style="padding: 4px 0; text-transform: uppercase; font-weight: bold; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100px;">{item.product_name}</td>
                <td style="padding: 4px 0; text-align: center;">{item.quantity}</td>
                <td style="padding: 4px 0; text-align: right; font-size: 11px;">{formatPrice(item.unit_price, selectedSale)}</td>
                <td style="padding: 4px 0; text-align: right; font-weight: bold;">{formatPrice(item.subtotal, selectedSale)}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #9ca3af; padding-top: 12px; margin-bottom: 16px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; text-transform: uppercase;">
            <span>SOUS-TOTAL</span>
            <span>{formatPrice(selectedSale.subtotal, selectedSale)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; text-transform: uppercase;">
            <span>TAXE ({selectedSale.tax_rate}%)</span>
            <span>{formatPrice(selectedSale.tax_amount, selectedSale)}</span>
          </div>
        </div>

        <div style="border-top: 2px double #000000; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <span style="font-weight: 900; font-size: 14px; text-transform: uppercase;">TOTAL HP</span>
          <span style="font-size: 18px; font-weight: 900;">{formatPrice(selectedSale.total_amount, selectedSale)}</span>
        </div>

        <div style="text-align: center; font-weight: bold; font-style: italic;">
          <p style="margin: 0;">MERCI DE VOTRE VISITE !</p>
          <p style="font-size: 10px; text-transform: uppercase; font-weight: normal; color: #6b7280; margin: 4px 0 0 0;">A conserver - Ticket client</p>
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
