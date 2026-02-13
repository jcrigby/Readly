import type { UserConfig } from '../src/lib/types';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';

/**
 * Exchange a refresh token for a short-lived access token.
 */
export async function getAccessToken(
	clientId: string,
	clientSecret: string,
	refreshToken: string
): Promise<string> {
	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
			grant_type: 'refresh_token'
		})
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token refresh failed (${res.status}): ${text}`);
	}
	const data = (await res.json()) as { access_token: string };
	return data.access_token;
}

/**
 * Read config.json from the readly/ folder in Google Drive.
 */
export async function fetchConfig(accessToken: string): Promise<UserConfig> {
	const folderQuery = `name='readly' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
	const folderRes = await fetch(
		`${DRIVE_API}/files?q=${encodeURIComponent(folderQuery)}&fields=files(id)`,
		{ headers: { Authorization: `Bearer ${accessToken}` } }
	);
	if (!folderRes.ok) throw new Error(`Drive folder search failed: ${folderRes.status}`);
	const folders = (await folderRes.json()) as { files: { id: string }[] };

	if (folders.files.length === 0) {
		console.log('No readly/ folder found in Drive, returning empty config');
		return {
			feeds: [],
			folders: [],
			preferences: { refreshInterval: 30, theme: 'system', defaultView: 'unread' }
		};
	}

	const folderId = folders.files[0].id;
	const fileQuery = `name='config.json' and '${folderId}' in parents and trashed=false`;
	const fileRes = await fetch(
		`${DRIVE_API}/files?q=${encodeURIComponent(fileQuery)}&fields=files(id)`,
		{ headers: { Authorization: `Bearer ${accessToken}` } }
	);
	if (!fileRes.ok) throw new Error(`Drive file search failed: ${fileRes.status}`);
	const files = (await fileRes.json()) as { files: { id: string }[] };

	if (files.files.length === 0) {
		console.log('No config.json found, returning empty config');
		return {
			feeds: [],
			folders: [],
			preferences: { refreshInterval: 30, theme: 'system', defaultView: 'unread' }
		};
	}

	const contentRes = await fetch(`${DRIVE_API}/files/${files.files[0].id}?alt=media`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!contentRes.ok) throw new Error(`Drive file read failed: ${contentRes.status}`);
	return (await contentRes.json()) as UserConfig;
}
