<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../components/Supabase';
  import { goto } from '$app/navigation'; 

  let isOpen = false;
  let loading = true;
  let user: any = null;
  let currentAccount: any = null;
  let accounts: any[] = [];

  // Account management functions
  const loadAccounts = () => {
    const storedAccounts = localStorage.getItem('accounts');
    if (storedAccounts) {
      try {
        accounts = JSON.parse(storedAccounts);
      } catch (e) {
        console.error('Error parsing stored accounts:', e);
      }
    }
  };

  const saveAccounts = () => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  };

  const updateAccounts = (account: any) => {
    const existing = accounts.find(a => a.id === account.id);
    if (!existing) {
      accounts = [...accounts, account];
      saveAccounts();
    }
  };

  const removeAccount = (accountId: string) => {
    accounts = accounts.filter(a => a.id !== accountId);
    saveAccounts();
  };

  onMount(() => {
    loadAccounts();

    // Get initial session and set up listener
    const getInitialSession = async () => {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Set user and account based on session
      if (session?.user) {
        user = session.user;
        currentAccount = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
          avatar: user.user_metadata?.avatar_url || ''
        };
        updateAccounts(currentAccount);
        
        // Redirect to Notes if on home page
        if (window.location.pathname === '/') {
          goto('/Notes');
        }
      }

      // Set loading to false
      loading = false;
    };

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        user = session?.user ?? null;
        
        if (user) {
          currentAccount = {
            id: user.id,
            name: user.user_metadata?.full_name || user.email,
            email: user.email,
            avatar: user.user_metadata?.avatar_url || ''
          };
          updateAccounts(currentAccount);
          
          // Redirect to Notes if on home page
          if (window.location.pathname === '/') {
            goto('/Notes');
          }
        } else {
          currentAccount = null;
          goto('/');
        }
      }
    );

    // Initial session check
    getInitialSession();

    // Cleanup listener on component destroy
    return () => {
      authListener.subscription.unsubscribe();
    };
  });

  // Toggle dropdown and auth functions
  function toggleDropdown() { isOpen = !isOpen; }

  async function login(loginHint?: string) {
    const options: any = {};
    if (loginHint) options.queryParams = { login_hint: loginHint };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options
    });

    if (error) console.error('Login error:', error);
  }

  async function logout() {
    if (currentAccount) removeAccount(currentAccount.id);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
    goto('/');
  }

  function switchAccount(account: any) {
    login(account.email);
    isOpen = false;
  }
</script>

<!-- Dropdown UI remains the same -->
{#if loading}
  <div class="flex items-center justify-center">
    <p>Loading...</p>
  </div>
{:else}
  <div class="relative inline-block text-left">
    {#if currentAccount}
      <button on:click={toggleDropdown} class="flex items-center space-x-2 rounded-full hover:bg-gray-100 p-1">
        <img src={currentAccount.avatar || "/placeholder.svg"} alt={currentAccount.name} class="w-8 h-8 rounded-full" />
      </button>
    {:else}
      <button on:click={() => login()} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
        Sign in
      </button>
    {/if}

    {#if isOpen && currentAccount}
      <div class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
        <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
          <div class="px-4 py-2 text-sm text-gray-700 flex items-center">
            <img src={currentAccount.avatar || "/placeholder.svg"} alt={currentAccount.name} class="w-8 h-8 rounded-full mr-2" />
            <div>
              <p class="font-medium">{currentAccount.name}</p>
              <p class="text-xs text-gray-500">{currentAccount.email}</p>
            </div>
          </div>
          <div class="border-t border-gray-100"></div>

          {#each accounts as account (account.id)}
            {#if account.id !== currentAccount.id}
              <button on:click={() => switchAccount(account)} class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
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

          <button 
            on:click={() => { login(); }} 
            class="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100" role="menuitem">
            Add another account
          </button>

          <button on:click={logout} class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
            Sign out
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}