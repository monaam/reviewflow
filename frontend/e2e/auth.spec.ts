import { test, expect } from '@playwright/test';
import { loginAs, type Role } from './helpers/auth';

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  const roles: Role[] = ['admin', 'pm', 'creative', 'reviewer'];

  for (const role of roles) {
    test(`${role} can login via form`, async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', `${role}@briefloop.com`);
      await page.fill('#password', 'password');
      await page.click('button[type="submit"]');

      await expect(page).not.toHaveURL(/\/login/);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });
  }

  test('logout clears auth', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login/);

    // Find and click logout button/link
    const logoutButton = page.getByText('Logout').or(page.getByText('Sign out')).or(page.getByText('Log out'));
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Try avatar/menu trigger first
      const avatar = page.locator('[class*="avatar"], button:has(img[alt])').first();
      if (await avatar.isVisible()) {
        await avatar.click();
        const logoutItem = page.getByText('Logout').or(page.getByText('Sign out')).or(page.getByText('Log out'));
        await logoutItem.click();
      }
    }

    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
  });
});
