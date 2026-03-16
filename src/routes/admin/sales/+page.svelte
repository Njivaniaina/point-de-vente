<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let sales = $state(data.sales as any[]);
  let search = $state('');
  let selectedSale = $state<any>(null);
  let saleItems = $state<any[]>([]);

  let filtered = $derived(sales.filter((s: any) =>
    s.invoice_ref.toLowerCase().includes(search.toLowerCase()) ||
    (s.client_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    s.pos_name.toLowerCase().includes(search.toLowerCase())
  ));

  function formatMGA(n: number) {
    return new Intl.NumberFormat('fr-MG').format(n) + ' Ar';
  }

  async function viewSale(id: number) {
    const res = await fetch(`/api/sales/${id}`);
    const data = await res.json();
    selectedSale = data.sale;
    saleItems = data.items;
  }

  const paymentLabels: Record<string, string> = { cash: 'Espèces', card: 'Carte', mobile: 'Mobile Money' };
</script>

<svelte:head><title>Ventes — ShopPOS</title></svelte:head>

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
              <td class="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatMGA(sale.total_amount)}</td>
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
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick={() => selectedSale = null}>
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onclick={(e) => e.stopPropagation()}>
      <div class="bg-gray-950 px-6 py-5 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Facture</p>
            <h2 class="font-bold font-mono">{selectedSale.invoice_ref}</h2>
          </div>
          <button onclick={() => window.print()} class="bg-blue-600 hover:bg-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">🖨 Imprimer</button>
        </div>
      </div>
      <div class="p-6 space-y-4 print:text-black" id="invoice-print">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><p class="text-gray-400 text-xs">Caisse</p><p class="font-medium">{selectedSale.pos_name}</p></div>
          <div><p class="text-gray-400 text-xs">Client</p><p class="font-medium">{selectedSale.client_name ?? 'Anonyme'}</p></div>
          <div><p class="text-gray-400 text-xs">Mode de paiement</p><p class="font-medium">{paymentLabels[selectedSale.payment_method] ?? selectedSale.payment_method}</p></div>
          <div><p class="text-gray-400 text-xs">Date</p><p class="font-medium text-xs">{new Date(selectedSale.created_at).toLocaleString('fr-FR')}</p></div>
        </div>
        <div class="border-t pt-4">
          <table class="w-full text-sm">
            <thead><tr class="text-gray-400 text-xs"><th class="text-left pb-2">Article</th><th class="text-right pb-2">Qté</th><th class="text-right pb-2">P.U.</th><th class="text-right pb-2">Total</th></tr></thead>
            <tbody class="divide-y divide-gray-50">
              {#each saleItems as item}
                <tr>
                  <td class="py-2">{item.product_name}</td>
                  <td class="py-2 text-right">{item.quantity}</td>
                  <td class="py-2 text-right whitespace-nowrap">{new Intl.NumberFormat('fr-MG').format(item.unit_price)} Ar</td>
                  <td class="py-2 text-right font-semibold whitespace-nowrap">{new Intl.NumberFormat('fr-MG').format(item.subtotal)} Ar</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="border-t pt-3 flex justify-between items-center">
          <span class="text-gray-600 font-semibold">Total</span>
          <span class="text-xl font-black text-gray-900">{new Intl.NumberFormat('fr-MG').format(selectedSale.total_amount)} Ar</span>
        </div>
      </div>
    </div>
  </div>
{/if}
