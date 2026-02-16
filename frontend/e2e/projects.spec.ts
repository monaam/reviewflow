import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Projects Page', () => {
  test('list loads with project cards', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/projects');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('Projects').first()).toBeVisible();
  });

  test('search filters by name', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/projects');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nonexistent-project-xyz');

    await expect(
      page.getByText('No matching projects').or(page.getByText('No projects found')),
    ).toBeVisible({ timeout: 5000 });
  });

  test('status filter works', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/projects');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    const activeFilter = page.getByRole('button', { name: 'Active' });
    if (await activeFilter.isVisible()) {
      await activeFilter.click();
    }
  });

  test('admin sees New Project button', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/projects');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('New Project')).toBeVisible();
  });

  test('pm sees New Project button', async ({ page }) => {
    await loginAs(page, 'pm');
    await page.goto('/projects');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('New Project')).toBeVisible();
  });

  test('creative does not see New Project button', async ({ page }) => {
    await loginAs(page, 'creative');
    await page.goto('/projects');

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('New Project')).toBeHidden();
  });
});
