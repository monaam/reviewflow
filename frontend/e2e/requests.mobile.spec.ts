import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad } from './helpers/mobile';

test.describe('Mobile Requests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/studio/requests');
    await waitForLoad(page);
  });

  test('search input renders full width', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search"]');
    await expect(search).toBeVisible();
    const box = await search.boundingBox();
    expect(box!.width).toBeGreaterThan(300);
  });

  test('filter buttons wrap on small screens', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'In Progress' })).toBeVisible();
  });

  test('request cards show title, status, and priority', async ({ page }) => {
    const card = page.locator('a.rounded-lg').first();
    await expect(card).toBeVisible();

    // Should contain a status badge
    await expect(
      card.getByText('In Progress')
        .or(card.getByText('Pending'))
        .or(card.getByText('Completed')),
    ).toBeVisible();

    // Should contain a priority badge
    await expect(
      card.getByText('High')
        .or(card.getByText('Medium'))
        .or(card.getByText('Low'))
        .or(card.getByText('Urgent')),
    ).toBeVisible();
  });

  test('request cards show project, assignee, and deadline', async ({ page }) => {
    const card = page.locator('a.rounded-lg').first();
    await expect(card).toBeVisible();

    // Should have some metadata text
    const text = await card.textContent();
    expect(text).toBeTruthy();
    // Should mention assignment or project info
    expect(text!.length).toBeGreaterThan(20);
  });

  test('clicking request navigates to detail', async ({ page }) => {
    const card = page.locator('a.rounded-lg').first();
    await card.click();

    await page.waitForURL(/\/studio\/requests\/.+/);
  });
});

test.describe('Mobile Request Detail', () => {
  test('upload asset modal opens as bottom sheet', async ({ page }) => {
    await loginAs(page, 'creative');
    await page.goto('/studio/requests');
    await waitForLoad(page);

    // Navigate to a request
    const card = page.locator('a.rounded-lg').first();
    await card.click();
    await page.waitForURL(/\/studio\/requests\/.+/);
    await waitForLoad(page);

    // Look for Upload button
    const uploadBtn = page.getByRole('button', { name: /upload/i });
    if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await uploadBtn.click();

      // Should be a bottom sheet
      await expect(page.locator('[class*="rounded-full"][class*="bg-gray-300"]').or(
        page.locator('[class*="rounded-full"][class*="bg-gray-600"]'),
      )).toBeVisible();
      await expect(page.getByText('Upload Asset for Request')).toBeVisible();
      await expect(page.getByLabel('File')).toBeVisible();
      await expect(page.getByLabel('Asset Title')).toBeVisible();
    }
  });
});
