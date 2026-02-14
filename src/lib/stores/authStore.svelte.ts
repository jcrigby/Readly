import type { OAuth2Tokens } from '../types';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokens = $state<OAuth2Tokens | null>(null);
let authError = $state<string | null>(null);
const isSignedIn = $derived(tokens !== null && Date.now() < (tokens?.expiresAt ?? 0));

export const authStore = {
	get tokens() {
		return tokens;
	},
	get isSignedIn() {
		return isSignedIn;
	},
	get accessToken(): string | null {
		return isSignedIn ? tokens!.accessToken : null;
	},
	get authError() {
		return authError;
	},

	signIn() {
		authError = null;
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
		if (!clientId) {
			authError =
				'Google OAuth not configured. Set VITE_GOOGLE_CLIENT_ID in .env to enable sign in.';
			return;
		}
		const redirectUri = window.location.origin + '/';
		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'token',
			scope: SCOPES,
			include_granted_scopes: 'true'
		});
		window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
	},

	signOut() {
		tokens = null;
	},

	handleRedirect(): boolean {
		const hash = window.location.hash;
		if (!hash.includes('access_token')) return false;

		const params = new URLSearchParams(hash.slice(1));
		const accessToken = params.get('access_token');
		const expiresIn = params.get('expires_in');

		if (accessToken && expiresIn) {
			tokens = {
				accessToken,
				expiresAt: Date.now() + parseInt(expiresIn) * 1000
			};
			window.history.replaceState(null, '', window.location.pathname);
			return true;
		}
		return false;
	}
};
