(() => {
  'use strict';
  const CFG = window.PC_CONFIG || {};
  const UI = window.PC_UI;
  const ORIGIN = { lon: 17.516653, lat: 40.64592 };
  const SEASON_END = '2027-05-30';
  const LEAGUES = ['Serie A', 'Serie C', 'Serie D'];
  const PILL = { 'Serie A': 'lg-a', 'Serie C': 'lg-c', 'Serie D': 'lg-d' };
  const FILL = { 'Serie A': '#2a5bb8', 'Serie C': '#e8b021', 'Serie D': '#c8623a' };
  const KM_MAX = 230, MIN_MAX = 170;
  const PAGES = ['matches', 'map', 'grounds', 'about'];
  const STORE = 'puglia-calcio-web-v1';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ---------- state ----------
  const pad = (n) => String(n).padStart(2, '0');
  const todayIso = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const defaults = () => ({ distBy: 'km', maxKm: KM_MAX, maxMin: MIN_MAX, from: todayIso(), to: SEASON_END, leagues: LEAGUES.slice(), team: '' });
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { saved = {}; }
  const pickLang = () => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && UI[q]) return q;
    if (saved.lang && UI[saved.lang]) return saved.lang;
    const nav = (navigator.languages || [navigator.language || 'en']).map((l) => String(l).slice(0, 2).toLowerCase());
    return nav.find((l) => UI[l]) || 'en';
  };
  const S = Object.assign(defaults(), {
    distBy: saved.distBy === 'min' ? 'min' : 'km',
    maxKm: Number(saved.maxKm) || KM_MAX,
    maxMin: Number(saved.maxMin) || MIN_MAX,
    leagues: Array.isArray(saved.leagues) ? saved.leagues.filter((l) => LEAGUES.includes(l)) : LEAGUES.slice(),
  });
  let lang = pickLang();
  let page = PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'matches';
  let search = '', sortKey = 'date', sortDir = 1, vSort = 'km', mapSel = '';
  const persist = () => {
    try { localStorage.setItem(STORE, JSON.stringify({ lang, distBy: S.distBy, maxKm: S.maxKm, maxMin: S.maxMin, leagues: S.leagues })); } catch (e) { /* storage unavailable */ }
  };

  // ---------- data ----------
  const D = { matches: null, venues: null, regions: null, site: null, remote: false, fallback: false };
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const getJson = (url) => withTimeout(fetch(url, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }), CFG.timeoutMs || 8000);
  const bust = () => 'v=' + Math.floor(Date.now() / 600000); // new URL every 10 minutes
  async function loadOne(name) {
    if (CFG.remoteData) {
      try { const d = await getJson(CFG.remoteData + name + '?' + bust()); D.remote = true; return d; } catch (e) { D.fallback = true; }
    }
    return getJson((CFG.localData || 'data/') + name + '?' + bust());
  }

  // ---------- text helpers ----------
  const t = (k) => (UI[lang][k] != null ? UI[lang][k] : UI.sv[k]);
  const fill = (s, map) => String(s).replace(/\{(\w+)\}/g, (m, k) => (map[k] != null ? map[k] : m));
  const tr = (sv) => {
    if (!sv || lang === 'sv') return sv || '';
    const e = D.site && D.site.texts && D.site.texts[sv];
    return (e && e[lang]) || sv;
  };
  const loc = () => t('locale');
  const nf = () => new Intl.NumberFormat(loc(), { maximumFractionDigits: 0 });
  const toDate = (iso) => new Date(iso + 'T12:00:00');
  const fmtDay = (iso) => toDate(iso).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' });
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDayYear = (iso) => toDate(iso).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const fmtLong = (iso) => toDate(iso).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMin = (m) => { m = Math.round(Number(m)); const h = Math.floor(m / 60); return h ? h + ' h ' + pad(m % 60) + ' min' : m + ' min'; };
  const fmtCap = (c) => (c == null || c === '' ? '–' : nf().format(Number(c)));
  const plural = (n, pair) => fill(pair[n === 1 ? 0 : 1], { n: nf().format(n) });
  const stClass = (s) => (s === 'Bekräftad' ? 'ok' : s === 'Preliminär' ? 'pre' : 'date');
  const capClass = (s) => (s === 'Säker' ? 's-ok' : s === 'Osäker' ? 's-pre' : 's-date');
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const link = (name, url) => {
    if (!url) return el('span', '', name);
    const a = el('a', '', name); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
  };
  const rich = (tpl, parts) => {
    const frag = document.createDocumentFragment();
    String(tpl).split(/(\{\w+\})/).forEach((p) => {
      const m = p.match(/^\{(\w+)\}$/);
      if (m && parts[m[1]] != null) frag.append(parts[m[1]]); else if (p) frag.append(p);
    });
    return frag;
  };

  // ---------- filtering ----------
  const venueMap = () => new Map((D.venues || []).map((v) => [v.team, v]));
  const capOf = (r, vm) => { const v = vm.get(r.home); return v && v.capacity != null ? Number(v.capacity) : null; };
  const byTime = (a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99'));
  const filtered = () => {
    if (!D.matches) return [];
    const lg = new Set(S.leagues);
    const lim = S.distBy === 'min' ? S.maxMin : S.maxKm;
    return D.matches.filter((r) => Number(S.distBy === 'min' ? r.min : r.km) <= lim && r.date >= S.from && r.date <= S.to && lg.has(r.league) && (!S.team || r.home === S.team));
  };
  const searched = (f) => (search ? f.filter((r) => [r.home, r.away, r.city, r.stadium, r.league].join(' ').toLowerCase().includes(search)) : f);

  // ---------- static texts ----------
  function applyTexts() {
    document.documentElement.lang = lang;
    $$('[data-t]').forEach((e) => { e.textContent = t(e.dataset.t); });
    $$('[data-t-aria]').forEach((e) => { e.setAttribute('aria-label', t(e.dataset.tAria)); });
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#search').placeholder = t('search');
    $('#search').setAttribute('aria-label', t('search'));
    const ss = $('#sortSel');
    ss.setAttribute('aria-label', t('sort'));
    ss.replaceChildren();
    [['date', 'cDate'], ['min', 'cMin'], ['km', 'cKm'], ['capacity', 'cCap'], ['league', 'cLeague'], ['home', 'cHome']].forEach(([k, lbl]) => {
      const o = el('option', '', t('sort') + ': ' + t(lbl)); o.value = k; ss.appendChild(o);
    });
    ss.value = sortKey;
    const desc = { sv: 'Hemmamatcher i Serie A–D för lag från Puglia, med avstånd och restid från Ceglie Messapica.', it: 'Partite casalinghe di Serie A–D delle squadre pugliesi, con distanza e tempo di viaggio da Ceglie Messapica.', en: 'Serie A–D home matches of Puglia clubs, with distance and drive time from Ceglie Messapica.' };
    document.querySelector('meta[name=description]').content = desc[lang];
  }

  // ---------- controls ----------
  function syncControls() {
    $('#maxKm').value = S.maxKm; $('#maxMin').value = S.maxMin;
    $('#kmVal').textContent = S.maxKm >= KM_MAX ? t('any') : '≤ ' + nf().format(S.maxKm) + ' km';
    $('#minVal').textContent = S.maxMin >= MIN_MAX ? t('any') : '≤ ' + fmtMin(S.maxMin);
    $$('[data-dist]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dist === S.distBy)));
    $$('[data-distrow]').forEach((r) => { r.hidden = r.dataset.distrow !== S.distBy; });
    if (document.activeElement !== $('#from')) $('#from').value = S.from;
    if (document.activeElement !== $('#to')) $('#to').value = S.to;
    $$('.lg').forEach((c) => { c.checked = S.leagues.includes(c.value); });
    const pk = $('#picked'); pk.hidden = !S.team; pk.textContent = fill(t('onlyTeam'), { team: S.team });
    const dist = S.distBy === 'min' ? $('#minVal').textContent : $('#kmVal').textContent;
    $('#fsum').textContent = [dist, fmtDay(S.from) + '–' + fmtDay(S.to), S.leagues.length === 3 ? 'A·C·D' : S.leagues.map((l) => l.slice(-1)).join('·') || '–', S.team].filter(Boolean).join(' · ');
    $$('[data-vsort]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vsort === vSort)));
  }
  function showPage() {
    $$('.page').forEach((p) => { p.hidden = p.id !== 'page-' + page; });
    $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === page)));
    if (page === 'map') drawMap();
  }
  const goPage = (p) => { page = p; history.replaceState(null, '', '#' + p); showPage(); };
  const changed = () => { persist(); render(); };

  $$('.tab').forEach((b) => b.addEventListener('click', () => goPage(b.dataset.tab)));
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; persist(); applyTexts(); render(); }));
  $('.ftoggle').addEventListener('click', () => {
    const f = $('#filters'); f.classList.toggle('open');
    $('.ftoggle').setAttribute('aria-expanded', String(f.classList.contains('open')));
  });
  $('#maxKm').addEventListener('input', (e) => { S.maxKm = Number(e.target.value); changed(); });
  $('#maxMin').addEventListener('input', (e) => { S.maxMin = Number(e.target.value); changed(); });
  $$('[data-dist]').forEach((b) => b.addEventListener('click', () => { S.distBy = b.dataset.dist; changed(); }));
  $('#from').addEventListener('change', (e) => { if (e.target.value && e.target.validity.valid) { S.from = e.target.value; changed(); } });
  $('#to').addEventListener('change', (e) => { if (e.target.value && e.target.validity.valid) { S.to = e.target.value; changed(); } });
  $('#from').addEventListener('blur', (e) => { e.target.value = S.from; });
  $('#to').addEventListener('blur', (e) => { e.target.value = S.to; });
  $$('.lg').forEach((c) => c.addEventListener('change', () => { S.leagues = $$('.lg').filter((x) => x.checked).map((x) => x.value); changed(); }));
  $('#reset').addEventListener('click', () => { Object.assign(S, defaults()); search = ''; $('#search').value = ''; mapSel = ''; changed(); resetZoom(); });
  $('#picked').addEventListener('click', () => { S.team = ''; changed(); });
  $('#search').addEventListener('input', (e) => { search = e.target.value.trim().toLowerCase(); drawMatches(); });
  $('#sortSel').addEventListener('change', (e) => { sortKey = e.target.value; sortDir = sortKey === 'capacity' ? -1 : 1; drawMatches(); });
  $$('[data-vsort]').forEach((b) => b.addEventListener('click', () => { vSort = b.dataset.vsort; syncControls(); drawVenues(); }));

  // ---------- rendering ----------
  const wide = window.matchMedia('(min-width: 900px)');
  wide.addEventListener ? wide.addEventListener('change', () => drawMatches()) : wide.addListener(() => drawMatches());

  function render() {
    syncControls();
    if (!D.matches) return;
    drawSummary();
    drawMatches();
    drawVenues();
    drawAbout();
    if (page === 'map') drawMap();
  }

  function drawSummary() {
    const f = filtered();
    let near = t('noMatch');
    if (f.length) {
      const k = S.distBy === 'min' ? 'min' : 'km';
      const n = f.reduce((a, b) => (Number(b[k]) < Number(a[k]) ? b : a));
      near = fill(t('near'), { team: n.home, city: n.city, km: nf().format(n.km), min: fmtMin(n.min) });
    }
    $('#take').replaceChildren(rich(t('take'), { n: el('b', '', nf().format(f.length)), near: el('b', '', near) }));
    $('#kCount').textContent = nf().format(f.length);
    $('#kVenues').textContent = nf().format(new Set(f.map((r) => r.home)).size);
    $('#kShort').textContent = f.length ? fmtMin(d3.min(f, (r) => Number(r.min))) : '—';
    if (f.length) { const n = f.slice().sort(byTime)[0]; $('#kNext').textContent = fmtDayYear(n.date) + (n.time ? ' ' + n.time : '') + ' · ' + n.home + '–' + n.away; }
    else $('#kNext').textContent = '—';
    const up = $('#updated'); up.replaceChildren();
    if (D.site && D.site.updated) up.append(el('span', '', fill(t('updated'), { date: fmtLong(D.site.updated.slice(0, 10)) })));
    up.append(el('span', 'caveat', t('caveat')));
    if (D.fallback) up.append(el('span', 'warn', t('fallback')));
  }

  function sorted(f, vm) {
    return f.slice().sort((a, b) => {
      if (sortKey === 'date') return sortDir * byTime(a, b);
      let x;
      if (sortKey === 'capacity') x = (capOf(a, vm) ?? -1) - (capOf(b, vm) ?? -1);
      else if (sortKey === 'km' || sortKey === 'min') x = Number(a[sortKey]) - Number(b[sortKey]);
      else x = String(a[sortKey]).localeCompare(String(b[sortKey]), loc());
      return sortDir * x || byTime(a, b);
    });
  }

  function drawMatches() {
    const box = $('#mlist');
    if (!D.matches) return;
    const vm = venueMap();
    const f = sorted(searched(filtered()), vm);
    $('#empty').hidden = f.length > 0;
    $('#sortSel').value = sortKey;
    box.replaceChildren(wide.matches ? matchTable(f, vm) : matchCards(f, vm));
  }

  function matchCards(f, vm) {
    const list = el('div', 'mlist');
    for (const r of f) {
      const v = vm.get(r.home) || {};
      const c = el('article', 'mc st-' + stClass(r.status));
      const top = el('div', 'mc-top');
      top.append(el('span', 'mc-date', cap1(fmtDay(r.date))), el('span', 'mc-time' + (r.time ? '' : ' unset'), r.time || t('timeUnset')), el('span', 'pill ' + (PILL[r.league] || ''), r.league));
      const teams = el('div', 'mc-teams'); teams.append(el('b', '', r.home), ' – ' + r.away);
      const ar = el('div', 'mc-arena'); ar.append(link(r.stadium, v.info_url), ' · ' + r.city);
      const dist = el('div', 'mc-dist');
      dist.append(el('span', '', nf().format(r.km) + ' km'), el('span', '', fmtMin(r.min)), el('span', '', fmtCap(capOf(r, vm)) + ' ' + t('seats')), el('span', 'status s-' + stClass(r.status), t('status')[r.status] || r.status));
      c.append(top, teams, ar, dist);
      if (r.note) c.append(el('p', 'mc-note', tr(r.note)));
      if (r.source) { const d = el('details'); d.append(el('summary', '', t('source')), el('div', '', tr(r.source))); c.append(d); }
      list.appendChild(c);
    }
    return list;
  }

  function matchTable(f, vm) {
    const wrap = el('div', 'tscroll');
    const tbl = el('table');
    const cols = [['date', 'cDate', 1], ['time', 'cTime'], ['league', 'cLeague', 1], ['home', 'cHome', 1], ['away', 'cAway'], ['stadium', 'cArena', 1], ['capacity', 'cCap', 1, 'num'], ['city', 'cCity'], ['km', 'cKm', 1, 'num'], ['min', 'cMin', 1, 'num'], ['status', 'cStatus', 1], ['note', 'cNote']];
    const hr = el('tr');
    for (const [k, lbl, sortable, cls] of cols) {
      const th = el('th', cls || '');
      if (sortable) {
        const b = el('button', '', t(lbl)); b.type = 'button';
        b.addEventListener('click', () => { if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = k === 'capacity' ? -1 : 1; } drawMatches(); });
        th.appendChild(b);
        if (sortKey === k) th.setAttribute('aria-sort', sortDir > 0 ? 'ascending' : 'descending');
      } else th.textContent = t(lbl);
      hr.appendChild(th);
    }
    const thead = el('thead'); thead.appendChild(hr);
    const tb = el('tbody');
    for (const r of f) {
      const v = vm.get(r.home) || {};
      const row = el('tr', 'st-' + stClass(r.status));
      const td = (x, cls) => { const c = el('td', cls || ''); if (x instanceof Node) c.appendChild(x); else c.textContent = x; row.appendChild(c); return c; };
      td(cap1(fmtDay(r.date)), 'nw');
      td(r.time || t('timeUnset'), r.time ? 'nw' : 'nw mut');
      td(el('span', 'pill ' + (PILL[r.league] || ''), r.league), 'nw');
      td(r.home); td(r.away);
      td(link(r.stadium, v.info_url));
      td(fmtCap(capOf(r, vm)), 'num');
      td(r.city);
      td(nf().format(r.km), 'num');
      td(fmtMin(r.min), 'num nw');
      td(el('span', 'status s-' + stClass(r.status), t('status')[r.status] || r.status));
      const nc = td(tr(r.note), 'mut');
      if (r.source) nc.title = t('source') + ': ' + tr(r.source);
      tb.appendChild(row);
    }
    tbl.append(thead, tb);
    wrap.appendChild(tbl);
    return wrap;
  }

  function drawVenues() {
    const box = $('#venues');
    if (!D.venues) return;
    const rows = D.venues.slice();
    if (vSort === 'capacity') rows.sort((a, b) => Number(b.capacity || 0) - Number(a.capacity || 0));
    else if (vSort === 'stadium') rows.sort((a, b) => String(a.stadium).localeCompare(String(b.stadium), loc()));
    else rows.sort((a, b) => Number(a.km) - Number(b.km));
    box.replaceChildren();
    for (const v of rows) {
      const c = el('article', 'vc');
      c.style.setProperty('--lg', FILL[v.league] || '#2a5bb8');
      const h = el('h3'); h.append(link(v.stadium, v.info_url));
      if (v.info_url && v.info_label) h.append(el('small', '', tr(v.info_label)));
      const cap = el('div', 'vc-cap');
      cap.append(el('span', 'vc-num', fmtCap(v.capacity)), el('span', 'vc-unit', t('maxSpect')), el('span', 'status ' + capClass(v.capacity_status), t('capStatus')[v.capacity_status] || v.capacity_status));
      const foot = el('div', 'vc-foot');
      foot.append(el('span', '', nf().format(v.km) + ' km · ' + fmtMin(v.min)));
      const b = el('button', 'btn', t('showMatches')); b.type = 'button';
      b.addEventListener('click', () => { S.team = v.team; changed(); goPage('matches'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      foot.append(b);
      c.append(h, el('div', 'vc-meta', v.team + ' · ' + v.league + ' · ' + v.city), cap, el('p', 'vc-note', tr(v.capacity_note)), foot, el('div', 'vc-meta', t('venueInfo') + ': ' + tr(v.venue_status)));
      box.appendChild(c);
    }
  }

  function drawAbout() {
    const box = $('#about');
    const secs = D.site && D.site.about && (D.site.about[lang] || D.site.about.sv);
    box.replaceChildren();
    if (!secs) return;
    for (const s of secs) {
      box.append(el('h3', '', s.h));
      const dl = el('dl');
      for (const [k, v] of s.items) dl.append(el('dt', '', k), el('dd', '', v));
      box.append(dl);
    }
  }

  // ---------- map ----------
  let zoom = null, svgSel = null;
  const orient = (f) => {
    const g = JSON.parse(JSON.stringify(f));
    if (d3.geoArea(g) > 2 * Math.PI) {
      const polys = g.geometry.type === 'MultiPolygon' ? g.geometry.coordinates : [g.geometry.coordinates];
      polys.forEach((poly) => poly.forEach((ring) => ring.reverse()));
    }
    return g;
  };
  function resetZoom() { if (svgSel && zoom) svgSel.transition().duration(250).call(zoom.transform, d3.zoomIdentity); }
  $('#zin').addEventListener('click', () => svgSel && svgSel.transition().duration(200).call(zoom.scaleBy, 1.6));
  $('#zout').addEventListener('click', () => svgSel && svgSel.transition().duration(200).call(zoom.scaleBy, 1 / 1.6));
  $('#zreset').addEventListener('click', resetZoom);

  let lastTransform = null;
  function drawMap() {
    const box = $('#map');
    if (!D.regions || !D.venues || box.offsetParent === null) return;
    box.querySelectorAll('svg').forEach((s) => s.remove());
    const W = Math.max(300, box.clientWidth || 600);
    const H = Math.round(Math.min(620, Math.max(360, W * 0.9)));
    const feats = (D.regions.features || []).map(orient);
    const puglia = feats.find((f) => f.properties && f.properties.region === 'Puglia');
    const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], puglia);
    const path = d3.geoPath(proj);
    const f = filtered();
    const byTeam = d3.group(f, (r) => r.home);
    const vs = D.venues.map((v) => {
      const ms = (byTeam.get(v.team) || []).slice().sort(byTime);
      const [x, y] = proj([Number(v.lon), Number(v.lat)]);
      return { ...v, ms, x, y };
    }).sort((a, b) => b.ms.length - a.ms.length);
    const maxN = d3.max(vs, (v) => v.ms.length) || 1;
    const rs = d3.scaleSqrt([0, maxN], [6, Math.max(11, Math.min(18, W / 36))]);

    svgSel = d3.select(box).insert('svg', ':first-child').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', t('tabMap'));
    const g = svgSel.append('g');
    g.append('g').selectAll('path').data(feats).join('path').attr('class', (d) => 'region' + (d.properties.region === 'Puglia' ? ' puglia' : '')).attr('d', path);
    const [hx, hy] = proj([ORIGIN.lon, ORIGIN.lat]);
    const home = g.append('g').attr('class', 'homeg');
    home.append('rect').attr('class', 'home').attr('x', -5).attr('y', -5).attr('width', 10).attr('height', 10).attr('transform', 'rotate(45)');
    const hl = home.append('text').attr('class', 'maplabel').attr('x', 10).attr('y', -9).text('Ceglie Messapica');
    if (hx + 10 + hl.node().getComputedTextLength() > W - 6) hl.attr('x', -10).attr('text-anchor', 'end');
    const dots = g.append('g').selectAll('g').data(vs).join('g').attr('class', 'vg');
    dots.append('circle').attr('r', 22).attr('fill', 'transparent'); // generous touch target
    dots.append('circle').attr('class', (v) => 'venue' + (v.ms.length ? '' : ' none') + (mapSel === v.team ? ' sel' : ''))
      .attr('r', (v) => (v.ms.length ? rs(v.ms.length) : 5)).attr('fill', (v) => (v.ms.length ? FILL[v.league] : null));
    home.raise();
    dots.style('cursor', 'pointer').on('click', (ev, v) => { mapSel = v.team; drawVPanel(v); dots.selectAll('.venue').classed('sel', (d) => d.team === mapSel); });

    const place = (tr0) => {
      const k = tr0.k;
      g.attr('transform', tr0);
      home.attr('transform', `translate(${hx},${hy}) scale(${1 / k})`);
      dots.attr('transform', (v) => `translate(${v.x},${v.y}) scale(${1 / k})`);
    };
    zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [W, H]]).on('zoom', (ev) => { lastTransform = ev.transform; place(ev.transform); });
    svgSel.call(zoom);
    if (lastTransform) svgSel.call(zoom.transform, lastTransform); else place(d3.zoomIdentity);
    const sel = vs.find((v) => v.team === mapSel);
    if (sel) drawVPanel(sel); else $('#vpanel').replaceChildren(el('span', 'mut', t('mapHint')));
  }

  function drawVPanel(v) {
    const p = $('#vpanel');
    p.replaceChildren();
    const h = el('div'); h.append(el('b', '', v.team), ' ', el('span', 'pill ' + (PILL[v.league] || ''), v.league));
    const ar = el('div'); ar.append(link(v.stadium, v.info_url), ' · ' + v.city);
    p.append(h, ar,
      el('div', 'mut', t('capacity') + ': ' + fmtCap(v.capacity) + ' (' + String(t('capStatus')[v.capacity_status] || v.capacity_status).toLowerCase() + ')'),
      el('div', 'mut', nf().format(v.km) + ' km · ' + fmtMin(v.min)),
      el('div', '', v.ms.length ? plural(v.ms.length, t('inSel')) : t('noSel')));
    if (v.ms.length) {
      const n = v.ms[0];
      p.append(el('div', 'mut', fill(t('next'), { day: fmtDay(n.date) + (n.time ? ' ' + n.time : ''), away: n.away })));
      const b = el('button', 'btn btn-blue', t('showMatches')); b.type = 'button';
      b.addEventListener('click', () => { S.team = v.team; changed(); goPage('matches'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      p.append(b);
    }
  }
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (page === 'map') { lastTransform = null; drawMap(); } }, 200); });

  // ---------- PDF ----------
  const setPdf = (msg, cls) => { const m = $('#pdfMsg'); m.textContent = msg || ''; m.className = 'meta ' + (cls || ''); };
  $('#pdf').addEventListener('click', () => {
    const btn = $('#pdf');
    btn.disabled = true; setPdf(t('pdfBusy'));
    setTimeout(() => {
      try {
        const L = t('pdfL');
        const vm = venueMap();
        const f = searched(filtered()).slice().sort(byTime);
        if (!f.length) { setPdf(t('pdfEmpty'), 'errc'); return; }
        const matches = f.map((r) => { const v = vm.get(r.home) || {}; return { ...r, note: tr(r.note), dateLabel: fmtDay(r.date), url: v.info_url || '', capLabel: fmtCap(v.capacity), kmLabel: nf().format(r.km), minLabel: fmtMin(r.min) }; });
        const byTeam = d3.group(f, (r) => r.home);
        const venues = D.venues.filter((v) => byTeam.has(v.team)).sort((a, b) => Number(a.km) - Number(b.km)).map((v) => {
          const l = byTeam.get(v.team);
          return { ...v, count: l.length, capLabel: fmtCap(v.capacity), distLabel: nf().format(v.km) + ' km · ' + fmtMin(v.min), matchesLabel: fill(L.inSel, { n: plural(l.length, L.match.map((w) => '{n} ' + w)), day: fmtDay(l[0].date), away: l[0].away }) };
        });
        const byMin = S.distBy === 'min';
        const dist = byMin ? (S.maxMin >= MIN_MAX ? L.anyMin : fill(L.maxMin, { min: fmtMin(S.maxMin) })) : (S.maxKm >= KM_MAX ? L.anyKm : fill(L.maxKm, { km: nf().format(S.maxKm) }));
        const filters = [[L.period, fmtLong(S.from) + ' – ' + fmtLong(S.to)], [L.dist, dist + ' ' + L.fromOrigin], [L.leagues, S.leagues.join(', ') || L.none], [L.team, S.team || L.all]];
        if (search) filters.push([L.search, search]);
        const out = window.PCPdf.build({
          d3, L, created: fmtLong(todayIso()),
          headline: fill(L.headline, { n: plural(f.length, L.match.map((w) => '{n} ' + w)), v: plural(venues.length, L.arena.map((w) => '{n} ' + w)) }),
          filters, regions: D.regions, venues, matches, origin: ORIGIN, about: L.aboutRows,
        });
        const blob = new Blob([out.bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'puglia-calcio-' + todayIso() + '.pdf'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        setPdf(t('pdfOk'), 'okc');
      } catch (e) {
        console.error(e);
        setPdf(t('pdfErr'), 'errc');
      } finally {
        btn.disabled = false;
      }
    }, 30);
  });

  // ---------- start ----------
  applyTexts();
  syncControls();
  showPage();
  Promise.all([loadOne('matches.json'), loadOne('venues.json'), loadOne('site.json'), getJson((CFG.localData || 'data/') + 'regions.json')])
    .then(([m, v, s, g]) => {
      D.matches = Array.isArray(m) ? m : (m.rows || m.data || []);
      D.venues = Array.isArray(v) ? v : (v.rows || v.data || []);
      D.site = s; D.regions = g;
      render();
    })
    .catch((e) => {
      console.error(e);
      $('#mlist').replaceChildren(el('p', 'loading', t('loadFail')));
    });
})();
