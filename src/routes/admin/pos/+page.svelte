<script lang="ts">
  import type { PageData } from './$types.js';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();
  let posInstances = $state(data.posInstances as any[]);
  let showModal = $state(false);
  let editTarget = $state<any>(null);
  let loading = $state(false);
  let error = $state('');

  function openNew() { editTarget = { name: '', location: '' }; showModal = true; error = ''; }
  function openEdit(p: any) { editTarget = { ...p }; showModal = true; error = ''; }

  async function save() {
    if (!editTarget?.name.trim()) { error = 'Le nom est requis'; return; }
    loading = true;
    const isEdit = editTarget.id !== undefined;
    const res = await fetch(isEdit ? `/api/pos/${editTarget.id}` : '/api/pos', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTarget)
    });
    const saved = await res.json();
    posInstances = isEdit ? posInstances.map(p => p.id === saved.id ? saved : p) : [...posInstances, saved];
    showModal = false; loading = false;
  }

  async function toggleActive(pos: any) {
    const res = await fetch(`/api/pos/${pos.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pos, active: pos.active ? 0 : 1 })
    });
    const saved = await res.json();
    posInstances = posInstances.map(p => p.id === saved.id ? saved : p);
  }
</script>

<svelte:head>
  <title>Caisses — {data.settings.shop_name || 'ShopPOS'}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Caisses (POS)</h1>
      <p class="text-gray-500 text-sm mt-1">{posInstances.filter((p: any) => p.active).length} caisse(s) active(s)</p>
    </div>
    <button onclick={openNew} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
      Nouvelle caisse
    </button>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each posInstances as pos}
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 {pos.active ? '' : 'opacity-60'}">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full {pos.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}">
            {pos.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <h3 class="font-bold text-gray-900">{pos.name}</h3>
        <p class="text-gray-500 text-sm">{pos.location ?? 'Aucun emplacement'}</p>
        <div class="mt-4 flex gap-2">
          <button onclick={() => goto('/pos')} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
            Ouvrir
          </button>
          <button onclick={() => openEdit(pos)} class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onclick={() => toggleActive(pos)} class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" title="{pos.active ? 'Désactiver' : 'Activer'}">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={pos.active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
          </button>
        </div>
      </div>
    {:else}
      <p class="col-span-full py-12 text-center text-gray-400">Aucune caisse créée</p>
    {/each}
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-5 border-b"><h2 class="font-bold text-gray-900 text-lg">{editTarget?.id ? 'Modifier' : 'Nouvelle'} caisse</h2></div>
      <div class="p-6 space-y-4">
        {#if error}<p class="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>{/if}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input bind:value={editTarget.name} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Caisse 1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Emplacement</label>
          <input bind:value={editTarget.location} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Rez-de-chaussée" />
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
