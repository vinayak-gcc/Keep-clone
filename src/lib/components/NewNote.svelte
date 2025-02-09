<script lang="ts">
	import { addNote } from '../../lib/components/NoteActions';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { supabase } from '../../lib/components/Supabase';

	let newTitle = '';
	let newContent = '';
	let newColor = 'white';
	let selectedImage: File | string | null = null;
	let userEmail = '';
	let newPinned = false;
	let showBackgroundOptions = false;
	let tempImageUrl: string | null = null;

	const defaultBackgrounds = [
		'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
		'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
	];

	onMount(async () => {
		if (browser) {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (user) {
				userEmail = user.email || '';
			}
		}
	});

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

	async function handleAddNote() {
		try {
			// Add the note using the `addNote` function
			await addNote(newTitle, newContent, newColor, selectedImage, userEmail, newPinned);

			// Clear the input fields after successfully adding the note
			newTitle = '';
			newContent = '';
			newColor = 'white';
			selectedImage = null;
			tempImageUrl = null;
			newPinned = false;
			showBackgroundOptions = false;

			console.log('Input fields cleared.');
		} catch (error) {
			console.error('Failed to add note:', error);
		}
	}
</script>

<!-- New Note Form -->
<div
	class="mx-auto mb-8 w-full max-w-[30rem] place-content-center space-y-2 rounded-lg border p-0 transition-colors duration-300 dark:bg-gray-800 dark:text-white md:w-[30rem] lg:w-[40rem]"
	style={tempImageUrl
		? `background-image: url(${tempImageUrl})`
		: selectedImage && typeof selectedImage === 'string'
			? `background-image: url(${selectedImage})`
			: `background-color: ${newColor}`}
>
	<div
		class="group flex flex-col px-2 dark:border dark:border-white dark:bg-[#202124] dark:text-white"
	>
		<div class="flex w-full gap-2">
			<div class="mt-1 w-full">
				<input
					type="text"
					bind:value={newTitle}
					placeholder="Title"
					class="w-full border-none bg-transparent placeholder-black shadow-none outline-none focus:ring-white dark:placeholder-white dark:focus:ring-[#202124]"
				/>
			</div>
			<div>
				<button
					on:click={() => (newPinned = !newPinned)}
					class={`mt-2.5 rounded-full p-1 hover:bg-gray-100 ${newPinned ? 'text-yellow-500' : 'text-gray-400'}`}
					aria-label="Pin note"
					title="Pin or Unpin Note"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
					</svg>
				</button>
			</div>
		</div>
		<div class="hidden group-visited:block group-focus-within:block">
			<div>
				<input
					bind:value={newContent}
					placeholder="Take a note..."
					class="w-full border-none bg-transparent p-2 placeholder-black shadow-none focus:ring-white dark:placeholder-white dark:focus:ring-[#202124]"
				/>
			</div>
			<div class="flex items-center justify-between py-2">
				<div class="relative flex gap-2">
					<button
						title="Change Background"
						aria-label="label"
						on:click={() => (showBackgroundOptions = !showBackgroundOptions)}
						class="relative mt-1 flex items-start justify-start rounded-full p-1 text-gray-600 hover:bg-gray-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					</button>
					{#if showBackgroundOptions}
						<div class="absolute left-0 top-0 z-50 mt-12 w-64 rounded-lg bg-white p-4 shadow-xl">
							<div class="flex flex-col gap-2">
								<div class="flex gap-2">
									{#each ['#f3f4f6', '#fecaca', '#a7f3d0', '#bfdbfe', '#fde68a', '#ddd6fe'] as color}
										<button
											aria-label="label"
											on:click={() => {
												newColor = color;
												selectedImage = null;
												tempImageUrl = null;
											}}
											class="h-8 w-8 rounded-md"
											style={`background-color: ${color};`}
										></button>
									{/each}
								</div>
								<div class="flex gap-2">
									{#each defaultBackgrounds as bg}
										<button
											aria-label="label"
											on:click={() => {
												showBackgroundOptions = !showBackgroundOptions;
												newColor = 'transparent';
												selectedImage = bg;
												tempImageUrl = null;
											}}
											class="h-8 w-8 rounded-md bg-cover bg-center"
											style={`background-image: url('${bg}')`}
										></button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
					<button aria-label="label">
						<label class="cursor-pointer bg-cover bg-center object-center" title="Choose Image">
							<input type="file" accept="image/*" on:change={handleImageSelect} class="hidden" />
							<div class="mr-2 flex items-start justify-start rounded-full p-1 hover:bg-gray-100">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
						</label>
					</button>
					<button
						on:click={handleAddNote}
						class="h-fit w-fit rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Add Note
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
