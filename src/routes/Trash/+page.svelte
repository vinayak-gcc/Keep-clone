<script lang="ts">
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import { createClient } from '@supabase/supabase-js';
    import { browser } from '$app/environment';
    import { gridLayout } from "../../Store/store";
  
    const supabase = createClient(
      'https://hyaocbmqcrtqyhfwypci.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YW9jYm1xY3J0cXloZnd5cGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0Mjg4OTUsImV4cCI6MjA1MzAwNDg5NX0.fc4IdicgAMemJaSvdOt5MmVGJ93jinx1yUKExbvsKZ0'
    );
  
    let userEmail = "";
    let loading = true;
  
    interface Note {
      id: number;
      title: string;
      content: string;
      color: string;
      image?: string | null;
      trashed: boolean;
      created_at: string;
      user_email: string;
    }
  
    const trashedNotes = writable<Note[]>([]);
  
    onMount(async () => {
      if (browser) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userEmail = user.email ?? '';
          await loadTrashedNotes();
        }
        loading = false;
      }
    });
  
    async function loadTrashedNotes() {
      const { data, error } = await supabase.from('notes')
        .select('*')
        .eq('user_email', userEmail)
        .eq('trashed', true)
        .order('created_at', { ascending: false });
  
      if (!error) trashedNotes.set(data || []);
    }
  
    async function restoreNote(id: number) {
      const { error } = await supabase
        .from('notes')
        .update({ trashed: false })
        .eq('id', id);
  
      if (!error) await loadTrashedNotes();
    }
  
    async function deletePermanently(id: number) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
  
      if (!error) await loadTrashedNotes();
    }
  </script>
  
  <div class="mx-auto px-4 my-8 py-2 mt-20 mx-10 relative overflow-visible dark:bg-[#202124] dark:text-white">

    {#if loading}
      <div class="text-center py-12 text-gray-500">Loading trashed notes...</div>
   
      {:else if $trashedNotes.length === 0}
      <div class="text-center py-12 text-gray-500">Trash is empty</div>
        
      {:else}

      <h2 class="text-2xl font-bold mb-8">Trash ({$trashedNotes.length})</h2>
      <div class="{$gridLayout ? 'grid grid-cols-1 max-w-[50rem]  gap-4 mx-auto' : 'masonry-grid'}">
        {#each $trashedNotes as note (note.id)}
          <div
            class="masonry-item p-4 rounded-lg shadow-lg relative"
            style={`background-color: ${note.color}; ${note.image ? `background-image: url(${note.image});
             background-size: cover;  background-position: center;` : ''}`}
          >
            
            <div class="absolute inset-0 rounded-lg bg-black/10"></div>
  
            <div class="relative z-10">
              
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-lg  max-h-[2rem] overflow-hidden">
                  {note.title}
                </h3>
                <div class="flex gap-2">
                 
                    <button
                     aria-label="Restore"
                    on:click={() => restoreNote(note.id)}
                    class="text-blue-500 hover:text-blue-700"
                    title="Restore"
                     >

                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  <button
                    aria-label="Delete Permanently"
                    on:click={() => deletePermanently(note.id)}
                    class="text-red-500 hover:text-red-700"
                    title="Delete Permanently"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
  
              
              <p class="whitespace-pre-wrap text-sm mb-4 max-h-[3.7rem] overflow-hidden ">{note.content}</p>  
              
              <div class="mt-4 text-xs text-black dark:text-white">
                Created at: {new Date(note.created_at).toLocaleString()}
              </div>

            </div>

          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <style>
    .masonry-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      grid-auto-rows: masonry;
    }
  
    .masonry-item {
      break-inside: avoid;
      margin-bottom: 1rem;
    }
  
  </style>