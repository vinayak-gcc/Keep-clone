<script lang="ts">
  import { Search, RefreshCw, LayoutGrid, Menu, Settings } from 'lucide-svelte';
  import { gridLayout, theme } from '../../Store/store';
  import { onMount } from 'svelte';
  import { supabase } from '../supabaseClient';
  import jQuery from 'jquery';
  import GoogleAuth from './GoogleAuth.svelte';

  let user: any = null;
  let refreshTrigger = false;
  let isMobileMenuOpen = false;
  let isSettingsOpen = false;
  let isMobileSettingsOpen = false;

  // Theme management
  function setTheme(newTheme: 'light' | 'dark') {
    $theme = newTheme;
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }

  onMount(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');

    // Auth initialization
    const initializeAuth = async () => {
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      user = initialUser;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        user = session?.user ?? null;
      });
      return () => subscription.unsubscribe();
    };
    initializeAuth();

    // Search functionality
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

<nav class="flex fixed z-50 w-full items-center justify-between px-4 py-2 pt-2 bg-white shadow-sm
 dark:bg-[#202124] dark:text-white dark:border-b dark:border-gray-500 ">
  <div class="flex items-center">
    <h1 class="text-xl font-sans ml-12 text-black dark:text-white">Keep</h1>
  </div>

  <button on:click={toggleMobileMenu} class="sm:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
    <Menu class="w-6 h-6 text-gray-600 dark:text-white" />
  </button>

  <!-- Desktop Search -->
  <div class="flex-grow max-w-3xl mx-4 hidden sm:block dark:bg-[#202124] dark:text-white">
    <div class="relative">
      <input
        type="text"
        id="searchInput"
        placeholder="Search"
        class="w-full px-4 py-2 bg-gray-100 rounded-lg  focus:bg-white focus:shadow-md focus:outline-none dark:placeholder-white 
        dark:bg-[#202124] dark:text-white"
      />
      <Search class="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 right-3 top-1/2 dark:text-gray-400" />
    </div>
  </div>

  <!-- Desktop Actions -->
  <div class="hidden sm:flex items-center space-x-4">


    <div class="relative">
      <button
        class="settings-button p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        on:click={() => isSettingsOpen = !isSettingsOpen}
      >
        <Settings class="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      {#if isSettingsOpen}
        
      <div class="settings-dropdown absolute right-0 mt-2 w-24 bg-white dark:bg-[#202124] rounded-md shadow-lg py-2 z-50">
          
        <button on:click={refreshNotes} class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <RefreshCw class="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
    
        <button on:click={() => $gridLayout = !$gridLayout} class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <LayoutGrid class="w-6 h-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600 dark:text-white'}" />
        </button>

         <button
            on:click={() => setTheme('dark')}
            on:click={() => isSettingsOpen = !isSettingsOpen}
            class="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Dark Mode
          </button>

          <button
            on:click={() => setTheme('light')}
            on:click={() => isSettingsOpen = !isSettingsOpen}
            class="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Light Mode
          </button>

        </div>


      {/if}
    </div>

    <GoogleAuth />
  </div>

  <!-- Mobile Menu -->
  {#if isMobileMenuOpen}
    <div class="sm:hidden absolute top-16 right-0 w-full bg-white dark:bg-gray-700 shadow-lg">
      <div class="flex flex-col items-center p-4 space-y-4">
        <div class="w-full">
          <div class="relative">
            <input
              type="text"
              id="searchInputMobile"
              placeholder="Search"
              class="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:shadow-md focus:outline-none dark:bg-gray-700
               dark:placeholder-white dark:text-gray-200"
            />
            <Search class="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 right-3 top-1/2 dark:text-gray-400" />
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2 w-full">
          <button on:click={refreshNotes} class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <RefreshCw class="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          <button on:click={() => $gridLayout = !$gridLayout} class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <LayoutGrid class="w-6 h-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'}" />
          </button>

          <div class="relative">
            <button
              on:click={() => isMobileSettingsOpen = !isMobileSettingsOpen}
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Settings class="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>

            {#if isMobileSettingsOpen}
              <div class="absolute left-0 mt-2 w-32 bg-white dark:bg-[#202124] rounded-md shadow-lg py-2 z-50">
                <button
                  on:click={() => setTheme('dark')}
                  class="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Dark Mode
                </button>
                
                <button
                  on:click={() => setTheme('light')}
                  class="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Light Mode
                </button>
              </div>
            {/if}
          </div>

          <div class="flex justify-center items-center">
            <GoogleAuth />
          </div>

        </div>
      </div>
    </div>
  {/if}

</nav>