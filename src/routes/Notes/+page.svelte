<script lang="ts">

  import { onMount } from "svelte";
  import { browser } from '$app/environment';
  import { supabase } from '../../lib/components/Supabase';
  import { loadNotes } from '../../lib/components/NoteActions';
  import NewNote from "../../lib/components/NewNote.svelte";
  import Notes from "../../lib/components/Notes.svelte";
  
  let userEmail = "";
  let isLoading = true;

  onMount(async () => {
    if (browser) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || "";
        isLoading = false;
        await loadNotes(userEmail);
      }
    }
  });

  
</script>

  <div class="mx-auto px-4 my-8 py-2 mt-20 relative overflow-visible dark:bg-[#202124] dark:text-white">
    
     <NewNote />
    
     <div class="sm:mx-12 md:mx-28">

      <Notes />

    </div>

    
  </div>
