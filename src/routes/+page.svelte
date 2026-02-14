<script lang="ts">
	import { onMount } from 'svelte';
	import { AddFeedModal, Header, Sidebar, EntryList, EntryView } from '$lib/components';
	import { authStore, configStore, feedStore, stateStore } from '$lib/stores';
	import { generateOpml, parseOpml } from '$lib/opml';
	import type { FeedEntry } from '$lib/types';

	let sidebarOpen = $state(false);
	let selectedFeedUrl = $state<string | null>(null);
	let selectedEntry = $state<FeedEntry | null>(null);
	let addFeedOpen = $state(false);
	let mobileView = $state<'list' | 'entry'>('list');

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
			configStore.loadFromDrive(authStore.accessToken);
		}
	});

	function selectEntry(entry: FeedEntry) {
		selectedEntry = entry;
		mobileView = 'entry';
		stateStore.markRead(entry.id, authStore.accessToken);
	}

	function goBackToList() {
		selectedEntry = null;
		mobileView = 'list';
	}

	async function removeFeed(url: string) {
		await configStore.removeFeed(url, authStore.accessToken);
		if (selectedFeedUrl === url) {
			selectedFeedUrl = null;
			selectedEntry = null;
		}
	}

	function importOpml() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.opml,.xml';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const text = await file.text();
			const feeds = parseOpml(text);
			for (const feed of feeds) {
				await configStore.addFeed(feed.url, feed.title, authStore.accessToken);
			}
		};
		input.click();
	}

	function exportOpml() {
		const opml = generateOpml(configStore.feeds);
		const blob = new Blob([opml], { type: 'text/xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'readly-subscriptions.opml';
		a.click();
		URL.revokeObjectURL(url);
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
					mobileView = 'list';
					sidebarOpen = false;
				}}
				onSelectAll={() => {
					selectedFeedUrl = null;
					selectedEntry = null;
					mobileView = 'list';
					sidebarOpen = false;
				}}
				onAddFeed={() => (addFeedOpen = true)}
				onRemoveFeed={removeFeed}
				onImportOpml={importOpml}
				onExportOpml={exportOpml}
			/>
		</div>

		<!-- Entry list (hidden on mobile when viewing an entry) -->
		<div class="w-full shrink-0 lg:w-80 {mobileView === 'entry' ? 'hidden lg:block' : 'block'}">
			<EntryList
				entries={visibleEntries}
				selectedEntryId={selectedEntry?.id ?? null}
				onSelectEntry={selectEntry}
			/>
		</div>

		<!-- Entry view (hidden on mobile when showing the list) -->
		<div class="flex-1 {mobileView === 'list' ? 'hidden lg:block' : 'block'}">
			<EntryView entry={selectedEntry} onBack={goBackToList} />
		</div>
	</div>

	{#if authStore.authError}
		<div
			class="fixed bottom-4 left-4 right-4 rounded-md bg-amber-600 px-4 py-3 text-sm text-white shadow-lg sm:left-auto sm:max-w-md"
		>
			{authStore.authError}
		</div>
	{/if}

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

	<AddFeedModal open={addFeedOpen} onClose={() => (addFeedOpen = false)} />
</div>
