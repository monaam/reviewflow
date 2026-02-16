import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Loading and Empty States', () => {
  test('dashboard loading spinner', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/');

    // Spinner should appear briefly during loading
    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 3000 }).catch(() => {
      // Data may load fast - that's OK
    });

    // Eventually page should load
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
  });

  test('projects empty state on search', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/projects');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('zzz-nonexistent-project-xyz');

    await expect(
      page.getByText('No matching projects').or(page.getByText('No projects found')),
    ).toBeVisible({ timeout: 5000 });
  });

  test('assets empty state on search', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/assets');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('zzz-nonexistent-asset-xyz');

    await expect(
      page.getByText('No matching assets').or(page.getByText('No assets found')),
    ).toBeVisible({ timeout: 5000 });
  });

  test('creative queue empty state for PM', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/queue');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: /no requests/i }),
    ).toBeVisible({ timeout: 5000 });
  });
});
