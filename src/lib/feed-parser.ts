import type { FeedEntry } from './types';

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

// TODO: Implement feed normalization
export async function normalizeEntry(_raw: unknown): Promise<FeedEntry> {
	throw new Error('Not implemented');
}
