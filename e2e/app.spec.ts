import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

test('app launches and shows a window', async () => {
  const app = await electron.launch({
    args: [path.join(__dirname, '..', 'out', 'main', 'main.js')],
  });

  const window = await app.firstWindow();
  expect(window).toBeTruthy();

  await app.close();
});
