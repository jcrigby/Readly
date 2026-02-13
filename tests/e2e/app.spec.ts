import { expect, test } from '@playwright/test';

test('page loads with title', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('Readly');
});
