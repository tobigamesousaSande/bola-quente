const zlib = require("zlib");
const T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
const crc = (b) => { let x = 0xffffffff; for (const v of b) x = T[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mx = (a, b, t) => a + (b - a) * t;
exports.handler = async (ev) => {
  const s = Math.min(512, Math.max(48, parseInt((ev.queryStringParameters || {}).s) || 192));
  const raw = Buffer.alloc((s * 3 + 1) * s);
  const bg = [7, 11, 9], g = [57, 255, 136];
  for (let y = 0; y < s; y++) {
    raw[y * (s * 3 + 1)] = 0;
    for (let x = 0; x < s; x++) {
      const dx = x + 0.5 - s / 2, dy = y + 0.5 - s / 2, d = Math.sqrt(dx * dx + dy * dy) / s;
      const glow = 0.35 * (1 - ss(0.3, 0.46, d)), disc = 1 - ss(0.295, 0.305, d), inner = 1 - ss(0.135, 0.145, d);
      for (let i = 0; i < 3; i++) {
        let c = mx(bg[i], g[i], glow); c = mx(c, g[i], disc); c = mx(c, bg[i], inner);
        raw[y * (s * 3 + 1) + 1 + x * 3 + i] = Math.round(c);
      }
    }
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(s, 0); ih.writeUInt32BE(s, 4); ih[8] = 8; ih[9] = 2;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
  return { statusCode: 200, headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" }, isBase64Encoded: true, body: png.toString("base64") };
};
