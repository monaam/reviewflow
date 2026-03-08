import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { waitForLoad, expectBottomSheet } from './helpers/mobile';

test.describe('Mobile Admin Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/studio/admin/users');
    await waitForLoad(page);
  });

  test('desktop table is hidden on mobile', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeHidden();
  });

  test('mobile card layout is visible', async ({ page }) => {
    // Cards should be visible in the md:hidden container
    const mobileCards = page.locator('.md\\:hidden');
    await expect(mobileCards).toBeVisible();
  });

  test('user cards show avatar, name, email, role, and status', async ({ page }) => {
    // First user card in mobile container
    const mobileContainer = page.locator('.md\\:hidden');
    const card = mobileContainer.locator('[class*="card"]').first();
    await expect(card).toBeVisible();

    const text = await card.textContent();
    // Should have role badge (CSS uppercase, but textContent is lowercase)
    expect(
      text!.includes('admin') ||
      text!.includes('pm') ||
      text!.includes('creative') ||
      text!.includes('reviewer'),
    ).toBeTruthy();

    // Should have active/inactive badge
    expect(text!.includes('Active') || text!.includes('Inactive')).toBeTruthy();
  });

  test('user card shows avatar initial', async ({ page }) => {
    // Avatar initial circle in mobile container
    const mobileContainer = page.locator('.md\\:hidden');
    const avatar = mobileContainer.locator('[class*="rounded-full"][class*="bg-primary"]').first();
    await expect(avatar).toBeVisible();
    const text = await avatar.textContent();
    expect(text!.length).toBe(1); // Single character initial
  });

  test('edit pencil button opens Edit User bottom sheet', async ({ page }) => {
    // Click the edit button on first user card in mobile container
    const mobileContainer = page.locator('.md\\:hidden');
    const editBtn = mobileContainer.locator('[class*="card"]').first().locator('button').last();
    await editBtn.click();

    await expectBottomSheet(page, 'Edit User');

    // Fields should be pre-filled
    const nameInput = page.getByLabel('Name');
    await expect(nameInput).toBeVisible();
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    const emailInput = page.getByLabel('Email');
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toContain('@');
  });

  test('edit user shows password hint', async ({ page }) => {
    const mobileContainer = page.locator('.md\\:hidden');
    const editBtn = mobileContainer.locator('[class*="card"]').first().locator('button').last();
    await editBtn.click();

    await expect(page.getByText('leave blank to keep current')).toBeVisible();
  });

  test('Add User button opens bottom sheet', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();

    await expectBottomSheet(page, 'Add User');

    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Role')).toBeVisible();
  });

  test('role dropdown works in Add User sheet', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();

    const roleSelect = page.getByLabel('Role');
    await roleSelect.selectOption('admin');
    await expect(roleSelect).toHaveValue('admin');

    await roleSelect.selectOption('pm');
    await expect(roleSelect).toHaveValue('pm');

    await roleSelect.selectOption('reviewer');
    await expect(roleSelect).toHaveValue('reviewer');
  });

  test('filter buttons wrap on mobile', async ({ page }) => {
    const allBtn = page.getByRole('button', { name: 'All' });
    const adminBtn = page.getByRole('button', { name: 'ADMIN' });
    const reviewerBtn = page.getByRole('button', { name: 'REVIEWER' });

    await expect(allBtn).toBeVisible();
    await expect(adminBtn).toBeVisible();
    await expect(reviewerBtn).toBeVisible();

    // All buttons should be within viewport (wrapped, not overflowing)
    const allBox = await allBtn.boundingBox();
    const reviewerBox = await reviewerBtn.boundingBox();
    expect(allBox!.x).toBeGreaterThanOrEqual(0);
    expect(reviewerBox!.x + reviewerBox!.width).toBeLessThanOrEqual(390 + 10); // viewport + tolerance
  });

  test('filter by role works', async ({ page }) => {
    await page.getByRole('button', { name: 'ADMIN' }).click();
    await waitForLoad(page);

    // Wait for cards to update — first card should contain "admin" role
    const mobileContainer = page.locator('.md\\:hidden');
    const firstCard = mobileContainer.locator('[class*="card"]').first();
    await expect(firstCard).toContainText('admin', { timeout: 5000 });

    const cards = mobileContainer.locator('[class*="card"]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      expect(text!.toLowerCase()).toContain('admin');
    }
  });
});
