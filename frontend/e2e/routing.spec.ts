import { test, expect } from '@playwright/test';
import { loginAs, getCredentials } from './helpers/auth';

test.describe('Studio URL Routing', () => {
  test.describe('Legacy redirects', () => {
    test('/projects redirects to /studio/projects', async ({ page }) => {
      await loginAs(page, 'pm');
      await page.goto('/projects');
      await expect(page).toHaveURL(/\/studio\/projects/, { timeout: 5000 });
    });

    test('/assets redirects to /studio/assets', async ({ page }) => {
      await loginAs(page, 'pm');
      await page.goto('/assets');
      await expect(page).toHaveURL(/\/studio\/assets/, { timeout: 5000 });
    });

    test('/requests redirects to /studio/requests', async ({ page }) => {
      await loginAs(page, 'pm');
      await page.goto('/requests');
      await expect(page).toHaveURL(/\/studio\/requests/, { timeout: 5000 });
    });

    test('/queue redirects to /studio/queue', async ({ page }) => {
      await loginAs(page, 'creative');
      await page.goto('/queue');
      await expect(page).toHaveURL(/\/studio\/queue/, { timeout: 5000 });
    });

    test('/review-queue redirects to /studio/review-queue', async ({ page }) => {
      await loginAs(page, 'pm');
      await page.goto('/review-queue');
      await expect(page).toHaveURL(/\/studio\/review-queue/, { timeout: 5000 });
    });

    test('/notifications redirects to /studio/notifications', async ({ page }) => {
      await loginAs(page, 'pm');
      await page.goto('/notifications');
      await expect(page).toHaveURL(/\/studio\/notifications/, { timeout: 5000 });
    });

    test('/profile redirects to /studio/profile', async ({ page }) => {
      await loginAs(page, 'pm');
      await page.goto('/profile');
      await expect(page).toHaveURL(/\/studio\/profile/, { timeout: 5000 });
    });
  });

  test.describe('Auth routing', () => {
    test('login redirects to /studio after successful auth', async ({ page }) => {
      const { email, password } = getCredentials('pm');
      await page.goto('/login');
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/studio/, { timeout: 10000 });
    });

    test('unauthenticated visit to /studio redirects to /login', async ({ page }) => {
      await page.goto('/studio');
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('unknown route redirects to /studio for authenticated user', async ({ page }) => {
      await loginAs(page, 'pm');
      await page.goto('/some-nonexistent-page');
      await expect(page).toHaveURL(/\/studio/, { timeout: 5000 });
    });
  });
});
