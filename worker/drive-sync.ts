import type { UserConfig } from '../src/lib/types';

// TODO: Implement worker-side Drive access using refresh token

export async function getAccessToken(
	_clientId: string,
	_clientSecret: string,
	_refreshToken: string
): Promise<string> {
	throw new Error('Not implemented');
}

export async function fetchConfig(_accessToken: string): Promise<UserConfig> {
	throw new Error('Not implemented');
}
