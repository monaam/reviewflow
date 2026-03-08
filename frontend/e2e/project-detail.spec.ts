import { test, expect } from '@playwright/test';
import { loginAs, type Role } from './helpers/auth';

test.describe('Project Detail Page', () => {
  const API_URL = process.env.API_URL || 'http://localhost:8000/api';

  async function getFirstProjectId(page: import('@playwright/test').Page, role: Role): Promise<string | null> {
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: role === 'pm' ? 'dounia@le2.agency' : role === 'admin' ? 'rym@le2.agency' : 'amir@fatoura.app',
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

  test('assets tab active by default', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: /^Assets/i }),
    ).toBeVisible();
  });

  test('pm sees Requests and Members tabs', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(page.getByRole('button', { name: /requests/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /members/i })).toBeVisible();
  });

  test('reviewer does NOT see Requests and Members tabs', async ({ page }) => {
    await loginAs(page, 'reviewer');
    const projectId = await getFirstProjectId(page, 'reviewer');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(page.getByRole('button', { name: /requests/i })).toBeHidden();
    await expect(page.getByRole('button', { name: /members/i })).toBeHidden();
  });

  test('pm sees upload button', async ({ page }) => {
    await loginAs(page, 'pm');
    const projectId = await getFirstProjectId(page, 'pm');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByTestId('upload-asset-btn'),
    ).toBeVisible();
  });

  test('reviewer does NOT see upload button', async ({ page }) => {
    await loginAs(page, 'reviewer');
    const projectId = await getFirstProjectId(page, 'reviewer');
    if (!projectId) { test.skip(); return; }

    await page.goto(`/studio/projects/${projectId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: /upload/i }),
    ).toBeHidden();
  });
});
