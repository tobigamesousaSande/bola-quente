const C = ["PPL", "PL", "PD", "SA", "BL1", "FL1", "CL"];
const B = "https://api.football-data.org/v4";
const H = { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY || "" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const j = async (u, n = 0) => {
  const r = await fetch(B + u, { headers: H });
  if (r.status === 429 && n < 2) { await sleep(7000); return j(u, n + 1); }
  if (!r.ok) throw new Error(r.status);
  return r.json();
};
const day = (o) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const FA = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
const po = (l, k) => Math.exp(-l) * Math.pow(l, k) / FA[k];
const cl = (x, a, b) => Math.min(b, Math.max(a, x));
const ok = (c, h, a) => ({ "1": h > a, "2": a > h, "1X": h >= a, "X2": a >= h, "o1.5": h + a > 1, "o2.5": h + a > 2, "o3.5": h + a > 3, "u2.5": h + a < 3, "u3.5": h + a < 4, y: h > 0 && a > 0, n: !(h > 0 && a > 0) })[c];
const add = (S, m) => {
  const a = S.t[m.h] || (S.t[m.h] = { gf: 0, ga: 0, n: 0, l: [] });
  const b = S.t[m.a] || (S.t[m.a] = { gf: 0, ga: 0, n: 0, l: [] });
  a.gf += m.hs; a.ga += m.as; a.n++; a.l.push([m.hs, m.as]);
  b.gf += m.as; b.ga += m.hs; b.n++; b.l.push([m.as, m.hs]);
  S.hg += m.hs; S.ag += m.as; S.n++;
};
const predict = (S, h, a, hn, an) => {
  const A = S.t[h], D = S.t[a];
  if (!A || !D || A.n < 3 || D.n < 3 || S.n < 10) return null;
  const aH = S.hg / S.n, aA = S.ag / S.n, g = (aH + aA) / 2, K = 4;
  const att = (t) => (t.gf + K * g) / (t.n + K) / g, def = (t) => (t.ga + K * g) / (t.n + K) / g;
  const fo = (t, i) => {
    const l = t.l.slice(-5); if (l.length < 3) return 1;
    const x = l.reduce((s, v) => s + v[i], 0) / l.length, base = (i ? t.ga : t.gf) / t.n;
    return cl(1 + 0.25 * ((x + 0.3) / (base + 0.3) - 1), 0.85, 1.15);
  };
  const lh = cl(aH * att(A) * fo(A, 0) * def(D) * fo(D, 1), 0.3, 3.5);
  const la = cl(aA * att(D) * fo(D, 0) * def(A) * fo(A, 1), 0.3, 3.5);
  let p1 = 0, px = 0, p2 = 0, o15 = 0, o25 = 0, o35 = 0, bt = 0, tot = 0;
  for (let i = 0; i <= 8; i++) for (let k = 0; k <= 8; k++) {
    const p = po(lh, i) * po(la, k); tot += p;
    if (i > k) p1 += p; else if (i === k) px += p; else p2 += p;
    if (i + k > 1) o15 += p; if (i + k > 2) o25 += p; if (i + k > 3) o35 += p;
    if (i > 0 && k > 0) bt += p;
  }
  p1 /= tot; px /= tot; p2 /= tot; o15 /= tot; o25 /= tot; o35 /= tot; bt /= tot;
  const w = Math.max(p1, p2), r = (x) => Math.round(x * 100);
  let res;
  if (w >= 0.5) res = p1 >= p2 ? ["1", "Vitória do " + hn, p1] : ["2", "Vitória do " + an, p2];
  else res = p1 >= p2 ? ["1X", "Dupla hipótese 1X (" + hn + " ou empate)", p1 + px] : ["X2", "Dupla hipótese X2 (empate ou " + an + ")", p2 + px];
  const G = [["o1.5", "Mais de 1.5 golos", o15], ["o2.5", "Mais de 2.5 golos", o25], ["o3.5", "Mais de 3.5 golos", o35], ["u2.5", "Menos de 2.5 golos", 1 - o25], ["u3.5", "Menos de 3.5 golos", 1 - o35]];
  const gl = G.filter((x) => x[2] >= 0.58 && x[2] <= 0.82).sort((x, y) => y[2] - x[2])[0] || G.slice().sort((x, y) => y[2] - x[2])[0];
  const bb = bt >= 0.5 ? ["y", "Sim", bt] : ["n", "Não", 1 - bt];
  return {
    prob: [p1 * 100, px * 100, p2 * 100], xg: [lh, la],
    tips: [{ k: "Resultado", c: res[0], t: res[1], p: r(res[2]) }, { k: "Golos", c: gl[0], t: gl[1], p: r(gl[2]) }, { k: "Ambas marcam", c: bb[0], t: bb[1], p: r(bb[2]) }],
  };
};
const form = (t) => (t ? t.l.slice(-5).map((v) => (v[0] > v[1] ? "V" : v[0] < v[1] ? "D" : "E")).join("") : "");
const p2 = (n) => String(n).padStart(2, "0");
exports.run = async () => {
  const win = await j(`/matches?competitions=${C.join(",")}&dateFrom=${day(-1)}&dateTo=${day(2)}`);
  const since = Date.now() - 14 * 864e5;
  const rec = { days: 14, n: 0, cats: { Resultado: { n: 0, h: 0 }, Golos: { n: 0, h: 0 }, "Ambas marcam": { n: 0, h: 0 } }, hi: { n: 0, h: 0 } };
  const ST = {}, FIN = {};
  await Promise.all(C.map(async (c) => {
    try {
      const d = await j(`/competitions/${c}/matches?status=FINISHED`);
      const F = d.matches.filter((x) => x.score.fullTime.home != null).map((x) => ({ utc: x.utcDate, h: x.homeTeam.id, a: x.awayTeam.id, hn: x.homeTeam.shortName || x.homeTeam.name, an: x.awayTeam.shortName || x.awayTeam.name, hs: x.score.fullTime.home, as: x.score.fullTime.away })).sort((a, b) => (a.utc < b.utc ? -1 : 1));
      const S = { t: {}, hg: 0, ag: 0, n: 0 };
      F.forEach((m) => {
        if (Date.parse(m.utc) >= since) {
          const p = predict(S, m.h, m.a, m.hn, m.an);
          if (p) {
            rec.n++;
            p.tips.forEach((t) => { const hit = ok(t.c, m.hs, m.as); rec.cats[t.k].n++; if (hit) rec.cats[t.k].h++; if (t.p >= 70) { rec.hi.n++; if (hit) rec.hi.h++; } });
          }
        }
        add(S, m);
      });
      ST[c] = S; FIN[c] = F;
    } catch (e) {}
  }));
  const out = win.matches.map((x) => {
    const c = x.competition.code, S = ST[c], h = x.homeTeam.id, a = x.awayTeam.id;
    const hn = x.homeTeam.shortName || x.homeTeam.name, an = x.awayTeam.shortName || x.awayTeam.name;
    const md = (S && predict(S, h, a, hn, an)) || {};
    const F = FIN[c] || []; let h2h = "";
    for (let i = F.length - 1; i >= 0; i--) {
      const m = F[i];
      if ((m.h === h && m.a === a) || (m.h === a && m.a === h)) { const d = new Date(m.utc); h2h = `${m.hn} ${m.hs}–${m.as} ${m.an} (${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)})`; break; }
    }
    return { id: x.id, comp: x.competition.name, utc: x.utcDate, status: x.status, home: hn, away: an, hs: x.score.fullTime.home, as: x.score.fullTime.away, prob: md.prob || null, xg: md.xg || null, tips: md.tips || null, fh: form(S && S.t[h]), fa: form(S && S.t[a]), h2h };
  });
  if (out.length) out[0].rec = rec;
  return out;
};
