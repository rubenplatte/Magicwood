// Generates PWA PNG icons with no external dependencies (pure zlib PNG encoder).
// Draws a simple Magic Wood mark: a moss-green boulder on a dark sky.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
mkdirSync(PUBLIC, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, draw) {
  const px = (x, y) => {
    const i = (y * size + x) * 4;
    return [raw[i], raw[i + 1], raw[i + 2], raw[i + 3]];
  };
  const raw = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size);
      const i = (y * size + x) * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  void px;
  // add filter byte (0) per scanline
  const stride = size * 4;
  const filtered = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    filtered[y * (stride + 1)] = 0;
    raw.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(filtered, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// scene: dark rounded background + a moss boulder blob + small chalk dots
function scene(x, y, size) {
  const u = x / size;
  const v = y / size;
  // background
  let r = 15, g = 23, b = 42; // slate-900

  // boulder: union of a few circles in lower-center
  const blobs = [
    { cx: 0.5, cy: 0.62, rad: 0.3 },
    { cx: 0.36, cy: 0.72, rad: 0.2 },
    { cx: 0.66, cy: 0.7, rad: 0.22 },
  ];
  let inRock = false;
  for (const bl of blobs) {
    const dx = u - bl.cx;
    const dy = v - bl.cy;
    if (dx * dx + dy * dy <= bl.rad * bl.rad) inRock = true;
  }
  if (inRock) {
    // shade by height for a little depth
    const shade = 1 - (v - 0.35) * 0.5;
    r = Math.round(70 * shade + 20);
    g = Math.round(120 * shade + 30);
    b = Math.round(60 * shade + 20);
  }

  // a couple of chalk holds (light dots) on the rock
  const dots = [
    { cx: 0.46, cy: 0.55 },
    { cx: 0.58, cy: 0.66 },
  ];
  for (const d of dots) {
    const dx = u - d.cx;
    const dy = v - d.cy;
    if (dx * dx + dy * dy <= 0.018 * 0.018 * 30) {
      if (inRock) {
        r = 226;
        g = 232;
        b = 240;
      }
    }
  }

  return [r, g, b, 255];
}

for (const size of [192, 512]) {
  writeFileSync(resolve(PUBLIC, `icon-${size}.png`), encodePNG(size, scene));
}
writeFileSync(resolve(PUBLIC, 'apple-touch-icon.png'), encodePNG(180, scene));
console.log('Wrote icon-192.png, icon-512.png, apple-touch-icon.png');
