import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Asset Version Upload - File Type Validation', () => {
  const API_URL = process.env.API_URL || 'http://localhost:8000/api';

  async function getAuthHeaders(page: import('@playwright/test').Page) {
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'ihab@le2.agency', password: 'password' },
      headers: { Accept: 'application/json' },
    });
    const { token } = await loginResponse.json();
    return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  }

  async function getProjectId(page: import('@playwright/test').Page, headers: Record<string, string>) {
    const response = await page.request.get(`${API_URL}/projects`, { headers });
    const body = await response.json();
    const projects = body.data || body;
    return projects[0]?.id;
  }

  async function createImageAsset(page: import('@playwright/test').Page, headers: Record<string, string>, projectId: string) {
    const response = await page.request.post(`${API_URL}/projects/${projectId}/assets`, {
      headers,
      multipart: {
        title: 'E2E Version Type Test',
        file: {
          name: 'test-image.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-content'),
        },
      },
    });
    return response;
  }

  test('rejects uploading a PDF as new version of an image asset', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const projectId = await getProjectId(page, headers);
    if (!projectId) { test.skip(); return; }

    const createResponse = await createImageAsset(page, headers, projectId);
    if (createResponse.status() !== 201) { test.skip(); return; }
    const asset = await createResponse.json();

    // Try uploading a PDF as a new version of an image asset
    const versionResponse = await page.request.post(`${API_URL}/assets/${asset.id}/versions`, {
      headers,
      multipart: {
        file: {
          name: 'document.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake-pdf-content'),
        },
      },
    });

    expect(versionResponse.status()).toBe(422);
    const body = await versionResponse.json();
    expect(body.message).toContain('File type mismatch');
  });

  test('rejects uploading a video as new version of an image asset', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const projectId = await getProjectId(page, headers);
    if (!projectId) { test.skip(); return; }

    const createResponse = await createImageAsset(page, headers, projectId);
    if (createResponse.status() !== 201) { test.skip(); return; }
    const asset = await createResponse.json();

    // Try uploading a video as a new version of an image asset
    const versionResponse = await page.request.post(`${API_URL}/assets/${asset.id}/versions`, {
      headers,
      multipart: {
        file: {
          name: 'video.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('fake-video-content'),
        },
      },
    });

    expect(versionResponse.status()).toBe(422);
    const body = await versionResponse.json();
    expect(body.message).toContain('File type mismatch');
  });

  test('accepts uploading same file type as new version', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const projectId = await getProjectId(page, headers);
    if (!projectId) { test.skip(); return; }

    const createResponse = await createImageAsset(page, headers, projectId);
    if (createResponse.status() !== 201) { test.skip(); return; }
    const asset = await createResponse.json();

    // Upload another image as a new version — should succeed
    const versionResponse = await page.request.post(`${API_URL}/assets/${asset.id}/versions`, {
      headers,
      multipart: {
        file: {
          name: 'updated-image.png',
          mimeType: 'image/png',
          buffer: Buffer.from('fake-image-v2-content'),
        },
      },
    });

    expect(versionResponse.status()).toBe(201);
    const body = await versionResponse.json();
    expect(body.current_version).toBe(2);
  });

  test('upload version modal shows error for wrong file type', async ({ page }) => {
    await loginAs(page, 'creative');
    const headers = await getAuthHeaders(page);
    const projectId = await getProjectId(page, headers);
    if (!projectId) { test.skip(); return; }

    const createResponse = await createImageAsset(page, headers, projectId);
    if (createResponse.status() !== 201) { test.skip(); return; }
    const asset = await createResponse.json();

    // Navigate to asset review page
    await page.goto(`/studio/assets/${asset.id}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Click "Upload New Version" button
    const uploadBtn = page.getByRole('button', { name: /upload.*version|new version/i });
    if (await uploadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadBtn.click();

      // Upload a PDF file in the modal
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'wrong-type.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fake-pdf'),
      });

      // Click upload button
      const submitBtn = page.getByRole('button', { name: /^upload$/i });
      await submitBtn.click();

      // Should show error message
      await expect(page.getByText(/file type mismatch|type mismatch/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
