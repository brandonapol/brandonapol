import { test, expect } from '@playwright/test';

// Wait for the scene, then return where a station's mesh lands on screen.
async function stationPoint(page, id) {
  await page.waitForFunction(() => window.__office?.stations);
  return page.evaluate((id) => {
    const { THREE, camera, stations } = window.__office;
    const station = stations.get(id);
    const box = new THREE.Box3();
    for (const o of [station.object].flat()) box.expandByObject(o);
    const p = box.getCenter(new THREE.Vector3()).project(camera);
    return { x: ((p.x + 1) / 2) * innerWidth, y: ((1 - p.y) / 2) * innerHeight };
  }, id);
}

const awaitLook = (page) => page.waitForFunction(() => window.__office?.controls.mode === 'look');

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

test('loads the office with the HUD and a fresh quest', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#scene')).toBeVisible();
  await expect(page.locator('#quest')).toContainText('0/12');
  await expect(page.locator('#skip')).toHaveAttribute('href', './resume.html');
  await expect(page.locator('#nowebgl')).toBeHidden();
});

test('dragging looks around', async ({ page }) => {
  await page.goto('./');
  await awaitLook(page);
  const before = await page.evaluate(() => window.__office.controls.yaw);
  await page.mouse.move(640, 400);
  await page.mouse.down();
  await page.mouse.move(800, 400, { steps: 5 });
  await page.mouse.up();
  const after = await page.evaluate(() => window.__office.controls.yaw);
  expect(after).toBeGreaterThan(before + 0.3);
});

test('clicking the monitor opens the terminal', async ({ page }) => {
  await page.goto('./');
  await awaitLook(page);
  const { x, y } = await stationPoint(page, 'computer');
  await page.mouse.click(x, y);
  const terminal = page.locator('#computer');
  await expect(terminal).toBeVisible();
  await expect(terminal).toContainText('Brandon Apol');

  await page.locator('#computer .input').fill('cat resume');
  await page.keyboard.press('Enter');
  await expect(terminal).toContainText('Radiance Technologies');

  await page.keyboard.press('Escape');
  await expect(terminal).toBeHidden();
  await awaitLook(page);
  await expect(page.locator('#quest')).toContainText('1/12');
});

test('the guitar plays the band on SoundCloud', async ({ page }) => {
  await page.goto('./?open=guitar');
  const card = page.locator('#card');
  await expect(card).toContainText('Noticing Icarus');
  await expect(card).toContainText('songwriters');
  await expect(card.locator('iframe')).toHaveAttribute('src', /soundcloud\.com\/noticing-icarus-363880582/);
  await card.getByRole('button', { name: '← back' }).click();
  await expect(card).toBeHidden();
});

test('the cooler links to birchwood.lol', async ({ page }) => {
  await page.goto('./?open=cooler');
  await expect(page.locator('#card a', { hasText: 'Get cooking' })).toHaveAttribute('href', 'https://birchwood.lol');
});

test('the keyboard links to the Primeagen post', async ({ page }) => {
  await page.goto('./?open=keyboard');
  await expect(page.locator('#card a.button')).toHaveAttribute('href', /x\.com\/ThePrimeagen\/status\/1952838755288793106/);
});

test('the records play a clean track first, then the playlist', async ({ page }) => {
  await page.goto('./?open=records');
  const frames = page.locator('#card iframe');
  await expect(frames).toHaveCount(2);
  await expect(frames.nth(0)).toHaveAttribute('src', /embed\/track\/4XosapYiYaXGcxc83p3DD9/);
  await expect(frames.nth(1)).toHaveAttribute('src', /embed\/playlist\/4ADWxA6WITqPaPIm6dq8TO/);
});

test('the gear wall lists the biggest climbs at work', async ({ page }) => {
  await page.goto('./?open=climbs');
  await expect(page.locator('#card')).toContainText('Seven services down to two');
});

test('the topo map shows the Chugach route', async ({ page }) => {
  await page.goto('./?open=topo');
  await expect(page.locator('#card')).toContainText('Chugach');
  await expect(page.locator('#card li')).toHaveCount(6);
});

test('the lava lamp shows a fresh SHA-256', async ({ page }) => {
  await page.goto('./?open=lavalamp');
  await expect(page.locator('#card .hash')).toHaveText(/^[0-9a-f]{64}$/);
});

test('the light switch toggles day and night', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => window.__office?.lighting);
  await page.evaluate(() => window.__office.stations.activate(window.__office.stations.get('lights')));
  await page.waitForFunction(() => window.__office.lighting.t === 1);
  await expect(page.locator('#quest')).toContainText('1/12');
});

test('quest progress survives a reload', async ({ page }) => {
  await page.goto('./?open=pad');
  await expect(page.locator('#card')).toContainText('Paradiddle');
  await expect(page.locator('#quest')).toContainText('1/12');
  await page.goto('./');
  await expect(page.locator('#quest')).toContainText('1/12');
});

test('the sound toggle remembers its state', async ({ page }) => {
  await page.goto('./');
  const button = page.locator('#sound');
  await expect(button).toHaveText('sound: on');
  await button.click();
  await expect(button).toHaveText('sound: off');
  await page.reload();
  await expect(button).toHaveText('sound: off');
});
