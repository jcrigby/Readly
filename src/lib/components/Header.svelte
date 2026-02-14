<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '../stores';

	let { onToggleSidebar }: { onToggleSidebar: () => void } = $props();

	let dark = $state(false);

	onMount(() => {
		dark =
			localStorage.getItem('theme') === 'dark' ||
			(!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
		applyTheme();
	});

	function applyTheme() {
		document.documentElement.classList.toggle('dark', dark);
	}

	function toggleDark() {
		dark = !dark;
		localStorage.setItem('theme', dark ? 'dark' : 'light');
		applyTheme();
	}
</script>

<header
	class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
>
	<div class="flex items-center gap-3">
		<button
			onclick={onToggleSidebar}
			class="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
			aria-label="Toggle sidebar"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		</button>
		<h1 class="text-xl font-bold text-gray-900 dark:text-white">Readly</h1>
	</div>

	<div class="flex items-center gap-2">
		<button
			onclick={toggleDark}
			class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
			aria-label="Toggle dark mode"
		>
			{#if dark}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			{:else}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			{/if}
		</button>

		{#if authStore.isSignedIn}
			<button
				onclick={() => authStore.signOut()}
				class="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Sign out
			</button>
		{:else}
			<button
				onclick={() => authStore.signIn()}
				class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
			>
				Sign in with Google
			</button>
		{/if}
	</div>
</header>
