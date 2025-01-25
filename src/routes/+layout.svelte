<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Note from '$lib/components/Note.svelte';
  </script>
  
    <div class="bg-gray-100">
		<div class="flex flex-col bg-gray-100">
			<Navbar />
			<div class="flex ">
			<Sidebar />
			<Note />
			</div>
		</div>
	</div>
  