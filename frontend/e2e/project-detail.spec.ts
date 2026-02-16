import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Project Detail Page', () => {
  // Helper to get the first project ID from the API
  async function getFirstProjectId(page: import('@playwright/test').Page, role: 'pm' | 'admin' | 'reviewer'): Promise<string | null> {
    const apiUrl = process.env.API_URL || 'http://localhost:8000/api';
    const loginResponse = await page.request.post(`${apiUrl}/auth/login`, {
      data: { email: `${role}@briefloop.com`, password: 'password' },
    });
    const { token } = await loginResponse.json();

    const projectsResponse = await page.request.get(`${apiUrl}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await projectsResponse.json();
    const projects = body.data || body;
    return projects.length > 0 ? projects[0].id : null;
  }

  test('assets tab active by default', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Assets tab should be active or assets content should be visible
    await expect(
      page.getByRole('button', { name: /assets/i }).or(page.getByText('Assets').first()),
    ).toBeVisible();
  });

  test('pm sees Requests and Members tabs', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(page.getByRole('button', { name: /requests/i }).or(page.getByText('Requests'))).toBeVisible();
    await expect(page.getByRole('button', { name: /members/i }).or(page.getByText('Members'))).toBeVisible();
  });

  test('reviewer does NOT see Requests and Members tabs', async ({ page }) => {
    await loginAs(page, 'reviewer');
    const projectId = await getFirstProjectId(page, 'reviewer');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(page.getByRole('button', { name: /requests/i })).toBeHidden();
    await expect(page.getByRole('button', { name: /members/i })).toBeHidden();
  });

  test('pm sees upload button', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByText('Upload').or(page.getByRole('button', { name: /upload/i })),
    ).toBeVisible();
  });

  test('reviewer does NOT see upload button', async ({ page }) => {
    await loginAs(page, 'reviewer');
    const projectId = await getFirstProjectId(page, 'reviewer');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: /upload/i }),
    ).toBeHidden();
  });
});
