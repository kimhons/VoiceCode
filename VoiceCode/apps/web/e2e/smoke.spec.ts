import { test, expect } from '@playwright/test';

// E2E Smoke test: landing → login → protected pages (using fake auth hook)
// The app's AuthContext supports an E2E hook: window.__E2E_FAKE_AUTH = '1'
// We set it via addInitScript so it's defined before the app loads.

test.describe('E2E Smoke: login → dashboard → recording UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Ensure fake auth is set before app scripts run
      (globalThis as any).__E2E_FAKE_AUTH = '1';
      try {
        globalThis.localStorage?.setItem('__E2E_FAKE_AUTH', '1');
      } catch {
        // localStorage may not be available in some contexts (e.g., incognito mode)
      }
    });
  });

  test('landing → login → app (ModernDashboard) → dashboard', async ({ page, baseURL }) => {
    const base = baseURL || 'http://localhost:4173';

    // Landing
    await page.goto(base + '/');

    // Login page
    await page.goto(base + '/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Protected route - ModernDashboard ("/app")
    await page.goto(base + '/app');
    // Wait for ProtectedRoute loading state to disappear if present
    const authLoading = page.getByText('Checking authentication...');
    await authLoading.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Expect main UI markers
    await expect(page.getByText('Templates', { exact: true })).toBeVisible();

    // Recording UI button presence via accessible name
    const recordBtn = page.getByRole('button', { name: /voice recording/i });
    await expect(recordBtn).toBeVisible();
    // Double-check we are on /app
    await expect(page).toHaveURL(/\/app(?:\?|$|$)/);

    // Unified Dashboard page
    await page.goto(base + '/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Usage & Stats/i })).toBeVisible().catch(async () => {
      // Fallback: look for text if tabs not marked as role=tab
      await expect(page.getByText('Usage & Stats', { exact: true })).toBeVisible();
    });
  });
});

