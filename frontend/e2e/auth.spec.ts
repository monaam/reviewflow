import { test, expect } from '@playwright/test';
import { loginAs, getCredentials, type Role } from './helpers/auth';

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/studio');
    await expect(page).toHaveURL(/\/login/);
  });

  const roles: Role[] = ['admin', 'pm', 'creative', 'reviewer'];

  for (const role of roles) {
    test(`${role} can login via form`, async ({ page }) => {
      const { email, password } = getCredentials(role);
      await page.goto('/login');
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');

      await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });
  }

  test('logout redirects to login', async ({ page }) => {
    // Login via form instead of addInitScript so logout fully works
    const { email, password } = getCredentials('admin');
    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

    // Click the Logout button in the sidebar
    await page.getByRole('button', { name: 'Logout' }).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
