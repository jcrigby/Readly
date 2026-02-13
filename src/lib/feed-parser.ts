import RSSParser from 'rss-parser';
import type { FeedData, FeedEntry } from './types';

const parser = new RSSParser();

/**
 * Generate a stable entry ID from a URL.
 * Uses SHA-256, truncated to 12 hex characters.
 */
export async function generateEntryId(url: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(url);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex.slice(0, 12);
}

/**
 * Normalize a raw parsed item into a FeedEntry.
 */
export async function normalizeEntry(raw: RSSParser.Item): Promise<FeedEntry> {
	const url = raw.link ?? '';
	return {
		id: await generateEntryId(url),
		title: raw.title ?? 'Untitled',
		url,
		published: raw.isoDate ?? raw.pubDate ?? new Date().toISOString(),
		summary: (raw.contentSnippet ?? raw.summary ?? raw.content ?? '').slice(0, 300),
		content: raw.content ?? undefined,
		author: raw.creator ?? (raw as Record<string, string>).author ?? undefined
	};
}

/**
 * Parse an RSS/Atom feed from an XML string and return normalized FeedData.
 */
export async function parseFeed(xml: string, feedUrl: string): Promise<FeedData> {
	const feed = await parser.parseString(xml);
	const entries = await Promise.all((feed.items ?? []).map(normalizeEntry));
	return {
		title: feed.title ?? feedUrl,
		url: feedUrl,
		entries
	};
}
