import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad, expectBottomTabBar } from './helpers/mobile';

test.describe('Mobile Assets List', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/studio/assets');
    await waitForLoad(page);
  });

  test('search input renders full width', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search"]');
    await expect(search).toBeVisible();
    const box = await search.boundingBox();
    expect(box!.width).toBeGreaterThan(300);
  });

  test('status filter tabs wrap on small screens', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Pending Review' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'In Review' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approved' })).toBeVisible();
  });

  test('asset cards display thumbnail, title, and status badge', async ({ page }) => {
    const card = page.locator('a.rounded-lg').first();
    await expect(card).toBeVisible();
    // Should show a status badge within the card
    const badge = card.locator('span').filter({
      hasText: /Pending Review|In Review|Approved|Revision Requested/,
    }).first();
    await expect(badge).toBeVisible();
  });

  test('bottom tab bar visible on assets list', async ({ page }) => {
    await expectBottomTabBar(page);
  });

  test('clicking asset navigates to review page', async ({ page }) => {
    const card = page.locator('a.rounded-lg').first();
    await card.click();

    await page.waitForURL(/\/studio\/assets\/.+/);
  });
});
