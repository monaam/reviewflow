import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad, expectBottomTabBar, expectNoBottomTabBar, tapTab } from './helpers/mobile';

test.describe('Mobile Navigation & Shell', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('bottom tab bar renders with 5 tabs', async ({ page }) => {
    await page.goto('/studio');
    await waitForLoad(page);

    const nav = page.locator('nav').filter({ has: page.getByText('Home') });
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Home')).toBeVisible();
    await expect(nav.getByText('Projects')).toBeVisible();
    await expect(nav.getByText('Assets')).toBeVisible();
    await expect(nav.getByText('Requests')).toBeVisible();
    await expect(nav.getByText('More')).toBeVisible();
  });

  test('active tab highlights on navigation', async ({ page }) => {
    await page.goto('/studio');
    await waitForLoad(page);

    // Home tab should be active
    const homeLink = page.locator('nav a[href="/studio"]');
    await expect(homeLink).toHaveClass(/text-primary-600/);

    // Navigate to Projects
    await tapTab(page, 'Projects');
    await waitForLoad(page);

    const projectsLink = page.locator('nav a[href*="/projects"]');
    await expect(projectsLink).toHaveClass(/text-primary-600/);
  });

  test('tab bar is hidden on asset review page', async ({ page }) => {
    await page.goto('/studio/assets');
    await waitForLoad(page);
    await expectBottomTabBar(page);

    // Click first asset card
    await page.locator('a.rounded-lg').first().click();
    await page.waitForURL(/\/studio\/assets\/.+/);
    await expectNoBottomTabBar(page);
  });

  test('tab bar reappears when navigating back from asset review', async ({ page }) => {
    await page.goto('/studio/assets');
    await waitForLoad(page);

    // Enter asset review
    await page.locator('a.rounded-lg').first().click();
    await page.waitForURL(/\/studio\/assets\/.+/);
    await expectNoBottomTabBar(page);

    // Go back
    await page.goBack();
    await waitForLoad(page);
    await expectBottomTabBar(page);
  });

  test('mobile header shows logo and notification bell', async ({ page }) => {
    await page.goto('/studio');
    await waitForLoad(page);

    await expect(page.getByRole('img', { name: /briefloop/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /notifications/i })).toBeVisible();
  });

  test('desktop sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/studio');
    await waitForLoad(page);

    // Sidebar contains nav links like "Dashboard" on desktop — should be hidden
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();
  });

  test('tab navigation works for all tabs', async ({ page }) => {
    await page.goto('/studio');
    await waitForLoad(page);

    await tapTab(page, 'Projects');
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByText('Manage your creative projects')).toBeVisible();

    await tapTab(page, 'Assets');
    await expect(page).toHaveURL(/\/assets/);
    await expect(page.getByText('Browse and manage all assets')).toBeVisible();

    await tapTab(page, 'Requests');
    await expect(page).toHaveURL(/\/requests/);
    await expect(page.getByText('Browse and manage creative requests')).toBeVisible();

    await tapTab(page, 'More');
    await expect(page).toHaveURL(/\/more/);
    await expect(page.getByText('Logout')).toBeVisible();

    await tapTab(page, 'Home');
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
