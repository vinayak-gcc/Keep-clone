<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '../components/Supabase';
    import { goto } from '$app/navigation';
    import { writable } from 'svelte/store';

    // Use stores for reactive data
    const isOpen = writable(false);
    import type { User } from '@supabase/supabase-js';
    const user = writable<User | null>(null);
    const currentAccount = writable<{ id: string; name: string; email: string; avatar: string } | null>(null);
    const accounts = writable<any[]>([]);

    // localStorage operations
    const getStoredAccounts = () => {
        try {
            return JSON.parse(localStorage.getItem('accounts') || '[]');
        } catch (e) {
            console.error('Error parsing accounts:', e);
            return [];
        }
    };

    const updateStoredAccounts = (newAccounts: any[]) => {
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
    };

    // Account management
    const updateAccounts = (account: any) => {
        accounts.update(prev => {
            if (!prev.some(a => a.id === account.id)) {
                const newAccounts = [...prev, account];
                updateStoredAccounts(newAccounts);
                return newAccounts;
            }
            return prev;
        });
    };

    const removeAccount = (accountId: string) => {
        accounts.update(prev => {
            const newAccounts = prev.filter(a => a.id !== accountId);
            updateStoredAccounts(newAccounts);
            return newAccounts;
        });
    };

    onMount(() => {
        // Initialize from localStorage
        accounts.set(getStoredAccounts());

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            user.set(currentUser);

            if (currentUser) {
                const account = {
                    id: currentUser.id,
                    name: currentUser.user_metadata?.full_name || currentUser.email,
                    email: currentUser.email || '',
                    avatar: currentUser.user_metadata?.avatar_url || ''
                };
                
                currentAccount.set(account);
                updateAccounts(account);
                localStorage.setItem('currentAccount', JSON.stringify(account));
                goto('/Notes');
            } else {
                currentAccount.set(null);
                localStorage.removeItem('currentAccount');
            }
        });

        return () => subscription.unsubscribe();
    });

    function toggleDropdown() {
        isOpen.update(v => !v);
    }

    async function login(loginHint?: string) {
        const options = loginHint ? { queryParams: { login_hint: loginHint } } : {};
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options
        });

        if (error) console.error('Login error:', error);
    }

    async function logout() {
        currentAccount.update(acc => {
            if (acc) removeAccount(acc.id);
            return null;
        });
        
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Logout error:', error);
    }

    function switchAccount(account: any) {
        login(account.email);
        isOpen.set(false);
    }
</script>

<div class="relative inline-block text-left">
    {#if $currentAccount}
        <button on:click={() => toggleDropdown()} class="flex items-center space-x-2 rounded-full hover:bg-gray-100 p-1">
            <img src={$currentAccount.avatar || "/placeholder.svg"} alt={$currentAccount.name} class="w-8 h-8 rounded-full" />
        </button>
    {:else}
        <button on:click={() => login()} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Sign in
        </button>
    {/if}

    {#if $isOpen && $currentAccount}
        <div class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div class="py-1" role="menu">
                <div class="px-4 py-2 text-sm text-gray-700">
                    <p class="font-medium">{$currentAccount.name}</p>
                    <p class="text-xs text-gray-500">{$currentAccount.email}</p>
                </div>

                <div class="border-t border-gray-100"></div>

                {#each $accounts as account (account.id)}
                    {#if account.id !== $currentAccount.id}
                        <button on:click={() => switchAccount(account)} class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <div class="flex items-center">
                                <img src={account.avatar || "/placeholder.svg"} alt={account.name} class="w-8 h-8 rounded-full mr-2" />
                                <div>
                                    <p class="font-medium">{account.name}</p>
                                    <p class="text-xs text-gray-500">{account.email}</p>
                                </div>
                            </div>
                        </button>
                    {/if}
                {/each}

                <div class="border-t border-gray-100"></div>

                <button on:click={() => login()} class="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100">
                    Add another account
                </button>

                <button on:click={logout} class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Sign out
                </button>
            </div>
        </div>
    {/if}
</div>