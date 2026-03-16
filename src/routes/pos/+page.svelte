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
  let loadingPDF = $state(false);

  const paymentLabels: Record<string, string> = { cash: 'Espèces', card: 'Carte', mobile: 'Virement Bancaire' };

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
    
    // Update stock locally
    data.items.forEach((soldItem: any) => {
      const product = products.find(p => p.id === soldItem.product_id);
      if (product) product.stock -= soldItem.quantity;
    });
    products = [...products];
    cart = [];
    showCheckout = false;
    loading = false;
    
    // Add a tiny delay before showing the invoice to prevent click-through
    setTimeout(() => {
      invoiceData = data;
    }, 100);
  }

  function printInvoice() { window.print(); }

  async function exportToPDF(invoiceRef: string) {
    const element = document.getElementById('thermal-ticket');
    if (!element) return;
    
    // @ts-ignore
    const html2pdf = window.html2pdf;
    if (!html2pdf) {
      alert("Erreur: Le module PDF n'est pas chargé. Veuillez patienter ou actualiser la page.");
      return;
    }

    loadingPDF = true;
    const opt = {
      margin:       5,
      filename:     `ticket_${invoiceRef}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      loadingPDF = false;
    }
  }

  function downloadInvoice(data: any) {
    const sale = data.sale;
    const items = data.items;
    let text = `${data.settings.shop_name} - FACTURE ${sale.invoice_ref}\n`;
    text += `==========================================\n`;
    text += `Date: ${new Date(sale.created_at).toLocaleString('fr-FR')}\n`;
    text += `Caisse: ${sale.pos_name}\n`;
    text += `Client: ${sale.client_name ?? 'Anonyme'}\n`;
    text += `Paiement: ${paymentLabels[sale.payment_method]}\n`;
    text += `------------------------------------------\n`;
    items.forEach((item: any) => {
      text += `${item.product_name.padEnd(25)} x${item.quantity}  ${new Intl.NumberFormat('fr-MG').format(item.subtotal)} Ar\n`;
    });
    text += `------------------------------------------\n`;
    text += `TOTAL: ${new Intl.NumberFormat('fr-MG').format(sale.total_amount)} Ar\n`;
    text += `==========================================\n`;
    text += `Merci de votre visite !\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture_${sale.invoice_ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<style>
  @media print {
    :global(body) { background: white !important; }
    .print-hidden { display: none !important; }
    #thermal-ticket { 
      width: 80mm !important; 
      margin: 0 !important; 
      padding: 0 !important;
      position: absolute;
      top: 0;
      left: 0;
    }
    :global(.fixed) { position: absolute !important; }
  }
</style>

<svelte:head>
  <title>Caisse — ShopPOS</title>
  <meta name="description" content="Interface point de vente ShopPOS" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
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
  <div 
    class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto" 
  >
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-[300px] overflow-hidden" onclick={(e) => e.stopPropagation()}>
      <!-- Modal Header (Controls) -->
      <div class="bg-gray-100 px-4 py-3 flex items-center justify-between border-b print:hidden">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Aperçu du ticket</span>
        <div class="flex gap-2">
          <button 
            type="button"
            onclick={() => exportToPDF(invoiceData.sale.invoice_ref)} 
            disabled={loadingPDF}
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            {#if loadingPDF}
              <span class="animate-spin text-[10px]">⌛</span>
            {/if}
            PDF
          </button>
          <button 
            type="button"
            onclick={printInvoice} 
            disabled={loadingPDF}
            class="bg-gray-800 hover:bg-gray-950 disabled:opacity-50 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            PRINT
          </button>
        </div>
      </div>

      <!-- Thermal Ticket Body -->
      <div id="thermal-ticket" class="bg-white p-6 font-mono text-[13px] text-gray-900 leading-tight print:p-0">
        <div class="text-center space-y-1 mb-6">
          <h2 class="font-black text-xl uppercase italic">{data.settings.shop_name}</h2>
          <p class="text-xs">{data.settings.shop_address}</p>
          <p class="text-xs">Tél: {data.settings.shop_phone}</p>
          <div class="border-b border-dashed border-gray-400 my-2 pt-2"></div>
          <p class="font-bold">FACTURÉ LE {new Date(invoiceData.sale.created_at).toLocaleDateString('fr-FR')}</p>
          <p class="text-[11px]">{new Date(invoiceData.sale.created_at).toLocaleTimeString('fr-FR')}</p>
        </div>

        <div class="space-y-1 mb-4">
          <div class="flex justify-between"><span>REF:</span><span class="font-bold">{invoiceData.sale.invoice_ref}</span></div>
          <div class="flex justify-between"><span>CAISSE:</span><span>{invoiceData.sale.pos_name}</span></div>
          <div class="flex justify-between"><span>CLIENT:</span><span>{invoiceData.sale.client_name ?? 'Anonyme'}</span></div>
          <div class="flex justify-between"><span>PAIEMENT:</span><span>{paymentLabels[invoiceData.sale.payment_method]}</span></div>
        </div>

        <div class="border-b border-dashed border-gray-400 my-3"></div>

        <table class="w-full text-[12px] mb-4">
          <thead>
            <tr class="text-left"><th class="pb-1">ART</th><th class="pb-1 text-center font-normal">QTÉ</th><th class="pb-1 text-right font-normal">P.U</th><th class="pb-1 text-right">TOTAL</th></tr>
          </thead>
          <tbody class="divide-y divide-dashed divide-gray-200">
            {#each invoiceData.items as item}
              <tr>
                <td class="py-1 uppercase font-bold text-[11px] truncate max-w-[100px]">{item.product_name}</td>
                <td class="py-1 text-center">{item.quantity}</td>
                <td class="py-1 text-right text-[11px]">{new Intl.NumberFormat('fr-MG').format(item.unit_price)}</td>
                <td class="py-1 text-right font-bold">{new Intl.NumberFormat('fr-MG').format(item.subtotal)}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <div class="border-t-2 border-double border-gray-900 pt-3 flex justify-between items-center mb-6">
          <span class="font-black text-sm">TOTAL (Ar)</span>
          <span class="text-lg font-black">{new Intl.NumberFormat('fr-MG').format(invoiceData.sale.total_amount)}</span>
        </div>

        <div class="text-center font-bold italic space-y-1">
          <p>MERCI DE VOTRE VISITE !</p>
          <p class="text-[10px] uppercase font-normal text-gray-500">A conserver - Ticket client</p>
        </div>
      </div>

      <div class="p-4 border-t bg-gray-50 flex justify-end print:hidden">
        <button 
          type="button"
          onclick={() => invoiceData = null} 
          disabled={loadingPDF}
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-8 py-2 rounded-lg text-xs transition-colors shadow-lg"
        >
          TERMINER
        </button>
      </div>
    </div>
  </div>
{/if}
