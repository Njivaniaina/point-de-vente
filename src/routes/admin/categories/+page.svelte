<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let categories = $state(data.categories);
  let showModal = $state(false);
  let editTarget = $state<{ id?: number; name: string; color: string } | null>(null);
  let loading = $state(false);
  let error = $state('');

  function openNew() {
    editTarget = { name: '', color: '#3b82f6' };
    showModal = true;
    error = '';
  }

  function openEdit(cat: { id: number; name: string; color: string }) {
    editTarget = { ...cat };
    showModal = true;
    error = '';
  }

  async function save() {
    if (!editTarget?.name.trim()) { error = 'Le nom est requis'; return; }
    loading = true;
    const isEdit = editTarget.id !== undefined;
    const url = isEdit ? `/api/categories/${editTarget.id}` : '/api/categories';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editTarget) });
    const data = await res.json();
    if (isEdit) {
      categories = categories.map(c => c.id === data.id ? data : c);
    } else {
      categories = [...categories, data];
    }
    showModal = false;
    loading = false;
  }

  async function deleteCategory(id: number) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    categories = categories.filter(c => c.id !== id);
  }
</script>

<svelte:head><title>Catégories — {data.settings.shop_name || 'ShopPOS'}</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Catégories</h1>
      <p class="text-gray-500 text-sm mt-1">{categories.length} catégorie(s)</p>
    </div>
    <button onclick={openNew} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nouvelle catégorie
    </button>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {#each categories as cat}
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-xl shrink-0 shadow-inner" style="background-color: {cat.color}"></div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 truncate">{cat.name}</p>
          <p class="text-gray-400 text-xs">{cat.color}</p>
        </div>
        <div class="flex gap-1">
          <button onclick={() => openEdit(cat)} class="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onclick={() => deleteCategory(cat.id)} class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    {:else}
      <div class="col-span-full py-16 text-center text-gray-400">Aucune catégorie pour l'instant</div>
    {/each}
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-5 border-b">
        <h2 class="font-bold text-gray-900 text-lg">{editTarget?.id ? 'Modifier' : 'Nouvelle'} catégorie</h2>
      </div>
      <div class="p-6 space-y-4">
        {#if error}<p class="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>{/if}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input bind:value={editTarget!.name} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Électronique" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
          <div class="flex items-center gap-3">
            <input type="color" bind:value={editTarget!.color} class="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" />
            <input bind:value={editTarget!.color} class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t flex gap-3 justify-end">
        <button onclick={() => showModal = false} class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
        <button onclick={save} disabled={loading} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  </div>
{/if}
