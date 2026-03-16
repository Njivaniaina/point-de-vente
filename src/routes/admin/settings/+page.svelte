<script lang="ts">
  let { data } = $props() as any;
  
  let settings = $state(data.settings as any);
  let loading = $state(false);
  let success = $state(false);

  async function save() {
    loading = true;
    success = false;
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    
    if (res.ok) {
      success = true;
      setTimeout(() => success = false, 3000);
    }
    loading = false;
  }
</script>

<div class="max-w-2xl mx-auto space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Paramètres de la boutique</h1>
    <p class="text-gray-500 text-sm mt-1">Ces informations apparaîtront sur vos tickets de caisse.</p>
  </div>

  <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
    <div class="space-y-4">
      <div>
        <label for="shop_name" class="block text-sm font-medium text-gray-700 mb-1">Nom de l'établissement</label>
        <input 
          id="shop_name"
          bind:value={settings.shop_name} 
          type="text" 
          placeholder="Ex: Le Gourmet"
          class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label for="shop_address" class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <textarea 
          id="shop_address"
          bind:value={settings.shop_address} 
          rows="2"
          placeholder="Ex: 123 Rue des Saveurs, Antananarivo"
          class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
        ></textarea>
      </div>

      <div>
        <label for="shop_phone" class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        <input 
          id="shop_phone"
          bind:value={settings.shop_phone} 
          type="text" 
          placeholder="Ex: +261 34 00 000 00"
          class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label for="currency" class="block text-sm font-medium text-gray-700 mb-1">Devise par défaut</label>
        <select 
          id="currency"
          bind:value={settings.currency} 
          class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="MGA">MGA (Ariary Malgache)</option>
          <option value="USD">USD (Dollar US)</option>
          <option value="EUR">EUR (Euro)</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label for="usd_rate" class="block text-sm font-medium text-gray-700 mb-1">Taux USD (1 $ = ? Ar)</label>
          <input 
            id="usd_rate"
            bind:value={settings.usd_rate} 
            type="number" 
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label for="eur_rate" class="block text-sm font-medium text-gray-700 mb-1">Taux EUR (1 € = ? Ar)</label>
          <input 
            id="eur_rate"
            bind:value={settings.eur_rate} 
            type="number" 
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <div class="pt-2">
        <label for="tax_rate" class="block text-sm font-medium text-gray-700 mb-1">Taux de Taxe (TVA %)</label>
        <input 
          id="tax_rate"
          bind:value={settings.tax_rate} 
          type="number" 
          placeholder="Ex: 20"
          class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    </div>

    <div class="pt-4 border-t flex items-center justify-between">
      {#if success}
        <p class="text-green-600 text-sm font-medium flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Paramètres enregistrés !
        </p>
      {:else}
        <div></div>
      {/if}
      
      <button 
        onclick={save}
        disabled={loading}
        class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
      >
        {#if loading}
          <span class="animate-spin text-sm">⌛</span>
        {/if}
        Enregistrer les modifications
      </button>
    </div>
  </div>

  <!-- Preview Card -->
  <div class="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6">
    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Aperçu en-tête ticket</h3>
    <div class="bg-white p-6 shadow-sm border border-gray-100 max-w-[280px] mx-auto text-center font-mono text-sm leading-tight">
      <h2 class="font-black text-lg uppercase italic">{settings.shop_name || 'NOM SHOP'}</h2>
      <p class="text-xs">{settings.shop_address || 'Adresse...'}</p>
      <p class="text-xs">Tél: {settings.shop_phone || 'Contact...'}</p>
      <div class="border-b border-dashed border-gray-400 my-2"></div>
    </div>
  </div>
</div>
