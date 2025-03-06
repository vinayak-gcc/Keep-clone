<script lang="ts">
  import { supabase } from "../../lib/components/Supabase";
  import { loadNotes } from "../../lib/components/NoteActions";
  import NewNote from "../../lib/components/NewNote.svelte";
  import Notes from "../../lib/components/Notes.svelte";

  let userEmail = "";
  let authSubscription: any = null; // Holds Supabase listener

  // console.log("Component initialized");

  // Ensure only one subscription exists
  if (!authSubscription) {
    authSubscription = supabase.auth.onAuthStateChange((event, session) => {

      if (session?.user?.email && session.user.email !== userEmail) {
        userEmail = session.user.email;
        // console.log(" User email:", userEmail);

      
          loadNotes(userEmail);
          console.log("Notes loaded for new session:", userEmail);
      }
    });
  }
</script>

<div class="mx-auto px-4 my-8 py-2 mt-20 relative overflow-visible dark:bg-[#202124] dark:text-white">
 
  <NewNote />

      <div class="sm:mx-12 md:mx-28">
        <Notes />
      </div>

      
</div>
