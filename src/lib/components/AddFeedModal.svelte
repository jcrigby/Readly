<script lang="ts">
	import { authStore, configStore } from '../stores';

	let { open, onClose }: { open: boolean; onClose: () => void } = $props();

	let url = $state('');
	let title = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		if (!url.trim()) {
			error = 'Please enter a feed URL';
			return;
		}

		loading = true;
		error = '';

		try {
			const feedTitle = title.trim() || new URL(url).hostname;
			await configStore.addFeed(url.trim(), feedTitle, authStore.accessToken);
			url = '';
			title = '';
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add feed';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={handleKeydown}
	>
		<div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Add Feed</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="mb-3">
					<label
						for="feed-url"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Feed URL
					</label>
					<input
						id="feed-url"
						type="url"
						bind:value={url}
						placeholder="https://example.com/feed.xml"
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						required
					/>
				</div>

				<div class="mb-4">
					<label
						for="feed-title"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Title (optional)
					</label>
					<input
						id="feed-title"
						type="text"
						bind:value={title}
						placeholder="My Favorite Blog"
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				{#if error}
					<p class="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}

				<div class="flex justify-end gap-2">
					<button
						type="button"
						onclick={onClose}
						class="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
					>
						{loading ? 'Adding...' : 'Add Feed'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
