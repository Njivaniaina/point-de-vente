<script lang="ts">
  import type { PageData } from './$types.js';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props() as { data: PageData };
  let currencies = $state(data.currencies as any[]);
  let loading = $state(false);
  let showModal = $state(false);
  let editingCurrency = $state<any>(null);

  // Form state
  let form = $state({
    code: '',
    name: '',
    symbol: '',
    exchange_rate: 1,
    is_default: false,
    active: 1
  });

  function openCreate() {
    editingCurrency = null;
    form = { code: '', name: '', symbol: '', exchange_rate: 1, is_default: false, active: 1 };
    showModal = true;
  }

  function openEdit(cur: any) {
    editingCurrency = cur;
    form = { ...cur };
    showModal = true;
  }

  async function save() {
    loading = true;
    const url = editingCurrency ? `/api/currencies/${editingCurrency.id}` : '/api/currencies';
    const method = editingCurrency ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      await invalidateAll();
      showModal = false;
      // Refresh local state from data
      currencies = data.currencies;
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de l'enregistrement");
    }
    loading = false;
  }

  async function remove(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer cette devise ?')) return;
    
    const res = await fetch(`/api/currencies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await invalidateAll();
      currencies = data.currencies;
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de la suppression");
    }
  }

  // Update local state when data changes
  $effect(() => {
    currencies = data.currencies;
  });
</script>

<svelte:head>
  <title>Devises — {data.settings.shop_name || 'ShopPOS'}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Devises</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Configurez vos taux de conversion (1 {currencies.find(c => c.is_default)?.code} = X devise)</p>
    </div>
    <button 
      onclick={openCreate}
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
      Ajouter une devise
    </button>
  </div>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#each currencies as cur}
      <div class="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative group transition-all duration-300 hover:shadow-md">
        {#if cur.is_default}
          <span class="absolute top-3 right-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Défaut</span>
        {/if}
        
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xl font-bold text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-gray-800">
            {cur.symbol}
          </div>
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white">{cur.code}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{cur.name}</p>
          </div>
        </div>

        <div class="space-y-1 mb-6">
          <p class="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Taux de conversion</p>
          <p class="text-lg font-black text-blue-600 dark:text-blue-400">
            {cur.exchange_rate} <span class="text-xs font-normal text-gray-400">{cur.code}</span>
          </p>
          <p class="text-[10px] text-gray-400 italic">1 {currencies.find(c => c.is_default)?.code || 'BASE'} = {cur.exchange_rate} {cur.code}</p>
        </div>

        <div class="flex justify-end gap-2 border-t border-gray-50 dark:border-gray-700 pt-4">
          <button onclick={() => openEdit(cur)} class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          {#if !cur.is_default}
            <button onclick={() => remove(cur.id)} class="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300">
      <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 class="font-bold text-gray-900 dark:text-white text-lg">{editingCurrency ? 'Modifier la devise' : 'Nouvelle devise'}</h2>
        <button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Code (ex: USD)</label>
            <input bind:value={form.code} class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="USD" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Symbole (ex: $)</label>
            <input bind:value={form.symbol} class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="$" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nom Complet</label>
          <input bind:value={form.name} class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Dollar US" />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Taux de conversion</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">1 {currencies.find(c => c.is_default)?.code || '...'} =</span>
            <input type="number" step="0.0001" bind:value={form.exchange_rate} class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-20 pr-12 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">{form.code || '...'}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input type="checkbox" id="is_default" bind:checked={form.is_default} class="w-4 h-4 text-blue-600 rounded bg-gray-900 border-gray-700" />
          <label for="is_default" class="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Définir comme devise par défaut (Ariary)</label>
        </div>
      </div>

      <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 transition-colors">
        <button onclick={() => showModal = false} class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Annuler</button>
        <button 
          onclick={save} 
          disabled={loading || !form.code || !form.name || !form.symbol}
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all shadow-lg shadow-blue-600/20"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  </div>
{/if}
