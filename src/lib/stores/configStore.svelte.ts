import { readConfig, writeConfig } from '../drive';
import type { FeedSubscription, UserConfig } from '../types';

let config = $state<UserConfig>({
	feeds: [],
	folders: [],
	preferences: { refreshInterval: 30, theme: 'system', defaultView: 'unread' }
});
let syncing = $state(false);

export const configStore = {
	get config() {
		return config;
	},
	get feeds() {
		return config.feeds;
	},
	get syncing() {
		return syncing;
	},

	async loadFromDrive(accessToken: string) {
		syncing = true;
		try {
			config = await readConfig(accessToken);
		} catch (e) {
			console.error('Failed to load config from Drive:', e);
		} finally {
			syncing = false;
		}
	},

	async addFeed(url: string, title: string, accessToken: string | null) {
		if (config.feeds.some((f) => f.url === url)) return;
		const feed: FeedSubscription = {
			url,
			title,
			folder: '',
			added: new Date().toISOString()
		};
		config = { ...config, feeds: [...config.feeds, feed] };
		if (accessToken) {
			try {
				await writeConfig(accessToken, config);
			} catch (e) {
				console.error('Failed to save config to Drive:', e);
			}
		}
	},

	async removeFeed(url: string, accessToken: string | null) {
		config = { ...config, feeds: config.feeds.filter((f) => f.url !== url) };
		if (accessToken) {
			try {
				await writeConfig(accessToken, config);
			} catch (e) {
				console.error('Failed to save config to Drive:', e);
			}
		}
	},

	setFeeds(feeds: FeedSubscription[]) {
		config = { ...config, feeds };
	}
};
