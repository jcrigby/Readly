import { readState, writeState } from '../drive';
import type { UserState } from '../types';

let state = $state<UserState>({
	read: [],
	saved: [],
	lastSync: new Date().toISOString()
});
let syncing = $state(false);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSync(accessToken: string) {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(async () => {
		syncing = true;
		try {
			await writeState(accessToken, state);
		} catch (e) {
			console.error('Failed to sync state to Drive:', e);
		} finally {
			syncing = false;
		}
	}, 1000);
}

export const stateStore = {
	get state() {
		return state;
	},
	get syncing() {
		return syncing;
	},

	isRead(entryId: string): boolean {
		return state.read.includes(entryId);
	},

	isSaved(entryId: string): boolean {
		return state.saved.includes(entryId);
	},

	markRead(entryId: string, accessToken: string | null) {
		if (!state.read.includes(entryId)) {
			state.read = [...state.read, entryId];
			if (accessToken) debouncedSync(accessToken);
		}
	},

	markUnread(entryId: string, accessToken: string | null) {
		state.read = state.read.filter((id) => id !== entryId);
		if (accessToken) debouncedSync(accessToken);
	},

	toggleSaved(entryId: string, accessToken: string | null) {
		if (state.saved.includes(entryId)) {
			state.saved = state.saved.filter((id) => id !== entryId);
		} else {
			state.saved = [...state.saved, entryId];
		}
		if (accessToken) debouncedSync(accessToken);
	},

	async loadFromDrive(accessToken: string) {
		syncing = true;
		try {
			state = await readState(accessToken);
		} catch (e) {
			console.error('Failed to load state from Drive:', e);
		} finally {
			syncing = false;
		}
	}
};
