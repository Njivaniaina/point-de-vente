<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();

  type Product = { id: number; name: string; price: number; stock: number; category_id: number | null; category_name?: string; category_color?: string; image_url?: string };
  type CartItem = { product: Product; quantity: number };

  let products = $state(data.products as Product[]);
  let categories = $state(data.categories as any[]);
  let clients = $state(data.clients as any[]);
  let posInstances = $state(data.posInstances as any[]);

  let selectedCategoryId = $state<number | null>(null);
  let search = $state('');
  let cart = $state<CartItem[]>([]);
  let selectedPosId = $state<number>(posInstances[0]?.id ?? 0);
  let selectedClientId = $state<number | string>('');
  let showCheckout = $state(false);
  let paymentMethod = $state('cash');
  let note = $state('');
  let loading = $state(false);
  let invoiceData = $state<any>(null);
  let sidebarOpen = $state(false);

  const paymentLabels: Record<string, string> = { cash: 'Espèces', card: 'Carte', mobile: 'Mobile Money' };

  let filtered = $derived(products.filter(p => {
    const matchesCategory = selectedCategoryId === null || p.category_id === selectedCategoryId;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }));

  let cartTotal = $derived(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
  let cartCount = $derived(cart.reduce((sum, item) => sum + item.quantity, 0));

  function addToCart(product: Product) {
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) existing.quantity++;
    } else {
      cart = [...cart, { product, quantity: 1 }];
    }
  }

  function updateQty(productId: number, delta: number) {
    cart = cart.map(item => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty < 1) return item;
      if (newQty > item.product.stock) return item;
      return { ...item, quantity: newQty };
    });
  }

  function removeFromCart(productId: number) {
    cart = cart.filter(i => i.product.id !== productId);
  }

  function clearCart() { cart = []; }

  function formatMGA(n: number) {
    return new Intl.NumberFormat('fr-MG').format(n) + ' Ar';
  }

  async function checkout() {
    if (!selectedPosId) return;
    if (cart.length === 0) return;
    loading = true;
    const items = cart.map(i => ({
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.product.price
    }));

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pos_id: selectedPosId,
        client_id: selectedClientId || null,
        items,
        payment_method: paymentMethod,
        note
      })
    });
    const data = await res.json();
    invoiceData = data;
    // Update stock locally
    data.items.forEach((soldItem: any) => {
      const product = products.find(p => p.id === soldItem.product_id);
      if (product) product.stock -= soldItem.quantity;
    });
    products = [...products];
    cart = [];
    showCheckout = false;
    loading = false;
  }

  function printInvoice() { window.print(); }
</script>

<svelte:head>
  <title>Caisse — ShopPOS</title>
  <meta name="description" content="Interface point de vente ShopPOS" />
</svelte:head>

<div class="flex h-screen bg-gray-950 overflow-hidden">
  <!-- Products Section -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Top Bar -->
    <header class="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
      <div class="flex items-center gap-2 shrink-0">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13" />
          </svg>
        </div>
        <span class="text-white font-bold text-sm hidden sm:block">ShopPOS</span>
      </div>

      <!-- Caisse selector -->
      <select bind:value={selectedPosId} class="bg-gray-800 text-gray-200 text-sm border border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hidden sm:block">
        {#each posInstances as pos}
          <option value={pos.id}>{pos.name}</option>
        {/each}
      </select>

      <div class="flex-1">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input bind:value={search} placeholder="Rechercher un produit..." class="w-full bg-gray-800 text-gray-200 text-sm border border-gray-700 rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500" />
        </div>
      </div>

      <a href="/admin" class="text-gray-500 hover:text-gray-300 text-xs hidden md:block transition-colors">Admin</a>
      <a href="/" class="text-gray-500 hover:text-gray-300 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      </a>

      <!-- Mobile cart button -->
      <button onclick={() => sidebarOpen = !sidebarOpen} class="relative lg:hidden text-gray-400 hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m.6 8l-1.5 6h13M9 19a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
        {#if cartCount > 0}
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-white text-xs flex items-center justify-center">{cartCount}</span>
        {/if}
      </button>
    </header>

    <!-- Category Tabs -->
    <div class="bg-gray-900 border-b border-gray-800 px-4 py-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
      <button
        onclick={() => selectedCategoryId = null}
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
          {selectedCategoryId === null ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
      >
        Tous
      </button>
      {#each categories as cat}
        <button
          onclick={() => selectedCategoryId = cat.id}
          class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5
            {selectedCategoryId === cat.id ? 'text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
          style={selectedCategoryId === cat.id ? `background-color: ${cat.color}` : ''}
        >
          <span class="w-2 h-2 rounded-full shrink-0" style="background-color: {cat.color}"></span>
          {cat.name}
        </button>
      {/each}
    </div>

    <!-- Products Grid -->
    <div class="flex-1 overflow-y-auto p-4">
      {#if filtered.length === 0}
        <div class="h-full flex items-center justify-center text-gray-600">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p>Aucun produit disponible</p>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {#each filtered as product}
            {@const cartItem = cart.find(i => i.product.id === product.id)}
            <button
              onclick={() => addToCart(product)}
              class="bg-gray-900 border-2 rounded-xl p-3 text-left transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer
                {cartItem ? 'border-blue-500 shadow-blue-600/20 shadow-lg' : 'border-gray-800 hover:border-gray-600'}"
            >
              <!-- Product image / placeholder -->
              <div class="w-full aspect-square rounded-lg mb-3 flex items-center justify-center overflow-hidden"
                style="background-color: {product.category_color ?? '#1f2937'}20">
                {#if product.image_url}
                  <img src={product.image_url} alt={product.name} class="w-full h-full object-cover rounded-lg" />
                {:else}
                  <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: {product.category_color ?? '#6b7280'}">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                {/if}
              </div>
              <p class="text-white text-xs font-semibold leading-tight line-clamp-2 mb-1">{product.name}</p>
              <p class="text-blue-400 text-xs font-bold">{formatMGA(product.price)}</p>
              <div class="mt-1.5 flex items-center justify-between">
                <span class="text-gray-600 text-xs">Stock: {product.stock}</span>
                {#if cartItem}
                  <span class="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartItem.quantity}</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Cart Sidebar Overlay (mobile) -->
  {#if sidebarOpen}
    <div class="fixed inset-0 bg-black/60 z-20 lg:hidden" onclick={() => sidebarOpen = false}></div>
  {/if}

  <!-- Cart -->
  <aside class="
    fixed inset-y-0 right-0 z-30 w-80 bg-gray-900 border-l border-gray-800 flex flex-col
    transform transition-transform duration-300
    {sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
    lg:static lg:translate-x-0 lg:z-auto lg:w-80
  ">
    <div class="px-4 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13M9 19a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
        <span class="text-white font-semibold">Panier</span>
        {#if cartCount > 0}
          <span class="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>
        {/if}
      </div>
      {#if cart.length > 0}
        <button onclick={clearCart} class="text-red-500 hover:text-red-400 text-xs transition-colors">Vider</button>
      {/if}
    </div>

    <!-- Cart Items -->
    <div class="flex-1 overflow-y-auto py-2">
      {#if cart.length === 0}
        <div class="h-full flex items-center justify-center text-gray-600 text-sm">
          <div class="text-center">
            <svg class="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13" />
            </svg>
            <p>Panier vide</p>
            <p class="text-xs mt-1 opacity-50">Cliquez sur un produit pour l'ajouter</p>
          </div>
        </div>
      {:else}
        {#each cart as item}
          <div class="px-4 py-3 border-b border-gray-800 flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium leading-tight line-clamp-1">{item.product.name}</p>
              <p class="text-blue-400 text-xs">{formatMGA(item.product.price)}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button onclick={() => updateQty(item.product.id, -1)} class="w-6 h-6 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm flex items-center justify-center transition-colors">−</button>
              <span class="text-white text-sm font-semibold w-6 text-center">{item.quantity}</span>
              <button onclick={() => updateQty(item.product.id, +1)} class="w-6 h-6 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm flex items-center justify-center transition-colors">+</button>
              <button onclick={() => removeFromCart(item.product.id)} class="w-6 h-6 rounded-md hover:bg-red-900/50 text-red-500 text-sm flex items-center justify-center ml-1 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Cart Footer -->
    <div class="px-4 py-4 border-t border-gray-800 space-y-3 shrink-0">
      <div class="flex items-center justify-between text-white">
        <span class="text-gray-400">Total</span>
        <span class="text-xl font-black text-white">{formatMGA(cartTotal)}</span>
      </div>
      <button
        onclick={() => { showCheckout = true; sidebarOpen = false; }}
        disabled={cart.length === 0}
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
      >
        Encaisser
      </button>
    </div>
  </aside>
</div>

<!-- Checkout Modal -->
{#if showCheckout}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-5 border-b border-gray-800">
        <h2 class="font-bold text-white text-lg">Finaliser la vente</h2>
        <p class="text-gray-500 text-sm">{cartCount} article(s) — {formatMGA(cartTotal)}</p>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Caisse</label>
          <select bind:value={selectedPosId} class="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {#each posInstances as pos}
              <option value={pos.id}>{pos.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Client (optionnel)</label>
          <select bind:value={selectedClientId} class="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Client anonyme —</option>
            {#each clients as c}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">Mode de paiement</label>
          <div class="grid grid-cols-3 gap-2">
            {#each Object.entries(paymentLabels) as [key, label]}
              <button
                onclick={() => paymentMethod = key}
                class="py-2 rounded-lg text-sm font-medium border transition-all
                  {paymentMethod === key ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}"
              >{label}</button>
            {/each}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Note (optionnel)</label>
          <textarea bind:value={note} rows="2" class="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Remarque sur la commande..."></textarea>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
        <button onclick={() => showCheckout = false} class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Annuler</button>
        <button onclick={checkout} disabled={loading || !selectedPosId} class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors">
          {loading ? 'Traitement...' : `Valider — ${formatMGA(cartTotal)}`}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Invoice Modal -->
{#if invoiceData}
  <div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 print:static print:bg-white" onclick={() => invoiceData = null}>
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden print:shadow-none" onclick={(e) => e.stopPropagation()}>
      <!-- Header -->
      <div class="bg-gray-950 px-6 py-5 text-white print:text-black print:bg-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400 print:text-gray-600">✅ Vente enregistrée</p>
            <h2 class="font-black text-xl font-mono mt-1">{invoiceData.sale.invoice_ref}</h2>
          </div>
          <div class="flex gap-2">
            <button onclick={printInvoice} class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 print:hidden">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimer
            </button>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><p class="text-gray-400 text-xs">Caisse</p><p class="font-semibold text-gray-900">{invoiceData.sale.pos_name}</p></div>
          <div><p class="text-gray-400 text-xs">Client</p><p class="font-semibold text-gray-900">{invoiceData.sale.client_name ?? 'Anonyme'}</p></div>
          <div><p class="text-gray-400 text-xs">Paiement</p><p class="font-semibold text-gray-900">{paymentLabels[invoiceData.sale.payment_method]}</p></div>
          <div><p class="text-gray-400 text-xs">Date</p><p class="font-semibold text-gray-900 text-xs">{new Date(invoiceData.sale.created_at).toLocaleString('fr-FR')}</p></div>
        </div>

        <div class="border-t pt-4">
          <table class="w-full text-sm">
            <thead><tr class="text-gray-400 text-xs"><th class="text-left pb-2">Article</th><th class="text-center pb-2">Qté</th><th class="text-right pb-2">P.U.</th><th class="text-right pb-2">Total</th></tr></thead>
            <tbody class="divide-y divide-gray-100">
              {#each invoiceData.items as item}
                <tr>
                  <td class="py-2 text-gray-900 font-medium">{item.product_name}</td>
                  <td class="py-2 text-center text-gray-600">{item.quantity}</td>
                  <td class="py-2 text-right text-gray-600 whitespace-nowrap">{new Intl.NumberFormat('fr-MG').format(item.unit_price)} Ar</td>
                  <td class="py-2 text-right font-bold text-gray-900 whitespace-nowrap">{new Intl.NumberFormat('fr-MG').format(item.subtotal)} Ar</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="border-t pt-3 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl flex justify-between items-center">
          <span class="text-gray-700 font-semibold">Total</span>
          <span class="text-2xl font-black text-gray-900">{new Intl.NumberFormat('fr-MG').format(invoiceData.sale.total_amount)} Ar</span>
        </div>
      </div>

      <div class="px-6 py-4 border-t flex justify-end gap-3 print:hidden">
        <button onclick={() => invoiceData = null} class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors">
          Nouvelle vente
        </button>
      </div>
    </div>
  </div>
{/if}
