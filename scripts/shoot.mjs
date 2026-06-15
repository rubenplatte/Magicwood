// Drives the built app in a mobile viewport with Playwright and saves
// screenshots so we can eyeball the UI. Usage: node scripts/shoot.mjs [baseUrl]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4173/';
const OUT = '/tmp/shots';
mkdirSync(OUT, { recursive: true });

// Magic Wood-ish coordinates so the "locate me" dot lands on the map.
const GEO = { latitude: 46.5638, longitude: 9.4373 };

const exe = process.env.PW_CHROME || undefined;
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  geolocation: GEO,
  permissions: ['geolocation'],
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

async function shot(name, ms = 600) {
  await page.waitForTimeout(ms);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot:', name);
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await shot('1-explore');

// Filters on the Explore tab (sort should be at the top here)
await page.getByRole('button', { name: 'Filters' }).click();
await shot('1b-filters-explore', 600);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// Open a boulder detail
await page.locator('h3').first().click();
await shot('2-detail');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// Map tab
await page.getByRole('button', { name: 'Map' }).click();
await shot('3-map', 2500);

// Locate me
await page.getByRole('button', { name: 'Show my location' }).click();
await shot('4-map-located', 2000);

// Zoom in via mouse wheel to trigger permanent sector labels
// Position precisely on a populated cluster at deep zoom to check labels.
await page.evaluate(() => {
  const m = window.__mwmap;
  if (m) m.setView([46.5638, 9.4373], 20);
});
await shot('5-map-zoomed', 1800);
// And a mid zoom over the dense core to confirm it stays uncluttered.
await page.evaluate(() => {
  const m = window.__mwmap;
  if (m) m.setView([46.5638, 9.4373], 16);
});
await shot('5b-map-core', 1500);

// Satellite toggle (exact label to avoid matching the nav "Map" tab)
await page.getByRole('button', { name: 'Satellite', exact: true }).click();
await shot('6-map-satellite', 2500);

// Filters over the map (the z-index bug)
await page.getByRole('button', { name: 'Filters' }).click();
await shot('7-filters-over-map', 800);
await page.keyboard.press('Escape');

// Lists tab
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Lists' }).click();
await shot('8-lists');

console.log('\nconsole errors:', errors.length ? errors : 'none');
await browser.close();
