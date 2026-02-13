import { describe, expect, it } from 'vitest';
import { generateEntryId } from './feed-parser';

describe('generateEntryId', () => {
	it('returns a 12-character hex string', async () => {
		const id = await generateEntryId('https://example.com/post/1');
		expect(id).toMatch(/^[0-9a-f]{12}$/);
	});

	it('produces consistent IDs for the same URL', async () => {
		const id1 = await generateEntryId('https://example.com/post/1');
		const id2 = await generateEntryId('https://example.com/post/1');
		expect(id1).toBe(id2);
	});

	it('produces different IDs for different URLs', async () => {
		const id1 = await generateEntryId('https://example.com/post/1');
		const id2 = await generateEntryId('https://example.com/post/2');
		expect(id1).not.toBe(id2);
	});
});
