// Scraper for Magic Wood boulders from publicly available 27crags pages.
//
// Sources (all public, no login required):
//   - https://27crags.com/crags/magic-wood/routelist  -> every boulder with
//     name, grade, type, ascents, rating, votes, sector and thumbnail
//   - https://27crags.com/crags/magic-wood/cragmap     -> GPS coordinates per
//     sector (the public topos do not expose per-boulder coordinates)
//
// Output: src/data/boulders.json and src/data/sectors.json
//
// Re-run any time with:  npm run scrape
//
// This only reads pages that 27crags serves to anonymous visitors. It does not
// log in or access any private/premium data.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/data');

const ROUTELIST_URL = 'https://27crags.com/crags/magic-wood/routelist';
const CRAGMAP_URL = 'https://27crags.com/crags/magic-wood/cragmap';
const CRAG_URL = 'https://27crags.com/crags/magic-wood';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function fetchText(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === 4) throw err;
      const wait = 2 ** attempt * 1000;
      console.warn(`  fetch ${url} failed (${err.message}); retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

const stripTags = (s) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&eacute;/g, 'é')
    .replace(/&nbsp;/g, ' ');

function parseSectors(html) {
  const m = html.match(/GoogleMap\((\{[\s\S]*?\})\);/);
  if (!m) throw new Error('Could not find GoogleMap() data in cragmap');
  const data = JSON.parse(m[1]);
  const sectors = {};
  for (const s of data.sectors || []) {
    const slug = s.url.split('/').pop();
    sectors[slug] = {
      slug,
      name: decode(s.name),
      lat: parseFloat(s.latitude),
      lng: parseFloat(s.longitude),
      kind: s.kind,
    };
  }
  return {
    crag: {
      name: data.crag?.name || 'Magic Wood',
      lat: parseFloat(data.map?.latitude ?? data.crag?.latitude),
      lng: parseFloat(data.map?.longitude ?? data.crag?.longitude),
      zoom: data.map?.zoom ?? 15,
    },
    sectors,
  };
}

function parseRoutes(html) {
  const rows = html.split(/<tr class="[^"]*">/);
  const routes = [];
  for (const r of rows) {
    const slugM = r.match(/href="\/crags\/magic-wood\/routes\/([^"]+)"/);
    if (!slugM) continue;
    const nameM = r.match(/class="lfont"[^>]*>([^<]+)<\/a>/);
    const gradeNumM = r.match(/<div class="hidden">\s*(\d+)\s*<\/div>\s*<span class="grade">/);
    const gradeM = r.match(/<span class="grade">([^<]*)<\/span>/);
    const typeAscM = r.match(
      /<td class="hidden-xs">([A-Za-z ]+)<\/td>\s*<td class="hidden-xs">\s*(\d+)\s*<\/td>/
    );
    const ratingM = r.match(/<div class="rating">([\d.]+)<\/div>/);
    const votesM = r.match(/Based on (\d+) votes/);
    const sectorM = r.match(
      /<td class="stxt hidden-xs">\s*<a href="\/crags\/magic-wood\/topos\/([^"]+)">([^<]+)<\/a>/
    );
    const thumbM = r.match(/tiny-topo-image">\s*<img[^>]*src="([^"]+)"/);
    const hasVideo = /tag video/.test(r);

    routes.push({
      slug: slugM[1],
      name: nameM ? decode(stripTags(nameM[1])) : slugM[1],
      grade: gradeM ? gradeM[1].trim() : null,
      gradeNum: gradeNumM ? parseInt(gradeNumM[1], 10) : null,
      type: typeAscM ? typeAscM[1].trim() : 'Boulder',
      ascents: typeAscM ? parseInt(typeAscM[2], 10) : 0,
      rating: ratingM ? Math.round(parseFloat(ratingM[1]) * 100) / 100 : 0,
      votes: votesM ? parseInt(votesM[1], 10) : 0,
      sectorSlug: sectorM ? sectorM[1] : null,
      sector: sectorM ? decode(stripTags(sectorM[2])) : null,
      thumb: thumbM ? thumbM[1] : null,
      hasVideo,
      url: `https://27crags.com/crags/magic-wood/routes/${slugM[1]}`,
    });
  }
  return routes;
}

async function main() {
  console.log('Fetching cragmap (sector GPS)…');
  const cragmapHtml = await fetchText(CRAGMAP_URL);
  const { crag, sectors } = parseSectors(cragmapHtml);
  console.log(`  found ${Object.keys(sectors).length} sectors`);

  console.log('Fetching routelist (boulders)…');
  const routelistHtml = await fetchText(ROUTELIST_URL);
  const routes = parseRoutes(routelistHtml);
  console.log(`  found ${routes.length} boulders`);

  // Join GPS coordinates onto each boulder via its sector.
  let withGps = 0;
  for (const route of routes) {
    const sec = route.sectorSlug ? sectors[route.sectorSlug] : null;
    if (sec) {
      route.lat = sec.lat;
      route.lng = sec.lng;
      withGps++;
    } else {
      route.lat = null;
      route.lng = null;
    }
  }
  console.log(`  ${withGps}/${routes.length} boulders have GPS via sector`);

  // Only keep sectors that actually contain boulders, for the map.
  const usedSlugs = new Set(routes.map((r) => r.sectorSlug).filter(Boolean));
  const usedSectors = Object.values(sectors)
    .filter((s) => usedSlugs.has(s.slug))
    .map((s) => ({
      ...s,
      count: routes.filter((r) => r.sectorSlug === s.slug).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(DATA_DIR, { recursive: true });
  const payload = {
    crag,
    scrapedAt: new Date().toISOString(),
    count: routes.length,
    boulders: routes,
  };
  writeFileSync(resolve(DATA_DIR, 'boulders.json'), JSON.stringify(payload));
  writeFileSync(
    resolve(DATA_DIR, 'sectors.json'),
    JSON.stringify({ crag, sectors: usedSectors })
  );
  console.log(`Wrote ${routes.length} boulders and ${usedSectors.length} sectors to src/data/`);
}

main().catch((err) => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
