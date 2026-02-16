#!/usr/bin/env npx tsx
/**
 * One-time script to obtain a Google OAuth refresh token.
 * 1. Starts a local HTTP server on port 3456
 * 2. Opens the Google consent screen in your browser
 * 3. Catches the redirect, exchanges the auth code for tokens
 * 4. Prints the refresh token
 *
 * Usage: npx tsx scripts/get-refresh-token.ts
 */

import http from 'node:http';
import { execSync } from 'node:child_process';
import { config } from 'dotenv';

config(); // load .env

const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3456/callback';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

if (!CLIENT_ID || !CLIENT_SECRET) {
	console.error('Missing VITE_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
	process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

const server = http.createServer(async (req, res) => {
	if (!req.url?.startsWith('/callback')) {
		res.writeHead(404);
		res.end();
		return;
	}

	const url = new URL(req.url, 'http://localhost:3456');
	const code = url.searchParams.get('code');

	if (!code) {
		res.writeHead(400);
		res.end('No authorization code received');
		return;
	}

	try {
		const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				code,
				client_id: CLIENT_ID!,
				client_secret: CLIENT_SECRET!,
				redirect_uri: REDIRECT_URI,
				grant_type: 'authorization_code'
			})
		});

		const data = await tokenRes.json();

		if (data.refresh_token) {
			console.log('\n=== Refresh Token ===');
			console.log(data.refresh_token);
			console.log('====================\n');

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end('<h1>Success!</h1><p>Refresh token has been printed to the terminal. You can close this tab.</p>');
		} else {
			console.error('No refresh_token in response:', data);
			res.writeHead(400, { 'Content-Type': 'text/html' });
			res.end('<h1>Error</h1><p>No refresh token received. Check terminal for details.</p>');
		}
	} catch (err) {
		console.error('Token exchange failed:', err);
		res.writeHead(500);
		res.end('Token exchange failed');
	}

	setTimeout(() => {
		server.close();
		process.exit(0);
	}, 1000);
});

server.listen(3456, () => {
	console.log('Listening on http://localhost:3456/callback');
	console.log('Opening browser for Google consent...\n');

	// Open browser
	try {
		execSync(`xdg-open "${authUrl.toString()}"`, { stdio: 'ignore' });
	} catch {
		console.log('Could not open browser automatically. Visit this URL:');
		console.log(authUrl.toString());
	}
});
