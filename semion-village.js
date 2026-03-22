// SEMION™ v4 — Village Loading Animation
// Studio Ghibli-style SVG village — Terence's "Homo sum, humani nihil a me alienum puto"
// Randomized per session. Forward-moving like film. No loop.
// Copyright © 2026 Sebastian Iturriaga — synapsecopilot.com

var _village = (function() {

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var _svg = null;
  var _animFrame = null;
  var _startTime = null;
  var _seed = 0;
  var _active = false;

  // Seeded random — different each session, deterministic within it
  function _rng(s) {
    var x = Math.sin(s + 1) * 43758.5453123;
    return x - Math.floor(x);
  }
  function _r(lo, hi) {
    _seed++;
    return lo + _rng(_seed + _startTime % 999) * (hi - lo);
  }
  function _ri(lo, hi) { return Math.floor(_r(lo, hi + 1)); }
  function _pick(arr) { return arr[_ri(0, arr.length - 1)]; }

  // Time of day palette — seeded per session
  var PALETTES = [
    // Late morning
    { sky: ['#c8d8e8','#dde8f0','#e8f0f5'], sun: '#f5e090', ground: '#3a4a2a', shadow: 'rgba(40,30,60,.15)', light: 'rgba(245,224,144,.25)' },
    // Golden afternoon
    { sky: ['#e8c87a','#d4a855','#c09040'], sun: '#f0c040', ground: '#4a3a20', shadow: 'rgba(60,30,10,.20)', light: 'rgba(240,192,64,.30)' },
    // Late afternoon
    { sky: ['#c06040','#a84830','#802830'], sun: '#f08040', ground: '#3a2a18', shadow: 'rgba(80,20,20,.22)', light: 'rgba(240,128,64,.28)' },
    // Blue hour
    { sky: ['#304060','#203050','#101828'], sun: '#8090b0', ground: '#201828', shadow: 'rgba(10,10,40,.30)', light: 'rgba(128,160,200,.15)' }
  ];

  function _el(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    }
    return e;
  }

  function _grp(id) {
    var g = _el('g');
    if (id) g.setAttribute('id', id);
    return g;
  }

  function _rect(x, y, w, h, fill, rx) {
    return _el('rect', { x:x, y:y, width:w, height:h, fill:fill, rx:rx||0 });
  }

  function _circle(cx, cy, r, fill) {
    return _el('circle', { cx:cx, cy:cy, r:r, fill:fill });
  }

  function _poly(pts, fill, opacity) {
    var e = _el('polygon', { points: pts, fill: fill });
    if (opacity) e.setAttribute('opacity', opacity);
    return e;
  }

  function _path(d, fill, stroke, sw) {
    var e = _el('path', { d:d, fill:fill||'none' });
    if (stroke) { e.setAttribute('stroke', stroke); e.setAttribute('stroke-width', sw||1); }
    return e;
  }

  // ── BUILD SCENE ──────────────────────────────────────────

  function _buildScene(svg, pal, session) {
    var W = 520, H = 340;
    svg.setAttribute('viewBox', '0 0 '+W+' '+H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);

    // SKY gradient
    var defs = _el('defs');
    var skyGrad = _el('linearGradient', { id:'skyG', x1:0, y1:0, x2:0, y2:1, gradientUnits:'objectBoundingBox' });
    pal.sky.forEach(function(c, i) {
      var s = _el('stop');
      s.setAttribute('offset', (i / (pal.sky.length - 1) * 100) + '%');
      s.setAttribute('stop-color', c);
      skyGrad.appendChild(s);
    });
    defs.appendChild(skyGrad);
    svg.appendChild(defs);

    // Sky
    svg.appendChild(_rect(0, 0, W, H, 'url(#skyG)'));

    // Clouds (randomized count 2-5)
    var cloudG = _grp('clouds');
    var numClouds = _ri(2, 5);
    for (var ci = 0; ci < numClouds; ci++) {
      var cx = _r(20, W - 60);
      var cy = _r(15, 80);
      var cw = _r(60, 120);
      var cloudOpacity = _r(0.4, 0.75);
      var cg = _grp();
      cg.setAttribute('opacity', cloudOpacity);
      cg.setAttribute('data-speed', _r(0.3, 0.8).toFixed(3));
      cg.setAttribute('data-ox', cx.toString());
      // Simple 3-circle cloud
      [0, cw*0.3, cw*0.6].forEach(function(ox, i) {
        var cr = _r(12, 24) - i * 2;
        cg.appendChild(_circle(cx + ox, cy, cr, 'rgba(255,255,255,0.82)'));
      });
      cloudG.appendChild(cg);
    }
    svg.appendChild(cloudG);

    // DISTANT HILLS (parallax layer 0)
    var hillG = _grp('hills');
    var hillCol = 'rgba(80,110,80,0.35)';
    var hill1 = _path('M0 180 Q80 140 160 170 Q240 200 320 155 Q400 120 520 165 L520 220 L0 220 Z', hillCol);
    var hill2 = _path('M0 200 Q60 170 140 195 Q220 218 300 188 Q380 160 520 195 L520 230 L0 230 Z', 'rgba(60,90,60,0.45)');
    hillG.appendChild(hill1);
    hillG.appendChild(hill2);
    svg.appendChild(hillG);

    // GROUND
    svg.appendChild(_rect(0, 220, W, H - 220, pal.ground));
    // Ground texture
    var gPath = _path('M0 240 Q130 230 260 242 Q390 254 520 238', 'none', 'rgba(255,255,255,0.04)', 1);
    svg.appendChild(gPath);

    // BUILDINGS GROUP (multiple traditions)
    var bldG = _grp('buildings');

    // Left: simple mosque-like structure
    var mosque = _grp('mosque');
    mosque.appendChild(_rect(30, 185, 50, 38, '#8B7355', 2));
    mosque.appendChild(_poly('30,185 55,168 80,185', '#9B8365'));
    mosque.appendChild(_rect(50, 165, 8, 22, '#8B7355'));
    mosque.appendChild(_circle(54, 163, 5, '#C9A050'));
    bldG.appendChild(mosque);

    // Center-left: library with lit window
    var lib = _grp('library');
    lib.appendChild(_rect(110, 175, 70, 48, '#6B6B7B', 3));
    lib.appendChild(_poly('110,175 145,158 180,175', '#7B7B8B'));
    // Windows
    var winLit = _ri(0,1);
    lib.appendChild(_rect(120, 185, 15, 18, winLit ? 'rgba(240,220,160,0.8)' : '#4a4a5a', 1));
    lib.appendChild(_rect(150, 185, 15, 18, _ri(0,1) ? 'rgba(240,220,160,0.7)' : '#4a4a5a', 1));
    lib.appendChild(_rect(125, 210, 20, 13, '#5B5B6B'));
    bldG.appendChild(lib);

    // Center: café + market stall
    var cafe = _grp('cafe');
    cafe.appendChild(_rect(215, 188, 55, 35, '#7A6050', 2));
    cafe.appendChild(_rect(215, 182, 55, 8, '#C9A050')); // awning
    cafe.appendChild(_rect(225, 195, 12, 16, 'rgba(200,180,120,0.6)', 1)); // window
    cafe.appendChild(_rect(245, 195, 12, 16, _ri(0,1) ? 'rgba(240,220,160,0.75)':'rgba(120,100,80,0.6)', 1));
    bldG.appendChild(cafe);

    // Right of center: radio tower
    var tower = _grp('tower');
    tower.appendChild(_rect(298, 168, 4, 55, '#8090A0'));
    tower.appendChild(_rect(294, 168, 12, 3, '#7080904'));
    tower.appendChild(_rect(292, 180, 16, 2, '#708090'));
    // Signal arcs
    var sig = _el('path', { d:'M300 166 Q310 160 320 166', fill:'none', stroke:'rgba(201,160,80,0.3)', 'stroke-width':'1.5' });
    var sig2 = _el('path', { d:'M300 166 Q316 157 332 166', fill:'none', stroke:'rgba(201,160,80,0.15)', 'stroke-width':'1' });
    tower.appendChild(sig); tower.appendChild(sig2);
    bldG.appendChild(tower);

    // Right: pagoda-inspired structure
    var pagoda = _grp('pagoda');
    pagoda.appendChild(_rect(340, 190, 55, 33, '#7B6B5B', 2));
    pagoda.appendChild(_poly('340,190 367,172 394,190', '#8B7B6B'));
    pagoda.appendChild(_poly('345,172 367,158 389,172', '#9B8B7B'));
    pagoda.appendChild(_rect(357, 158, 20, 14, '#7B6B5B'));
    pagoda.appendChild(_rect(354, 195, 14, 20, '#6B5B4B')); // door
    bldG.appendChild(pagoda);

    // Far right: simple building with garden
    var house = _grp('house');
    house.appendChild(_rect(430, 192, 62, 31, '#6B7B6B', 2));
    house.appendChild(_poly('430,192 461,178 492,192', '#7B8B7B'));
    house.appendChild(_rect(445, 198, 12, 15, _ri(0,1) ? 'rgba(240,220,160,0.7)':'rgba(80,90,80,0.6)', 1));
    house.appendChild(_rect(468, 198, 12, 15, '#5B6B5B', 1));
    bldG.appendChild(house);

    svg.appendChild(bldG);

    // TREES (variable, 4-8)
    var treeG = _grp('trees');
    var treePositions = [60, 95, 195, 310, 420, 505];
    treePositions.forEach(function(tx) {
      if (_ri(0, 3) > 0) { // 75% chance
        var th = _r(30, 55);
        var tc = _pick(['#3A5A30','#4A6A40','#506040','#405530']);
        var tg = _grp();
        tg.setAttribute('data-sway', _r(-0.6, 0.6).toFixed(3));
        tg.appendChild(_rect(tx - 2, 223 - th * 0.3, 4, th * 0.3, '#5A4530'));
        tg.appendChild(_circle(tx, 228 - th, _r(12, 22), tc));
        tg.appendChild(_circle(tx - 8, 232 - th, _r(8, 15), tc));
        tg.appendChild(_circle(tx + 7, 230 - th, _r(9, 14), tc));
        treeG.appendChild(tg);
      }
    });
    svg.appendChild(treeG);

    // GARDEN (foreground)
    svg.appendChild(_rect(400, 215, 90, 8, '#3A5A2A'));
    svg.appendChild(_circle(415, 215, 4, '#8B7B3B'));
    svg.appendChild(_circle(440, 214, 5, '#7A6A2A'));
    svg.appendChild(_circle(465, 215, 3, '#6A5A2A'));

    // FIGURES (silhouettes, 4-6 chosen from pool of 8 positions)
    var figureG = _grp('figures');
    var figureSlots = [
      {x:88,y:218,h:16,w:5},   // near mosque
      {x:155,y:220,h:15,w:5},  // near library
      {x:200,y:222,h:14,w:4},  // market area
      {x:245,y:221,h:13,w:4},  // café
      {x:265,y:220,h:15,w:5},  // walking
      {x:330,y:219,h:14,w:4},  // near tower
      {x:410,y:220,h:16,w:5},  // garden
      {x:480,y:219,h:14,w:4}   // far right
    ];
    // Pick 4-6 figures
    var numFigs = _ri(4, 6);
    var chosen = figureSlots.slice(0).sort(function() { return _r(-1,1); }).slice(0, numFigs);
    chosen.forEach(function(f) {
      var fig = _grp();
      fig.setAttribute('data-walk', _r(-0.3, 0.3).toFixed(3));
      var figCol = 'rgba(20,15,10,' + _r(0.55, 0.8).toFixed(2) + ')';
      // Body
      fig.appendChild(_rect(f.x - f.w/2, f.y - f.h, f.w, f.h * 0.65, figCol, 1));
      // Head
      fig.appendChild(_circle(f.x, f.y - f.h - f.w * 0.6, f.w * 0.6, figCol));
      figureG.appendChild(fig);
    });
    svg.appendChild(figureG);

    // LIGHT OVERLAY (golden hour effect)
    var lightOverlay = _el('rect', {
      x:0, y:0, width:W, height:H,
      fill:'url(#skyG)', opacity:'0.06', id:'lightOverlay'
    });
    svg.appendChild(lightOverlay);

    // LAUNDRY LINES between buildings
    var laundryG = _grp('laundry');
    var lLine = _path('M160 188 Q200 182 240 186', 'none', 'rgba(180,160,140,0.3)', 0.5);
    laundryG.appendChild(lLine);
    [[170,183,'rgba(200,80,80,0.5)'],[185,180,'rgba(80,80,200,0.4)'],[210,181,'rgba(200,200,80,0.45)']].forEach(function(lc) {
      laundryG.appendChild(_rect(lc[0], lc[1], 6, 9, lc[2], 1));
    });
    svg.appendChild(laundryG);

    // WINDOW LIGHTS (randomly lit per session)
    var wlG = _grp('winlights');
    var winPositions = [
      [122,186,14,17],[152,186,14,17],[448,198,11,14],[360,195,11,14],[380,195,11,14]
    ];
    winPositions.forEach(function(wp) {
      if (_ri(0,1)) {
        var glow = _el('rect', {x:wp[0],y:wp[1],width:wp[2],height:wp[3],fill:'rgba(240,220,140,0.65)',rx:1});
        wlG.appendChild(glow);
      }
    });
    svg.appendChild(wlG);

    // FOREGROUND SHADOW
    svg.appendChild(_rect(0, 235, W, H - 235, 'rgba(0,0,0,0.18)'));

    // GRAIN OVERLAY
    var grain = _el('rect', {x:0,y:0,width:W,height:H,fill:'url(#noiseP)',opacity:'0.04'});
    var noisePat = _el('pattern', {id:'noiseP',width:'80',height:'80',patternUnits:'userSpaceOnUse'});
    var noiseFilter = _el('filter', {id:'noiseF'});
    var turbulence = _el('feTurbulence', {type:'fractalNoise',baseFrequency:'0.85',numOctaves:'3',stitchTiles:'stitch'});
    noiseFilter.appendChild(turbulence);
    defs.appendChild(noiseFilter);
    var nRect = _el('rect', {width:'80',height:'80',filter:'url(#noiseF)',opacity:'1'});
    noisePat.appendChild(nRect);
    defs.appendChild(noisePat);
    svg.appendChild(grain);
  }

  // ── ANIMATION LOOP ────────────────────────────────────────

  function _animate(ts) {
    if (!_active) return;
    if (!_startTime) _startTime = ts;
    var elapsed = (ts - _startTime) / 1000; // seconds

    // Animate clouds (slow drift)
    var clouds = _svg.querySelectorAll('#clouds g');
    clouds.forEach(function(c) {
      var speed = parseFloat(c.getAttribute('data-speed') || 0.4);
      var ox = parseFloat(c.getAttribute('data-ox') || 0);
      var nx = (ox + elapsed * speed * 12) % 580 - 30;
      c.setAttribute('transform', 'translate(' + (nx - ox) + ',0)');
    });

    // Animate trees (gentle sway)
    var trees = _svg.querySelectorAll('#trees g');
    trees.forEach(function(t) {
      var sway = parseFloat(t.getAttribute('data-sway') || 0);
      var angle = Math.sin(elapsed * 0.8 + sway * 5) * 1.5 * sway;
      // Get tree base approximately
      var rects = t.querySelectorAll('rect');
      if (rects.length) {
        var baseX = parseFloat(rects[0].getAttribute('x') || 0) + 2;
        var baseY = parseFloat(rects[0].getAttribute('y') || 220) + parseFloat(rects[0].getAttribute('height') || 10);
        t.setAttribute('transform', 'rotate(' + angle + ',' + baseX + ',' + baseY + ')');
      }
    });

    // Animate figures (subtle breathing/swaying)
    var figs = _svg.querySelectorAll('#figures g');
    figs.forEach(function(f, i) {
      var walk = parseFloat(f.getAttribute('data-walk') || 0);
      var offset = Math.sin(elapsed * 1.2 + i * 0.9) * 0.8 * walk;
      f.setAttribute('transform', 'translate(' + (elapsed * walk * 0.4) + ',0)');
    });

    // Light overlay breathing
    var lightOverlay = _svg.querySelector('#lightOverlay');
    if (lightOverlay) {
      var lightPulse = 0.04 + Math.sin(elapsed * 0.3) * 0.015;
      lightOverlay.setAttribute('opacity', lightPulse.toFixed(3));
    }

    _animFrame = requestAnimationFrame(_animate);
  }

  // ── PUBLIC API ────────────────────────────────────────────

  function show() {
    var container = document.getElementById('village-loading');
    if (!container) return;

    // Initialize SVG if needed
    if (!_svg) {
      _svg = document.createElementNS(SVG_NS, 'svg');
      _svg.setAttribute('id', 'village-svg');
      _svg.style.cssText = 'width:min(520px,92vw);height:auto;display:block;border-radius:12px;';
      container.appendChild(_svg);
    } else {
      // Clear and rebuild for variety
      while (_svg.firstChild) _svg.removeChild(_svg.firstChild);
    }

    // New random seed each show
    _seed = 0;
    _startTime = null;
    _startTime = Date.now() % 9999;

    var palIdx = _ri(0, 3);
    var pal = PALETTES[palIdx];
    _buildScene(_svg, pal, _startTime);

    container.classList.add('active');
    _active = true;
    _animFrame = requestAnimationFrame(_animate);
  }

  function hide(onDone) {
    _active = false;
    if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
    var container = document.getElementById('village-loading');
    if (!container) { if (onDone) onDone(); return; }
    container.classList.add('fading');
    setTimeout(function() {
      container.classList.remove('active');
      container.classList.remove('fading');
      if (onDone) onDone();
    }, 600);
  }

  return { show: show, hide: hide };
})();
