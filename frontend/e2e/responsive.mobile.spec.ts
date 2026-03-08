import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad } from './helpers/mobile';

test.describe('Mobile Responsive Breakpoints', () => {
  test('no horizontal overflow at 390px (iPhone 14)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, 'admin');

    const pages = ['/studio', '/studio/projects', '/studio/assets', '/studio/requests', '/studio/more'];

    for (const url of pages) {
      await page.goto(url);
      await waitForLoad(page);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth, `Horizontal overflow on ${url}`).toBeLessThanOrEqual(clientWidth + 1);
    }
  });

  test('no horizontal overflow at 375px (iPhone SE)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAs(page, 'admin');

    const pages = ['/studio', '/studio/projects', '/studio/assets', '/studio/requests'];

    for (const url of pages) {
      await page.goto(url);
      await waitForLoad(page);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth, `Horizontal overflow on ${url} at 375px`).toBeLessThanOrEqual(clientWidth + 1);
    }
  });

  test('at 1024px shows desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await loginAs(page, 'admin');
    await page.goto('/studio');
    await waitForLoad(page);

    // Desktop sidebar should be visible (rendered by Layout when !isMobile)
    const sidebar = page.locator('.w-64').first();
    await expect(sidebar).toBeVisible();

    // Bottom tab bar should be hidden (lg:hidden)
    const bottomNav = page.locator('nav').filter({ has: page.getByText('Home') });
    await expect(bottomNav).toBeHidden();
  });

  test('admin users page: table on desktop, cards on mobile', async ({ page }) => {
    await loginAs(page, 'admin');

    // Desktop: table visible, cards hidden
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/studio/admin/users');
    await waitForLoad(page);
    await expect(page.locator('table')).toBeVisible();

    // Mobile: table hidden, cards visible
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/studio/admin/users');
    await waitForLoad(page);
    await expect(page.locator('table')).toBeHidden();
    await expect(page.locator('.md\\:hidden')).toBeVisible();
  });
});
