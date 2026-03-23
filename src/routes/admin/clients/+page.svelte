<script lang="ts">
  let { data } = $props() as any;
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

  function openNew() { editTarget = { name: '', phone: '', email: '', address: '', card_number: '' }; showModal = true; error = ''; }
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">{filtered.length} client(s)</p>
    </div>
    <button onclick={openNew} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
      Nouveau client
    </button>
  </div>

  <div class="relative">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
    <input bind:value={search} placeholder="Rechercher un client..." class="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
  </div>

  <!-- Table (Desktop) -->
  <div class="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-300">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Nom</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Téléphone</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Email</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          {#each filtered as client}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 dark:text-white">{client.name}</div>
                {#if client.card_number}
                  <div class="text-[10px] text-blue-500 font-mono mt-0.5">💳 {client.card_number}</div>
                {/if}
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{client.phone ?? '—'}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{client.email ?? '—'}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex gap-1 justify-end">
                  <button onclick={() => openEdit(client)} aria-label="Modifier le client" class="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onclick={() => deleteClient(client.id)} aria-label="Supprimer le client" class="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Cards (Mobile) -->
  <div class="grid grid-cols-1 gap-4 md:hidden">
    {#each filtered as client}
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3 transition-colors">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white">{client.name}</h3>
            {#if client.card_number}
              <div class="text-[10px] text-blue-500 font-mono mt-0.5">💳 {client.card_number}</div>
            {/if}
          </div>
          <div class="flex gap-2">
            <button onclick={() => openEdit(client)} class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onclick={() => deleteClient(client.id)} class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        
        <div class="space-y-1.5 pt-2 border-t dark:border-gray-700">
          {#if client.phone}
            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {client.phone}
            </div>
          {/if}
          {#if client.email}
            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {client.email}
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 p-12 text-center rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700 text-gray-400">
        Aucun client trouvé
      </div>
    {/each}
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-300">
      <div class="px-6 py-5 border-b dark:border-gray-800"><h2 class="font-bold text-gray-900 dark:text-white text-lg">{editTarget?.id ? 'Modifier' : 'Nouveau'} client</h2></div>
      <div class="p-6 space-y-4">
        {#if error}<p class="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>{/if}
        <div>
          <label for="client-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
          <input id="client-name" bind:value={editTarget.name} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div>
          <label for="client-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
          <input id="client-phone" bind:value={editTarget.phone} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div>
          <label for="client-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input type="email" id="client-email" bind:value={editTarget.email} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div>
          <label for="client-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
          <textarea id="client-address" bind:value={editTarget.address} rows="2" class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"></textarea>
        </div>
        <div>
          <label for="client-card" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro de carte bancaire</label>
          <input id="client-card" bind:value={editTarget.card_number} placeholder="XXXX XXXX XXXX XXXX" class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
      </div>
      <div class="px-6 py-4 border-t dark:border-gray-800 flex gap-3 justify-end">
        <button onclick={() => showModal = false} class="px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Annuler</button>
        <button onclick={save} disabled={loading} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  </div>
{/if}
