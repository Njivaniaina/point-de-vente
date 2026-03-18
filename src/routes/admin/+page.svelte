<script lang="ts">
  let { data } = $props() as any;

  function formatPrice(amount: number, saleContext?: any) {
    const currency = saleContext ? (saleContext.currency || 'MGA') : (data.settings.currency || 'MGA');
    
    // For historical sales, we use the stored rate if available
    const rate = saleContext 
      ? parseFloat(saleContext.exchange_rate || '1') 
      : parseFloat(data.settings[currency.toLowerCase() + '_rate'] || '1');

    if (currency === 'MGA') {
      return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
    }
    
    const converted = amount / (rate || 1);
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }).format(converted);
  }

  const stats = [
    { label: 'Produits actifs', value: data.productCount, color: 'bg-blue-600', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Clients', value: data.clientCount, color: 'bg-emerald-600', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Ventes aujourd\'hui', value: data.todaySales, color: 'bg-violet-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'CA aujourd\'hui', value: formatPrice(data.todayRevenue), color: 'bg-amber-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];
</script>

<svelte:head>
  <title>Administration — {data.settings.shop_name || 'ShopPOS'}</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Vue d'ensemble de votre activité commerciale</p>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#each stats as stat}
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-3 transition-colors duration-300">
        <div class="flex items-center justify-between">
          <span class="text-gray-500 dark:text-gray-400 text-xs font-medium">{stat.label}</span>
          <div class="{stat.color} w-8 h-8 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon} />
            </svg>
          </div>
        </div>
        <p class="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
      </div>
    {/each}
  </div>

  <!-- Sales Trend Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-semibold text-gray-900 dark:text-white">Tendance des ventes (7 derniers jours)</h2>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span class="w-3 h-3 bg-blue-600 rounded-full"></span> Ventes (Ar)
      </div>
    </div>
    
    <div class="h-48 w-full relative">
      {#if data.salesTrend.length > 1}
        {@const max = Math.max(...data.salesTrend.map((d: any) => d.total), 1000)}
        {@const points = data.salesTrend.map((d: any, i: number) => ({
          x: (i * (700 / (data.salesTrend.length - 1))),
          y: 200 - (d.total / max * 180) - 10
        }))}
        {@const pathData = points.map((p: any, i: number) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')}
        {@const areaData = `${pathData} L ${points[points.length-1].x} 200 L 0 200 Z`}

        <svg class="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
          <path d={pathData} class="stroke-blue-600" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          
          {#each points as p, i}
            <circle cx={p.x} cy={p.y} r="4" class="fill-blue-600 stroke-white dark:stroke-gray-800" stroke-width="2" />
          {/each}
        </svg>
        
        <div class="flex justify-between mt-2">
          {#each data.salesTrend as d}
            <span class="text-[10px] text-gray-400 font-medium">{new Date(d.day).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
          {/each}
        </div>
      {:else}
        <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm italic">
          Pas assez de données pour afficher la tendance
        </div>
      {/if}
    </div>
  </div>

  <div class="grid lg:grid-cols-2 gap-6">
    <!-- Recent Sales -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900 dark:text-white">Ventes récentes</h2>
        <a href="/admin/sales" class="text-blue-600 dark:text-blue-400 text-sm hover:underline">Voir tout</a>
      </div>
      <div class="divide-y divide-gray-50 dark:divide-gray-700">
        {#each data.recentSales as sale}
          <div class="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">{sale.invoice_ref}</p>
              <p class="text-gray-400 dark:text-gray-500 text-xs">{sale.pos_name} · {sale.client_name ?? 'Client anonyme'}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-gray-900 dark:text-white text-sm">{formatPrice(sale.total_amount, sale)}</p>
              <p class="text-gray-400 dark:text-gray-500 text-xs">{new Date(sale.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        {:else}
          <p class="px-6 py-8 text-center text-gray-400 text-sm">Aucune vente enregistrée</p>
        {/each}
      </div>
    </div>

    <!-- Revenue Summary -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white">Résumé financier</h2>
      </div>
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-colors">
          <span class="text-blue-700 dark:text-blue-300 font-medium text-sm">Chiffre d'affaires total</span>
          <span class="text-blue-900 dark:text-blue-100 font-black text-lg">{formatPrice(data.totalRevenue)}</span>
        </div>
        <div class="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl transition-colors">
          <span class="text-amber-700 dark:text-amber-300 font-medium text-sm">Aujourd'hui</span>
          <span class="text-amber-900 dark:text-amber-100 font-black text-lg">{formatPrice(data.todayRevenue)}</span>
        </div>
        <div class="pt-2">
          <a href="/pos" class="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Ouvrir la caisse
          </a>
        </div>
      </div>
    </div>
  </div>

  {#if data.lowStockProducts.length > 0}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden transition-colors duration-300">
      <div class="px-6 py-4 border-b border-red-50 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10 flex items-center gap-2">
        <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 class="font-bold text-red-900 dark:text-red-400">Alerte Stocks Faibles</h2>
      </div>
      <div class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50/50 dark:bg-gray-900/30 border-b dark:border-gray-700">
            <tr>
              <th class="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Produit</th>
              <th class="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Catégorie</th>
              <th class="px-6 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Stock</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            {#each data.lowStockProducts as product}
              <tr class="hover:bg-red-50/30 dark:hover:bg-red-900/5 transition-colors">
                <td class="px-6 py-3 font-medium text-gray-900 dark:text-white">{product.name}</td>
                <td class="px-6 py-3 text-gray-500 dark:text-gray-400">{product.category_name ?? '—'}</td>
                <td class="px-6 py-3 text-right">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                    {product.stock} restants
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
