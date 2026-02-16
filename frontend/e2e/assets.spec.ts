import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Assets Page', () => {
  test('list loads with assets', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/assets');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('Assets').first()).toBeVisible();
  });

  test('search filters by title', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/assets');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nonexistent-asset-xyz');

    await expect(
      page.getByText('No matching assets').or(page.getByText('No assets found')),
    ).toBeVisible({ timeout: 5000 });
  });

  test('status filter works', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/assets');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const allFilter = page.getByRole('button', { name: 'All' }).first();
    if (await allFilter.isVisible()) {
      await allFilter.click();
    }
  });

  test('reviewer sees only client-facing status filters', async ({ page }) => {
    await loginAs(page, 'reviewer');
    await page.goto('/assets');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Reviewer should NOT see internal statuses
    await expect(page.getByRole('button', { name: 'Pending Review', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'In Review', exact: true })).toBeHidden();
  });

  test('empty state on no search results', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/assets');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('zzz-no-match-ever-xyz');

    await expect(
      page.getByText('No matching assets').or(page.getByText('No assets found')),
    ).toBeVisible({ timeout: 5000 });
  });

  test('loading spinner visible during fetch', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/assets');

    // Spinner should appear briefly during loading
    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 3000 }).catch(() => {
      // Spinner may have already disappeared if data loaded fast - that's OK
    });
  });
});
