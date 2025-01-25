<script lang="ts">

  import { writable, derived } from "svelte/store";
  import { onMount } from "svelte";
  import { createClient } from '@supabase/supabase-js';

  const supabase = createClient(
    'https://hyaocbmqcrtqyhfwypci.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YW9jYm1xY3J0cXloZnd5cGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0Mjg4OTUsImV4cCI6MjA1MzAwNDg5NX0.fc4IdicgAMemJaSvdOt5MmVGJ93jinx1yUKExbvsKZ0'
  );

  const notes = writable<Array<{
    id: number;
    title: string;
    content: string;
    color: string;
    image?: string | null;
    pinned: boolean;
    user_email: string;
    created_at?: string;
  }>>([]);

  const pinnedNotes = derived(notes, $notes => $notes.filter(n => n.pinned));
  const unpinnedNotes = derived(notes, $notes => $notes.filter(n => !n.pinned));

  let newTitle = "";
  let newContent = "";
  let newColor = "white";
  let selectedImage: File | string | null = null;
  let userEmail = "";
  let newPinned = false;
  let showBackgroundOptions = false;
  let tempImageUrl: string | null = null;
  
  const defaultBackgrounds = [
    'https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  ];

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userEmail = user.email || "";
      await loadNotes();
    }
  });

  supabase.channel('Keep')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => loadNotes())
    .subscribe();

  async function loadNotes() {
    const { data } = await supabase.from('notes')
      .select('*')
      .eq('user_email', userEmail)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (data) notes.set(data);
  }

  async function addNote() {

    if (newTitle.trim() && newContent.trim()) {
      let imageUrl: string | null = null;

      try {
        if (selectedImage instanceof File) {
          const fileExt = selectedImage.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { error } = await supabase.storage
            .from('note_images')
            .upload(fileName, selectedImage);
          
          if (error) throw error;
          
          const { data: urlData } = supabase.storage
            .from('note_images')
            .getPublicUrl(fileName);
            
          imageUrl = urlData.publicUrl;
        } else if (typeof selectedImage === 'string') {
          imageUrl = selectedImage;
        }

        const { data, error } = await supabase.from('notes')
          .insert([{ 
            title: newTitle, 
            content: newContent, 
            color: newColor,
            image: imageUrl,
            pinned: newPinned,
            user_email: userEmail
          }])
          .select();

        if (error) throw error;

        newTitle = "";
        newContent = "";
        newColor = "white";
        selectedImage = null;
        newPinned = false;
        showBackgroundOptions = false;
        if (tempImageUrl) URL.revokeObjectURL(tempImageUrl);
        tempImageUrl = null;

        notes.update((current) => [...current, data[0]]);
      } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${(error as Error).message}`);
      }
    }
  }

  function handleImageSelect(event: Event) {

    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      selectedImage = file;
      tempImageUrl = URL.createObjectURL(file);
    } else {
      selectedImage = null;
      tempImageUrl = null;
    }
  }

  async function updateNote(id: number, title: string, content: string) {

    await supabase
      .from('notes')
      .update({ title, content })
      .eq('id', id)
      .eq('user_email', userEmail);

    notes.update(current => current.map(note => note.id === id ? { ...note, title, content } : note));
  }

  async function changeNoteColor(id: number, color: string) {
    await supabase
      .from('notes')
      .update({ color })
      .eq('id', id)
      .eq('user_email', userEmail);

    notes.update(current => current.map(note => note.id === id ? { ...note, color } : note));
  }

  async function deleteNote(id: number) {
    await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);

    notes.update(current => current.filter(note => note.id !== id));
  }

  async function togglePin(id: number, pinned: boolean) {
    await supabase
      .from('notes')
      .update({ pinned: !pinned })
      .eq('id', id)
      .eq('user_email', userEmail);

    notes.update(current => current.map(note => note.id === id ? { ...note, pinned: !pinned } : note));
  }

  async function updateNoteImage(id: number, file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('note_images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('note_images')
        .getPublicUrl(fileName);

      await supabase
        .from('notes')
        .update({ image: urlData.publicUrl })
        .eq('id', id);

      notes.update(current => 
        current.map(note => note.id === id ? { ...note, image: urlData.publicUrl } : note)
      );
    } catch (error) {
      console.error('Image update failed:', error);
    }
  }

  async function removeNoteImage(id: number) {
    await supabase
      .from('notes')
      .update({ image: null })
      .eq('id', id);
    
    notes.update(current => 
      current.map(note => note.id === id ? { ...note, image: null } : note)
    );
  }
</script>

<div class="mx-auto px-4 my-8 py-2 mt-20">
  {#if userEmail}
    <div 
      class="mb-8 px-2 border space-y-2 border-black rounded-lg max-w-[40vw] place-content-center mx-auto transition-colors duration-300"
      style={
        tempImageUrl 
          ? `background-image: url(${tempImageUrl})`
          : selectedImage && typeof selectedImage === 'string'
          ? `background-image: url(${selectedImage})`
          : `background-color: ${newColor}`
      }
    >
      <div class="flex flex-col group backdrop-blur-sm bg-white/30">
        <div class="flex items-center gap-2">
          <input
            type="text"
            bind:value={newTitle}
            placeholder="Title"
            class="w-full  border-none outline-none shadow-none bg-transparent placeholder-black"
          />

          <button
            on:click={() => newPinned = !newPinned}
            class={`p-1 rounded-full ${newPinned ? 'text-yellow-500' : 'text-gray-400'}`}
            aria-label="Pin note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/>
            </svg>

          </button>
        </div>

        <div class="hidden group-visited:block group-focus-within:block">
          <div>
            <input
              bind:value={newContent}
              placeholder="Take a note..."
              class="p-2 w-full border-none shadow-none bg-transparent placeholder-black"
            />
          </div>

          <div class="flex items-center justify-between py-2">

            <div class="flex gap-2 relative">

              <button
              aria-label="label"
                on:click={() => showBackgroundOptions = !showBackgroundOptions}
                class="ml-2 relative flex items-start justify-start mt-1 text-gray-600 hover:bg-gray-100 p-1 rounded-full"
              >

                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>

              </button>

              {#if showBackgroundOptions}
                <div class=" left-0 mb-2 bg-white rounded-lg shadow-xl p-4 w-64">
                    
                  
                <!-- Background Options -->
                  <div class="flex flex-col gap-2 mb-4">
      
                
                    <div class="flex gap-2">
                      {#each ["#f3f4f6", "#fecaca", "#a7f3d0", "#bfdbfe", "#fde68a", "#ddd6fe"] as color}
                        <button
                        aria-label="label"
                          on:click={() => {
                            newColor = color;
                            selectedImage = null;
                            tempImageUrl = null;
                          }}
                          class="w-8 h-8 rounded-md"
                          style={`background-color: ${color};`}
                        ></button>
                      {/each}
                    </div>

                    <div class="flex gap-2">
                      {#each defaultBackgrounds as bg}
                        <button
                        aria-label="label"
                          on:click={() => {
                            newColor = 'transparent';
                            selectedImage = bg;
                            tempImageUrl = null;
                          }}
                          class="w-8 h-8 rounded-md bg-cover bg-center"
                          style={`background-image: url('${bg}')`}
                        ></button>
                      {/each}
                    </div>                   

                    </div>
                </div>
              {/if}

              <button aria-label="label">
                <label class="cursor-pointer">
                  <buttton class="w-4 h-4">
                      <input 
                        type="file" 
                        accept="image/*" 
                        on:change={handleImageSelect} 
                        class="hidden"
                      />
                  </buttton>
                  <div class="mr-2  flex items-start justify-start  place-content-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </label>
              </button>


              <button
                on:click={addNote}
                class="px-4 py-2 w-fit h-fit bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if $pinnedNotes.length > 0}
      <h2 class="text-xl font-bold mb-4">Pinned</h2>
      <div class="grid gap-4 mb-8 max-w-[60vw] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {#each $pinnedNotes as { id, title, content, color, image, pinned } (id)}
          
        <div 
            class="p-4 rounded-lg shadow-lg relative min-h-[200px]"
            style={`
              ${image ? `background-image: url('${image}');` : ''}
              background-size: cover;
              background-position: center;
            `}
          >

            <div 
              class="absolute inset-0 rounded-lg"
              style={`background-color: ${color}; opacity: 0.4;`}
            ></div>
            <div class="relative z-10 h-full flex flex-col">
              <div class="flex items-center justify-between mb-2">

                <input
                  type="text"
                  bind:value={title}
                  class="w-full bg-transparent font-bold text-lg border-none"
                  on:input={(e) => {
                    const target = e.target as HTMLInputElement | null;
                    if (target) updateNote(id, target.value, content);
                  }}
                />

                <div class="flex gap-2">
                 
                  <button on:click={() => togglePin(id, pinned)} class="text-yellow-500">
                    {pinned ? '📌' : '📍'}
                  </button>

                </div>
              </div>


              <textarea
                bind:value={content}
                class="w-full bg-transparent flex-grow resize-none border-none"
                on:input={(e) => {
                  const target = e.target as HTMLTextAreaElement | null;
                  if (target) updateNote(id, title, target.value);
                }}
              ></textarea>

              <div class="flex gap-2 mt-4 items-center">
                {#each ["#f3f4f6", "yellow", "green", "orange", "pink", "purple"] as colorOption}
                  
                <button
                  aria-label="label"
                    on:click={() => changeNoteColor(id, colorOption)}
                    class={`w-4 h-4 rounded-full ${color === colorOption ? 'border-black' : 'border-gray-300'}`}
                    style={`background-color: ${colorOption};`}
                  ></button>

                {/each}
                <label class="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        on:change={(e) => {
                          const target = e.target as HTMLInputElement | null;
                          const file = target?.files?.[0];
                          if (file) updateNoteImage(id, file);
                        }} 
                        class="hidden"
                      />

                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>

                </label>

                {#if image}

                    <button on:click={() => removeNoteImage(id)} class="text-red-500 " aria-label="label" >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>

                {/if}

                <button on:click={() => deleteNote(id)} class="ml-auto" aria-label="label" >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>

              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if $unpinnedNotes.length > 0}
      <h2 class="text-xl font-bold mb-4">Others</h2>
      <div class="grid gap-4 max-w-[60vw] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {#each $unpinnedNotes as { id, title, content, color, image, pinned } (id)}
           
        <div 
              class="p-4 rounded-lg shadow-lg relative min-h-[200px]"
              style={`
                ${image ? `background-image: url('${image}');` : ''}
                background-size: cover;
                background-position: center;
              `}
            >

            <div 
              class="absolute inset-0 rounded-lg"
              style={`background-color: ${color}; opacity: 0.4;`}
            >
            </div>

            <div class="relative z-10 h-full flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <input
                  type="text"
                  bind:value={title}
                  class="w-full bg-transparent font-bold text-lg border-none"
                  on:input={(e) => {
                    const target = e.target as HTMLInputElement | null;
                    if (target) updateNote(id, target.value, content);
                  }}
                />

                <div class="flex gap-2">

                  <button on:click={() => togglePin(id, pinned)} class="text-yellow-500">
                    {pinned ? '📌' : '📍'}
                  </button>

                </div>
              </div>

              <textarea
                bind:value={content}
                class="w-full bg-transparent flex-grow resize-none border-none"
                on:input={(e) => {
                  const target = e.target as HTMLTextAreaElement | null;
                  if (target) updateNote(id, title, target.value);
                }}
              ></textarea>

              <div class="flex gap-2 mt-4 items-center">
               
                {#each ["#f3f4f6", "yellow", "green", "orange", "pink", "purple"] as colorOption}
                  <button
                  aria-label="label"
                    on:click={() => changeNoteColor(id, colorOption)}
                    class={`w-4 h-4 rounded-full ${color === colorOption ? 'border-black' : 'border-gray-300'}`}
                    style={`background-color: ${colorOption};`}
                  ></button>
                {/each}

                <label class="cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      on:change={(e) => {
                        const target = e.target as HTMLInputElement | null;
                        const file = target?.files?.[0];
                        if (file) updateNoteImage(id, file);
                      }} 
                      class="hidden"
                    />

                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>

                </label>

                {#if image}

                  <button on:click={() => removeNoteImage(id)} class="text-red-500" aria-label="label" >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>

                {/if}


                <button on:click={() => deleteNote(id)} class="ml-auto" aria-label="label" >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>

                
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
    
  {/if}
</div>