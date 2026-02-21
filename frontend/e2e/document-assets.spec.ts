import { test, expect } from '@playwright/test';
import { loginAs, type Role } from './helpers/auth';

test.describe('Document Assets', () => {
  const API_URL = process.env.API_URL || 'http://localhost:8000/api';

  async function getFirstProjectId(page: import('@playwright/test').Page, role: Role): Promise<string | null> {
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: role === 'pm' ? 'dounia@le2.agency' : role === 'admin' ? 'rym@le2.agency' : role === 'creative' ? 'ihab@le2.agency' : 'amir@fatoura.app',
        password: 'password',
      },
      headers: { Accept: 'application/json' },
    });
    const { token } = await loginResponse.json();

    const projectsResponse = await page.request.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const body = await projectsResponse.json();
    const projects = body.data || body;
    return projects.length > 0 ? projects[0].id : null;
  }

  test('PM can see Write Document button on project detail', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: /write document/i }),
    ).toBeVisible();
  });

  test('Reviewer cannot see Write Document button', async ({ page }) => {
    await loginAs(page, 'reviewer');
    const projectId = await getFirstProjectId(page, 'reviewer');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: /write document/i }),
    ).toBeHidden();
  });

  test('PM can create a document asset via the editor page', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await page.getByRole('button', { name: /write document/i }).click();

    // Should navigate to the document editor page
    await expect(page).toHaveURL(/\/documents\/new/);
    await expect(page.getByRole('heading', { name: 'Write Document' })).toBeVisible();

    // Fill in the title
    await page.getByPlaceholder('Document title...').fill('E2E Test Document');

    // Type in the editor
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.type('This is test content written in the editor.');

    // Submit
    await page.getByRole('button', { name: /create document/i }).click();

    // Should navigate to the asset review page
    await expect(page).toHaveURL(/\/assets\//, { timeout: 10000 });
  });

  test('Document editor page has formatting toolbar', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}/documents/new`);

    // Verify toolbar buttons are present
    await expect(page.getByTitle('Bold')).toBeVisible();
    await expect(page.getByTitle('Italic')).toBeVisible();
    await expect(page.getByTitle('Heading 1')).toBeVisible();
    await expect(page.getByTitle('Bullet List')).toBeVisible();
    await expect(page.getByTitle('Undo')).toBeVisible();

    await page.getByRole('button', { name: /cancel/i }).click();
    // Should navigate back to project
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}`), { timeout: 5000 });
  });

  test('Document creation requires title and content', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}/documents/new`);

    // Try to submit without filling anything
    const submitButton = page.getByRole('button', { name: /create document/i });
    await expect(submitButton).toBeVisible();

    // Click submit without content — should show error
    await submitButton.click();
    await expect(page.getByText('Content is required')).toBeVisible();
  });
});
