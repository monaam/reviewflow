import { Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

const TEST_USERS = {
  admin: { email: 'rym@le2.agency', password: 'password' },
  pm: { email: 'dounia@le2.agency', password: 'password' },
  creative: { email: 'ihab@le2.agency', password: 'password' },
  reviewer: { email: 'amir@fatoura.app', password: 'password' },
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

export function getCredentials(role: Role) {
  return TEST_USERS[role];
}
