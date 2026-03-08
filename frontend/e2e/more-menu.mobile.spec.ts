import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad } from './helpers/mobile';

test.describe('Mobile More Menu', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/studio/more');
    await waitForLoad(page);
  });

  test('displays user avatar and name/role', async ({ page }) => {
    // User name should be visible
    await expect(page.getByText('Rym')).toBeVisible();
    // Role uses CSS capitalize, so DOM text is "admin"
    await expect(page.getByText('admin', { exact: true })).toBeVisible();
  });

  test('shows all menu items for admin', async ({ page }) => {
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('Review Queue')).toBeVisible();
    await expect(page.getByText('Users')).toBeVisible();
    await expect(page.getByText('Admin Settings')).toBeVisible();
    await expect(page.getByText('Profile & Settings')).toBeVisible();
    await expect(page.getByText('Light Mode').or(page.getByText('Dark Mode'))).toBeVisible();
    await expect(page.getByText('Logout')).toBeVisible();
  });

  test('Users menu navigates to admin users page', async ({ page }) => {
    await page.getByText('Users').click();
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('Profile & Settings navigates correctly', async ({ page }) => {
    await page.getByText('Profile & Settings').click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('Notifications navigates correctly', async ({ page }) => {
    await page.getByText('Notifications').click();
    await expect(page).toHaveURL(/\/notifications/);
  });

  test('logout redirects to login', async ({ page }) => {
    await page.getByText('Logout').click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
