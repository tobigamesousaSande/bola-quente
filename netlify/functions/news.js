const FEEDS = [
  ["BBC Sport", "https://feeds.bbci.co.uk/sport/football/rss.xml"],
  ["Sky Sports", "https://www.skysports.com/rss/12040"],
];
const tag = (s, t) => { const m = s.match(new RegExp("<" + t + "[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</" + t + ">")); return m ? m[1].trim() : ""; };
exports.handler = async () => {
  const all = [];
  await Promise.all(FEEDS.map(async ([src, url]) => {
    try {
      const x = await (await fetch(url)).text();
      x.split("<item>").slice(1, 25).forEach((it) => all.push({ src, title: tag(it, "title"), link: tag(it, "link"), date: tag(it, "pubDate") }));
    } catch (e) {}
  }));
  all.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300, s-maxage=900" }, body: JSON.stringify(all.slice(0, 60)) };
};
