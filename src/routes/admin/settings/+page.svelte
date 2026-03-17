<script lang="ts">
  let { data } = $props() as any;
  
  let settings = $state(data.settings as any);
  let loading = $state(false);
  let success = $state(false);

  let galleryImages = $state<{url: string, name: string}[]>([]);
  let loadingGallery = $state(false);

  // Load images on mount
  import { onMount } from 'svelte';
  onMount(() => {
    loadImages();
  });

  async function loadImages() {
    loadingGallery = true;
    try {
      const res = await fetch('/api/images');
      const data = await res.json();
      galleryImages = data.images.map((url: string) => ({ url, name: url.split('/').pop() || 'image' }));
    } catch (err) {
      console.error("Erreur chargement images", err);
    } finally {
      loadingGallery = false;
    }
  }

  async function deleteImage(url: string, name: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'image "${name}" ?\nAttention : Si cette image est utilisée par des produits, ils ne s'afficheront plus correctement.`)) {
      return;
    }

    try {
      const res = await fetch('/api/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (res.ok) {
        // Remove from local array
        galleryImages = galleryImages.filter(img => img.url !== url);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      alert("Erreur réseau");
    }
  }

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
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Paramètres de la boutique</h1>
    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Ces informations apparaîtront sur vos tickets de caisse.</p>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4 transition-colors duration-300">
    <div class="space-y-4">
      <div>
        <label for="shop_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'établissement</label>
        <input 
          id="shop_name"
          bind:value={settings.shop_name} 
          type="text" 
          placeholder="Ex: Le Gourmet"
          class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
        />
      </div>

      <div>
        <label for="shop_address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
        <textarea 
          id="shop_address"
          bind:value={settings.shop_address} 
          rows="2"
          placeholder="Ex: 123 Rue des Saveurs, Antananarivo"
          class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none transition-colors"
        ></textarea>
      </div>

      <div>
        <label for="shop_phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
        <input 
          id="shop_phone"
          bind:value={settings.shop_phone} 
          type="text" 
          placeholder="Ex: +261 34 00 000 00"
          class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
        />
      </div>

      <div>
        <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise par défaut</label>
        <select 
          id="currency"
          bind:value={settings.currency} 
          class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
        >
          <option value="MGA">MGA (Ariary Malgache)</option>
          <option value="USD">USD (Dollar US)</option>
          <option value="EUR">EUR (Euro)</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label for="usd_rate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taux USD (1 $ = ? Ar)</label>
          <input 
            id="usd_rate"
            bind:value={settings.usd_rate} 
            type="number" 
            class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
          />
        </div>
        <div>
          <label for="eur_rate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taux EUR (1 € = ? Ar)</label>
          <input 
            id="eur_rate"
            bind:value={settings.eur_rate} 
            type="number" 
            class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
          />
        </div>
      </div>

      <div class="pt-2">
        <label for="tax_rate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taux de Taxe (TVA %)</label>
        <input 
          id="tax_rate"
          bind:value={settings.tax_rate} 
          type="number" 
          placeholder="Ex: 20"
          class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
        />
      </div>
    </div>

    <div class="pt-4 border-t dark:border-gray-700 flex items-center justify-between transition-colors">
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
  <div class="bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
    <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Aperçu en-tête ticket</h3>
    <div class="bg-white dark:bg-black p-6 shadow-sm border border-gray-100 dark:border-gray-800 max-w-[280px] mx-auto text-center font-mono text-sm leading-tight transition-colors">
      <h2 class="font-black text-lg uppercase italic text-black dark:text-white">{settings.shop_name || 'NOM SHOP'}</h2>
      <p class="text-xs text-gray-600 dark:text-gray-400">{settings.shop_address || 'Adresse...'}</p>
      <p class="text-xs text-gray-600 dark:text-gray-400">Tél: {settings.shop_phone || 'Contact...'}</p>
      <div class="border-b border-dashed border-gray-400 dark:border-gray-600 my-2"></div>
    </div>
  </div>

  <!-- Image Management Section -->
  <div>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Gestion des images</h2>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 overflow-hidden transition-colors duration-300">
      {#if loadingGallery}
        <div class="flex justify-center py-6"><span class="animate-spin text-xl text-blue-600">⏳</span></div>
      {:else if galleryImages.length === 0}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p>Aucune image uploadée pour le moment.</p>
        </div>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {#each galleryImages as img}
            <div class="group relative aspect-square rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors">
              <img src={img.url} alt={img.name} class="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" loading="lazy" />
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <p class="text-white text-[10px] truncate w-full text-center mb-2" title={img.name}>{img.name}</p>
                <button 
                  onclick={() => deleteImage(img.url, img.name)}
                  class="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transform hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black/60"
                  aria-label="Supprimer {img.name}"
                  title="Supprimer définitivement"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Attention : La suppression d'une image est définitive et affectera l'affichage des produits qui l'utilisent.
        </p>
      {/if}
    </div>
  </div>
</div>
