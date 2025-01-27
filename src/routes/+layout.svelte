<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<div class="bg-gray-100 dark:bg-[#202124] dark:text-white min-h-screen">
	<div class="flex flex-col">

		<Navbar />

		<div class="flex flex-1">

			<Sidebar />

			<main class="flex-1 p-4">
				<slot /> 
			</main>

		</div>

	</div>
</div>