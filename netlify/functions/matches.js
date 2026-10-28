const C = ["PPL", "PL", "PD", "SA", "BL1", "FL1", "CL"];
const B = "https://api.football-data.org/v4";
const H = { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY || "" };
const j = async (u) => { const r = await fetch(B + u, { headers: H }); if (!r.ok) throw new Error(r.status); return r.json(); };
const day = (o) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const FA = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
const po = (l, k) => Math.exp(-l) * Math.pow(l, k) / FA[k];
const model = (h, a, avg, hn, an) => {
  if (!h || !a || !avg) return null;
  const rate = (x, g) => (x + avg * 3) / (g + 3);
  const hf = rate(h.gf, h.g), ha = rate(h.ga, h.g), af = rate(a.gf, a.g), aa = rate(a.ga, a.g);
  let lh = hf * aa / avg * 1.1, la = af * ha / avg * 0.92;
  lh = Math.min(3.5, Math.max(0.3, lh)); la = Math.min(3.5, Math.max(0.3, la));
  let p1 = 0, px = 0, p2 = 0, o15 = 0, o25 = 0, o35 = 0, bt = 0, tot = 0;
  for (let i = 0; i <= 8; i++) for (let k = 0; k <= 8; k++) {
    const p = po(lh, i) * po(la, k); tot += p;
    if (i > k) p1 += p; else if (i === k) px += p; else p2 += p;
    if (i + k > 1) o15 += p; if (i + k > 2) o25 += p; if (i + k > 3) o35 += p;
    if (i > 0 && k > 0) bt += p;
  }
  p1 /= tot; px /= tot; p2 /= tot; o15 /= tot; o25 /= tot; o35 /= tot; bt /= tot;
  const w = Math.max(p1, p2);
  let res;
  if (w >= 0.5) res = p1 >= p2 ? ["Vitória do " + hn, p1] : ["Vitória do " + an, p2];
  else res = p1 >= p2 ? ["Dupla hipótese 1X (" + hn + " ou empate)", p1 + px] : ["Dupla hipótese X2 (empate ou " + an + ")", p2 + px];
  const G = [["Mais de 1.5 golos", o15], ["Mais de 2.5 golos", o25], ["Mais de 3.5 golos", o35], ["Menos de 2.5 golos", 1 - o25], ["Menos de 3.5 golos", 1 - o35]];
  let gl = G.filter((x) => x[1] >= 0.58 && x[1] <= 0.82).sort((x, y) => y[1] - x[1])[0];
  if (!gl) gl = G.slice().sort((x, y) => y[1] - x[1])[0];
  const bb = bt >= 0.5 ? ["Sim", bt] : ["Não", 1 - bt];
  const r = (x) => Math.round(x * 100);
  return {
    prob: [p1 * 100, px * 100, p2 * 100],
    xg: [lh, la],
    tips: [{ k: "Resultado", t: res[0], p: r(res[1]) }, { k: "Golos", t: gl[0], p: r(gl[1]) }, { k: "Ambas marcam", t: bb[0], p: r(bb[1]) }],
  };
};
exports.handler = async () => {
  try {
    const m = await j(`/matches?competitions=${C.join(",")}&dateFrom=${day(-1)}&dateTo=${day(2)}`);
    const st = {}, avg = {};
    const codes = [...new Set(m.matches.map((x) => x.competition.code))];
    await Promise.all(codes.map(async (c) => {
      try {
        const s = await j(`/competitions/${c}/standings`);
        const t = (s.standings.find((x) => x.type === "TOTAL") || s.standings[0]).table;
        let gf = 0, g = 0;
        t.forEach((r) => { st[r.team.id] = { gf: r.goalsFor, ga: r.goalsAgainst, g: Math.max(r.playedGames, 1) }; gf += r.goalsFor; g += r.playedGames; });
        avg[c] = g ? gf / g : 1.3;
      } catch (e) {}
    }));
    const out = m.matches.map((x) => {
      const hn = x.homeTeam.shortName || x.homeTeam.name, an = x.awayTeam.shortName || x.awayTeam.name;
      const md = model(st[x.homeTeam.id], st[x.awayTeam.id], avg[x.competition.code], hn, an) || {};
      return { id: x.id, comp: x.competition.name, utc: x.utcDate, status: x.status, home: hn, away: an, hs: x.score.fullTime.home, as: x.score.fullTime.away, prob: md.prob || null, xg: md.xg || null, tips: md.tips || null };
    });
    return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60, s-maxage=120" }, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
