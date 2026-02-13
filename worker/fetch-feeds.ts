import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { parseFeed } from '../src/lib/feed-parser';
import type { FeedBundle, FeedData } from '../src/lib/types';
import { fetchConfig, getAccessToken } from './drive-sync';

const MAX_ENTRIES_PER_FEED = 50;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

async function fetchWithRetry(url: string): Promise<string> {
	let lastError: Error | null = null;
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.text();
		} catch (e) {
			lastError = e instanceof Error ? e : new Error(String(e));
			if (attempt < MAX_RETRIES) {
				const delay = 1000 * (attempt + 1);
				console.log(`  Retry ${attempt + 1} for ${url} in ${delay}ms...`);
				await new Promise((r) => setTimeout(r, delay));
			}
		}
	}
	throw lastError;
}

async function main(): Promise<void> {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

	let feedUrls: string[];

	if (clientId && clientSecret && refreshToken) {
		console.log('Authenticating with Google Drive...');
		const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
		const config = await fetchConfig(accessToken);
		feedUrls = config.feeds.map((f) => f.url);
		console.log(`Found ${feedUrls.length} feed(s) in config`);
	} else {
		console.log('No Google credentials found, using empty feed list');
		feedUrls = [];
	}

	if (feedUrls.length === 0) {
		console.log('No feeds to fetch, writing empty bundle');
	}

	const feeds: Record<string, FeedData> = {};
	const results = await Promise.allSettled(
		feedUrls.map(async (url) => {
			console.log(`Fetching ${url}...`);
			const xml = await fetchWithRetry(url);
			const feed = await parseFeed(xml, url);
			// Keep only the most recent N entries
			feed.entries = feed.entries
				.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
				.slice(0, MAX_ENTRIES_PER_FEED);
			return { url, feed };
		})
	);

	for (const result of results) {
		if (result.status === 'fulfilled') {
			feeds[result.value.url] = result.value.feed;
			console.log(`  OK: ${result.value.feed.title} (${result.value.feed.entries.length} entries)`);
		} else {
			console.error(`  FAIL: ${result.reason}`);
		}
	}

	const bundle: FeedBundle = {
		generated: new Date().toISOString(),
		feeds
	};

	const outPath = resolve('static', 'feed-bundle.json');
	writeFileSync(outPath, JSON.stringify(bundle));
	const sizeKb = (JSON.stringify(bundle).length / 1024).toFixed(1);
	console.log(`Bundle written to ${outPath} (${sizeKb} KB, ${Object.keys(feeds).length} feeds)`);
}

main().catch((e) => {
	console.error('Feed fetch failed:', e);
	process.exit(1);
});
