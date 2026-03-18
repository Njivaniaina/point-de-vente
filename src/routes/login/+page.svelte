<script lang="ts">
  import { enhance } from '$app/forms';
  import { Lock, User, AlertCircle } from 'lucide-svelte';

  let { form } = $props();
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 mb-4">
        <Lock size={32} />
      </div>
      <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Administration</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Connectez-vous pour gérer votre point de vente</p>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 transition-colors duration-300">
      {#if form?.error}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <p>{form.error}</p>
        </div>
      {/if}

      <form method="POST" use:enhance class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Utilisateur</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <User size={18} />
            </div>
            <input 
              type="text" 
              name="username" 
              id="username" 
              required
              class="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="ex: admin"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={18} />
            </div>
            <input 
              type="password" 
              name="password" 
              id="password" 
              required
              class="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          type="submit" 
          class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Se connecter
        </button>
      </form>
    </div>

    <div class="mt-8 text-center">
      <a href="/pos" class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        ← Retour au Point de Vente
      </a>
    </div>
  </div>
</div>
