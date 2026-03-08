import { Page, expect } from '@playwright/test';

export const MOBILE_VIEWPORT = { width: 390, height: 844 };

/** Wait for loading spinners to disappear */
export async function waitForLoad(page: Page) {
  // Wait until no spinners are visible (handles 0, 1, or multiple)
  await page.waitForFunction(
    () => document.querySelectorAll('.animate-spin').length === 0,
    { timeout: 15000 },
  );
}

/** Assert bottom tab bar is visible with expected tabs */
export async function expectBottomTabBar(page: Page) {
  const nav = page.locator('nav').filter({ has: page.getByText('Home') });
  await expect(nav).toBeVisible();
  await expect(nav.getByText('Projects')).toBeVisible();
  await expect(nav.getByText('Assets')).toBeVisible();
  await expect(nav.getByText('More')).toBeVisible();
}

/** Assert bottom tab bar is NOT visible */
export async function expectNoBottomTabBar(page: Page) {
  const nav = page.locator('nav').filter({ has: page.getByText('Home') });
  await expect(nav).toBeHidden();
}

/** Navigate via bottom tab bar */
export async function tapTab(page: Page, name: string) {
  const nav = page.locator('nav').filter({ has: page.getByText('Home') });
  await nav.getByText(name, { exact: true }).click();
}

/** Assert a bottom sheet is open with given title */
export async function expectBottomSheet(page: Page, title: string) {
  // Bottom sheet has a drag handle bar
  const handle = page.locator('div.rounded-full').filter({ has: page.locator(':scope:empty') });
  await expect(handle.first()).toBeVisible();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

/** Close a bottom sheet via X button */
export async function closeBottomSheet(page: Page) {
  // The X button is inside the bottom sheet header
  const sheet = page.locator('.fixed.inset-x-0.bottom-0.z-50');
  await sheet.locator('button').filter({ has: page.locator('svg') }).first().click();
}
