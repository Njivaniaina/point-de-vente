<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let clients = $state(data.clients as any[]);
  let showModal = $state(false);
  let editTarget = $state<any>(null);
  let loading = $state(false);
  let error = $state('');
  let search = $state('');

  let filtered = $derived(clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  ));

  function openNew() { editTarget = { name: '', phone: '', email: '', address: '' }; showModal = true; error = ''; }
  function openEdit(c: any) { editTarget = { ...c }; showModal = true; error = ''; }

  async function save() {
    if (!editTarget?.name.trim()) { error = 'Le nom est requis'; return; }
    loading = true;
    const isEdit = editTarget.id !== undefined;
    const res = await fetch(isEdit ? `/api/clients/${editTarget.id}` : '/api/clients', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTarget)
    });
    const saved = await res.json();
    clients = isEdit ? clients.map(c => c.id === saved.id ? saved : c) : [...clients, saved];
    showModal = false; loading = false;
  }

  async function deleteClient(id: number) {
    if (!confirm('Supprimer ce client ?')) return;
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    clients = clients.filter(c => c.id !== id);
  }
</script>

<svelte:head>
  <title>Clients — {data.settings.shop_name || 'ShopPOS'}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Clients</h1>
      <p class="text-gray-500 text-sm mt-1">{filtered.length} client(s)</p>
    </div>
    <button onclick={openNew} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
      Nouveau client
    </button>
  </div>

  <div class="relative">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
    <input bind:value={search} placeholder="Rechercher un client..." class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>

  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Téléphone</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Email</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each filtered as client}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{client.name}</div>
                <div class="text-gray-400 text-xs md:hidden">{client.phone ?? ''} {client.email ?? ''}</div>
              </td>
              <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">{client.phone ?? '—'}</td>
              <td class="px-4 py-3 text-gray-600 hidden md:table-cell">{client.email ?? '—'}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex gap-1 justify-end">
                  <button onclick={() => openEdit(client)} class="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onclick={() => deleteClient(client.id)} class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-4 py-12 text-center text-gray-400">Aucun client trouvé</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-5 border-b"><h2 class="font-bold text-gray-900 text-lg">{editTarget?.id ? 'Modifier' : 'Nouveau'} client</h2></div>
      <div class="p-6 space-y-4">
        {#if error}<p class="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>{/if}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input bind:value={editTarget.name} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input bind:value={editTarget.phone} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" bind:value={editTarget.email} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <textarea bind:value={editTarget.address} rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
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
