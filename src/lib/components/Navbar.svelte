<script lang="ts">
  import { Search, RefreshCw, LayoutGrid, LogIn, LogOut } from 'lucide-svelte';
  import { gridLayout } from '../../store';
  import { onMount } from 'svelte';
  import { supabase } from '../supabaseClient';
  import jQuery from 'jquery';

  let user: any = null;
  let refreshTrigger = false;

  onMount(() => {
    const initialize = async () => {
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      user = initialUser;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        user = session?.user ?? null;
      });
      return () => subscription.unsubscribe();
    };
    initialize();
  });

  onMount(() => {
    const handleSearch = () => {
      const searchTerm = jQuery('#searchInput').val()?.toString().trim().toLowerCase() || '';
      jQuery('.note-item').each(function() {
        const noteText = jQuery(this).text().toLowerCase();
        jQuery(this).toggle(noteText.includes(searchTerm));
      });
    };

    jQuery('#searchInput').on('input', handleSearch);

    return () => {
      jQuery('#searchInput').off('input', handleSearch);
    };
  });

  async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Login error:', error);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  }

  function refreshNotes() {
    refreshTrigger = !refreshTrigger;
    window.location.reload();
  }
</script>

<nav class="flex fixed z-50 w-full items-center justify-between px-4 py-2 pt-2 bg-white">
  <div class="flex items-center my-2">
    <h1 class="ml-12 text-xl font-sans text-gray-800">Keep</h1>
  </div>
  <div class="flex-grow max-w-3xl mx-4">
    <div class="relative">
      <input
      type="text"
      id="searchInput"
      placeholder="Search"
      class="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:shadow-md focus:outline-none"
    />
      <Search class="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 right-3 top-1/2" />
    </div>
  </div>
  <div class="flex items-center">
    <button on:click={refreshNotes} class="p-2 rounded-full hover:bg-gray-100">
      <RefreshCw class="w-6 h-6 text-gray-600" />
    </button>
    <button 
      on:click={() => $gridLayout = !$gridLayout}
      class="p-2 rounded-full hover:bg-gray-100"
    >
      <LayoutGrid class="w-6 h-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600'}" />
    </button>
    {#if user}
      <div class="flex items-center gap-2">
        {#if user.user_metadata?.avatar_url}
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            class="w-8 h-8 ml-2 rounded-full"
          />
        {:else}
          <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span class="text-sm text-gray-600">{user.email?.charAt(0).toUpperCase()}</span>
          </div>
        {/if}
        <button on:click={logout} class="p-2 rounded-full hover:bg-gray-100">
          <LogOut class="w-6 h-6 text-gray-600" />
        </button>
      </div>
    {:else}
      <button on:click={login} class="p-2 rounded-full hover:bg-gray-100">
        <LogIn class="w-6 h-6 text-gray-600" />
      </button>
    {/if}
  </div>
</nav>