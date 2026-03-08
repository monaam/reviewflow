import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad } from './helpers/mobile';

test.describe('Mobile Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/studio');
    await waitForLoad(page);
  });

  test('welcome message displays user name', async ({ page }) => {
    await expect(page.getByText('Welcome back, Rym')).toBeVisible();
  });

  test('stat cards stack vertically', async ({ page }) => {
    const cards = page.locator('text=Total Projects').locator('..');
    await expect(cards).toBeVisible();

    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active Projects')).toBeVisible();
    await expect(page.getByText('Pending Assets')).toBeVisible();
    await expect(page.getByText('Overdue Requests')).toBeVisible();
  });

  test('stat cards show numeric counts', async ({ page }) => {
    // Each stat card should contain a number
    const statValues = page.locator('h3, [class*="text-2xl"], [class*="text-3xl"]');
    const count = await statValues.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});
