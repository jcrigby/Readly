import type { DriveFile, UserConfig, UserState } from './types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER = 'readly';
const MIME_JSON = 'application/json';

function headers(accessToken: string): HeadersInit {
	return { Authorization: `Bearer ${accessToken}` };
}

/**
 * Find or create the readly/ app folder in the user's Drive.
 * Returns the folder ID.
 */
export async function ensureAppFolder(accessToken: string): Promise<string> {
	const query = `name='${APP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
	const searchUrl = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
	const res = await fetch(searchUrl, { headers: headers(accessToken) });
	if (!res.ok) throw new Error(`Drive search failed: ${res.status}`);
	const data = (await res.json()) as { files: DriveFile[] };

	if (data.files.length > 0) {
		return data.files[0].id;
	}

	const createRes = await fetch(`${DRIVE_API}/files`, {
		method: 'POST',
		headers: { ...headers(accessToken), 'Content-Type': MIME_JSON },
		body: JSON.stringify({
			name: APP_FOLDER,
			mimeType: 'application/vnd.google-apps.folder'
		})
	});
	if (!createRes.ok) throw new Error(`Drive folder creation failed: ${createRes.status}`);
	const folder = (await createRes.json()) as DriveFile;
	return folder.id;
}

/**
 * Find a file by name inside a given folder.
 */
async function findFile(
	accessToken: string,
	folderId: string,
	fileName: string
): Promise<string | null> {
	const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
	const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id)`;
	const res = await fetch(url, { headers: headers(accessToken) });
	if (!res.ok) throw new Error(`Drive file search failed: ${res.status}`);
	const data = (await res.json()) as { files: { id: string }[] };
	return data.files.length > 0 ? data.files[0].id : null;
}

/**
 * Read a JSON file from Drive by file ID.
 */
async function readJsonFile<T>(accessToken: string, fileId: string): Promise<T> {
	const url = `${DRIVE_API}/files/${fileId}?alt=media`;
	const res = await fetch(url, { headers: headers(accessToken) });
	if (!res.ok) throw new Error(`Drive read failed: ${res.status}`);
	return (await res.json()) as T;
}

/**
 * Create or update a JSON file in Drive.
 */
async function writeJsonFile(
	accessToken: string,
	folderId: string,
	fileName: string,
	data: unknown
): Promise<string> {
	const existingId = await findFile(accessToken, folderId, fileName);
	const body = JSON.stringify(data);

	if (existingId) {
		const url = `${DRIVE_UPLOAD_API}/files/${existingId}?uploadType=media`;
		const res = await fetch(url, {
			method: 'PATCH',
			headers: { ...headers(accessToken), 'Content-Type': MIME_JSON },
			body
		});
		if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
		return existingId;
	}

	const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
	const boundary = 'feedle_boundary';
	const multipart =
		`--${boundary}\r\nContent-Type: ${MIME_JSON}\r\n\r\n${metadata}\r\n` +
		`--${boundary}\r\nContent-Type: ${MIME_JSON}\r\n\r\n${body}\r\n` +
		`--${boundary}--`;

	const url = `${DRIVE_UPLOAD_API}/files?uploadType=multipart`;
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			...headers(accessToken),
			'Content-Type': `multipart/related; boundary=${boundary}`
		},
		body: multipart
	});
	if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
	const file = (await res.json()) as { id: string };
	return file.id;
}

export async function readConfig(accessToken: string): Promise<UserConfig> {
	const folderId = await ensureAppFolder(accessToken);
	const fileId = await findFile(accessToken, folderId, 'config.json');
	if (!fileId) {
		const defaultConfig: UserConfig = {
			feeds: [],
			folders: [],
			preferences: { refreshInterval: 30, theme: 'system', defaultView: 'unread' }
		};
		await writeJsonFile(accessToken, folderId, 'config.json', defaultConfig);
		return defaultConfig;
	}
	return readJsonFile<UserConfig>(accessToken, fileId);
}

export async function writeConfig(accessToken: string, config: UserConfig): Promise<void> {
	const folderId = await ensureAppFolder(accessToken);
	await writeJsonFile(accessToken, folderId, 'config.json', config);
}

export async function readState(accessToken: string): Promise<UserState> {
	const folderId = await ensureAppFolder(accessToken);
	const fileId = await findFile(accessToken, folderId, 'state.json');
	if (!fileId) {
		const defaultState: UserState = {
			read: [],
			saved: [],
			lastSync: new Date().toISOString()
		};
		await writeJsonFile(accessToken, folderId, 'state.json', defaultState);
		return defaultState;
	}
	return readJsonFile<UserState>(accessToken, fileId);
}

export async function writeState(accessToken: string, state: UserState): Promise<void> {
	const folderId = await ensureAppFolder(accessToken);
	await writeJsonFile(accessToken, folderId, 'state.json', state);
}
