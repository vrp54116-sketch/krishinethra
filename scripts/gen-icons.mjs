// Generates simple KrishiNethra PWA icons: green leaf circle on black.
// Pure Node (no deps): raw RGBA + zlib + CRC32 -> valid PNG.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

function crc32(buf) {
  let table = crc32._t;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    crc32._t = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Emerald palette
const GREEN = [34, 197, 94];
const GREEN_DARK = [5, 46, 22];
const LEAF = [220, 252, 231];

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // base: pure black
      buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 255;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.hypot(dx, dy);
      // soft anti-aliased green disc
      const alpha = 1 - smoothstep(R - 1.5, R + 1.5, dist);
      if (alpha > 0) {
        // subtle radial glow: brighter center
        const glow = 1 - Math.min(1, dist / R) * 0.25;
        const r = Math.round(GREEN[0] * glow);
        const g = Math.round(Math.min(255, GREEN[1] * (1 + (1 - Math.min(1, dist / R)) * 0.12)));
        const b = Math.round(GREEN[2] * glow);
        buf[i] = Math.round(buf[i] * (1 - alpha) + r * alpha);
        buf[i + 1] = Math.round(buf[i + 1] * (1 - alpha) + g * alpha);
        buf[i + 2] = Math.round(buf[i + 2] * (1 - alpha) + b * alpha);
      }
      if (dist < R - 1) {
        // leaf body: rotated ellipse (45deg) in pale green, centered slightly up
        const ang = Math.PI / 4;
        const lx = x + 0.5 - cx;
        const ly = y + 0.5 - (cy - R * 0.05);
        const rx = lx * Math.cos(ang) + ly * Math.sin(ang);
        const ry = -lx * Math.sin(ang) + ly * Math.cos(ang);
        const ex = rx / (R * 0.52);
        const ey = ry / (R * 0.30);
        const inLeaf = ex * ex + ey * ey < 1;
        // stem: short diagonal line from leaf base
        const stemDist = Math.abs((lx + ly * 0.35 + R * 0.28) / Math.hypot(1, 0.35));
        const alongStem = -lx * 0.32 + ly;
        const inStem = stemDist < R * 0.045 && alongStem > -R * 0.1 && alongStem < R * 0.55;
        // vein: center line of the leaf
        const vein = Math.abs(ry) < R * 0.028 && Math.abs(rx) < R * 0.5;
        if (inLeaf) {
          const edge = smoothstep(1, 0.92, ex * ex + ey * ey);
          const lr = vein ? GREEN_DARK[0] : LEAF[0];
          const lg = vein ? GREEN_DARK[1] : LEAF[1];
          const lb = vein ? GREEN_DARK[2] : LEAF[2];
          buf[i] = Math.round(buf[i] * (1 - edge) + lr * edge);
          buf[i + 1] = Math.round(buf[i + 1] * (1 - edge) + lg * edge);
          buf[i + 2] = Math.round(buf[i + 2] * (1 - edge) + lb * edge);
        } else if (inStem) {
          buf[i] = LEAF[0]; buf[i + 1] = LEAF[1]; buf[i + 2] = LEAF[2];
        }
      }
    }
  }
  return buf;
}

for (const size of [192, 512]) {
  const png = encodePNG(size, size, drawIcon(size));
  const out = join(pub, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}
// apple-touch-icon (180x180, no transparency issues — same black bg)
{
  const png = encodePNG(180, 180, drawIcon(180));
  const out = join(pub, "apple-touch-icon.png");
  writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}
