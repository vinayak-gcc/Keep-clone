<script lang="ts">
	import { pinnedNotes, unpinnedNotes, gridLayout } from '../../Store/store';
	import {
		updateNoteImage,
		updateNoteImageUrl,
		trashNote,
		archiveNote,
		updateNote,
		togglePin,
		changeNoteColor
	} from '../components/NoteActions';
	import { onMount, afterUpdate } from 'svelte';

	// Current search term
	let currentSearchTerm = '';
	let searchCleared = false;

	
	// Flag to track if filtering is in progress to prevent race conditions
	let isFiltering = false;

	// Subscribe to store changes to re-apply filter when notes change
	$: {
		// When either pinnedNotes or unpinnedNotes change, reapply the filter
		if ($pinnedNotes || $unpinnedNotes) {
			if (currentSearchTerm && !isFiltering) {
				// Use setTimeout to ensure DOM has updated after store changes
				setTimeout(() => applyFilterToDOM(currentSearchTerm), 100);
			}
		}
	}

	onMount(() => {
		// Check for query parameter in URL
		const urlParams = new URLSearchParams(window.location.search);
		const queryParam = urlParams.get('query');
		
		console.log('Query parameter:', queryParam);
		
		// If there's a query parameter, use it for filtering notes
		if (queryParam) {
			currentSearchTerm = queryParam;
			setTimeout(() => applyFilterToDOM(currentSearchTerm), 300);
			
			// Update search input to match URL parameter
			const searchInput = document.getElementById('searchInput') as HTMLInputElement;
			if (searchInput) {
				searchInput.value = queryParam;
			}
		}
		// Otherwise check if there's a stored search term in localStorage
		else {
			const lastSearch = localStorage.getItem('lastNoteSearch');
			if (lastSearch) {
				currentSearchTerm = lastSearch;
				setTimeout(() => applyFilterToDOM(currentSearchTerm), 300);
				
				// Update search input to match stored search
				const searchInput = document.getElementById('searchInput') as HTMLInputElement;
				if (searchInput) {
					searchInput.value = lastSearch;
				}
			}
		}
	});

	// This function only handles the DOM manipulation part
	function applyFilterToDOM(searchTerm: string) {
		if (isFiltering) return; // Prevent concurrent filtering operations
		
		isFiltering = true;
		// console.log(`Applying filter with search term: ${searchTerm}`);
		
		// Get all notes as an array to work with
		const noteElements = Array.from(document.querySelectorAll('.masonry-item'));
		// console.log(`Found ${noteElements.length} note elements`);
		
		// Skip filtering if search term is empty
		if (!searchTerm || searchTerm.trim() === '') {
			noteElements.forEach(note => {
				(note as HTMLElement).style.display = 'block';
			});
			
			const noResultsMsg = document.getElementById('no-results-message');
			if (noResultsMsg) {
				noResultsMsg.style.display = 'none';
			}
			
			isFiltering = false;
			return;
		}
		
		const searchTermLower = searchTerm.toLowerCase();
		let visibleCount = 0;
		
		// Filter each note
		noteElements.forEach(note => {
			const noteElement = note as HTMLElement;
			const titleElement = noteElement.querySelector('input');
			const contentElement = noteElement.querySelector('textarea'); 
			
			// Get text content safely
			const title = titleElement ? (titleElement.value || '').toLowerCase() : '';
			const content = contentElement ? (contentElement.value || '').toLowerCase() : '';
			
			// Log for debugging
			// console.log(`Note title: "${title}", content: "${content.substring(0, 20)}..."`);
			
			// Check if note matches search
			if (title.includes(searchTermLower) || content.includes(searchTermLower)) {
				noteElement.style.display = 'block';
				visibleCount++;
				// console.log('Showing note - match found');
			} else {
				noteElement.style.display = 'none';
				// console.log('Hiding note - no match');
			}
		});
		
		// console.log(`Visible notes after filtering: ${visibleCount}`);
		
		// Show a message if no notes match
		let noResultsMsg = document.getElementById('no-results-message');
		
		if (visibleCount === 0) {
			if (!noResultsMsg) {
				noResultsMsg = document.createElement('div');
				noResultsMsg.id = 'no-results-message';
				noResultsMsg.className = 'text-center p-4 text-gray-500 dark:text-gray-400';
				
				const masonryGrid = document.querySelector('.masonry-grid');
				if (masonryGrid && masonryGrid.parentNode) {
					masonryGrid.parentNode.insertBefore(noResultsMsg, masonryGrid.nextSibling);
				} else {
					// Fallback if masonry-grid not found
					document.body.appendChild(noResultsMsg);
				}
				console.log('Created no results message');
			}
			
			noResultsMsg.textContent = `No notes found matching "${searchTerm}"`;
			noResultsMsg.style.display = 'block';
		} else if (noResultsMsg) {
			noResultsMsg.style.display = 'none';
		}
		
		isFiltering = false;
	}


// Replace the clearSearch function:
function clearSearch() {
  // Mark that search has been deliberately cleared
  searchCleared = true;
  
  // Clear the current search term
  currentSearchTerm = '';
  
  // Remove from localStorage
  localStorage.removeItem('lastNoteSearch');
  
  // Update URL to remove query parameter
  const url = new URL(window.location);
  url.searchParams.delete('query');
  window.history.pushState({}, '', url);
  
  // Clear the search input field
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Show all notes
  applyFilterToDOM('');
}

// Modify the handleSearch function to reset the cleared flag:
function handleSearch(searchTerm: string) {
  console.log(`Search initiated with term: ${searchTerm}`);
  
  // Reset the cleared flag once user actively searches
  if (searchTerm) {
    searchCleared = false;
  }
  
  currentSearchTerm = searchTerm;
  
  // Only store non-empty search terms
  if (searchTerm) {
    localStorage.setItem('lastNoteSearch', searchTerm);
  } else {
    localStorage.removeItem('lastNoteSearch');
  }
  
  // Update URL without full page reload
  const url = new URL(window.location);
  if (searchTerm) {
    url.searchParams.set('query', searchTerm);
  } else {
    url.searchParams.delete('query');
  }
  window.history.pushState({}, '', url);
  
  // Apply filtering
  applyFilterToDOM(searchTerm);
}

// Modify the onMount function:
onMount(() => {
  // Don't load previous searches if the search was just cleared
  if (searchCleared) return;
  
  // Check for query parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('query');
  
  console.log('Query parameter:', queryParam);
  
  // If there's a query parameter, use it for filtering notes
  if (queryParam) {
    currentSearchTerm = queryParam;
    setTimeout(() => applyFilterToDOM(currentSearchTerm), 300);
    
    // Update search input to match URL parameter
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = queryParam;
    }
  }
  // Otherwise check if there's a stored search term in localStorage
  else {
    const lastSearch = localStorage.getItem('lastNoteSearch');
    if (lastSearch) {
      currentSearchTerm = lastSearch;
      setTimeout(() => applyFilterToDOM(currentSearchTerm), 300);
      
      // Update search input to match stored search
      const searchInput = document.getElementById('searchInput') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = lastSearch;
      }
    }
  }
});

// Add this to prevent the reactive statement from re-applying search
// when search has been cleared
$: {
  if ($pinnedNotes || $unpinnedNotes) {
    if (currentSearchTerm && !isFiltering && !searchCleared) {
      setTimeout(() => applyFilterToDOM(currentSearchTerm), 100);
    }
  }
}

// Add event listener for input field changes 
// Make sure to add this in your onMount function:
onMount(() => {
  // Previous code...
  
  // Add event listener to search input to detect when user clears it manually
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.value === '') {
        clearSearch();
      }
    });
  }
});

// Modify the onMount function to respect when search has been deliberately cleared
onMount(() => {
  // Check for query parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('query');
  
//   console.log('Query parameter:', queryParam);
  
  // Only apply saved search if clearSearch hasn't been called recently
  if (!isFiltering) {
    // If there's a query parameter, use it for filtering notes
    if (queryParam) {
      currentSearchTerm = queryParam;
      setTimeout(() => applyFilterToDOM(currentSearchTerm), 300);
      
      // Update search input to match URL parameter
      const searchInput = document.getElementById('searchInput') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = queryParam;
      }
    }
    // Otherwise check if there's a stored search term in localStorage
    else {
      const lastSearch = localStorage.getItem('lastNoteSearch');
      if (lastSearch) {
        currentSearchTerm = lastSearch;
        setTimeout(() => applyFilterToDOM(currentSearchTerm), 300);
        
        // Update search input to match stored search
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = lastSearch;
        }
      }
    }
  }
});

	interface Note {
		id: number;
		title: string;
		content: string;
		color: string;
		image?: string | null;
		pinned: boolean;
	}

	let userEmail = '';
	let showModal = false;
	let selectedNoteId: number | null = null;
	let expandedNote: Note | null = null;
	let modalPosition = { x: 0, y: 0 };

	const defaultBackgrounds = [
		'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
	];

	const toggleModal = (noteId: number, event: any) => {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const margin = 16; // 4 units in Tailwind (16px)

		modalPosition = {
			x: Math.max(rect.left + 120),
			y: rect.bottom + margin
		};

		showModal = !showModal;
		selectedNoteId = noteId;
	};

	function handleClickOutside(event: MouseEvent) {
		if (showModal && !(event.target as HTMLElement).closest('.modal-content')) {
			showModal = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

{#each [$pinnedNotes, $unpinnedNotes] as notes, i}
	{#if notes.length > 0}
		<h2 class="text-xl font-bold {i ? 'my-4' : 'mb-4'}">{i ? 'Others' : 'Pinned'}</h2>
		<div class={$gridLayout ? 'mx-auto grid max-w-[50rem] grid-cols-1 gap-4' : 'masonry-grid'}>
			{#each notes as note (note.id)}
				<div
					class="masonry-item group relative cursor-pointer rounded-lg p-4 shadow-lg transition-transform duration-200 hover:scale-[1.02]"
					style={`background-image: ${note.image ? `url('${note.image}')` : 'none'}; background-size: cover; background-position: center;`}
					on:click|preventDefault={() => (expandedNote = note)}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && (expandedNote = note)}
				>
					<div
						class="absolute inset-0 rounded-lg"
						style={`background-color: ${note.color}; opacity: ${note.image ? '0' : '0.9'};`}
						role="presentation"
					></div>
					<div class="relative z-10 flex h-full flex-col">
						<div class="mb-2 flex items-center justify-between">
							<input
								bind:value={note.title}
								class="pointer-events-none w-full border-none bg-transparent text-lg font-bold note-title"
								readonly
							/>
							<button
								on:click|stopPropagation={() => togglePin(note.id.toString(), note.pinned)}
								class="text-yellow-500"
							>
								{note.pinned ? '📌' : '📍'}
							</button>
						</div>
						<textarea
							bind:value={note.content}
							class="pointer-events-none w-full flex-grow resize-none border-none bg-transparent note-content"
							readonly
						></textarea>

						<div
							class="note-actions z-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
							role="group"
						>
							<!-- Toggle Modal Action -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								role="button"
								tabindex="0"
								aria-label="Toggle Color/Image Modal"
								on:keydown={(e) => e.key === 'Enter' && toggleModal(note.id, e)}
								on:click|stopPropagation={(e) => toggleModal(note.id, e)}
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>

							<!-- Update Note Image Action -->
							<label class="cursor-pointer" on:click|stopPropagation>
								<input
									type="file"
									accept="image/*"
									on:change|stopPropagation={(e) => {
										const file = (e.target as HTMLInputElement)?.files?.[0];
										file && updateNoteImage(note.id, file);
									}}
									class="hidden"
								/>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									role="button"
									tabindex="0"
									aria-label="Update Note Image"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</label>

							<!-- Archive Note Action -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								role="button"
								tabindex="0"
								aria-label="Archive Note"
								on:keydown={(e) => e.key === 'Enter' && archiveNote(note.id)}
								on:click|stopPropagation={(e) => {
									archiveNote(note.id);
									expandedNote = null;
								}}
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								/>
							</svg>

							<!-- Trash Note Action -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								role="button"
								tabindex="0"
								aria-label="Trash Note"
								on:keydown={(e) => e.key === 'Enter' && trashNote(note.id)}
								on:click|stopPropagation={(e) => {
									trashNote(note.id);
									expandedNote = null;
								}}
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{/each}

<!-- No results message placeholder -->
<div id="no-results-message" class="text-center p-4 text-gray-500 dark:text-gray-400" style="display: none;"></div>

{#if expandedNote}
	<section
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
		role="dialog"
		aria-modal="true"
		on:click={() => (expandedNote = null)}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
			on:click|stopPropagation
			style={`background-image: ${expandedNote.image ? `url('${expandedNote.image}')` : 'none'}; background-color: ${expandedNote.color}; background-size: cover;`}
		>
			<div class="relative z-10">
				<div class="mb-4 flex items-center justify-between">
					<input
						bind:value={expandedNote.title}
						class="w-full border-none bg-transparent text-2xl font-bold note-title"
						on:input={(e) => {
							if (expandedNote) {
								updateNote(
									expandedNote.id,
									(e.target as HTMLInputElement).value,
									expandedNote.content,
								);
							} else {
								console.error('expandedNote is null');
							}
						}}
					/>
					<button
						on:click={() => (expandedNote = null)}
						class="text-xl text-black hover:text-gray-800">✕</button
					>
				</div>
				<textarea
					bind:value={expandedNote.content}
					class="min-h-[200px] w-full resize-none border-none bg-transparent text-lg note-content"
					on:input={(e) => {
						if (expandedNote) {
							updateNote(
								expandedNote.id,
								expandedNote.title,
								(e.target as HTMLInputElement).value,
							);
						} else {
							console.error('expandedNote is null');
						}
					}}
				>
				</textarea>
				<div class="modal-actions mt-4 flex justify-end gap-4">
					<!-- Toggle Modal Action -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-label="Toggle Color/Image Modal"
						on:keydown={(e) => e.key === 'Enter' && toggleModal(expandedNote!.id, e)}
						on:click|stopPropagation={(e) => toggleModal(expandedNote!.id, e)}
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>

					<!-- Update Note Image Action -->
					<label class="cursor-pointer" on:click|stopPropagation>
						<input
							type="file"
							accept="image/*"
							on:change|stopPropagation={(e) => {
								if (expandedNote) {
									const file = (e.target as HTMLInputElement)?.files?.[0];
									file && updateNoteImage(expandedNote.id, file);
								} else {
									console.error('expandedNote is null');
								}
							}}
							class="hidden"
						/>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-label="Update Note Image"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</label>

					<!-- Archive Note Action -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-label="Archive Note"
						on:keydown={(e) => e.key === 'Enter' && archiveNote(expandedNote!.id)}
						on:click|stopPropagation={(e) => {
							archiveNote(expandedNote!.id);
							expandedNote = null;
						}}
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/>
					</svg>

					<!-- Trash Note Action -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-label="Trash Note"
						on:keydown={(e) => e.key === 'Enter' && trashNote(expandedNote!.id)}
						on:click|stopPropagation={(e) => {
							trashNote(expandedNote!.id);
							expandedNote = null;
						}}
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</div>
			</div>
		</div>
	</section>
{/if}

{#if showModal}
	<div
		class="modal-content fixed z-[60] w-72 flex-wrap"
		style="left: {modalPosition.x}px; top: {modalPosition.y}px;"
		on:click|stopPropagation
	>
		<div
			class="w-64 -translate-x-1/2 transform rounded-lg bg-white px-0 py-2 shadow-xl"
			on:click|stopPropagation
		>
			<div class="flex flex-col gap-2">
				<div class="flex flex-wrap justify-center gap-2">
					{#each ['#f3f4f6', '#fecaca', '#a7f3d0', '#bfdbfe', '#fde68a', '#ddd6fe'] as colorOption}
						<button
							class="h-8 w-8 rounded-md"
							aria-label="Change Color"
							style={`background-color: ${colorOption};`}
							on:click={() => {
								changeNoteColor(selectedNoteId!, colorOption);
								showModal = false;
							}}
						>
						</button>
					{/each}
				</div>
				<div class="flex flex-wrap justify-center gap-2">
					{#each defaultBackgrounds as bg}
						<button
							aria-label="UpdateNoteImage"
							class="h-8 w-8 rounded-md bg-cover bg-center"
							style={`background-image: url('${bg}')`}
							on:click={() => {
								updateNoteImageUrl(selectedNoteId!, bg);
								showModal = false;
							}}
						>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.masonry-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		grid-auto-flow: dense;
		break-inside: avoid;
	}

	.note-actions {
		@apply mt-4 flex items-center gap-2;
		transition: opacity 0.2s ease-in-out;
	}

	.modal-actions {
		@apply flex items-center gap-2;
	}

	.modal-content {
		filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
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
	@media (max-width: 375px) {
		.masonry-grid {
			grid-template-columns: 1fr;
		}
	}

	.note-actions svg {
		font-weight: normal;
	}
</style>