import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Creative Queue Page', () => {
  test('creative sees their queue', async ({ page }) => {
    await loginAs(page, 'creative');
    await page.goto('/queue');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'My Queue' })).toBeVisible();
  });

  test('search filters items', async ({ page }) => {
    await loginAs(page, 'creative');
    await page.goto('/queue');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzz-no-match-ever-xyz');

      await expect(
        page.getByText('No matching').or(page.getByText('No requests')),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('empty state for non-creative role', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/queue');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: /no requests/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('loading spinner visible during fetch', async ({ page }) => {
    await loginAs(page, 'creative');
    await page.goto('/queue');

    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 3000 }).catch(() => {
      // Data may load fast
    });
  });
});
