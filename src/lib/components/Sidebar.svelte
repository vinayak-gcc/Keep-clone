<script>
// @ts-nocheck

  let isOpen = false;

  const toggleSidebar = () => {
    isOpen = !isOpen;
  };

  function handleClickOutside(event) {
    if (isOpen && !event.target.closest('.sidebar, button')) {
      isOpen = false;
    }
  }




</script>

<svelte:window on:click={handleClickOutside} />

<!-- Menu Button -->
<button
  class="fixed z-50 top-2 left-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
  on:click={toggleSidebar}
  aria-label="Toggle Sidebar"
>
  <svg class="w-6 h-6 text-gray-600" viewBox="0 0 24 24">
    <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
</button>

<!-- Sidebar -->
<div
  class="sidebar  fixed top-0 mt-5 left-0 h-screen transition-transform duration-200 ease-in-out z-40 bg-gray-100  "
  class:translate-x-0={isOpen}
  class:-translate-x-full={!isOpen}
  style="width: 200px;"
>
  <nav class="pt-14 pl-2 pr-4">
    <ul class="space-y-1">
      <li>
        <a href="/Notes" class="flex items-center h-12 px-4 rounded-r-full hover:bg-gray-100 text-gray-700">
          <svg class="w-6 h-6 mr-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z" />
          </svg>
          Notes
        </a>
      </li>
      <li>
        <a href="/Reminders"  class="flex items-center h-12 px-4 rounded-r-full hover:bg-gray-100 text-gray-700">
          <svg class="w-6 h-6 mr-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M18 17v-6c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v6H5c-.55 0-1 .45-1 1s.45 1 1 1h14c.55 0 1-.45 1-1s-.45-1-1-1h-1zm-6 0c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1zm0-10c.34 0 .63.16.81.4.12.17.19.37.19.6v.55c2.33.82 4 3.03 4 5.45v4.45H7V12c0-2.42 1.67-4.63 4-5.45V8c0-.23.07-.43.19-.6.18-.24.47-.4.81-.4z" />
          </svg>
          Reminders
        </a>
      </li>
      <li>
        <a href="/Archive"   class="flex items-center h-12 px-4 rounded-r-full hover:bg-gray-100 text-gray-700">
          <svg class="w-6 h-6 mr-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.83 1H5.42l.82-1zM5 19V8h14v11H5zm11-5.5l-4 4-4-4 1.41-1.41L11 13.67V10h2v3.67l1.59-1.59L16 13.5z" />
          </svg>
          Archive
        </a>
      </li>
      <li>
        <a href="/Trash" class="flex items-center h-12 px-4 rounded-r-full hover:bg-gray-100 text-gray-700">
          <svg class="w-6 h-6 mr-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z" />
            <path fill="currentColor" d="M9 8h2v9H9zm4 0h2v9h-2z" />
          </svg>
          Trash
        </a>
      </li>
    </ul>

  </nav>
</div>