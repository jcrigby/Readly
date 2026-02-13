export interface FeedSubscription {
	url: string;
	title: string;
	folder: string;
	added: string; // ISO 8601 date
}

export interface UserPreferences {
	refreshInterval: number; // minutes
	theme: 'light' | 'dark' | 'system';
	defaultView: 'all' | 'unread' | 'saved';
}

export interface UserConfig {
	feeds: FeedSubscription[];
	folders: string[];
	preferences: UserPreferences;
}

export interface UserState {
	read: string[]; // entry IDs
	saved: string[]; // entry IDs
	lastSync: string; // ISO 8601 date
}

export interface FeedEntry {
	id: string; // SHA-256 hash of URL, truncated to 12 hex chars
	title: string;
	url: string;
	published: string; // ISO 8601 date
	summary: string;
	content?: string;
	author?: string;
}

export interface FeedData {
	title: string;
	url: string;
	entries: FeedEntry[];
}

export interface FeedBundle {
	generated: string; // ISO 8601 date
	feeds: Record<string, FeedData>;
}

export interface DriveFile {
	id: string;
	name: string;
	mimeType: string;
}

export interface OAuth2Tokens {
	accessToken: string;
	expiresAt: number;
}

export type LoadingState = 'idle' | 'loading' | 'error' | 'success';

export interface AsyncResult<T> {
	data: T | null;
	state: LoadingState;
	error: string | null;
}
