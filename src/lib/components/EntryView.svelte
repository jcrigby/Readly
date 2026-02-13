<script lang="ts">
	import type { FeedEntry } from '../types';
	import { authStore, stateStore } from '../stores';

	let { entry }: { entry: FeedEntry | null } = $props();
</script>

{#if entry}
	<article class="h-full overflow-y-auto p-6">
		<header class="mb-4">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{entry.title}</h2>
			<div class="mt-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
				{#if entry.author}
					<span>{entry.author}</span>
				{/if}
				<span>{new Date(entry.published).toLocaleDateString()}</span>
				<a
					href={entry.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-indigo-600 hover:underline dark:text-indigo-400"
				>
					Open original
				</a>
			</div>
			<div class="mt-3 flex gap-2">
				<button
					onclick={() => stateStore.toggleSaved(entry!.id, authStore.accessToken)}
					class="rounded-md px-3 py-1 text-xs {stateStore.isSaved(entry.id)
						? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
						: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}"
				>
					{stateStore.isSaved(entry.id) ? 'Saved' : 'Save'}
				</button>
				{#if stateStore.isRead(entry.id)}
					<button
						onclick={() => stateStore.markUnread(entry!.id, authStore.accessToken)}
						class="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
					>
						Mark unread
					</button>
				{/if}
			</div>
		</header>

		<div class="prose prose-sm max-w-none dark:prose-invert">
			{#if entry.content}
				{@html entry.content}
			{:else}
				<p>{entry.summary}</p>
			{/if}
		</div>
	</article>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-gray-400 dark:text-gray-500">Select an entry to read.</p>
	</div>
{/if}
