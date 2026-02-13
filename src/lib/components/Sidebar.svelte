<script lang="ts">
	import type { FeedData } from '../types';

	let {
		feeds,
		selectedFeedUrl,
		onSelectFeed,
		onSelectAll
	}: {
		feeds: FeedData[];
		selectedFeedUrl: string | null;
		onSelectFeed: (url: string) => void;
		onSelectAll: () => void;
	} = $props();
</script>

<nav
	class="flex h-full flex-col overflow-y-auto border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
>
	<div class="p-3">
		<button
			onclick={onSelectAll}
			class="w-full rounded-md px-3 py-2 text-left text-sm font-medium {selectedFeedUrl === null
				? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
				: 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800'}"
		>
			All feeds
		</button>
	</div>

	<div class="flex-1 px-3 pb-3">
		<h2
			class="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
		>
			Subscriptions
		</h2>
		{#each feeds as feed (feed.url)}
			<button
				onclick={() => onSelectFeed(feed.url)}
				class="w-full truncate rounded-md px-3 py-1.5 text-left text-sm {selectedFeedUrl ===
				feed.url
					? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
					: 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}"
			>
				{feed.title}
				<span class="ml-1 text-xs text-gray-400 dark:text-gray-500">{feed.entries.length}</span>
			</button>
		{/each}

		{#if feeds.length === 0}
			<p class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No feeds yet.</p>
		{/if}
	</div>
</nav>
