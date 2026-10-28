const C = ["PPL", "PL", "PD", "SA", "BL1", "FL1", "CL"];
const B = "https://api.football-data.org/v4";
const H = { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY || "" };
const j = async (u) => { const r = await fetch(B + u, { headers: H }); if (!r.ok) throw new Error(r.status); return r.json(); };
const day = (o) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const prob = (h, a) => {
  if (!h || !a) return null;
  const d = (h.ppg - a.ppg) + 0.35 + 0.15 * (h.gd - a.gd);
  const pd = Math.max(0.16, 0.28 - 0.05 * Math.abs(d));
  const ph = (1 - pd) / (1 + Math.exp(-1.3 * d));
  return [ph * 100, pd * 100, (1 - pd - ph) * 100];
};
exports.handler = async () => {
  try {
    const m = await j(`/matches?competitions=${C.join(",")}&dateFrom=${day(-1)}&dateTo=${day(2)}`);
    const st = {};
    const codes = [...new Set(m.matches.map((x) => x.competition.code))];
    await Promise.all(codes.map(async (c) => {
      try {
        const s = await j(`/competitions/${c}/standings`);
        const t = (s.standings.find((x) => x.type === "TOTAL") || s.standings[0]).table;
        t.forEach((r) => { const g = Math.max(r.playedGames, 1); st[r.team.id] = { ppg: r.points / g, gd: r.goalDifference / g }; });
      } catch (e) {}
    }));
    const out = m.matches.map((x) => ({
      id: x.id, comp: x.competition.name, utc: x.utcDate, status: x.status,
      home: x.homeTeam.shortName || x.homeTeam.name, away: x.awayTeam.shortName || x.awayTeam.name,
      hs: x.score.fullTime.home, as: x.score.fullTime.away,
      prob: prob(st[x.homeTeam.id], st[x.awayTeam.id]),
    }));
    return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60, s-maxage=120" }, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
