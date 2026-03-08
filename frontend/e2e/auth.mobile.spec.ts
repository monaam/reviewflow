import { test, expect } from '@playwright/test';
import { getCredentials } from './helpers/auth';

test.describe('Mobile Login', () => {
  test('login form renders correctly on mobile', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('email and password fields are usable width', async ({ page }) => {
    await page.goto('/login');

    const emailBox = await page.locator('#email').boundingBox();
    const pwBox = await page.locator('#password').boundingBox();

    // Fields should be at least 280px wide on mobile
    expect(emailBox!.width).toBeGreaterThan(280);
    expect(pwBox!.width).toBeGreaterThan(280);
  });

  test('error message displays within mobile width', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error
    const error = page.locator('[class*="bg-red"], [class*="text-red"]').first();
    await expect(error).toBeVisible({ timeout: 10000 });

    // Error should not overflow viewport
    const box = await error.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(400); // viewport width + tolerance
  });

  test('successful login redirects to dashboard with mobile shell', async ({ page }) => {
    const { email, password } = getCredentials('admin');
    await page.goto('/login');

    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

    // Should see mobile bottom tab bar
    const nav = page.locator('nav').filter({ has: page.getByText('Home') });
    await expect(nav).toBeVisible();

    // Should see welcome message
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
