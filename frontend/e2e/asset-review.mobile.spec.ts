import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad, expectNoBottomTabBar } from './helpers/mobile';

test.describe('Mobile Asset Review', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/studio/assets');
    await waitForLoad(page);
    // Navigate to first asset
    await page.locator('a.rounded-lg').first().click();
    await page.waitForURL(/\/studio\/assets\/.+/);
    await waitForLoad(page);
  });

  test('bottom tab bar is hidden', async ({ page }) => {
    await expectNoBottomTabBar(page);
  });

  test('header shows title, status badge, and actions menu', async ({ page }) => {
    // Asset title
    await expect(page.locator('h1')).toBeVisible();

    // Status badge (span with rounded-full inside the header area)
    const badge = page.locator('span.rounded-full').filter({
      hasText: /In Review|Pending Review|Revision Requested|Approved/,
    }).first();
    await expect(badge).toBeVisible();

    // Actions menu button
    await expect(page.getByRole('button', { name: 'Actions' })).toBeVisible();
  });

  test('MobileReviewDrawer renders in peek state', async ({ page }) => {
    // Should see the comment bar
    await expect(page.getByText('Add a comment...')).toBeVisible();
    // Drag handle
    await expect(page.locator('[class*="rounded-full"][class*="bg-gray-300"]').or(
      page.locator('[class*="rounded-full"][class*="bg-gray-600"]'),
    )).toBeVisible();
  });

  test('tapping comment bar expands drawer', async ({ page }) => {
    await page.getByText('Add a comment...').click();

    // Should now show tabs (Comments / Versions)
    await expect(page.getByRole('button', { name: /comments/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /versions/i })).toBeVisible();
  });

  test('expanded drawer shows Comments and Versions tabs', async ({ page }) => {
    await page.getByText('Add a comment...').click();

    const commentsTab = page.getByRole('button', { name: /comments/i });
    const versionsTab = page.getByRole('button', { name: /versions/i });

    await expect(commentsTab).toBeVisible();
    await expect(versionsTab).toBeVisible();

    // Click Versions tab
    await versionsTab.click();
    // Should show version content area
    await expect(page.getByText(/version/i).first()).toBeVisible();

    // Click back to Comments
    await commentsTab.click();
  });

  test('actions menu shows all options', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();

    await expect(page.getByText('Timeline')).toBeVisible();
    await expect(page.getByText('Lock')).toBeVisible();
    await expect(page.getByText('Download').first()).toBeVisible();
    await expect(page.getByText('Edit')).toBeVisible();
    await expect(page.getByText('Delete')).toBeVisible();
  });

  test('browser back navigates away from review', async ({ page }) => {
    // Back arrow link is hidden on mobile (hidden sm:block), use browser back
    await page.goBack();

    await expect(page).not.toHaveURL(/\/studio\/assets\/.{8,}/);
  });
});
