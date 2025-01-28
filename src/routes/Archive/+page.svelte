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
    const archivedNotes = writable<any[]>([]);
    let loading = true;
  
    onMount(async () => {
      if (browser) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userEmail = user.email ?? '';
          await loadArchivedNotes();
        }
        loading = false;
      }
    });
  
    async function loadArchivedNotes() {
      const { data, error } = await supabase.from('notes')
        .select('*')
        .eq('user_email', userEmail)
        .eq('archived', true)
        .order('created_at', { ascending: false });
  
      if (!error) archivedNotes.set(data || []);
    }
  
    async function unarchiveNote(id: number) {
      const { error } = await supabase
        .from('notes')
        .update({ archived: false })
        .eq('id', id);
  
      if (!error) await loadArchivedNotes();
    }
  </script>
  
  <div class="mx-auto mx-10 px-4 my-8 py-2 mt-20 relative overflow-visible dark:bg-[#202124] dark:text-white">
    {#if loading}
      <div class="text-center py-12 text-gray-500">Loading archived notes...</div>
    {:else if $archivedNotes.length === 0}
      <div class="text-center py-12 text-gray-500">No archived notes found</div>
    {:else}
      <h2 class="text-2xl font-bold mb-8">Archived Notes ({$archivedNotes.length})</h2>
      <div class="{$gridLayout ? 'grid grid-cols-1 max-w-[50rem] gap-4 mx-auto' : 'masonry-grid'}">
        {#each $archivedNotes as note (note.id)}
          <div
            class="masonry-item p-4 rounded-lg shadow-lg relative max-h-[10rem]"
            style={`background-color: ${note.color}; ${note.image ? `background-image: url(${note.image}); background-size: cover; background-position: center;` : ''}`}
          >
            <div class="absolute inset-0 rounded-lg bg-black/10"></div>
  
            <div class="relative z-10">
          
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-lg">{note.title}</h3>
                <button
                  aria-label="Unarchive"
                  on:click={() => unarchiveNote(note.id)}
                  class="text-blue-500 hover:text-blue-700"
                  title="Unarchive"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </button>
              </div>
  
              <p class="whitespace-pre-wrap text-sm mb-4 max-h-[3.7rem] overflow-hidden ">{note.content}</p>
  
      
  
              <div class="mt-4 text-xs text-black dark:white">
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