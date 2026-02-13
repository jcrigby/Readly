<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, Sidebar, EntryList, EntryView } from '$lib/components';
	import { authStore, feedStore, stateStore } from '$lib/stores';
	import type { FeedEntry } from '$lib/types';

	let sidebarOpen = $state(false);
	let selectedFeedUrl = $state<string | null>(null);
	let selectedEntry = $state<FeedEntry | null>(null);

	let visibleEntries = $derived(
		selectedFeedUrl
			? (feedStore.bundle?.feeds[selectedFeedUrl]?.entries ?? [])
			: feedStore.allEntries
	);

	onMount(() => {
		authStore.handleRedirect();
		feedStore.loadBundle();

		if (authStore.isSignedIn && authStore.accessToken) {
			stateStore.loadFromDrive(authStore.accessToken);
		}
	});

	function selectEntry(entry: FeedEntry) {
		selectedEntry = entry;
		stateStore.markRead(entry.id, authStore.accessToken);
		// On mobile, hide the list when viewing an entry
		if (window.innerWidth < 1024) {
			sidebarOpen = false;
		}
	}
</script>

<div class="flex h-screen flex-col bg-white dark:bg-gray-950">
	<Header onToggleSidebar={() => (sidebarOpen = !sidebarOpen)} />

	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		<div class="w-64 shrink-0 {sidebarOpen ? 'block' : 'hidden'} lg:block">
			<Sidebar
				feeds={feedStore.feeds}
				{selectedFeedUrl}
				onSelectFeed={(url) => {
					selectedFeedUrl = url;
					selectedEntry = null;
				}}
				onSelectAll={() => {
					selectedFeedUrl = null;
					selectedEntry = null;
				}}
			/>
		</div>

		<!-- Entry list -->
		<div class="w-80 shrink-0 {selectedEntry && window.innerWidth < 1024 ? 'hidden' : 'block'}">
			<EntryList
				entries={visibleEntries}
				selectedEntryId={selectedEntry?.id ?? null}
				onSelectEntry={selectEntry}
			/>
		</div>

		<!-- Entry view -->
		<div class="flex-1">
			<EntryView entry={selectedEntry} />
		</div>
	</div>

	{#if feedStore.loadingState === 'loading'}
		<div
			class="fixed bottom-4 right-4 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white shadow-lg"
		>
			Loading feeds...
		</div>
	{/if}

	{#if feedStore.loadingState === 'error'}
		<div
			class="fixed bottom-4 right-4 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white shadow-lg"
		>
			{feedStore.error}
		</div>
	{/if}
</div>
