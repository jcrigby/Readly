import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureAppFolder, readConfig, readState, writeConfig, writeState } from './drive';
import type { UserConfig, UserState } from './types';

const TOKEN = 'fake-access-token';
const FOLDER_ID = 'folder-123';
const FILE_ID = 'file-456';

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('ensureAppFolder', () => {
	it('returns existing folder ID when found', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FOLDER_ID, name: 'readly' }] }));
		const id = await ensureAppFolder(TOKEN);
		expect(id).toBe(FOLDER_ID);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('creates folder when not found', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [] })).mockResolvedValueOnce(
			jsonResponse({
				id: FOLDER_ID,
				name: 'readly',
				mimeType: 'application/vnd.google-apps.folder'
			})
		);
		const id = await ensureAppFolder(TOKEN);
		expect(id).toBe(FOLDER_ID);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const createCall = fetchMock.mock.calls[1];
		expect(createCall[1].method).toBe('POST');
	});

	it('throws on API error', async () => {
		fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
		await expect(ensureAppFolder(TOKEN)).rejects.toThrow('Drive search failed: 401');
	});
});

describe('readConfig', () => {
	it('returns stored config', async () => {
		const config: UserConfig = {
			feeds: [
				{
					url: 'https://example.com/feed.xml',
					title: 'Test',
					folder: 'Tech',
					added: '2024-01-01T00:00:00Z'
				}
			],
			folders: ['Tech'],
			preferences: { refreshInterval: 30, theme: 'system', defaultView: 'unread' }
		};
		// ensureAppFolder: search finds folder
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FOLDER_ID }] }));
		// findFile: config.json exists
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FILE_ID }] }));
		// readJsonFile: return config
		fetchMock.mockResolvedValueOnce(jsonResponse(config));

		const result = await readConfig(TOKEN);
		expect(result).toEqual(config);
	});

	it('creates default config when file not found', async () => {
		// ensureAppFolder: search finds folder
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FOLDER_ID }] }));
		// findFile: config.json not found
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [] }));
		// writeJsonFile -> findFile (no existing)
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [] }));
		// writeJsonFile -> create (multipart upload)
		fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'new-file-id' }));

		const result = await readConfig(TOKEN);
		expect(result.feeds).toEqual([]);
		expect(result.preferences.theme).toBe('system');
	});
});

describe('writeConfig', () => {
	it('writes config to Drive', async () => {
		const config: UserConfig = {
			feeds: [],
			folders: [],
			preferences: { refreshInterval: 30, theme: 'dark', defaultView: 'all' }
		};
		// ensureAppFolder
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FOLDER_ID }] }));
		// findFile: config.json exists
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FILE_ID }] }));
		// PATCH update
		fetchMock.mockResolvedValueOnce(jsonResponse({ id: FILE_ID }));

		await writeConfig(TOKEN, config);
		const patchCall = fetchMock.mock.calls[2];
		expect(patchCall[1].method).toBe('PATCH');
		expect(patchCall[1].body).toBe(JSON.stringify(config));
	});
});

describe('readState', () => {
	it('returns stored state', async () => {
		const state: UserState = {
			read: ['abc123def456'],
			saved: [],
			lastSync: '2024-01-01T00:00:00Z'
		};
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FOLDER_ID }] }));
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FILE_ID }] }));
		fetchMock.mockResolvedValueOnce(jsonResponse(state));

		const result = await readState(TOKEN);
		expect(result).toEqual(state);
	});
});

describe('writeState', () => {
	it('creates state file when it does not exist', async () => {
		const state: UserState = {
			read: ['id1', 'id2'],
			saved: ['id3'],
			lastSync: '2024-06-01T00:00:00Z'
		};
		// ensureAppFolder
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [{ id: FOLDER_ID }] }));
		// findFile: state.json not found
		fetchMock.mockResolvedValueOnce(jsonResponse({ files: [] }));
		// multipart create
		fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'new-state-id' }));

		await writeState(TOKEN, state);
		const createCall = fetchMock.mock.calls[2];
		expect(createCall[1].method).toBe('POST');
	});
});
