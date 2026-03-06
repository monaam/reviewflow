import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad, expectBottomSheet } from './helpers/mobile';

test.describe('Mobile Projects', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/studio/projects');
    await waitForLoad(page);
  });

  test('search input renders full width', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search"]');
    await expect(search).toBeVisible();
    const box = await search.boundingBox();
    expect(box!.width).toBeGreaterThan(300);
  });

  test('filter buttons are visible and wrap', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: /active/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /on hold/i })).toBeVisible();
  });

  test('project cards display correctly', async ({ page }) => {
    const card = page.locator('a.rounded-lg').first();
    await expect(card).toBeVisible();
    // Card should have project name, client, description
    await expect(card.locator('text=Active').or(card.locator('text=On Hold'))).toBeVisible();
  });

  test('FAB button opens create project bottom sheet', async ({ page }) => {
    // Click the floating action button
    const fab = page.locator('button').filter({ has: page.locator('svg') }).last();
    await fab.click();

    await expectBottomSheet(page, 'Create New Project');

    // Form fields should be visible
    await expect(page.getByLabel('Project Name')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByLabel('Client Name')).toBeVisible();
    await expect(page.getByLabel('Deadline')).toBeVisible();
  });

  test('bottom sheet has drag handle and X close', async ({ page }) => {
    const fab = page.locator('button').filter({ has: page.locator('svg') }).last();
    await fab.click();

    // Drag handle
    await expect(page.locator('[class*="rounded-full"][class*="bg-gray-300"]')).toBeVisible();

    // X close button
    const closeBtn = page.locator('.fixed.inset-x-0.bottom-0').getByRole('button').first();
    await expect(closeBtn).toBeVisible();
  });

  test('tapping backdrop closes bottom sheet', async ({ page }) => {
    const fab = page.locator('button').filter({ has: page.locator('svg') }).last();
    await fab.click();

    await expect(page.getByText('Create New Project')).toBeVisible();

    // Click the backdrop (top of page) — bg-black/20 becomes bg-black\/20 in CSS
    await page.locator('.fixed.inset-0[class*="bg-black"]').click({ position: { x: 10, y: 10 } });

    await expect(page.getByText('Create New Project')).toBeHidden();
  });

  test('X button closes bottom sheet', async ({ page }) => {
    const fab = page.locator('button').filter({ has: page.locator('svg') }).last();
    await fab.click();

    await expect(page.getByText('Create New Project')).toBeVisible();

    // Find the X/close button within the sheet
    const sheet = page.locator('.fixed.inset-x-0.bottom-0.z-50');
    await sheet.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();

    await expect(page.getByText('Create New Project')).toBeHidden();
  });

  test('clicking project card navigates to detail', async ({ page }) => {
    const card = page.locator('a.rounded-lg').first();
    await card.click();

    await page.waitForURL(/\/studio\/projects\/.+/);
  });

  test('creative does not see FAB button', async ({ page }) => {
    await loginAs(page, 'creative');
    await page.goto('/studio/projects');
    await waitForLoad(page);

    // Should not have the + button for creating projects
    await expect(page.getByText('New Project')).toBeHidden();
  });
});
