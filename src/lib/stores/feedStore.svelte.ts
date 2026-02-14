import type { FeedBundle, FeedData, FeedEntry, LoadingState } from '../types';

let bundle = $state<FeedBundle | null>(null);
let loadingState = $state<LoadingState>('idle');
let error = $state<string | null>(null);

export const feedStore = {
	get bundle() {
		return bundle;
	},
	get loadingState() {
		return loadingState;
	},
	get error() {
		return error;
	},
	get feeds(): FeedData[] {
		return bundle ? Object.values(bundle.feeds) : [];
	},
	get allEntries(): FeedEntry[] {
		return this.feeds
			.flatMap((f) => f.entries)
			.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
	},

	async loadBundle(bundleUrl = '/feed-bundle.json') {
		loadingState = 'loading';
		error = null;
		try {
			let res = await fetch(bundleUrl);
			// Fall back to sample data in development
			if (!res.ok && import.meta.env.DEV) {
				res = await fetch('/feed-bundle.sample.json');
			}
			if (!res.ok) throw new Error(`Failed to fetch bundle: ${res.status}`);
			bundle = (await res.json()) as FeedBundle;
			loadingState = 'success';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
			loadingState = 'error';
		}
	},

	setBundle(data: FeedBundle) {
		bundle = data;
		loadingState = 'success';
		error = null;
	}
};
