/**
 * Generates the PWA icon set into apps/client/public.
 *
 * The icons are drawn here rather than checked in as binaries so the brand
 * colours stay in one place and anyone can regenerate them after a rebrand:
 *
 *   node scripts/generate-pwa-icons.mjs
 *
 * It writes plain 8-bit RGBA PNGs with a tiny hand-rolled encoder, which keeps
 * the repo free of an image-processing dependency for four static files.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BRAND = [0xa3, 0x4f, 0x32]; // --color-primary
const ACCENT = [0xff, 0x5a, 0x00]; // logo orange
const CREAM = [0xff, 0xfd, 0xf8]; // --color-surface

/* ---------------------------------------------------------------- encoding */

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function encodePng(width, height, rgba) {
  // One filter byte (0 = None) in front of every scanline, then zlib.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ----------------------------------------------------------------- drawing */

/** Signed distance to a rounded rectangle, negative inside. */
function sdRoundedRect(px, py, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(px - cx) - (halfW - radius);
  const qy = Math.abs(py - cy) - (halfH - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - radius;
}

/** Signed distance to an annulus (ring) of the given radius and thickness. */
function sdRing(px, py, cx, cy, radius, thickness) {
  return Math.abs(Math.hypot(px - cx, py - cy) - radius) - thickness / 2;
}

/**
 * Draws the mark: a cream shopping bag on the brand square, with an orange
 * handle. `inset` is the fraction of the canvas kept clear around the glyph —
 * maskable icons need a generous safe zone because launchers crop to a circle.
 */
function drawIcon(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  const inset = maskable ? 0.26 : 0.16;
  const corner = maskable ? size / 2 : size * 0.22; // full bleed circle-safe vs. squircle

  const glyph = size * (1 - inset * 2);
  const gx = size / 2;
  // Bag body sits slightly low to leave room for the handle.
  const bodyH = glyph * 0.62;
  const bodyW = glyph * 0.78;
  const bodyCy = size / 2 + glyph * 0.14;
  const handleR = bodyW * 0.3;
  const handleCy = bodyCy - bodyH / 2;
  const handleT = glyph * 0.1;

  // Anti-aliasing: sample the distance fields at 3x3 sub-pixels.
  const SS = 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let body = 0;
      let handle = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (sdRoundedRect(px, py, size / 2, size / 2, size / 2, size / 2, corner) < 0) bg++;
          if (sdRoundedRect(px, py, gx, bodyCy, bodyW / 2, bodyH / 2, glyph * 0.12) < 0) body++;
          // Only the top half of the ring, so it reads as a handle not an O.
          if (py < handleCy + handleT / 2 && sdRing(px, py, gx, handleCy, handleR, handleT) < 0) {
            handle++;
          }
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      const alpha = bg / n;
      if (alpha === 0) continue;

      let [r, g, b] = BRAND;
      const bodyA = body / n;
      const handleA = handle / n;
      if (bodyA > 0) {
        r = r + (CREAM[0] - r) * bodyA;
        g = g + (CREAM[1] - g) * bodyA;
        b = b + (CREAM[2] - b) * bodyA;
      }
      if (handleA > 0) {
        r = r + (ACCENT[0] - r) * handleA;
        g = g + (ACCENT[1] - g) * handleA;
        b = b + (ACCENT[2] - b) * handleA;
      }
      rgba[i] = Math.round(r);
      rgba[i + 1] = Math.round(g);
      rgba[i + 2] = Math.round(b);
      rgba[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, size, rgba);
}

/* ------------------------------------------------------------------- write */

mkdirSync(PUBLIC_DIR, { recursive: true });

const targets = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: false }],
];

for (const [name, size, options] of targets) {
  const png = drawIcon(size, options);
  writeFileSync(join(PUBLIC_DIR, name), png);
  console.log(`wrote public/${name} (${size}x${size}, ${png.length} bytes)`);
}
