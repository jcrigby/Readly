import { expect, test } from '@playwright/test';

test('page loads with header title', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('Readly');
});

test('shows sign in button when not authenticated', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Sign in with Google')).toBeVisible();
});

test('shows sidebar with All feeds button', async ({ page }) => {
	await page.goto('/');
	// On desktop-sized viewport, sidebar should be visible
	await page.setViewportSize({ width: 1280, height: 720 });
	await expect(page.getByText('All feeds')).toBeVisible();
});

test('shows empty state when no feeds loaded', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('No entries to show.')).toBeVisible();
});
