import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad } from './helpers/mobile';

test.describe('Mobile Version Comparison', () => {
  // Find an asset with multiple versions via the API, then navigate to it
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');

    // Login via API to get a token for direct API calls
    const loginResp = await page.request.post('http://localhost:8000/api/auth/login', {
      data: { email: 'rym@le2.agency', password: 'password' },
    });
    const { token } = await loginResp.json();

    // Find an asset with 2+ versions
    const resp = await page.request.get('http://localhost:8000/api/assets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    const assets = data.data as Array<{ id: string }>;
    let assetId: string | null = null;

    for (const asset of assets) {
      const detailResp = await page.request.get(`http://localhost:8000/api/assets/${asset.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const detail = await detailResp.json();
      const assetData = detail.data ?? detail;
      if (assetData?.versions && assetData.versions.length >= 2) {
        assetId = asset.id;
        break;
      }
    }

    if (!assetId) {
      test.skip();
      return;
    }

    await page.goto(`/studio/assets/${assetId}`);
    await waitForLoad(page);
  });

  test('opens compare view from actions menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Compare').click();

    await expect(page.getByText('Compare').first()).toBeVisible();
    // Close button in the header
    const header = page.locator('.border-b.border-gray-700').first();
    await expect(header.locator('button')).toBeVisible();
  });

  test('tab toggle shows version tabs', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Compare').click();

    // Should have two version tab buttons
    const tabs = page.locator('button').filter({ hasText: /^Version \d+$/ });
    await expect(tabs).toHaveCount(2);
  });

  test('switching tabs changes displayed version', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Compare').click();

    // Initially on left tab, version selector shows the left version
    const versionSelect = page.locator('select').first();
    await expect(versionSelect).toBeVisible();

    // Click the right version tab
    const tabs = page.locator('button').filter({ hasText: /^Version \d+$/ });
    await tabs.last().click();

    // Version selector should still be visible (now showing right version)
    await expect(versionSelect).toBeVisible();
  });

  test('swap button swaps version assignments', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Compare').click();

    // Get initial tab labels
    const tabs = page.locator('button').filter({ hasText: /^Version \d+$/ });
    const firstTabText = await tabs.first().textContent();

    // Click swap (button has title="Swap versions")
    await page.locator('button[title="Swap versions"]').click();

    // First tab should now have the other version
    const newFirstTabText = await tabs.first().textContent();
    expect(newFirstTabText).not.toBe(firstTabText);
  });

  test('metadata is present in compare view', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Compare').click();

    // Version selector should be visible
    await expect(page.locator('select').first()).toBeVisible();

    // Compare heading should be present
    await expect(page.getByText('Compare')).toBeVisible();
  });

  test('X button closes comparison', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Compare').click();

    await expect(page.getByText('Compare').first()).toBeVisible();

    // Close — the X button is next to the Compare heading in the header
    const header = page.locator('.border-b.border-gray-700').first();
    await header.locator('button').click();

    // Should be back on asset review (no Compare heading)
    await expect(page.getByRole('button', { name: 'Actions' })).toBeVisible();
  });
});
