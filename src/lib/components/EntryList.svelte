<script lang="ts">
	import type { FeedEntry } from '../types';
	import { stateStore } from '../stores';

	let {
		entries,
		selectedEntryId,
		onSelectEntry
	}: {
		entries: FeedEntry[];
		selectedEntryId: string | null;
		onSelectEntry: (entry: FeedEntry) => void;
	} = $props();

	function formatDate(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const hours = Math.floor(diff / 3600000);
		if (hours < 1) return 'Just now';
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return d.toLocaleDateString();
	}
</script>

<div
	class="flex h-full flex-col overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950"
>
	{#each entries as entry (entry.id)}
		<button
			onclick={() => onSelectEntry(entry)}
			class="border-b border-gray-100 px-4 py-3 text-left transition-colors dark:border-gray-800
				{selectedEntryId === entry.id
				? 'bg-indigo-50 dark:bg-indigo-950'
				: 'hover:bg-gray-50 dark:hover:bg-gray-900'}
				{stateStore.isRead(entry.id) ? 'opacity-60' : ''}"
		>
			<h3
				class="text-sm font-medium text-gray-900 dark:text-gray-100 {stateStore.isRead(entry.id)
					? 'font-normal'
					: ''}"
			>
				{entry.title}
			</h3>
			<p class="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{entry.summary}</p>
			<div class="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
				<span>{formatDate(entry.published)}</span>
				{#if stateStore.isSaved(entry.id)}
					<span class="text-amber-500">Saved</span>
				{/if}
			</div>
		</button>
	{/each}

	{#if entries.length === 0}
		<div class="flex flex-1 items-center justify-center p-8">
			<p class="text-sm text-gray-400 dark:text-gray-500">No entries to show.</p>
		</div>
	{/if}
</div>
