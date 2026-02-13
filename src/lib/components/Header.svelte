<script lang="ts">
	import { authStore } from '../stores';

	let { onToggleSidebar }: { onToggleSidebar: () => void } = $props();
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

	<div>
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
