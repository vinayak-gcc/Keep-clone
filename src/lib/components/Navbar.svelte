<script lang="ts">
  import { Search, RefreshCw, LayoutGrid, LogIn, LogOut, Menu } from 'lucide-svelte';
  import { gridLayout } from '../../Store/store';
  import { onMount } from 'svelte';
  import { supabase } from '../supabaseClient';
  import jQuery from 'jquery';
  import GoogleAuth from './GoogleAuth.svelte';

  let user: any = null;
  let refreshTrigger = false;
  let isMobileMenuOpen = false; 

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

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }
</script>

<nav class="flex fixed z-50 w-full items-center justify-between px-4 py-2 pt-2 bg-white shadow-sm">
  
  <div class="flex items-center">
    <h1 class="text-xl font-sans ml-12  text-gray-800">Keep</h1>
  </div>

  <button on:click={toggleMobileMenu} class="sm:hidden p-2 rounded-full hover:bg-gray-100">
    <Menu class="w-6 h-6 text-gray-600" />
  </button>

  <!-- Search Bar (Hidden on sm and below) -->
  <div class="flex-grow max-w-3xl mx-4 hidden sm:block">
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

  <!-- Desktop Actions (Hidden on sm and below) -->
  <div class="hidden sm:flex items-center space-x-4">
    <button on:click={refreshNotes} class="p-2 rounded-full hover:bg-gray-100">
      <RefreshCw class="w-6 h-6 text-gray-600" />
    </button>

    <button on:click={() => $gridLayout = !$gridLayout} class="p-2 rounded-full hover:bg-gray-100">
      <LayoutGrid class="w-6 h-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600'}" />
    </button>

    <GoogleAuth />
  </div>

  <!-- Mobile Menu (Visible on sm and below) -->
  {#if isMobileMenuOpen}
    <div class="sm:hidden absolute top-16 right-0 w-full bg-white shadow-lg">
      <div class="flex flex-col items-center p-4 space-y-4">
        <!-- Search Bar -->
        <div class="w-full">
          <div class="relative">
            <input
              type="text"
              id="searchInputMobile"
              placeholder="Search"
              class="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:shadow-md focus:outline-none"
            />
            <Search class="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 right-3 top-1/2" />
          </div>
        </div>

        <button on:click={refreshNotes} class="w-full flex items-center justify-center p-2 rounded-full hover:bg-gray-100">
          <RefreshCw class="w-6 h-6 text-gray-600" />
          <span class="ml-2">Refresh</span>
        </button>

        <button on:click={() => $gridLayout = !$gridLayout} class="w-full hidden sm:block flex items-center justify-center p-2 rounded-full hover:bg-gray-100">
          <LayoutGrid class="w-6 h-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600'}" />
          <span class="ml-2">Toggle Layout</span>
        </button>

        <GoogleAuth />

        
      </div>
    </div>
  {/if}
</nav>

