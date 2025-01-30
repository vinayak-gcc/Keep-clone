<script lang="ts">

import { pinnedNotes, gridLayout} from '../../Store/store';

import { updateNoteImage , updateNoteImageUrl ,  removeNoteImage , trashNote , archiveNote , 
    updateNote , togglePin ,changeNoteColor } from './NoteActions';

let activeNoteMenu: { id: number | null, type: 'pinned' | 'unpinned' | null } = 
  { 
  id: null, 
  type: null 
   };

   let userEmail = "";
   let showpinnedbg = false;

  const defaultBackgrounds = [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  ];

</script>

  <!-- Pinned Notes -->
  {#if $pinnedNotes.length > 0}
  <h2 class="text-xl font-bold mb-4">Pinned</h2>
  <div class="{$gridLayout ? 'grid grid-cols-1 max-w-[50rem] gap-4 mx-auto' : 'masonry-grid'}">
    {#each $pinnedNotes as { id, title, content, color, image, pinned } (id)}
      <!-- Pinned Note Item -->
      <div class="masonry-item p-4 rounded-lg shadow-lg relative" style={`${image ? `background-image: url('${image}');` : ''} background-size: cover; background-position: center;`}>
        <div class="absolute inset-0 rounded-lg" style={`background-color: ${color}; opacity: 0.4;`}></div>
        <div class="relative z-10 h-full flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <input type="text" bind:value={title} class="w-full bg-transparent font-bold text-lg border-none" 
            on:input={(e) => updateNote(id, (e.target as HTMLInputElement).value, content , userEmail )} />
            <div class="flex gap-2">
              <button on:click={() => togglePin(id, pinned , userEmail )} class="text-yellow-500" aria-label={pinned ? 'Unpin note' : 'Pin note'}>
                {pinned ? '📌' : '📍'}
              </button>
            </div>
          </div>
          <textarea bind:value={content } class="w-full bg-transparent flex-grow resize-none border-none"
           on:input={(e) => updateNote(id, title,  userEmail , (e.target as HTMLTextAreaElement).value)}></textarea>
          
          <div class="flex gap-2 mt-4 items-center">

            <button
            title="Change Background"
              aria-label="label"
              on:click={() => (showpinnedbg = !showpinnedbg)}
              on:click={() => activeNoteMenu = activeNoteMenu.id === id && activeNoteMenu.type === 'pinned' 
              ? { id: null, type: null } 
              : { id: id, type: 'pinned' }}
              class="relative flex items-start justify-start mt-1 text-gray-600 hover:bg-gray-100 p-1 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </button>
            
            <!-- BackGround Options -->
            {#if showpinnedbg}
                {#if activeNoteMenu.id === id && activeNoteMenu.type === 'pinned'}

                    <div class=" background-button absolute mt-12 z-50 left-0 top-0 bg-white rounded-lg shadow-xl p-4 w-64">
                   
                      <!-- Background Options -->
                      <div class="flex flex-col gap-2">
                        <div class="flex gap-2">
                          
                          {#each ["#f3f4f6", "#fecaca", "#a7f3d0", "#bfdbfe", "#fde68a", "#ddd6fe"] as colorOption}
                          <button
                            aria-label="label"
                            on:click={() => changeNoteColor(id, colorOption, userEmail)}
                            on:click={() => {
                              showpinnedbg = !showpinnedbg;
                            }}
                            class="w-8 h-8 rounded-md"
                            style={`background-color: ${colorOption};`}
                          ></button>
                          {/each}

                        </div>
    
                        <div class="flex gap-2">
                          {#each defaultBackgrounds as bg}
                            <button
                              aria-label="label"
                              on:click={() => {
                                showpinnedbg = !showpinnedbg;
                                updateNoteImageUrl(id, bg , userEmail );
                              }}
                              class="w-8 h-8 rounded-md bg-cover bg-center"
                              style={`background-image: url('${bg}')`}
                            ></button>
                          {/each}
                        </div>
                      </div>
                      
                    </div>

                {/if}
            {/if}

            <label class="cursor-pointer" title="Change Image" >
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
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </label>

            {#if image}
              <button on:click={() => removeNoteImage(id)} class="text-red-500" aria-label="label" title="Remove Image">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            {/if}

             <button
             aria-label="label"
              on:click={() => archiveNote(id)} class="text-gray-500 hover:text-blue-500" title="Archive">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>

            <button 
            aria-label="label"
            on:click={() => trashNote(id)} class="text-gray-500 hover:text-red-500 ml-auto" title="Trash">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

          </div>
        </div>

      </div>
    {/each}
  </div>

{/if}

<style>
  .masonry-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-auto-flow: dense;
  }

  .masonry-item {
    break-inside: avoid;
  }

  @media (min-width: 1024px) {
  .masonry-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  }

  @media (max-width: 468px) {
    .masonry-grid {
      grid-template-columns: 2fr;
    }
  }

  @media (max-width: 140px) {
    .masonry-grid {
      grid-template-columns: 1fr;
    }
  }
</style>  