// Writes yellow "S" on black PNGs into public/. Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const S = ['01110', '10001', '10000', '01110', '00001', '10001', '01110']; // 5x7 block S
const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };

function png(size) {
  const cell = Math.floor(size / 10), w = 5 * cell, h = 7 * cell, ox = (size - w) >> 1, oy = (size - h) >> 1;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const gx = Math.floor((x - ox) / cell), gy = Math.floor((y - oy) / cell);
    const on = x >= ox && y >= oy && gx < 5 && gy < 7 && S[gy][gx] === '1';
    const i = y * (size * 3 + 1) + 1 + x * 3;
    raw[i] = on ? 0xe4 : 0x0a; raw[i + 1] = on ? 0xff : 0x0a; raw[i + 2] = on ? 0x1a : 0x0a;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) writeFileSync(new URL(`../public/${name}`, import.meta.url), png(size));
