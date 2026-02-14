<script lang="ts">
	import type { FeedData } from '../types';

	let {
		feeds,
		selectedFeedUrl,
		onSelectFeed,
		onSelectAll,
		onAddFeed,
		onRemoveFeed,
		onImportOpml,
		onExportOpml
	}: {
		feeds: FeedData[];
		selectedFeedUrl: string | null;
		onSelectFeed: (url: string) => void;
		onSelectAll: () => void;
		onAddFeed: () => void;
		onRemoveFeed: (url: string) => void;
		onImportOpml: () => void;
		onExportOpml: () => void;
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
		<div class="mb-1 flex items-center justify-between px-3">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
				Subscriptions
			</h2>
			<button
				onclick={onAddFeed}
				class="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
				aria-label="Add feed"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</button>
		</div>
		{#each feeds as feed (feed.url)}
			<div class="group flex items-center">
				<button
					onclick={() => onSelectFeed(feed.url)}
					class="flex-1 truncate rounded-md px-3 py-1.5 text-left text-sm {selectedFeedUrl ===
					feed.url
						? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
						: 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}"
				>
					{feed.title}
					<span class="ml-1 text-xs text-gray-400 dark:text-gray-500">{feed.entries.length}</span>
				</button>
				<button
					onclick={() => onRemoveFeed(feed.url)}
					class="ml-1 hidden rounded p-1 text-gray-400 hover:text-red-500 group-hover:block dark:hover:text-red-400"
					aria-label="Remove feed"
				>
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		{/each}

		{#if feeds.length === 0}
			<p class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
				No feeds yet.
				<button onclick={onAddFeed} class="text-indigo-500 hover:underline">Add one</button>
			</p>
		{/if}
	</div>

	<div class="border-t border-gray-200 px-3 py-2 dark:border-gray-700">
		<div class="flex gap-2">
			<button
				onclick={onImportOpml}
				class="flex-1 rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
			>
				Import OPML
			</button>
			<button
				onclick={onExportOpml}
				class="flex-1 rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
			>
				Export OPML
			</button>
		</div>
	</div>
</nav>
