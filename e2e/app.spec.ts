import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

async function launchApp() {
  const app = await electron.launch({
    args: [path.join(__dirname, '..', 'out', 'main', 'main.js')],
  });
  const window = await app.firstWindow();
  // Wait for the React app to mount
  await window.waitForSelector('#root', { timeout: 10_000 });
  return { app, window };
}

// --------------------------------------------------------------------------
// App launch
// --------------------------------------------------------------------------

test('app launches and renders a window', async () => {
  const { app, window } = await launchApp();
  expect(window).toBeTruthy();
  await app.close();
});

test('window has a non-empty title', async () => {
  const { app, window } = await launchApp();
  const title = await window.title();
  expect(title.length).toBeGreaterThan(0);
  await app.close();
});

// --------------------------------------------------------------------------
// Login page (shown when not authenticated)
// --------------------------------------------------------------------------

test('login page shows QR code tab by default', async () => {
  const { app, window } = await launchApp();

  // The default login method is QR — heading should say "Scan QR Code"
  const heading = await window.locator('h2').first();
  await expect(heading).toContainText('Scan QR Code');

  await app.close();
});

test('login page has login method tabs', async () => {
  const { app, window } = await launchApp();

  // LoginTabs renders buttons: QR, Webtoken, Credentials
  for (const label of ['QR', 'Webtoken', 'Credentials']) {
    await expect(window.getByRole('button', { name: label })).toBeVisible();
  }

  await app.close();
});

test('switching to Credentials login shows username and password fields', async () => {
  const { app, window } = await launchApp();

  await window.getByRole('button', { name: 'Credentials' }).click();

  await expect(window.locator('#username')).toBeVisible();
  await expect(window.locator('#password')).toBeVisible();

  await app.close();
});

test('username field accepts text input', async () => {
  const { app, window } = await launchApp();

  await window.getByRole('button', { name: 'Credentials' }).click();
  await window.locator('#username').fill('testuser');
  const value = await window.locator('#username').inputValue();
  expect(value).toBe('testuser');

  await app.close();
});

// --------------------------------------------------------------------------
// Sidebar navigation (visible even when not logged in)
// --------------------------------------------------------------------------

test('sidebar shows all main navigation items', async () => {
  const { app, window } = await launchApp();

  // Navigation links are always rendered in the sidebar (just pointer-events-none when not logged in)
  for (const label of ['Overview', 'Transfer', 'Inventory', 'Trade up']) {
    await expect(window.getByText(label).first()).toBeVisible();
  }

  await app.close();
});
