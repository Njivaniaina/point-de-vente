<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let products = $state(data.products as any[]);
  let categories = $state(data.categories as any[]);
  let showModal = $state(false);
  let editTarget = $state<any>(null);
  let loading = $state(false);
  let error = $state('');
  let search = $state('');

  let filtered = $derived(
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category_name ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  function openNew() {
    editTarget = { name: '', price: 0, stock: 0, barcode: '', image_url: '', category_id: '' };
    showModal = true; error = '';
  }

  function openEdit(p: any) {
    editTarget = { ...p, category_id: p.category_id ?? '' };
    showModal = true; error = '';
  }

  async function save() {
    if (!editTarget?.name.trim()) { error = 'Le nom est requis'; return; }
    loading = true;
    const isEdit = editTarget.id !== undefined;
    const url = isEdit ? `/api/products/${editTarget.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editTarget, category_id: editTarget.category_id || null }) });
    const saved = await res.json();
    if (isEdit) {
      products = products.map(p => p.id === saved.id ? saved : p);
    } else {
      products = [...products, saved];
    }
    showModal = false; loading = false;
  }

  async function deleteProduct(id: number) {
    if (!confirm('Archiver ce produit ?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    products = products.filter(p => p.id !== id);
  }

  function formatMGA(n: number) {
    return new Intl.NumberFormat('fr-MG').format(n) + ' Ar';
  }
</script>

<svelte:head><title>Produits — ShopPOS</title></svelte:head>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Produits</h1>
      <p class="text-gray-500 text-sm mt-1">{filtered.length} / {products.length} produits</p>
    </div>
    <button onclick={openNew} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nouveau produit
    </button>
  </div>

  <!-- Search -->
  <div class="relative">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
    </svg>
    <input bind:value={search} placeholder="Rechercher un produit..." class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Produit</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Catégorie</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600">Prix</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600 hidden md:table-cell">Stock</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each filtered as prod}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{prod.name}</div>
                {#if prod.barcode}<div class="text-gray-400 text-xs">{prod.barcode}</div>{/if}
              </td>
              <td class="px-4 py-3 hidden sm:table-cell">
                {#if prod.category_name}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white" style="background-color: {prod.category_color ?? '#6b7280'}">
                    {prod.category_name}
                  </span>
                {:else}
                  <span class="text-gray-300">—</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{formatMGA(prod.price)}</td>
              <td class="px-4 py-3 text-right hidden md:table-cell">
                <span class="font-medium {prod.stock < 5 ? 'text-red-600' : prod.stock < 20 ? 'text-amber-600' : 'text-emerald-600'}">{prod.stock}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex gap-1 justify-end">
                  <button onclick={() => openEdit(prod)} class="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onclick={() => deleteProduct(prod.id)} class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr><td colspan="5" class="px-4 py-12 text-center text-gray-400">Aucun produit trouvé</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="px-6 py-5 border-b sticky top-0 bg-white">
        <h2 class="font-bold text-gray-900 text-lg">{editTarget?.id ? 'Modifier' : 'Nouveau'} produit</h2>
      </div>
      <div class="p-6 space-y-4">
        {#if error}<p class="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>{/if}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input bind:value={editTarget.name} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Téléphone Itel" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prix (Ar)</label>
            <input type="number" bind:value={editTarget.price} min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input type="number" bind:value={editTarget.stock} min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select bind:value={editTarget.category_id} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Aucune —</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
            <input bind:value={editTarget.barcode} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="EAN-13..." />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">URL Image</label>
            <input bind:value={editTarget.image_url} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t flex gap-3 justify-end sticky bottom-0 bg-white">
        <button onclick={() => showModal = false} class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
        <button onclick={save} disabled={loading} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  </div>
{/if}
