<script lang="ts">

  import { onMount } from "svelte";
  import { browser } from '$app/environment';
  import { supabase } from '../../lib/components/Supabase';
  import { loadPinnedNotes, loadNotes } from '../../lib/components/NoteActions';
  import NewNote from "../../lib/components/NewNote.svelte";
  import PinnedNotes from "$lib/components/PinnedNotes.svelte";
  import UnpinnedNotes from "$lib/components/UnpinnedNotes.svelte";
  
  let userEmail = "";

  onMount(async () => {
    if (browser) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || "";
        await loadPinnedNotes(userEmail); 
        await loadNotes(userEmail); 
      }
    }
  });

  
</script>

  <!-- Main page content -->
  <div class="mx-auto px-4 my-8 py-2 mt-20 relative overflow-visible dark:bg-[#202124] dark:text-white">
    
   <!-- New Note Form -->
   <NewNote />
    
    <!-- Show This if User is Logged In -->
    {#if userEmail}

    <!-- Pinned and Unpinned Notes -->
    <div class="sm:mx-12 md:mx-28">

      <!-- Pinned Notes -->
      <PinnedNotes />

      <!-- Unpinned Notes -->
      <UnpinnedNotes />

  </div>

    {/if}
    
  </div>
