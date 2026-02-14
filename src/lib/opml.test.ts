import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';
import { generateOpml, parseOpml } from './opml';

beforeAll(() => {
	// parseOpml uses DOMParser which is a browser API
	const dom = new JSDOM();
	globalThis.DOMParser = dom.window.DOMParser;
});

describe('parseOpml', () => {
	it('parses feeds from OPML', () => {
		const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Tech">
      <outline type="rss" text="Example Blog" xmlUrl="https://example.com/feed.xml" />
    </outline>
    <outline type="rss" text="Another Blog" xmlUrl="https://another.com/rss" />
  </body>
</opml>`;

		const feeds = parseOpml(opml);
		expect(feeds).toHaveLength(2);
		expect(feeds[0].url).toBe('https://example.com/feed.xml');
		expect(feeds[0].title).toBe('Example Blog');
		expect(feeds[0].folder).toBe('Tech');
		expect(feeds[1].url).toBe('https://another.com/rss');
		expect(feeds[1].folder).toBe('');
	});

	it('returns empty array for empty OPML', () => {
		const opml = `<?xml version="1.0"?><opml version="2.0"><body></body></opml>`;
		expect(parseOpml(opml)).toEqual([]);
	});
});

describe('generateOpml', () => {
	it('produces valid OPML with folders', () => {
		const feeds = [
			{
				url: 'https://example.com/feed.xml',
				title: 'Example',
				folder: 'Tech',
				added: '2024-01-01T00:00:00Z'
			},
			{ url: 'https://other.com/rss', title: 'Other', folder: '', added: '2024-01-02T00:00:00Z' }
		];
		const opml = generateOpml(feeds);
		expect(opml).toContain('<opml version="2.0">');
		expect(opml).toContain('xmlUrl="https://example.com/feed.xml"');
		expect(opml).toContain('text="Tech"');
		expect(opml).toContain('xmlUrl="https://other.com/rss"');
	});

	it('escapes special characters', () => {
		const feeds = [
			{
				url: 'https://example.com/feed.xml',
				title: 'A & B <C>',
				folder: '',
				added: '2024-01-01T00:00:00Z'
			}
		];
		const opml = generateOpml(feeds);
		expect(opml).toContain('text="A &amp; B &lt;C&gt;"');
	});
});
