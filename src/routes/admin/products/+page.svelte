<script lang="ts">
  let { data } = $props() as any;
  let products = $state(data.products as any[]);
  let categories = $state(data.categories as any[]);
  let showModal = $state(false);
  let editTarget = $state<any>(null);
  let loading = $state(false);
  let error = $state('');
  let search = $state('');
  let uploadingImage = $state(false);
  let showGallery = $state(false);
  let galleryImages = $state<{url: string, name: string}[]>([]);
  let loadingGallery = $state(false);

  async function openGallery() {
    showGallery = true;
    if (galleryImages.length === 0) {
      loadingGallery = true;
      try {
        const res = await fetch('/api/images');
        const data = await res.json();
        galleryImages = data.images.map((url: string) => ({ url, name: url.split('/').pop() || 'image' }));
      } catch (err) {
        console.error("Erreur lors du chargement de la galerie", err);
      } finally {
        loadingGallery = false;
      }
    }
  }

  function selectFromGallery(url: string) {
    editTarget.image_url = url;
    showGallery = false;
  }

  async function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    uploadingImage = true;
    error = '';
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        editTarget.image_url = data.url;
      } else {
        const errData = await res.json();
        error = errData.error || "Erreur lors de l'upload de l'image";
      }
    } catch (err) {
      error = "Erreur réseau lors de l'upload";
    } finally {
      uploadingImage = false;
      input.value = ''; // Reset file input
    }
  }

  let filtered = $derived(
    products.filter(p =>
      p?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p?.category_name ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  function openNew() {
    editTarget = { name: '', price: 0, stock: 0, unit: 'unité', barcode: '', image_url: '/default-product.png', category_id: '', original_price: 0, price_currency: data.settings.currency || 'MGA' };
    showModal = true; error = '';
  }

  function openEdit(p: any) {
    editTarget = { ...p, category_id: p.category_id ?? '', image_url: p.image_url || '/default-product.png', original_price: p.original_price ?? p.price, price_currency: p.price_currency || 'MGA' };
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

  let currencyFormat = $derived(new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: data.settings.currency || 'MGA',
    currencyDisplay: 'symbol'
  }));

  function formatPrice(amount: number) {
    const curCode = data.settings.currency || 'MGA';
    const currency = data.currencies.find((c: any) => c.code === curCode) || { code: 'MGA', symbol: 'Ar', exchange_rate: 1 };
    
    if (currency.code === 'MGA') {
      return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
    }
    
    const converted = amount / (currency.exchange_rate || 1);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'symbol'
    }).format(converted);
  }

  let currentCurrencyLabel = $derived(data.settings.currency || 'MGA');

  // Multi-currency price conversion in form
  $effect(() => {
    if (!showModal || !editTarget) return;
    const currency = data.currencies.find((c: any) => c.code === editTarget.price_currency) || { exchange_rate: 1 };
    // MGA Price = original_price * rate (since rate is 1 Ar = X cur, it should be original_price / rate)
    // Wait, my rate is 1 BASE (MGA) = X EUR.
    // So if 1 MGA = 0.0002 EUR, then 10 EUR = 10 / 0.0002 = 50,000 MGA.
    editTarget.price = (editTarget.original_price || 0) / (currency.exchange_rate || 1);
  });
</script>

<svelte:head>
  <title>Produits — {data.settings.shop_name || 'ShopPOS'}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Produits</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">{filtered.length} / {products.length} produits</p>
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
    <input bind:value={search} placeholder="Rechercher un produit..." class="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
  </div>

  <!-- Table -->
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-300">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Produit</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Catégorie</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Prix</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Stock</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          {#each filtered as prod}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700 overflow-hidden mix-blend-multiply dark:mix-blend-normal">
                    <img src={prod.image_url || '/default-product.png'} alt={prod.name} class="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{prod.name}</div>
                    {#if prod.barcode}<div class="text-gray-400 dark:text-gray-500 text-xs">{prod.barcode}</div>{/if}
                  </div>
                </div>
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
              <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatPrice(prod.price)}</td>
              <td class="px-4 py-3 text-right hidden md:table-cell">
                <span class="font-medium {prod.stock < 5 ? 'text-red-600 dark:text-red-400' : prod.stock < 20 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}">{prod.stock}</span>
                <span class="text-[10px] text-gray-400 uppercase font-bold ml-1">{prod.unit || 'unité'}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex gap-1 justify-end">
                  <button onclick={() => openEdit(prod)} aria-label="Modifier le produit" class="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onclick={() => deleteProduct(prod.id)} aria-label="Supprimer le produit" class="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
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
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4 transition-colors duration-300">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border dark:border-gray-800">
      <div class="px-6 py-5 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <h2 class="font-bold text-gray-900 dark:text-white text-lg">{editTarget?.id ? 'Modifier' : 'Nouveau'} produit</h2>
      </div>
      <div class="p-6 space-y-4">
        {#if error}<p class="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>{/if}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label for="prod-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input id="prod-name" bind:value={editTarget.name} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ex: Téléphone Itel" />
          </div>
          <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <label for="prod-price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix de base</label>
              <div class="relative">
                <input type="number" id="prod-price" bind:value={editTarget.original_price} min="0" step="0.01" class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-white dark:bg-gray-900 px-1">
                  ≈ {new Intl.NumberFormat('fr-MG').format(Math.round(editTarget.price))} Ar
                </div>
              </div>
            </div>
            <div>
              <label for="prod-currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise</label>
              <select id="prod-currency" bind:value={editTarget.price_currency} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                {#each data.currencies as cur}
                  <option value={cur.code}>{cur.code} ({cur.symbol})</option>
                {/each}
              </select>
            </div>
          </div>
          <div>
            <label for="prod-stock" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
            <input type="number" id="prod-stock" bind:value={editTarget.stock} min="0" class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>
          <div>
            <label for="prod-unit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité</label>
            <select id="prod-unit" bind:value={editTarget.unit} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
              <optgroup label="Volume / Masse">
                <option value="kg">Kilogramme (Kg)</option>
                <option value="g">Gramme (g)</option>
                <option value="l">Litre (L)</option>
                <option value="ml">Millilitre (ml)</option>
              </optgroup>
              <optgroup label="Emballage">
                <option value="unité">Unité</option>
                <option value="paquet">Paquet</option>
                <option value="boite">Boîte</option>
                <option value="sac">Sac</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label for="prod-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
            <select id="prod-category" bind:value={editTarget.category_id} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
              <option value="">— Aucune —</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="prod-barcode" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code-barres</label>
            <input id="prod-barcode" bind:value={editTarget.barcode} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="EAN-13..." />
          </div>
          <div class="sm:col-span-2">
            <label for="prod-image-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image du Produit</label>
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden mix-blend-multiply dark:mix-blend-normal relative group">
                <img src={editTarget.image_url || '/default-product.png'} alt="Aperçu" class="w-full h-full object-cover" />
                {#if uploadingImage}
                  <div class="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                    <span class="animate-spin text-lg">⏳</span>
                  </div>
                {/if}
              </div>
              <div class="flex-1 space-y-2">
                 <div class="flex items-center gap-2">
                   <input type="file" accept="image/*" onchange={handleImageUpload} disabled={uploadingImage} class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50 transition-colors cursor-pointer file:cursor-pointer disabled:opacity-50" />
                   <button type="button" onclick={openGallery} class="shrink-0 px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">Parcourir</button>
                 </div>
                 <div class="flex gap-2">
                   <input id="prod-image-url" bind:value={editTarget.image_url} class="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ou saisissez une URL d'image (https://...)" />
                   {#if editTarget.image_url && editTarget.image_url !== '/default-product.png'}
                     <button type="button" onclick={() => editTarget.image_url = '/default-product.png'} title="Remettre l'image par défaut" class="shrink-0 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800">
                       <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                   {/if}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t dark:border-gray-800 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-gray-900 transition-colors">
        <button onclick={() => showModal = false} class="px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Annuler</button>
        <button onclick={save} disabled={loading} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  </div>

  <!-- Gallery Modal (nested) -->
  {#if showGallery}
    <div class="fixed inset-0 bg-black/60 dark:bg-black/80 z-[60] flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border dark:border-gray-800">
        <div class="px-5 py-4 border-b dark:border-gray-800 flex justify-between items-center">
          <h3 class="font-bold text-gray-900 dark:text-white">Galerie d'images</h3>
          <button onclick={() => showGallery = false} aria-label="Fermer la galerie" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-5 overflow-y-auto flex-1 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
          {#if loadingGallery}
            <div class="flex justify-center py-10"><span class="animate-spin text-2xl text-blue-600">⏳</span></div>
          {:else if galleryImages.length === 0}
            <div class="text-center py-10 text-gray-500 dark:text-gray-400">Aucune image uploadée pour le moment.</div>
          {:else}
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {#each galleryImages as img}
                <button onclick={() => selectFromGallery(img.url)} class="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all group bg-white dark:bg-gray-800">
                  <img src={img.url} alt={img.name} class="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" loading="lazy" />
                  <div class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] truncate px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.name}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/if}
