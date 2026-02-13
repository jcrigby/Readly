import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { generateEntryId, parseFeed } from './feed-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = resolve(__dirname, '../../tests/fixtures');

function readFixture(name: string): string {
	return readFileSync(resolve(fixturesDir, name), 'utf-8');
}

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

describe('parseFeed', () => {
	describe('RSS 2.0', () => {
		it('parses feed title and URL', async () => {
			const xml = readFixture('rss-sample.xml');
			const feed = await parseFeed(xml, 'https://example.com/feed.xml');
			expect(feed.title).toBe('Sample RSS Feed');
			expect(feed.url).toBe('https://example.com/feed.xml');
		});

		it('parses all entries', async () => {
			const xml = readFixture('rss-sample.xml');
			const feed = await parseFeed(xml, 'https://example.com/feed.xml');
			expect(feed.entries).toHaveLength(2);
		});

		it('normalizes entry fields', async () => {
			const xml = readFixture('rss-sample.xml');
			const feed = await parseFeed(xml, 'https://example.com/feed.xml');
			const entry = feed.entries[0];
			expect(entry.title).toBe('First Post');
			expect(entry.url).toBe('https://example.com/post/1');
			expect(entry.id).toMatch(/^[0-9a-f]{12}$/);
			expect(entry.summary).toBe('This is the first post.');
		});

		it('produces stable entry IDs based on URL', async () => {
			const xml = readFixture('rss-sample.xml');
			const feed1 = await parseFeed(xml, 'https://example.com/feed.xml');
			const feed2 = await parseFeed(xml, 'https://example.com/feed.xml');
			expect(feed1.entries[0].id).toBe(feed2.entries[0].id);
		});
	});

	describe('Atom', () => {
		it('parses feed title and URL', async () => {
			const xml = readFixture('atom-sample.xml');
			const feed = await parseFeed(xml, 'https://example.com/atom.xml');
			expect(feed.title).toBe('Sample Atom Feed');
			expect(feed.url).toBe('https://example.com/atom.xml');
		});

		it('parses all entries', async () => {
			const xml = readFixture('atom-sample.xml');
			const feed = await parseFeed(xml, 'https://example.com/atom.xml');
			expect(feed.entries).toHaveLength(2);
		});

		it('normalizes entry fields with author', async () => {
			const xml = readFixture('atom-sample.xml');
			const feed = await parseFeed(xml, 'https://example.com/atom.xml');
			const entry = feed.entries[0];
			expect(entry.title).toBe('First Entry');
			expect(entry.url).toBe('https://example.com/entry/1');
			expect(entry.summary).toBe('This is the first entry.');
		});
	});
});
