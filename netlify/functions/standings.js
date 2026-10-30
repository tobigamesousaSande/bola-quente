const L = { PPL: "Liga Portugal", PL: "Premier League", PD: "La Liga", SA: "Serie A", BL1: "Bundesliga", FL1: "Ligue 1" };
const H = { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY || "" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (c, n = 0) => {
  const r = await fetch("https://api.football-data.org/v4/competitions/" + c + "/standings", { headers: H });
  if (r.status === 429 && n < 2) { await sleep(7000); return get(c, n + 1); }
  if (!r.ok) throw new Error(r.status);
  return r.json();
};
exports.handler = async () => {
  const out = {};
  await Promise.all(Object.keys(L).map(async (c) => {
    try {
      const s = await get(c);
      const t = (s.standings.find((x) => x.type === "TOTAL") || s.standings[0]).table;
      out[c] = { name: L[c], table: t.map((x) => ({ p: x.position, t: x.team.shortName || x.team.name, c: x.team.crest, j: x.playedGames, v: x.won, e: x.draw, d: x.lost, dg: x.goalDifference, pts: x.points })) };
    } catch (e) {}
  }));
  const ok = Object.keys(out).length > 0;
  return { statusCode: ok ? 200 : 503, headers: { "Content-Type": "application/json", "Cache-Control": ok ? "public, max-age=120, s-maxage=600, stale-while-revalidate=86400" : "no-store" }, body: JSON.stringify(out) };
};
