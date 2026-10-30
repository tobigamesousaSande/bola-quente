const { run } = require("../lib/model");
module.exports = async (req, res) => {
  try {
    const d = await run();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=3600");
    res.end(JSON.stringify(d));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: String(e) }));
  }
};
