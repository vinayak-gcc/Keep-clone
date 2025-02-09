<script lang="ts">
	import { Search, RefreshCw, LayoutGrid, Menu, Settings } from 'lucide-svelte';
	import { gridLayout, theme } from '../../Store/store';
	import { onMount } from 'svelte';
	import { supabase } from '../components/Supabase';
	import jQuery from 'jquery';
	import GoogleAuth from './GoogleAuth.svelte';

	let user: any = null;
	let refreshTrigger = false;
	let isMobileMenuOpen = false;
	let isSettingsOpen = false;
	let isMobileSettingsOpen = false;

	function setTheme(newTheme: 'light' | 'dark') {
		$theme = newTheme;
		localStorage.setItem('theme', newTheme);
		document.documentElement.classList.toggle('dark', newTheme === 'dark');
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme') || 'light';
		setTheme(savedTheme as 'light' | 'dark');

		const initializeAuth = async () => {
			const {
				data: { user: initialUser }
			} = await supabase.auth.getUser();
			user = initialUser;
			const {
				data: { subscription }
			} = supabase.auth.onAuthStateChange((event, session) => {
				user = session?.user ?? null;
			});
			return () => subscription.unsubscribe();
		};
		initializeAuth();

		const handleSearch = () => {
			const searchTerm = jQuery('#searchInput').val()?.toString().trim().toLowerCase() || '';
			jQuery('.note-item').each(function () {
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
</script>

<nav
	class="absolute z-50 flex w-full items-center justify-between bg-white px-4 py-2 pt-2 shadow-sm dark:border-b dark:border-gray-500 dark:bg-[#202124] dark:text-white"
>
	<div class="flex items-center">
		<h1 class="ml-12 font-sans text-xl text-black dark:text-white">Keep</h1>
	</div>

	<button
		on:click={toggleMobileMenu}
		class="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 sm:hidden"
	>
		<Menu class="h-6 w-6 text-gray-600 dark:text-white" />
	</button>

	<div class="mx-4 hidden max-w-3xl flex-grow dark:bg-[#202124] dark:text-white sm:block">
		<div class="relative">
			<input
				type="text"
				id="searchInput"
				placeholder="Search"
				class="w-full rounded-lg bg-gray-100 px-4 py-2 focus:bg-white focus:shadow-md focus:outline-none dark:bg-[#202124] dark:text-white dark:placeholder-white"
			/>
			<Search
				class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500 dark:text-gray-400"
			/>
		</div>
	</div>

	<div class="hidden items-center space-x-4 sm:flex">
		<div class="relative">
			<button
				class="settings-button rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
				on:click={() => (isSettingsOpen = !isSettingsOpen)}
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
					>
						<RefreshCw class="h-6 w-6 text-gray-600 dark:text-gray-300" />
					</button>
					<button
						on:click={() => ($gridLayout = !$gridLayout)}
						class="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<LayoutGrid
							class="h-6 w-6 {$gridLayout ? 'text-blue-500' : 'text-gray-600 dark:text-white'}"
						/>
					</button>
					{#if $theme === 'light'}
						<button
							on:click={() => setTheme('dark')}
							class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
						>
							Dark Mode
						</button>
					{:else}
						<button
							on:click={() => setTheme('light')}
							class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
						>
							Light Mode
						</button>
					{/if}
				</div>
			{/if}
		</div>
		<GoogleAuth />
	</div>
</nav>
