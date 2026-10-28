const L = { PPL: "Liga Portugal", PL: "Premier League", PD: "La Liga", SA: "Serie A", BL1: "Bundesliga", FL1: "Ligue 1" };
const H = { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY || "" };
exports.handler = async () => {
  const out = {};
  await Promise.all(Object.keys(L).map(async (c) => {
    try {
      const r = await fetch("https://api.football-data.org/v4/competitions/" + c + "/standings", { headers: H });
      if (!r.ok) return;
      const s = await r.json();
      const t = (s.standings.find((x) => x.type === "TOTAL") || s.standings[0]).table;
      out[c] = { name: L[c], table: t.map((x) => ({ p: x.position, t: x.team.shortName || x.team.name, c: x.team.crest, j: x.playedGames, v: x.won, e: x.draw, d: x.lost, dg: x.goalDifference, pts: x.points })) };
    } catch (e) {}
  }));
  return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=120, s-maxage=300" }, body: JSON.stringify(out) };
};
