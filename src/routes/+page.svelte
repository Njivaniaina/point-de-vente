<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.settings.shop_name || 'ShopPOS'} — Gestion de point de vente locale</title>
</svelte:head>

<div class="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
  <!-- Gradient Background -->
  <div class="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-emerald-900/20 z-0"></div>
  <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.15),_transparent_50%)] z-0"></div>

  <div class="relative z-10 max-w-4xl w-full">
    <!-- Logo -->
    <div class="flex items-center justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
        <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13M7 13L5.4 5M9 19a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
      </div>
      <span class="text-white text-3xl font-bold tracking-wide">{data.settings.shop_name || 'ShopPOS'}</span>
    </div>

    <!-- Hero Section -->
    <h1 class="text-5xl md:text-6xl font-black text-white mb-4 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
      Votre Caisse,<br/>
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Simplifiée à l'Extrême.</span>
    </h1>
    
    <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
      Gérez vos produits, suivez vos stocks et encaissez vos clients avec une interface fluide, moderne et performante.
    </p>

    <!-- CTAs -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both">
      <a 
        href="/pos" 
        class="group relative px-8 py-4 bg-blue-600 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-3 overflow-hidden"
      >
        <span class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        ACCÉDER À LA CAISSE
      </a>

      <a 
        href="/admin" 
        class="group px-8 py-4 bg-gray-800 rounded-2xl text-gray-200 font-bold text-lg hover:bg-gray-700 hover:text-white transition-all flex items-center gap-3 border border-gray-700"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
        </svg>
        ADMINISTRATION
      </a>
    </div>
  </div>

  <p class="relative z-10 text-gray-700 text-xs mt-12">{data.settings.shop_name || 'ShopPOS'} v1.0 — Gestion de boutique locale</p>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
