<script lang="ts">
    import { Search, RefreshCw, LayoutGrid, Menu, Settings } from 'lucide-svelte';
    import { gridLayout, theme } from '../../Store/store';
    import { onMount } from 'svelte';
    import { supabase } from '../components/Supabase';
    import jQuery from 'jquery';
    import GoogleAuth from './GoogleAuth.svelte';
    import {downloadNotesBackup} from '../components/NoteActions'

    let user: any = null;
    let refreshTrigger = false;
    let isMobileMenuOpen = false;
    let isSettingsOpen = false;
    let searchTerm: string = '';
    let searchTimeout: ReturnType<typeof setTimeout>;

    function setTheme(newTheme: 'light' | 'dark') {
        $theme = newTheme;
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }

    onMount(() => {
        // Set saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme as 'light' | 'dark');

        // Enhanced search functionality
        jQuery('#searchInput').on('input', (event) => {
            clearTimeout(searchTimeout);
            searchTerm = jQuery(event.target).val()?.toString().trim().toLowerCase() || '';
            
            // Store the current search term in localStorage
            if (searchTerm) {
                localStorage.setItem('lastNoteSearch', searchTerm);
                
                // Add debounce to prevent too many redirects while typing
                searchTimeout = setTimeout(() => {
                    // Redirect to Notes page with query parameter
                    window.location.href = `/Notes?query=${encodeURIComponent(searchTerm)}`;
                }, 500); // 500ms debounce
            }
        });

        // Handle search form submission
        jQuery('#searchForm').on('submit', (event) => {
            event.preventDefault();
            clearTimeout(searchTimeout);
            
            if (searchTerm) {
                // Redirect to Notes page with query parameter
                window.location.href = `/Notes?query=${encodeURIComponent(searchTerm)}`;
            }
        });

        // Close settings dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            const settingsButton = document.querySelector('.settings-button');
            const settingsDropdown = document.querySelector('.settings-dropdown');
            if (
                isSettingsOpen &&
                settingsButton &&
                settingsDropdown &&
                !settingsButton.contains(event.target as Node) &&
                !settingsDropdown.contains(event.target as Node)
            ) {
                isSettingsOpen = false;
            }
        };
        document.addEventListener('click', handleClickOutside);

        return () => {
            jQuery('#searchInput').off('input');
            jQuery('#searchForm').off('submit');
            document.removeEventListener('click', handleClickOutside);
            clearTimeout(searchTimeout);
        };
    });

    async function login() {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
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

    function handleSearchSubmit(event: Event) {
        event.preventDefault();
        if (searchTerm) {
            clearTimeout(searchTimeout);
            window.location.href = `/Notes?query=${encodeURIComponent(searchTerm)}`;
        }
    }
</script>

<nav
    class="absolute z-50 flex w-full items-center justify-between bg-white px-4 py-2 pt-2 shadow-sm dark:border-b dark:border-gray-500 dark:bg-[#202124] dark:text-white"
>
    <!-- Logo -->
    <a href="/Notes" aria-label="Go to Notes page">
        <div class="flex items-center">
            <h1 class="ml-12 font-sans text-xl text-black dark:text-white">Keep</h1>
        </div>
    </a>

    <!-- Mobile Menu Button -->
    <button
        on:click={toggleMobileMenu}
        class="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 sm:hidden"
        aria-label="Toggle mobile menu"
    >
        <Menu class="h-6 w-6 text-gray-600 dark:text-white" />
    </button>

    <!-- Search Bar -->
    <form 
        id="searchForm"
        on:submit={handleSearchSubmit}
        class="mx-4 hidden max-w-3xl flex-grow dark:bg-[#202124] dark:text-white sm:block"
    >
        <div class="relative">
            <input
                type="text"
                id="searchInput"
                placeholder="Search"
                bind:value={searchTerm}
                class="w-full rounded-lg bg-gray-100 px-4 py-2 focus:bg-white focus:shadow-md focus:outline-none dark:bg-[#202124] dark:text-white dark:placeholder-white"
                aria-label="Search notes"
            />
            <button 
                type="submit"
                class="absolute right-3 top-1/2 -translate-y-1/2 transform"
                aria-label="Search notes"
            >
                <Search
                    class="h-5 w-5 text-gray-500 dark:text-gray-400"
                />
            </button>
        </div>
    </form>

    <!-- Actions and Settings (Desktop) -->
    <div class="hidden items-center space-x-4 sm:flex">
        <!-- Settings Dropdown -->
        <div class="relative">
            <button
                class="settings-button rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                on:click={() => (isSettingsOpen = !isSettingsOpen)}
                aria-label="Open settings"
            >
                <Settings class="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            {#if isSettingsOpen}
                <div
                    class="settings-dropdown absolute right-0 z-50 mt-2 w-24 rounded-md bg-white py-2 shadow-lg dark:bg-[#202124]"
                >
                    <button
                        on:click={refreshNotes}
                        class="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Refresh notes"
                    >
                        <RefreshCw class="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                        on:click={() => ($gridLayout = !$gridLayout)}
                        class="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Toggle grid layout"
                    >
                        <LayoutGrid
                            class="h-6 w-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600 dark:text-white'}"
                        />
                    </button>
                    {#if $theme === 'light'}
                        <button
                            on:click={() => setTheme('dark')}
                            class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                            aria-label="Switch to dark mode"
                        >
                            Dark Mode
                        </button>
                    {:else}
                        <button
                            on:click={() => setTheme('light')}
                            class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                            aria-label="Switch to light mode"
                        >
                            Light Mode
                        </button>
                    {/if}
                    <button
                        on:click={() => downloadNotesBackup(user.email)}
                        class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                        aria-label="Download notes backup"
                    >
                        Download Your Data
                    </button>
                </div>
            {/if}
        </div>

        <!-- Google Auth (Desktop) -->
        <GoogleAuth />
    </div>

    <!-- Mobile Menu (expanded) -->
    {#if isMobileMenuOpen}
        <div class="absolute left-0 right-0 top-14 z-50 bg-white p-4 shadow-md dark:bg-[#202124] sm:hidden">
            <!-- Mobile Search -->
            <form on:submit={handleSearchSubmit} class="mb-4">
                <div class="relative">
                    <input
                        type="text"
                        placeholder="Search"
                        bind:value={searchTerm}
                        class="w-full rounded-lg bg-gray-100 px-4 py-2 focus:bg-white focus:shadow-md focus:outline-none dark:bg-[#202124] dark:text-white dark:placeholder-white"
                    />
                    <button 
                        type="submit"
                        class="absolute right-3 top-1/2 -translate-y-1/2 transform"
                    >
                        <Search class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            </form>
            
            <!-- Mobile Settings Menu -->
             <div>
            <div class="grid grid-cols-4 gap-2">
                <button
                    on:click={refreshNotes}
                    class="flex flex-col items-center justify-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Refresh notes"
                >
                    <RefreshCw class="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    <span class="mt-1 text-xs">Refresh</span>
                </button>
                
                <button
                    on:click={() => ($gridLayout = !$gridLayout)}
                    class="flex flex-col items-center justify-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Toggle grid layout"
                >
                    <LayoutGrid class="h-6 w-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600 dark:text-white'}" />
                    <span class="mt-1 text-xs">Layout</span>
                </button>
                
                <button
                    on:click={() => setTheme($theme === 'light' ? 'dark' : 'light')}
                    class="flex flex-col items-center justify-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="{$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}"
                >
                    <Settings class="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    <span class="mt-1 text-xs">{$theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>

                                     
            <!-- Google Auth (Mobile) -->
            <div class="mt-2">
                <GoogleAuth />
            </div>
       

            </div>
                     
            <button
            on:click={() => downloadNotesBackup(user.email)}
            class="flex flex-col items-center justify-center rounded-md p-2 mx-4 hover:bg-gray-100 dark:hover:bg-gray-700 col-span-3"
            aria-label="Download notes backup"
        >
            <span class="text-sm">Download Your Data</span>
        </button>

    </div>
      
        </div>
    {/if}
</nav>