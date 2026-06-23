// Scraper for boulders from publicly available 27crags pages.
//
// Covers four areas. Most areas map to a single public 27crags crag, but an
// area can also aggregate several neighbouring crags into one (Gottardo bundles
// the Gottardo, Gottardo Centrale and Mätteli crags):
//   - magic-wood   (Magic Wood, Switzerland)
//   - chironico    (Chironico, Ticino)
//   - cresciano    (Cresciano, Ticino)
//   - gottardo     (Gottardo + Gottardo Centrale + Mätteli, Gotthard)
//
// Sources per crag (all public, no login required):
//   - https://27crags.com/crags/<crag>/routelist -> every boulder with
//     name, grade, type, ascents, rating, votes, sector and thumbnail
//   - https://27crags.com/crags/<crag>/cragmap   -> GPS coordinates per
//     sector (the public topos do not expose per-boulder coordinates)
//
// Output: src/data/boulders.json and src/data/sectors.json, with every
// boulder and sector tagged with its `area` so the app can label, sort and
// filter across all areas. Magic Wood slugs are preserved exactly so existing
// saved likes / lists / ticks keep matching.
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

// The areas to scrape, in the display order used across the app (Magic Wood
// first, then the Ticino areas, then Gotthard). Each area lists the public
// 27crags crag slug(s) it is built from — a single slug for most areas, or
// several when one app area aggregates neighbouring crags.
const AREAS = [
  { slug: 'magic-wood', name: 'Magic Wood', crags: ['magic-wood'] },
  { slug: 'chironico', name: 'Chironico', crags: ['chironico'] },
  { slug: 'cresciano', name: 'Cresciano', crags: ['cresciano'] },
  // Gottardo bundles three adjacent Gotthard crags into one area. Mätteli's
  // 27crags slug is `gotthardreuss`.
  { slug: 'gottardo', name: 'Gottardo', crags: ['gottardo', 'gottardo-centrale', 'gotthardreuss'] },
];

const ROUTELIST_URL = (crag) => `https://27crags.com/crags/${crag}/routelist`;
const CRAGMAP_URL = (crag) => `https://27crags.com/crags/${crag}/cragmap`;
const ROUTE_URL = (crag, slug) => `https://27crags.com/crags/${crag}/routes/${slug}`;
const PHOTO_URL = (id) => `https://27crags.com/photos/${id}`;
const PHOTO_CONCURRENCY = 12;

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

function parseSectors(html, cragSlug, areaSlug) {
  const m = html.match(/GoogleMap\((\{[\s\S]*?\})\);/);
  if (!m) throw new Error(`Could not find GoogleMap() data in ${cragSlug} cragmap`);
  const data = JSON.parse(m[1]);
  const sectors = {};
  for (const s of data.sectors || []) {
    const slug = s.url.split('/').pop();
    sectors[slug] = {
      slug,
      area: areaSlug,
      name: decode(s.name),
      lat: parseFloat(s.latitude),
      lng: parseFloat(s.longitude),
      kind: s.kind,
    };
  }
  const crag = {
    name: data.crag?.name || cragSlug,
    lat: parseFloat(data.map?.latitude ?? data.crag?.latitude),
    lng: parseFloat(data.map?.longitude ?? data.crag?.longitude),
    zoom: data.map?.zoom ?? 15,
  };
  return { crag, sectors };
}

function parseRoutes(html, cragSlug, areaSlug) {
  const rows = html.split(/<tr class="[^"]*">/);
  const routes = [];
  const routeHref = new RegExp(`href="/crags/${cragSlug}/routes/([^"]+)"`);
  const sectorHref = new RegExp(
    `<td class="stxt hidden-xs">\\s*<a href="/crags/${cragSlug}/topos/([^"]+)">([^<]+)</a>`
  );
  for (const r of rows) {
    const slugM = r.match(routeHref);
    if (!slugM) continue;
    const nameM = r.match(/class="lfont"[^>]*>([^<]+)<\/a>/);
    const gradeNumM = r.match(/<div class="hidden">\s*(\d+)\s*<\/div>\s*<span class="grade">/);
    const gradeM = r.match(/<span class="grade">([^<]*)<\/span>/);
    const typeAscM = r.match(
      /<td class="hidden-xs">([A-Za-z ]+)<\/td>\s*<td class="hidden-xs">\s*(\d+)\s*<\/td>/
    );
    const ratingM = r.match(/<div class="rating">([\d.]+)<\/div>/);
    const votesM = r.match(/Based on (\d+) votes/);
    const sectorM = r.match(sectorHref);
    const thumbM = r.match(/tiny-topo-image">\s*<img[^>]*src="([^"]+)"/);
    const hasVideo = /tag video/.test(r);

    routes.push({
      slug: slugM[1],
      area: areaSlug,
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
      url: ROUTE_URL(cragSlug, slugM[1]),
    });
  }
  return routes;
}

// The routelist only exposes the 80px "small" thumbnail. The full-resolution
// image (size_xl, ~1520px) lives at a different, content-hashed URL that we can
// only discover from each photo's page. Resolve them in a small concurrency
// pool so the detail view and map popups can show a proper photo.
function photoIdFromThumb(thumb) {
  const m = thumb && thumb.match(/\/photos\/\d{3}\/\d{3}\/(\d+)\//);
  return m ? m[1] : null;
}

async function resolveHighResImages(routes) {
  const ids = [...new Set(routes.map((r) => photoIdFromThumb(r.thumb)).filter(Boolean))];
  console.log(`Resolving high-res images for ${ids.length} unique photos…`);
  const xlById = new Map();
  let done = 0;

  async function worker(queue) {
    for (const id of queue) {
      try {
        const html = await fetchText(PHOTO_URL(id));
        const m = html.match(
          /https:\/\/storage\.e5gc6\.upcloudobjects\.com\/photos\/[^"']*size_xl-[a-f0-9]+\.(?:jpg|jpeg|png)/i
        );
        if (m) xlById.set(id, m[0]);
      } catch {
        /* leave unresolved; falls back to the thumbnail */
      }
      done++;
      if (done % 200 === 0) console.log(`    ${done}/${ids.length}`);
    }
  }

  // Split ids round-robin into PHOTO_CONCURRENCY queues.
  const queues = Array.from({ length: PHOTO_CONCURRENCY }, () => []);
  ids.forEach((id, i) => queues[i % PHOTO_CONCURRENCY].push(id));
  await Promise.all(queues.map(worker));

  let resolved = 0;
  for (const r of routes) {
    const id = photoIdFromThumb(r.thumb);
    const xl = id ? xlById.get(id) : null;
    r.image = xl || r.thumb || null;
    if (xl) resolved++;
  }
  console.log(`  resolved ${resolved}/${routes.length} high-res images`);
}

// Scrape a single 27crags crag: its sectors (with GPS) and its boulders, with
// GPS joined onto each boulder via its sector. Boulders/sectors are tagged with
// the owning app area so several crags can be merged into one area later.
async function scrapeCrag(cragSlug, areaSlug) {
  console.log(`  crag ${cragSlug}: fetching cragmap + routelist…`);
  const cragmapHtml = await fetchText(CRAGMAP_URL(cragSlug));
  const { crag, sectors } = parseSectors(cragmapHtml, cragSlug, areaSlug);

  const routelistHtml = await fetchText(ROUTELIST_URL(cragSlug));
  const routes = parseRoutes(routelistHtml, cragSlug, areaSlug);

  // Join GPS coordinates onto each boulder via its sector (within this crag).
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

  // Only keep sectors that actually contain boulders, for the map.
  const usedSlugs = new Set(routes.map((r) => r.sectorSlug).filter(Boolean));
  const usedSectors = Object.values(sectors)
    .filter((s) => usedSlugs.has(s.slug))
    .map((s) => ({
      ...s,
      count: routes.filter((r) => r.sectorSlug === s.slug).length,
    }));

  console.log(
    `    ${routes.length} boulders (${withGps} with GPS), ${usedSectors.length} sectors`
  );
  return { crag, routes, sectors: usedSectors };
}

async function scrapeArea(area) {
  console.log(`\n=== ${area.name} (${area.slug}) — ${area.crags.join(', ')} ===`);

  const routes = [];
  const sectors = [];
  const crags = [];
  for (const cragSlug of area.crags) {
    const res = await scrapeCrag(cragSlug, area.slug);
    routes.push(...res.routes);
    sectors.push(...res.sectors);
    crags.push(res.crag);
  }

  // Centre the area on its crags. With a single crag this is exactly that
  // crag's curated map centre/zoom (so existing areas stay byte-identical);
  // with several, use their centroid and the widest (smallest) zoom so the
  // default view spans the whole area.
  const lat = crags.reduce((s, c) => s + c.lat, 0) / crags.length;
  const lng = crags.reduce((s, c) => s + c.lng, 0) / crags.length;
  const zoom = Math.min(...crags.map((c) => c.zoom));

  console.log(`  area total: ${routes.length} boulders, ${sectors.length} sectors`);
  return {
    // Use our own short display name (e.g. "Gottardo") with a map centre that
    // covers all of the area's crags.
    area: { slug: area.slug, name: area.name, lat, lng, zoom, count: routes.length },
    routes,
    sectors,
  };
}

async function main() {
  const results = [];
  for (const area of AREAS) {
    results.push(await scrapeArea(area));
  }

  const allRoutes = results.flatMap((r) => r.routes);
  const allSectors = results
    .flatMap((r) => r.sectors)
    .sort((a, b) => a.name.localeCompare(b.name));
  const areas = results.map((r) => r.area);

  console.log(`\nResolving high-res images across all ${allRoutes.length} boulders…`);
  await resolveHighResImages(allRoutes);

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    resolve(DATA_DIR, 'boulders.json'),
    JSON.stringify({
      areas,
      scrapedAt: new Date().toISOString(),
      count: allRoutes.length,
      boulders: allRoutes,
    })
  );
  writeFileSync(
    resolve(DATA_DIR, 'sectors.json'),
    JSON.stringify({ areas, sectors: allSectors })
  );
  console.log(
    `\nWrote ${allRoutes.length} boulders and ${allSectors.length} sectors ` +
      `across ${areas.length} areas to src/data/`
  );
  for (const a of areas) console.log(`  ${a.name}: ${a.count} boulders`);
}

main().catch((err) => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
