import { Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

const TEST_USERS = {
  admin: { email: 'admin@briefloop.com', password: 'password' },
  pm: { email: 'pm@briefloop.com', password: 'password' },
  creative: { email: 'creative@briefloop.com', password: 'password' },
  reviewer: { email: 'reviewer@briefloop.com', password: 'password' },
} as const;

export type Role = keyof typeof TEST_USERS;

export async function loginAs(page: Page, role: Role): Promise<void> {
  const { email, password } = TEST_USERS[role];

  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });

  const body = await response.json();
  const token = body.token;
  const user = body.user;

  await page.addInitScript(
    ({ token, user }: { token: string; user: unknown }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token, user },
  );
}
