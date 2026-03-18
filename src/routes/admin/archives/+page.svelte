<script lang="ts">
  let { data } = $props() as any;
  let products = $state(data.archivedProducts);
  let posInstances = $state(data.archivedPos);
  let loading = $state<number | null>(null);

  async function restoreProduct(id: number) {
    loading = id;
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: 1 })
    });
    if (res.ok) {
      products = products.filter((p: any) => p.id !== id);
    }
    loading = null;
  }

  async function restorePos(id: number) {
    loading = id;
    const res = await fetch(`/api/pos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: 1 })
    });
    if (res.ok) {
      posInstances = posInstances.filter((p: any) => p.id !== id);
    }
    loading = null;
  }
</script>

<svelte:head><title>Archives — Administration</title></svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Archives & Restauration</h1>
    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Gérez et restaurez les éléments désactivés</p>
  </div>

  <!-- Archived Products -->
  <div class="space-y-4">
    <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
      Produits archivés
    </h2>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
          <tr>
            <th class="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Nom</th>
            <th class="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Catégorie</th>
            <th class="px-6 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          {#each products as p}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
              <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{p.category_name ?? '—'}</td>
              <td class="px-6 py-4 text-right">
                <button 
                  onclick={() => restoreProduct(p.id)}
                  disabled={loading === p.id}
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {loading === p.id ? '...' : 'Restaurer'}
                </button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="3" class="px-6 py-12 text-center text-gray-400 italic">Aucun produit dans les archives</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Archived POS -->
  <div class="space-y-4">
    <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      Caisses archivées
    </h2>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
          <tr>
            <th class="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Nom</th>
            <th class="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Emplacement</th>
            <th class="px-6 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          {#each posInstances as pos}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{pos.name}</td>
              <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{pos.location ?? '—'}</td>
              <td class="px-6 py-4 text-right">
                <button 
                  onclick={() => restorePos(pos.id)}
                  disabled={loading === pos.id}
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {loading === pos.id ? '...' : 'Restaurer'}
                </button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="3" class="px-6 py-12 text-center text-gray-400 italic">Aucune caisse dans les archives</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
