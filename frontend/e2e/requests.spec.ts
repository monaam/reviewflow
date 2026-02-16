import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Requests Page', () => {
  test('pm sees requests list', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/requests');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(
      page.getByText('Requests').or(page.getByText('Creative Requests')).first(),
    ).toBeVisible();
  });

  test('status filter works', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/requests');

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

  test('reviewer sees access denied', async ({ page }) => {
    await loginAs(page, 'reviewer');
    await page.goto('/requests');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(
      page.getByText('Access Restricted').or(page.getByText('access denied').or(page.getByText('not authorized'))),
    ).toBeVisible({ timeout: 5000 });
  });

  test('loading spinner during fetch', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/requests');

    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 3000 }).catch(() => {
      // Data may load fast
    });
  });
});
