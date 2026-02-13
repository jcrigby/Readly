import type { UserConfig, UserState } from './types';

// TODO: Implement Google Drive API helpers

export async function ensureAppFolder(_accessToken: string): Promise<string> {
	throw new Error('Not implemented');
}

export async function readConfig(_accessToken: string): Promise<UserConfig> {
	throw new Error('Not implemented');
}

export async function writeConfig(_accessToken: string, _config: UserConfig): Promise<void> {
	throw new Error('Not implemented');
}

export async function readState(_accessToken: string): Promise<UserState> {
	throw new Error('Not implemented');
}

export async function writeState(_accessToken: string, _state: UserState): Promise<void> {
	throw new Error('Not implemented');
}
