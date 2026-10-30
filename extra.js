(function () {
  var st = document.createElement("style");
  st.textContent = ".fm b{display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:5px;font-size:10px;margin-right:2px;color:#04210f}.fm .fV{background:#39ff88}.fm .fE{background:#8aa196}.fm .fD{background:#ff5a4d;color:#fff}.rc{background:linear-gradient(135deg,rgba(57,255,136,.12),#101713);border:1px solid rgba(57,255,136,.3);border-radius:18px;padding:14px;margin:14px 0}.rc h3{margin:0 0 8px;font-size:15px}.rc .rw{display:flex;justify-content:space-between;font-size:14px;padding:4px 0}.rc .rw b{color:#39ff88}.rc small{display:block;color:#8aa196;font-size:11.5px;line-height:1.45;margin-top:8px}";
  document.head.appendChild(st);
  function fm(s) { return String(s || "").split("").map(function (c) { return '<b class="f' + c + '">' + c + "</b>"; }).join(""); }
  function pc(o) { return o && o.n ? Math.round(100 * o.h / o.n) + "% (" + o.h + "/" + o.n + ")" : "—"; }
  function recHtml() {
    var r = null, i;
    for (i = 0; i < M.length; i++) if (M[i].rec) { r = M[i].rec; break; }
    if (!r || !r.n) return '<div class="rc"><h3>📈 Registo de acertos</h3><small>Ainda sem jogos suficientes para avaliar.</small></div>';
    var rows = ["Resultado", "Golos", "Ambas marcam"].map(function (k) { return '<div class="rw"><span>' + k + "</span><b>" + pc(r.cats[k]) + "</b></div>"; }).join("");
    return '<div class="rc"><h3>📈 Registo de acertos · últimos ' + r.days + " dias</h3>" + rows + '<div class="rw"><span>Dicas com 70%+ de confiança</span><b>' + pc(r.hi) + "</b></div><small>" + r.n + " jogos avaliados. Cada jogo foi recalculado só com os dados anteriores a ele. Um modelo simples falha muitas vezes: não são garantias.</small></div>';
  }
  window.card = function (m, withTip) {
    var live = isLive(m), fin = m.status === "FINISHED", mid;
    if (fin) mid = '<div class="sc">' + m.hs + " – " + m.as + "<small>Fim</small></div>";
    else if (live) mid = '<div class="sc lv">' + m.hs + " – " + m.as + '<small class="lv">AO VIVO</small></div>';
    else mid = '<div class="sc t">' + hr(m.utc) + "</div>";
    var p = m.prob, extra = "";
    if (withTip && p && !live) {
      extra = '<div class="bar"><i class="b1" style="width:' + p[0] + '%"></i><i class="bx" style="width:' + p[1] + '%"></i><i class="b2" style="width:' + p[2] + '%"></i></div><div class="pl"><span>1 · ' + Math.round(p[0]) + "%</span><span>X · " + Math.round(p[1]) + "%</span><span>2 · " + Math.round(p[2]) + "%</span></div>";
      if (m.xg) extra += '<div class="xg">Golos esperados: ' + m.xg[0].toFixed(1) + " – " + m.xg[1].toFixed(1) + "</div>";
      if (m.fh || m.fa) extra += '<div class="xg fm">' + esc(m.home) + " " + fm(m.fh) + " · " + esc(m.away) + " " + fm(m.fa) + "</div>";
      if (m.h2h) extra += '<div class="xg">Último confronto: ' + esc(m.h2h) + "</div>";
      if (m.tips) extra += '<div class="tps">' + m.tips.map(function (t) { return '<div class="tp" style="--p:' + t.p + '%"><b>' + esc(t.k) + "</b><span>" + esc(t.t) + '</span><span class="pc">' + t.p + "%</span></div>"; }).join("") + "</div>";
    }
    return '<div class="m' + (live ? " hot" : "") + (isFav(m) ? " fv" : "") + '"><div class="lg">' + (isFav(m) ? "⭐ " : "") + esc(m.l) + '</div><div class="g">' + team(m.home) + mid + team(m.away) + "</div>" + extra + '<div class="act"><button class="sh" data-i="' + m.id + '">↗ Partilhar</button></div></div>';
  };
  window.renderD = function () {
    var base = M.filter(function (m) { return m.status !== "FINISHED" && !isLive(m); }), c = cur(base, fD);
    $("chipsD").innerHTML = chipsHtml(base, c);
    var up = flt(base, c).sort(function (a, b) { return a.utc < b.utc ? -1 : 1; });
    $("dicL").innerHTML = recHtml() + (up.length ? group(up, function (m) { return card(m, true); }) : '<div class="em">Sem jogos por começar.</div>');
  };
  if (M && M.length) renderD();
})();
