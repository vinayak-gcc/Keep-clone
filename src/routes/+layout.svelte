<script lang="ts">
	let { children } = $props();
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';


</script>
  
    <div class="bg-gray-100">


		<div class="flex flex-col bg-gray-100">

			<Navbar />
			<Sidebar />

		</div>

		{@render children()}

	</div>
  
	
