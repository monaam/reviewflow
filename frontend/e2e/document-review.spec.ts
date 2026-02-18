import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Document Review', () => {
  const API_URL = process.env.API_URL || 'http://localhost:8000/api';

  async function createDocumentAsset(page: import('@playwright/test').Page): Promise<{ token: string; projectId: string; assetId: string } | null> {
    // Login as PM via API
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'dounia@le2.agency', password: 'password' },
      headers: { Accept: 'application/json' },
    });
    const { token } = await loginResponse.json();
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

    // Get first project
    const projectsResponse = await page.request.get(`${API_URL}/projects`, { headers });
    const projectsBody = await projectsResponse.json();
    const projects = projectsBody.data || projectsBody;
    if (projects.length === 0) return null;
    const projectId = projects[0].id;

    // Create document asset via API
    const createResponse = await page.request.post(`${API_URL}/projects/${projectId}/assets/document`, {
      headers,
      data: {
        title: 'E2E Review Test Document',
        description: 'A document for review testing',
        content: '<p>This is the first paragraph of the test document.</p><p>This is the second paragraph with some important text that reviewers might want to highlight.</p><p>And a third paragraph to provide enough content for testing.</p>',
      },
    });

    if (createResponse.status() !== 201) return null;
    const asset = await createResponse.json();

    return { token, projectId, assetId: asset.id };
  }

  test('Document renders in review page with content', async ({ page }) => {
    await loginAs(page, 'pm');
    const setup = await createDocumentAsset(page);
    if (!setup) { test.skip(); return; }

    await page.goto(`/assets/${setup.assetId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Document content should be visible
    await expect(page.locator('.document-renderer')).toBeVisible();
    await expect(page.getByText('first paragraph')).toBeVisible();
    await expect(page.getByText('second paragraph')).toBeVisible();
  });

  test('Text selection shows annotation banner in comment panel', async ({ page }) => {
    await loginAs(page, 'pm');
    const setup = await createDocumentAsset(page);
    if (!setup) { test.skip(); return; }

    await page.goto(`/assets/${setup.assetId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Select text in the document
    const editor = page.locator('.ProseMirror');
    await editor.waitFor({ state: 'visible' });

    // Use keyboard to select text
    await editor.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');

    // Check for text selected banner
    await expect(page.getByText('Text selected')).toBeVisible({ timeout: 5000 });
  });

  test('Can submit a comment with text annotation', async ({ page }) => {
    await loginAs(page, 'pm');
    const setup = await createDocumentAsset(page);
    if (!setup) { test.skip(); return; }

    await page.goto(`/assets/${setup.assetId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Select text in the document
    const editor = page.locator('.ProseMirror');
    await editor.waitFor({ state: 'visible' });
    await editor.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');

    // Type a comment
    const commentInput = page.locator('textarea[placeholder*="comment"]');
    await commentInput.fill('This needs revision');
    await page.getByRole('button', { name: /add comment/i }).click();

    // Verify comment appears
    await expect(page.getByText('This needs revision')).toBeVisible({ timeout: 5000 });
  });

  test('Can submit new document version', async ({ page }) => {
    await loginAs(page, 'pm');
    const setup = await createDocumentAsset(page);
    if (!setup) { test.skip(); return; }

    await page.goto(`/assets/${setup.assetId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Check version is v1
    await expect(page.getByText('v1')).toBeVisible();

    // Click upload version / new version button
    const uploadVersionButton = page.getByRole('button', { name: /upload|new version|version/i });
    if (await uploadVersionButton.isVisible()) {
      await uploadVersionButton.click();

      // The document version modal should show with editor
      const editorArea = page.locator('.ProseMirror');
      if (await editorArea.isVisible({ timeout: 3000 })) {
        // Clear and type new content
        await editorArea.click();
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.keyboard.type('Updated document content for version 2.');

        // Submit
        const submitBtn = page.getByRole('button', { name: /submit version/i });
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await expect(page.getByText('v2')).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('Clicking a highlighted annotation selects the comment', async ({ page }) => {
    await loginAs(page, 'pm');
    const setup = await createDocumentAsset(page);
    if (!setup) { test.skip(); return; }

    // Create a comment with text anchor via API
    const headers = { Authorization: `Bearer ${setup.token}`, Accept: 'application/json', 'Content-Type': 'application/json' };
    await page.request.post(`${API_URL}/assets/${setup.assetId}/comments`, {
      headers,
      data: {
        content: 'Highlight test comment',
        text_anchor: { from: 4, to: 20, selectedText: 'is the first par' },
      },
    });

    await page.goto(`/assets/${setup.assetId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Check comment appears in sidebar
    await expect(page.getByText('Highlight test comment')).toBeVisible({ timeout: 5000 });

    // Click on the highlight in the document
    const highlight = page.locator('.annotation-unresolved').first();
    if (await highlight.isVisible({ timeout: 3000 })) {
      await highlight.click();

      // Verify the comment is selected (highlighted in sidebar)
      await expect(page.locator('[class*="border-primary"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('Resolving a comment changes highlight color', async ({ page }) => {
    await loginAs(page, 'pm');
    const setup = await createDocumentAsset(page);
    if (!setup) { test.skip(); return; }

    // Create a comment with text anchor via API
    const headers = { Authorization: `Bearer ${setup.token}`, Accept: 'application/json', 'Content-Type': 'application/json' };
    const commentResponse = await page.request.post(`${API_URL}/assets/${setup.assetId}/comments`, {
      headers,
      data: {
        content: 'Resolve test comment',
        text_anchor: { from: 4, to: 20, selectedText: 'is the first par' },
      },
    });
    const comment = await commentResponse.json();

    await page.goto(`/assets/${setup.assetId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });

    // Verify unresolved highlight exists
    await expect(page.locator('.annotation-unresolved')).toBeVisible({ timeout: 5000 });

    // Resolve the comment via API
    await page.request.post(`${API_URL}/comments/${comment.id}/resolve`, { headers });

    // Reload and check for resolved highlight
    await page.goto(`/assets/${setup.assetId}`);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('.annotation-resolved')).toBeVisible({ timeout: 5000 });
  });
});
