<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Point de Vente — Accueil</title>
  <meta name="description" content="Système de point de vente pour petite boutique." />
</svelte:head>

<div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
  <!-- Background decorative elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>
    <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-800 rounded-full opacity-10 blur-3xl"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-950 rounded-full opacity-20 blur-3xl"></div>
  </div>

  <div class="relative z-10 text-center px-4 mb-16">
    <div class="flex items-center justify-center gap-3 mb-6">
      <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
        <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13M7 13L5.4 5M9 19a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
      </div>
      <span class="text-white text-3xl font-bold tracking-wide">ShopPOS</span>
    </div>
    <h1 class="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
      Votre Caisse,<br/>
      <span class="text-blue-400">Simplifiée</span>
    </h1>
    <p class="text-gray-400 text-lg max-w-md mx-auto">
      Gérez vos ventes, produits et clients depuis une interface moderne et intuitive.
    </p>
  </div>

  <!-- Cards -->
  <div class="relative z-10 flex flex-col sm:flex-row gap-6 px-4 w-full max-w-3xl justify-center">
    <!-- POS Card -->
    <button
      onclick={() => goto('/pos')}
      class="group flex-1 bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/20 hover:-translate-y-1 cursor-pointer"
    >
      <div class="w-14 h-14 bg-blue-600 group-hover:bg-blue-500 rounded-xl flex items-center justify-center mb-5 transition-colors shadow-lg shadow-blue-600/30">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 class="text-white text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Point de Vente</h2>
      <p class="text-gray-500 text-sm leading-relaxed">Accédez à la caisse pour saisir des ventes, gérer le panier et générer des factures instantanément.</p>
      <div class="mt-6 flex items-center text-blue-500 text-sm font-semibold gap-2">
        Ouvrir la caisse 
        <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>

    <!-- Admin Card -->
    <button
      onclick={() => goto('/admin')}
      class="group flex-1 bg-gray-900 border border-gray-800 hover:border-gray-500 rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-gray-600/10 hover:-translate-y-1 cursor-pointer"
    >
      <div class="w-14 h-14 bg-gray-700 group-hover:bg-gray-600 rounded-xl flex items-center justify-center mb-5 transition-colors">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 class="text-white text-2xl font-bold mb-2 group-hover:text-gray-300 transition-colors">Administration</h2>
      <p class="text-gray-500 text-sm leading-relaxed">Configurez vos produits, catégories, clients et caisses. Consultez l'historique des ventes.</p>
      <div class="mt-6 flex items-center text-gray-500 text-sm font-semibold gap-2">
        Gérer la boutique
        <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  </div>

  <p class="relative z-10 text-gray-700 text-xs mt-12">ShopPOS v1.0 — Gestion de boutique locale</p>
</div>
