const G = (q) => "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=pt-PT&gl=PT&ceid=PT:pt-150";
const FEEDS = [G("futebol transferências when:30d"), G("futebol Liga Portugal when:2d"), G("futebol polémica árbitro when:7d"), G("futebol Benfica Sporting FC Porto when:2d")];
const tag = (s, t) => { const m = s.match(new RegExp("<" + t + "[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</" + t + ">")); return m ? m[1].trim() : ""; };
const dec = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
exports.handler = async () => {
  const all = [], seen = {};
  await Promise.all(FEEDS.map(async (url) => {
    try {
      const x = await (await fetch(url)).text();
      x.split("<item>").slice(1, 20).forEach((it) => {
        const src = dec(tag(it, "source"));
        let title = dec(tag(it, "title"));
        if (src && title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3));
        if (!title || seen[title]) return;
        seen[title] = 1;
        all.push({ src: src || "Notícias", title, link: tag(it, "link"), date: tag(it, "pubDate") });
      });
    } catch (e) {}
  }));
  all.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300, s-maxage=900" }, body: JSON.stringify(all.slice(0, 80)) };
};
