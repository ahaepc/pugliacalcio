(function (root) {
  'use strict';
  const W_REG=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
  const W_BOLD=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];
  // Builds a print-ready A4 PDF from the filtered matches, the arenas in the selection and the region map.
  // Plain PDF 1.4 with the standard Helvetica fonts (WinAnsi), vector map, clickable arena links.
  const SPECIAL = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F, 0x202F: 0xA0, 0x2009: 0x20, 0x2212: 0x2D };
  const codes = (s) => {
    const out = [];
    for (const ch of String(s == null ? '' : s)) {
      const cp = ch.codePointAt(0);
      if ((cp >= 32 && cp < 127) || (cp >= 0xA0 && cp <= 0xFF)) out.push(cp);
      else if (SPECIAL[cp] != null) out.push(SPECIAL[cp]);
      else if (cp === 10 || cp === 9) out.push(32);
      else out.push(0x3F);
    }
    return out;
  };
  const hex = (s) => '<' + codes(s).map((c) => c.toString(16).padStart(2, '0')).join('') + '>';
  const FONT = { r: { key: 'F1', w: W_REG }, b: { key: 'F2', w: W_BOLD }, i: { key: 'F3', w: W_REG } };
  const tw = (s, f, size) => codes(s).reduce((a, c) => a + (FONT[f].w[c] || 556), 0) * size / 1000;
  const fit = (s, f, size, max) => {
    s = String(s == null ? '' : s);
    if (tw(s, f, size) <= max) return s;
    while (s.length > 1 && tw(s + '…', f, size) > max) s = s.slice(0, -1);
    return s.replace(/\s+$/, '') + '…';
  };
  const wrap = (s, f, size, max) => {
    const words = String(s == null ? '' : s).split(/\s+/).filter(Boolean);
    const lines = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (tw(t, f, size) <= max || !cur) cur = t; else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines.map((l) => fit(l, f, size, max));
  };
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map((v) => +v.toFixed(3)).join(' '); };
  const n2 = (v) => (Math.round(v * 100) / 100).toString();
  const lit = (s) => '(' + String(s).replace(/[^\x20-\x7e]/g, '').replace(/([\\()])/g, '\\$1') + ')';

  const C = {
    blue: '#2a5bb8', deep: '#173a7a', gold: '#e8b021', goldSoft: '#f6d873', ink: '#1c2440', muted: '#6b7280', line: '#d9dde5',
    panel: '#f5f7fb', terra: '#c8623a', white: '#ffffff',
    okBg: '#e3f4e6', okBar: '#2e9e4f', dateBg: '#fdf0d2', dateBar: '#e09a12', preBg: '#fbe1df', preBar: '#d2453a',
    regionPuglia: '#fbefc9', regionOther: '#f1f2f5',
  };
  const LG = { 'Serie A': { bg: C.blue, fg: C.white }, 'Serie B': { bg: '#6b7a90', fg: C.white }, 'Serie C': { bg: C.gold, fg: C.ink }, 'Serie D': { bg: C.terra, fg: C.white } };
  const ST = { 'Bekräftad': [C.okBg, C.okBar], 'Datum fastställt': [C.dateBg, C.dateBar], 'Preliminär': [C.preBg, C.preBar] };
  const CAPST = { 'Säker': C.okBar, 'Trolig': C.muted, 'Osäker': C.dateBar };

  const PW = 595.28, PH = 841.89, M = 40, CW = PW - 2 * M, FOOT = 30;

  function build(o) {
    const d3 = o.d3;
    const L = o.L;
    const fill2 = (s, map) => String(s).replace(/\{(\w+)\}/g, (m, k) => (map[k] != null ? map[k] : m));
    const pages = [];
    let pg = null, y = 0;
    const newPage = () => { pg = { ops: [], links: [] }; pages.push(pg); y = M; return pg; };
    const op = (s) => pg.ops.push(s);
    const Y = (v) => n2(PH - v);
    const fill = (c) => op(rgb(c) + ' rg');
    const stroke = (c) => op(rgb(c) + ' RG');
    const rect = (x, yy, w, h, c) => { fill(c); op(`${n2(x)} ${Y(yy + h)} ${n2(w)} ${n2(h)} re f`); };
    const rrect = (x, yy, w, h, r, c) => {
      fill(c); const k = 0.5523 * r, x1 = x + w, y1 = yy + h;
      op(`${n2(x + r)} ${Y(yy)} m ${n2(x1 - r)} ${Y(yy)} l ${n2(x1 - r + k)} ${Y(yy)} ${n2(x1)} ${Y(yy + r - k)} ${n2(x1)} ${Y(yy + r)} c ${n2(x1)} ${Y(y1 - r)} l ${n2(x1)} ${Y(y1 - r + k)} ${n2(x1 - r + k)} ${Y(y1)} ${n2(x1 - r)} ${Y(y1)} c ${n2(x + r)} ${Y(y1)} l ${n2(x + r - k)} ${Y(y1)} ${n2(x)} ${Y(y1 - r + k)} ${n2(x)} ${Y(y1 - r)} c ${n2(x)} ${Y(yy + r)} l ${n2(x)} ${Y(yy + r - k)} ${n2(x + r - k)} ${Y(yy)} ${n2(x + r)} ${Y(yy)} c f`);
    };
    const circ = (cx, cy, r, c, sc, sw) => {
      const k = 0.5523 * r;
      const path = `${n2(cx + r)} ${Y(cy)} m ${n2(cx + r)} ${Y(cy - k)} ${n2(cx + k)} ${Y(cy - r)} ${n2(cx)} ${Y(cy - r)} c ${n2(cx - k)} ${Y(cy - r)} ${n2(cx - r)} ${Y(cy - k)} ${n2(cx - r)} ${Y(cy)} c ${n2(cx - r)} ${Y(cy + k)} ${n2(cx - k)} ${Y(cy + r)} ${n2(cx)} ${Y(cy + r)} c ${n2(cx + k)} ${Y(cy + r)} ${n2(cx + r)} ${Y(cy + k)} ${n2(cx + r)} ${Y(cy)} c`;
      if (c) fill(c);
      if (sc) { stroke(sc); op(`${n2(sw || 1)} w`); }
      op(path + (c && sc ? ' B' : c ? ' f' : ' S'));
    };
    const line = (x1, y1, x2, y2, c, w) => { stroke(c); op(`${n2(w || 0.6)} w ${n2(x1)} ${Y(y1)} m ${n2(x2)} ${Y(y2)} l S`); };
    const text = (x, yy, s, f, size, c, opt) => {
      opt = opt || {};
      let tx = x;
      if (opt.align === 'right') tx = x - tw(s, f, size);
      else if (opt.align === 'center') tx = x - tw(s, f, size) / 2;
      if (opt.halo) op(`BT /${FONT[f].key} ${n2(size)} Tf 1 Tr ${rgb(C.white)} RG 2.4 w 1 j ${n2(tx)} ${Y(yy)} Td ${hex(s)} Tj ET`);
      op(`BT /${FONT[f].key} ${n2(size)} Tf 0 Tr ${rgb(c || C.ink)} rg ${n2(tx)} ${Y(yy)} Td ${hex(s)} Tj ET`);
      return tw(s, f, size);
    };
    const link = (x, yy, w, h, url) => { if (url) pg.links.push({ x, y: yy, w, h, url }); };
    const ensure = (h, onNew) => { if (y + h > PH - M - FOOT) { newPage(); if (onNew) onNew(); return true; } return false; };

    // ---------- logo badge (trullo with a football on top) ----------
    const logo = (cx, cy, s) => {
      const P = (x, yy) => [cx + (x - 48) * s, cy + (yy - 48) * s];
      circ(cx, cy, 45 * s, C.deep, C.gold, 5 * s);
      fill(C.gold); { const a = P(48, 30), b = P(67, 62), c = P(29, 62); op(`${n2(a[0])} ${Y(a[1])} m ${n2(b[0])} ${Y(b[1])} l ${n2(c[0])} ${Y(c[1])} l h f`); }
      { const a = P(28, 62); rect(a[0], a[1], 40 * s, 13 * s, C.white); }
      { const a = P(44, 69); rect(a[0], a[1], 8 * s, 6 * s, C.blue); }
      { const a = P(48, 22); circ(a[0], a[1], 9 * s, C.white, C.deep, 1.4 * s); }
      { const pts = [[48, 17.8], [52, 20.7], [50.5, 25.4], [45.5, 25.4], [44, 20.7]].map((p) => P(p[0], p[1]));
        fill(C.deep); op(pts.map((p, i) => `${n2(p[0])} ${Y(p[1])} ${i ? 'l' : 'm'}`).join(' ') + ' h f'); }
    };

    // ---------- page 1: header ----------
    newPage();
    rect(0, 0, PW, 78, C.deep);
    rect(0, 78, PW, 4, C.gold);
    logo(M + 26, 39, 0.56);
    const wx = M + 62;
    const w1 = text(wx, 40, 'PUGLIA', 'b', 24, C.white);
    text(wx + w1 + 7, 40, 'CALCIO', 'b', 24, C.gold);
    text(wx, 57, 'Partite di calcio vicino a Ceglie Messapica', 'i', 10, C.goldSoft);
    text(PW - M, 34, L.title, 'b', 11, C.white, { align: 'right' });
    text(PW - M, 50, L.created + ' ' + o.created, 'r', 8.5, C.goldSoft, { align: 'right' });
    y = 104;

    // ---------- selection summary ----------
    text(M, y, o.headline, 'b', 15, C.deep);
    y += 12;
    const rows = o.filters;
    const boxH = 14 + Math.ceil(rows.length / 2) * 15;
    rrect(M, y, CW, boxH, 4, C.panel);
    rows.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + 12 + col * (CW / 2);
      const yy = y + 17 + row * 15;
      const lw = text(x, yy, r[0] + ': ', 'b', 8.5, C.muted);
      text(x + lw, yy, fit(r[1], 'r', 8.5, CW / 2 - 24 - lw), 'r', 8.5, C.ink);
    });
    y += boxH + 18;

    // ---------- match table ----------
    const cols = [
      { k: 'date', t: L.cols[0], w: 60 }, { k: 'time', t: L.cols[1], w: 31 }, { k: 'league', t: L.cols[2], w: 44 },
      { k: 'match', t: L.cols[3], w: 142 }, { k: 'arena', t: L.cols[4], w: 122 }, { k: 'cap', t: L.cols[5], w: 42, right: true },
      { k: 'km', t: L.cols[6], w: 24, right: true }, { k: 'min', t: L.cols[7], w: 50, right: true },
    ];
    const tableHead = () => {
      rect(M, y, CW, 18, C.deep);
      let x = M;
      for (const c of cols) { text(c.right ? x + c.w - 5 : x + 6, y + 12, c.t, 'b', 7.5, C.white, c.right ? { align: 'right' } : {}); x += c.w; }
      y += 18;
    };
    const legend = () => {
      let x = M;
      for (const [lbl, s] of [[L.lgOk, 'Bekräftad'], [L.lgDate, 'Datum fastställt'], [L.lgPre, 'Preliminär']]) {
        rect(x, y - 7, 10, 8, ST[s][0]); rect(x, y - 7, 2.5, 8, ST[s][1]);
        x += 14; x += text(x, y, lbl, 'r', 7.5, C.ink) + 14;
      }
      y += 10;
    };
    ensure(80);
    text(M, y, L.matches + ' (' + o.matches.length + ')', 'b', 13, C.deep);
    y += 14; legend(); y += 2; tableHead();
    o.matches.forEach((m, i) => {
      const note = m.status !== 'Bekräftad' && m.note ? m.note : '';
      const h = note ? 26 : 17;
      ensure(h, () => { text(M, y, L.cont, 'b', 10, C.deep); y += 10; tableHead(); });
      const st = ST[m.status] || ST['Datum fastställt'];
      rect(M, y, CW, h, st[0]); rect(M, y, 3, h, st[1]);
      line(M, y + h, M + CW, y + h, '#ffffff', 0.8);
      let x = M; const by = y + 11.5;
      const cell = (c, s, f, col) => { const max = c.w - 10; const v = fit(s, f, 7.8, max); if (c.right) text(x + c.w - 5, by, v, f, 7.8, col, { align: 'right' }); else text(x + 6, by, v, f, 7.8, col); };
      for (const c of cols) {
        if (c.k === 'date') cell(c, m.dateLabel, 'b', C.ink);
        else if (c.k === 'time') cell(c, m.time || L.timeUnset, m.time ? 'r' : 'i', m.time ? C.ink : C.muted);
        else if (c.k === 'league') {
          const lg = LG[m.league] || LG['Serie A']; const s = m.league; const pw = tw(s, 'b', 6.8) + 8;
          rrect(x + 5, y + 4, pw, 10, 5, lg.bg); text(x + 9, y + 11.6, s, 'b', 6.8, lg.fg);
        } else if (c.k === 'match') {
          const max = c.w - 10; const hw = Math.min(tw(m.home, 'b', 7.8), max * 0.55);
          const hs = fit(m.home, 'b', 7.8, max * 0.55); const used = text(x + 6, by, hs, 'b', 7.8, C.ink);
          text(x + 6 + used, by, fit(' – ' + m.away, 'r', 7.8, max - used), 'r', 7.8, C.ink); void hw;
        } else if (c.k === 'arena') {
          const v = fit(m.stadium, 'r', 7.8, c.w - 10); const w = text(x + 6, by, v, 'r', 7.8, m.url ? C.blue : C.ink);
          if (m.url) { line(x + 6, by + 1.5, x + 6 + w, by + 1.5, '#9db4e0', 0.5); link(x + 6, by - 8, w, 10, m.url); }
        } else if (c.k === 'cap') cell(c, m.capLabel, 'r', C.ink);
        else if (c.k === 'km') cell(c, m.kmLabel, 'r', C.ink);
        else if (c.k === 'min') cell(c, m.minLabel, 'r', C.ink);
        x += c.w;
      }
      if (note) text(M + 6 + 60 + 31 + 44, y + 21.5, fit(note, 'i', 6.8, CW - 6 - 60 - 31 - 44 - 10), 'i', 6.8, C.muted);
      y += h;
    });
    if (!o.matches.length) { text(M, y + 14, L.noMatches, 'i', 9, C.muted); y += 20; }
    y += 20;

    // ---------- map + compact arena list ----------
    if (o.venues.length) {
      const mapW = 228, mapH = 236, gap = 16, lx0 = M + mapW + gap, lw = CW - mapW - gap, rowH = 25;
      const need = 22 + Math.max(mapH, o.venues.length * rowH);
      if (y + need > PH - M - FOOT) newPage();
      text(M, y, L.mapTitle + ' (' + o.venues.length + ')', 'b', 13, C.deep);
      y += 10;
      const my0 = y, mx0 = M;
      rrect(mx0, my0, mapW, mapH, 4, '#fbfcfe');
      const feats = (o.regions.features || []).map((f) => {
        const g = JSON.parse(JSON.stringify(f));
        if (d3.geoArea(g) > 2 * Math.PI) {
          const polys = g.geometry.type === 'MultiPolygon' ? g.geometry.coordinates : [g.geometry.coordinates];
          polys.forEach((poly) => poly.forEach((ring) => ring.reverse()));
        }
        return g;
      });
      const puglia = feats.find((f) => f.properties && f.properties.region === 'Puglia');
      const proj = d3.geoMercator().fitExtent([[mx0 + 8, my0 + 8], [mx0 + mapW - 8, my0 + mapH - 8]], puglia || { type: 'FeatureCollection', features: feats });
      op('q'); op(`${n2(mx0)} ${Y(my0 + mapH)} ${n2(mapW)} ${n2(mapH)} re W n`);
      for (const f of feats) {
        const parts = [];
        const ctx = { moveTo: (a2, b2) => parts.push(`${n2(a2)} ${Y(b2)} m`), lineTo: (a2, b2) => parts.push(`${n2(a2)} ${Y(b2)} l`), closePath: () => parts.push('h'), arc: () => {} };
        d3.geoPath(proj, ctx)(f);
        const isP = f.properties && f.properties.region === 'Puglia';
        fill(isP ? C.regionPuglia : C.regionOther); stroke(isP ? '#c9a54a' : '#c7ccd6');
        op(`${isP ? '0.8' : '0.4'} w 1 j`);
        op(parts.join(' ') + ' B');
      }
      const hp = proj([o.origin.lon, o.origin.lat]);
      fill(C.ink); op(`${n2(hp[0])} ${Y(hp[1] - 4.5)} m ${n2(hp[0] + 4.5)} ${Y(hp[1])} l ${n2(hp[0])} ${Y(hp[1] + 4.5)} l ${n2(hp[0] - 4.5)} ${Y(hp[1])} l h f`);
      // numbered markers, drawn far-to-near so the closest stay on top
      const vs = o.venues.map((v, i) => ({ ...v, n: i + 1, p: proj([Number(v.lon), Number(v.lat)]) }));
      // spread markers that would overlap; a thin leader line points to the true spot
      vs.forEach((v) => { v.q = [v.p[0], v.p[1]]; });
      const MIN = 13.2;
      for (let it = 0; it < 60; it++) {
        let moved = false;
        for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
          const a2 = vs[i].q, b2 = vs[j].q;
          let dx = b2[0] - a2[0], dy = b2[1] - a2[1], d = Math.hypot(dx, dy);
          if (d >= MIN) continue;
          if (d < 0.01) { dx = 1; dy = 0.3; d = Math.hypot(dx, dy); }
          const push = (MIN - d) / 2 + 0.1;
          a2[0] -= dx / d * push; a2[1] -= dy / d * push; b2[0] += dx / d * push; b2[1] += dy / d * push;
          moved = true;
        }
        if (!moved) break;
      }
      vs.forEach((v) => { if (Math.hypot(v.q[0] - v.p[0], v.q[1] - v.p[1]) > 2) { line(v.p[0], v.p[1], v.q[0], v.q[1], C.ink, 0.5); circ(v.p[0], v.p[1], 1.3, C.ink); } });
      vs.slice().reverse().forEach((v) => {
        const lg = LG[v.league] || LG['Serie A'];
        circ(v.q[0], v.q[1], 6.2, lg.bg, C.white, 1);
        text(v.q[0], v.q[1] + 2.3, String(v.n), 'b', 6.5, lg.fg, { align: 'center' });
      });
      op('Q');
      // small legend under the map
      let ly = my0 + mapH + 11, lxx = M;
      fill(C.ink); op(`${n2(lxx + 3.5)} ${Y(ly - 6.5)} m ${n2(lxx + 7)} ${Y(ly - 3)} l ${n2(lxx + 3.5)} ${Y(ly + 0.5)} l ${n2(lxx)} ${Y(ly - 3)} l h f`);
      text(lxx + 11, ly, 'Ceglie Messapica', 'r', 7, C.muted);
      // arena list
      let ry = my0;
      vs.forEach((v) => {
        const lg = LG[v.league] || LG['Serie A'];
        if (v.n % 2 === 0) rect(lx0, ry, lw, rowH, C.panel);
        circ(lx0 + 10, ry + 12.5, 6.2, lg.bg, C.white, 1);
        text(lx0 + 10, ry + 14.8, String(v.n), 'b', 6.5, lg.fg, { align: 'center' });
        const nx = lx0 + 22, nmax = lw - 22 - 6;
        const nm = fit(v.stadium, 'b', 8.6, nmax);
        const w = text(nx, ry + 10.5, nm, 'b', 8.6, v.info_url ? C.blue : C.deep);
        if (v.info_url) link(nx, ry + 2, w, 11, v.info_url);
        let x2 = nx;
        x2 += text(x2, ry + 20.5, fit(v.team, 'r', 7.6, 90), 'r', 7.6, C.ink) + 5;
        const pw = tw(v.league, 'b', 6.2) + 7;
        rrect(x2, ry + 14, pw, 8.5, 4.2, lg.bg); text(x2 + 3.5, ry + 20.2, v.league, 'b', 6.2, lg.fg);
        x2 += pw + 6;
        text(x2, ry + 20.5, fit(v.capLabel + ' ' + L.seats + ' · ' + v.distLabel, 'r', 7.6, lx0 + lw - x2 - 4), 'r', 7.6, C.muted);
        ry += rowH;
      });
      y = Math.max(my0 + mapH + 20, ry) + 16;
    }

    // ---------- about ----------
    const about = o.about;
    const aboutLines = about.map(([k, v]) => ({ k, lines: wrap(v, 'r', 7.6, CW - 110) }));
    const aboutH = 24 + aboutLines.reduce((a, r) => a + Math.max(1, r.lines.length) * 10 + 4, 0);
    if (y + aboutH > PH - M - FOOT) newPage();
    text(M, y, L.about, 'b', 11, C.deep); y += 14;
    for (const r of aboutLines) {
      text(M, y, r.k, 'b', 7.6, C.ink);
      r.lines.forEach((l, i) => text(M + 110, y + i * 10, l, 'r', 7.6, C.muted));
      y += Math.max(1, r.lines.length) * 10 + 4;
    }

    // ---------- footers ----------
    pages.forEach((p, i) => {
      pg = p;
      line(M, PH - M + 6, PW - M, PH - M + 6, C.gold, 1);
      text(M, PH - M + 18, fill2(L.footer, { date: o.created }), 'r', 7, C.muted);
      text(PW - M, PH - M + 18, fill2(L.page, { i: i + 1, n: pages.length }), 'r', 7, C.muted, { align: 'right' });
    });

    // ---------- serialize ----------
    const objs = [];
    const add = (s) => { objs.push(s); return objs.length; };
    const catalogId = add(null), pagesId = add(null);
    const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const f3 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
    const kids = [];
    for (const p of pages) {
      const content = p.ops.join('\n');
      const cid = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      const annots = p.links.map((l) => add(`<< /Type /Annot /Subtype /Link /Rect [${n2(l.x)} ${n2(PH - l.y - l.h)} ${n2(l.x + l.w)} ${n2(PH - l.y)}] /Border [0 0 0] /A << /S /URI /URI ${lit(l.url)} >> >>`));
      const pid = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${cid} 0 R${annots.length ? ' /Annots [' + annots.map((a) => a + ' 0 R').join(' ') + ']' : ''} >>`);
      kids.push(pid);
    }
    objs[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
    const info = add(`<< /Title ${lit('Puglia Calcio - ' + L.title)} /Producer ${lit('Puglia Calcio dashboard')} >>`);
    let out = '%PDF-1.4\n';
    const offs = [];
    objs.forEach((s, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${s}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o2) => String(o2).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogId} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return { bytes, pages: pages.length };
  }
  root.PCPdf = { build };
})(typeof window !== 'undefined' ? window : globalThis);
