import type { FeedSubscription } from './types';

/**
 * Parse an OPML XML string into an array of feed subscriptions.
 */
export function parseOpml(xml: string): FeedSubscription[] {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, 'text/xml');
	const outlines = doc.querySelectorAll('outline[xmlUrl]');
	const feeds: FeedSubscription[] = [];

	outlines.forEach((outline) => {
		const url = outline.getAttribute('xmlUrl');
		if (!url) return;
		const title = outline.getAttribute('title') || outline.getAttribute('text') || url;
		const folder = outline.parentElement?.getAttribute('text') ?? '';
		feeds.push({
			url,
			title,
			folder,
			added: new Date().toISOString()
		});
	});

	return feeds;
}

/**
 * Generate an OPML XML string from an array of feed subscriptions.
 */
export function generateOpml(feeds: FeedSubscription[]): string {
	const folders = new Map<string, FeedSubscription[]>();
	for (const feed of feeds) {
		const key = feed.folder || '';
		if (!folders.has(key)) folders.set(key, []);
		folders.get(key)!.push(feed);
	}

	let body = '';
	for (const [folder, folderFeeds] of folders) {
		const outlines = folderFeeds
			.map(
				(f) =>
					`      <outline type="rss" text="${escapeXml(f.title)}" title="${escapeXml(f.title)}" xmlUrl="${escapeXml(f.url)}" />`
			)
			.join('\n');

		if (folder) {
			body += `    <outline text="${escapeXml(folder)}">\n${outlines}\n    </outline>\n`;
		} else {
			body += outlines + '\n';
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Readly Subscriptions</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${body}  </body>
</opml>`;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
