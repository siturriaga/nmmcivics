// SEMION(tm) v4 -- UI Module
// All DOM interaction. Depends on: semion-data.js, semion-engine.js,
// semion-apis.js, semion-learn.js (loaded before this file)
// Copyright 2026 Sebastian Iturriaga -- synapsecopilot.com

// ── STATE — delegates to SEMION_STATE where possible ─────────
var voice = 'analytical';
var convoHistory = [];
var msgN = 0;
var isListening = false;
var speechRec = null;
var ohChapters = [];
var ohCurrentChapter = 0;
var ohPlaying = false;

// Getters/setters that use SEMION_STATE
function _getState(k, fallback) {
  return (typeof SEMION_STATE !== 'undefined' && SEMION_STATE[k] !== undefined)
    ? SEMION_STATE[k] : fallback;
}
function _setUIState(k, v) {
  if (typeof SEMION_STATE !== 'undefined') SEMION_STATE[k] = v;
}

// Shims for legacy var references
Object.defineProperty(window, 'currentEncoding', {
  get: function() { return _getState('encoding', null); },
  set: function(v) { _setUIState('encoding', v); }
});
Object.defineProperty(window, 'currentImageURL', {
  get: function() { return _getState('imageURL', null); },
  set: function(v) { _setUIState('imageURL', v); }
});
Object.defineProperty(window, 'currentImagePrompt', {
  get: function() { return _getState('imagePrompt', null); },
  set: function(v) { _setUIState('imagePrompt', v); }
});
Object.defineProperty(window, 'welcomeDismissed', {
  get: function() { return _getState('welcomeDismissed', false); },
  set: function(v) { _setUIState('welcomeDismissed', v); }
});
Object.defineProperty(window, '_lastConvId', {
  get: function() { return _getState('lastConvId', null); },
  set: function(v) { _setUIState('lastConvId', v); }
});
var ohMode    = ''; Object.defineProperty(window, 'ohMode',    { get: function(){ return _getState('ohMode','lecture'); },   set: function(v){ _setUIState('ohMode',v); } });
var ohTopic   = ''; Object.defineProperty(window, 'ohTopic',   { get: function(){ return _getState('ohTopic',''); },         set: function(v){ _setUIState('ohTopic',v); } });
var ohEncoding = null; Object.defineProperty(window, 'ohEncoding', { get: function(){ return _getState('ohEncoding',null); }, set: function(v){ _setUIState('ohEncoding',v); } });

// ── CORE UTILS ───────────────────────────────────────────────
function qs(id) { return document.getElementById(id); }

function setSt(label, cls) {
  var p = qs('hpill');
  if (!p) return;
  p.textContent = label;
  p.className = 'hstatus ' + (cls || 'ready');
}

function setBodyOrder(enc) {
  var d = enc && enc.L5 && enc.L5.dominant_order;
  document.body.className = d === 2 ? 'order2' : d === 3 ? 'order3' : '';
}

function dismissWelcome() {
  if (welcomeDismissed) return;
  welcomeDismissed = true;
  var w = qs('welcome');
  if (w) {
    w.classList.add('gone');
    setTimeout(function() { w.style.display = 'none'; }, 600);
  }
}

function goHome() {
  dismissWelcome();
  var m = qs('msgs');
  if (m) m.innerHTML = '';
  msgN = 0;
  convoHistory = [];
  currentEncoding = null;
  document.body.className = '';
  setSt('READY', 'ready');
  var inp = qs('inp');
  if (inp) inp.focus();
}

function wAsk(q) {
  dismissWelcome();
  setTimeout(function() {
    var inp = qs('inp');
    if (inp) inp.value = q;
    send();
  }, 350);
}

function askQ(q, ctx) {
  dismissWelcome();
  setTimeout(function() { doSend(q, ctx || ''); }, 200);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(function() {});
    return;
  }
  var ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

function shareAnalysis() {
  if (!currentEncoding) return;
  var url = window.location.origin + window.location.pathname +
    '?q=' + encodeURIComponent(currentEncoding.matched || '');
  copyToClipboard(url);
  setSt('LINK COPIED', 'ready');
  setTimeout(function() { setSt('READY', 'ready'); }, 2000);
}

// ── MESSAGE RENDERING ────────────────────────────────────────
function addMsg(role, content, encoding, stream) {
  var id = ++msgN;
  var msgs = qs('msgs');
  if (!msgs) return id;
  var div = document.createElement('div');
  var typeClass = '';
  if (role === 'ai' && classification) {
    if (classification.type === 'HOLD') typeClass = ' hold-type';
    if (classification.type === 'RESPOND') typeClass = ' respond-type';
  }
  var orderClass = '';
  if (role === 'ai' && encoding && encoding.L5) {
    orderClass = ' order' + (encoding.L5.dominant_order || 1);
  }
  div.className = 'msg ' + role + orderClass + typeClass;
  div.id = 'msg-' + id;

  if (role === 'user') {
    div.innerHTML = '<div class="bubble">' + content + '</div>';
  } else {
    var dom = encoding && encoding.L5 && encoding.L5.dominant_order;
    var oc = dom === 2 ? 'og-2' : dom === 3 ? 'og-3' : 'og-1';
    var oLabels = ['', 'Denotative', 'Mythic', 'Obtuse', 'Infrastructural'];
    var orderLabel = dom ? 'ORDER:' + dom + ' &middot; ' + (oLabels[dom] || '') : '';
    var routeLabel = encoding && encoding.routing ? encoding.routing.primary : '';

    // Concept nameplate — appears before response
    var nameplate = '';
    if (encoding && encoding.matched) {
      var npMI = encoding.L5 && encoding.L5.myth_index;
      var npCol = npMI ? _mythColor(npMI) : null;
      nameplate = '<div class="concept-nameplate">' +
        encoding.matched.toUpperCase() +
        (npCol ? '<span class="np-mi ' + npCol.cls + '">' + Math.round(npMI*100) + '%</span>' : '') +
        '</div>';
    }

    var html = '';
    if (nameplate) html += nameplate;
    if (orderLabel) {
      html += '<div class="order-glyph ' + oc + '">' + orderLabel +
        (routeLabel ? ' &middot; ' + routeLabel : '') + '</div>';
    }
    html += '<div class="bubble" id="bubble-' + id + '">' +
      content + (stream ? '<span class="cursor"></span>' : '') + '</div>';

    if (encoding) {
      html += '<button class="reveal-btn" onclick="toggleAP(' + id + ')">' +
        '<span>&#9672;</span> Semiotic Analysis</button>';
      html += '<div class="analysis-panel" id="ap-' + id + '">' + buildAPHtml(encoding) + '</div>';
      html += '<div class="fb-row">' +
        '<button class="fb-tiny" onclick="rFB(' + id + ',\'positive\',this)">&#10003; accurate</button>' +
        '<button class="fb-tiny" onclick="rFB(' + id + ',\'negative\',this)">&#10007; wrong</button>' +
        '<button class="fb-tiny" onclick="shareAnalysis()">&#8599; share</button>';
      if (encoding.matched) {
        html += '<button class="fb-tiny" onclick="wAsk(\'Generate an image of ' +
          encoding.matched.replace(/'/g, "\\'") + '\')">&#9672; image</button>';
      }
      html += '</div>';
    }
    div.innerHTML = html;
  }

  msgs.appendChild(div);
  var conv = qs('conv');
  if (conv) conv.scrollTop = 99999;
  return id;
}

function buildAPHtml(enc) {
  if (!enc || !enc.L5) return '';
  var L5 = enc.L5;
  var mi = L5.myth_index || 0;
  var mc = mi > 0.7 ? 'rgba(220,100,100,.8)' : mi > 0.4 ? 'rgba(201,160,80,.8)' : 'rgba(80,180,100,.8)';
  var dom = L5.dominant_order || 1;
  var orders = [L5.order_1 || 0, L5.order_2 || 0, L5.order_3 || 0, L5.order_4 || 0];
  var codes = L5.codes || {};
  var codeKeys = Object.keys(codes);

  var html = '<div class="ap-row">';
  html += '<span class="ap-pill" style="background:rgba(201,160,80,.08);color:rgba(201,160,80,.9);border-color:rgba(201,160,80,.2)">myth ' + Math.round(mi * 100) + '%</span>';
  html += '<span class="ap-pill" style="background:rgba(128,96,192,.08);color:rgba(180,140,240,.9);border-color:rgba(128,96,192,.2)">ORDER:' + dom + '</span>';
  html += '<span class="ap-pill" style="border-color:var(--border);color:var(--parchment-dim)">' + (enc.routing ? enc.routing.primary : '') + '</span>';
  if (enc.derived) html += '<span class="ap-pill" style="border-color:rgba(201,160,80,.2);color:rgba(201,160,80,.6)">NSM-derived</span>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0">';
  for (var i = 0; i < 4; i++) {
    html += '<div style="background:rgba(234,226,214,.02);border-radius:6px;padding:6px;text-align:center;border:1px solid var(--border)">' +
      '<div style="font-size:16px;color:rgba(234,226,214,.8)">' + Math.round(orders[i] * 100) + '%</div>' +
      '<div style="font-size:7px;color:rgba(234,226,214,.35);letter-spacing:.12em">ORDER:' + (i + 1) + '</div></div>';
  }
  html += '</div>';

  if (L5.etymology) {
    html += '<div style="font-size:9px;color:rgba(201,160,80,.6);margin:4px 0">Etymology: <em>' +
      L5.etymology.root + '</em> (' + L5.etymology.language + ') &mdash; ' +
      (L5.etymology.trace || L5.etymology.literal) + '</div>';
  }
  if (L5.denotation) {
    html += '<div style="font-size:11px;color:var(--parchment-dim);margin:4px 0">' + L5.denotation.slice(0, 120) + '</div>';
  }
  if (L5.note) {
    html += '<div style="font-size:10px;color:rgba(234,226,214,.4);font-style:italic;margin:4px 0;padding:6px;background:rgba(234,226,214,.02);border-radius:6px">' + L5.note.slice(0, 200) + '</div>';
  }
  if (L5.cultural_anchor) {
    html += '<div style="font-size:8px;color:var(--parchment-dim);letter-spacing:.12em">Anchor: ' + L5.cultural_anchor.replace(/_/g, ' ') + '</div>';
  }
  if (L5.collapsed_reading) {
    html += '<div style="font-size:8px;color:rgba(128,96,192,.7);letter-spacing:.12em;margin-top:3px">Collapsed: ' + L5.collapsed_reading.replace(/_/g, ' ') + '</div>';
  }
  return html;
}

function updateBubble(id, content, done) {
  var bubble = qs('bubble-' + id);
  if (!bubble) return;
  var safe = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  bubble.innerHTML = safe + (done ? '' : '<span class="cursor"></span>');
  var conv = qs('conv');
  if (conv) conv.scrollTop = 99999;
}

function toggleAP(id) {
  var p = qs('ap-' + id);
  if (p) p.classList.toggle('open');
}

function rFB(id, signal, btn) {
  if (btn) { btn.style.opacity = '.4'; btn.disabled = true; }
  if (_lastConvId && typeof recordFeedback === 'function') {
    var concept = currentEncoding && currentEncoding.matched;
    var mi = currentEncoding && currentEncoding.L5 && currentEncoding.L5.myth_index;
    recordFeedback(_lastConvId, signal, concept, mi != null ? mi : null).catch(function() {});
  }
}

function addSourceBadges(mid, sources, synthesis) {
  var container = qs('msg-' + mid);
  if (!container || !sources || !sources.length) return;
  var wrap = document.createElement('div');
  wrap.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:3px';
  var usedSet = {};
  if (synthesis && synthesis.sources_used) {
    for (var i = 0; i < synthesis.sources_used.length; i++) usedSet[synthesis.sources_used[i]] = true;
  }
  for (i = 0; i < sources.length; i++) {
    if (!sources[i].content) continue;
    var badge = document.createElement('span');
    badge.className = 'source-badge' + (usedSet[sources[i].source] ? ' used' : '');
    badge.textContent = sources[i].source;
    badge.title = 'Reliability: ' + Math.round((sources[i].reliability || 0) * 100) + '%';
    wrap.appendChild(badge);
  }
  if (wrap.children.length) container.appendChild(wrap);
}

function addFollowUpChips(mid, questions) {
  var container = qs('msg-' + mid);
  if (!container || !questions || !questions.length) return;
  var wrap = document.createElement('div');
  wrap.className = 'followup-chips';
  for (var i = 0; i < questions.length; i++) {
    (function(q) {
      var chip = document.createElement('button');
      chip.className = 'followup-chip';
      chip.textContent = q.slice(0, 60) + (q.length > 60 ? '\u2026' : '');
      chip.onclick = function() {
        var inp = qs('inp');
        if (inp) inp.value = q;
        send();
      };
      wrap.appendChild(chip);
    })(questions[i]);
  }
  container.appendChild(wrap);
}

function addQuantumPanel(mid, encoding, synthesis) {
  var container = qs('msg-' + mid);
  if (!container || !encoding || !encoding.L5) return;
  var L5 = encoding.L5;

  var panel = document.createElement('div');
  panel.className = 'quantum-panel';
  panel.style.display = 'none';

  var html = '<div style="color:rgba(128,96,192,.8);letter-spacing:.2em;margin-bottom:8px;font-size:9px">QUANTUM ENCODING</div>';

  if (L5.wavefunction && L5.wavefunction.amplitudes) {
    html += '<div style="margin-bottom:6px;color:rgba(234,226,214,.5);font-size:8px">WAVEFUNCTION</div>';
    var amps = L5.wavefunction.amplitudes;
    var keys = Object.keys(amps);
    for (var i = 0; i < keys.length; i++) {
      var d = amps[keys[i]];
      var barW = Math.round(d.amplitude * 80);
      var miPct = Math.round(d.myth_index * 100);
      html += '<div style="display:flex;gap:8px;align-items:center;margin:3px 0">';
      html += '<span style="width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px;color:rgba(234,226,214,.6)">' + keys[i].replace(/_/g, ' ') + '</span>';
      html += '<div style="height:3px;background:rgba(128,96,192,.4);border-radius:999px;width:' + barW + 'px;flex-shrink:0"></div>';
      html += '<span style="color:rgba(201,160,80,.7);font-size:8px">' + miPct + '%</span></div>';
    }
  }

  if (L5.affects) {
    html += '<div style="margin-top:8px;margin-bottom:4px;color:rgba(234,226,214,.5);font-size:8px">AFFECT VECTOR</div>';
    var affKeys = ['power_to_question', 'power_to_imagine_alternatives', 'power_to_act', 'power_to_connect'];
    var affLabels = ['question', 'imagine', 'act', 'connect'];
    for (i = 0; i < affKeys.length; i++) {
      var v = L5.affects[affKeys[i]] || 0;
      var col = v > 0 ? 'rgba(52,211,153,.8)' : 'rgba(220,100,100,.8)';
      html += '<div style="display:flex;gap:6px;align-items:center;margin:2px 0;font-size:8px">';
      html += '<span style="width:70px;color:rgba(234,226,214,.5)">' + affLabels[i] + '</span>';
      html += '<span style="color:' + col + '">' + (v > 0 ? '+' : '') + v.toFixed(2) + '</span></div>';
    }
  }

  if (synthesis && synthesis.live_myth_index && synthesis.source_count > 0) {
    html += '<div style="margin-top:8px;font-size:8px;color:rgba(234,226,214,.5)">CROSS-SOURCE: <span style="color:var(--gold)">' +
      Math.round(synthesis.live_myth_index * 100) + '%</span> (n=' + synthesis.source_count +
      ', spread=' + Math.round(synthesis.source_divergence * 100) + '%)</div>';
    if (synthesis.disagreement) {
      html += '<div style="margin-top:4px;font-size:7px;color:rgba(234,226,214,.3);line-height:1.5">' + synthesis.disagreement + '</div>';
    }
  }

  if (L5.entanglements && L5.entanglements.length) {
    html += '<div style="margin-top:8px;font-size:8px;color:rgba(234,226,214,.5)">ENTANGLED</div>';
    for (i = 0; i < Math.min(4, L5.entanglements.length); i++) {
      var ent = L5.entanglements[i];
      html += '<span style="display:inline-block;margin:2px;padding:2px 8px;border-radius:999px;border:1px solid rgba(128,96,192,.2);font-size:7px;color:rgba(180,140,240,.7)">' +
        ent.concept + ' (' + ent.type + ')</span>';
    }
  }

  panel.innerHTML = html;

  var btn = document.createElement('button');
  btn.className = 'reveal-btn';
  btn.style.marginTop = '8px';
  btn.innerHTML = '<span>&#11041;</span> Quantum Analysis';
  btn.onclick = (function(p, b) {
    return function() {
      var open = p.style.display !== 'none' && p.style.display !== '';
      p.style.display = open ? 'none' : 'block';
      b.innerHTML = open ? '<span>&#11041;</span> Quantum Analysis' : '<span>&#11041;</span> Hide';
    };
  })(panel, btn);

  container.appendChild(btn);
  container.appendChild(panel);
}


// ── MYTH INDEX GAUGE (Sprint 2) ──────────────────────────────

function _mythColor(mi) {
  if (mi > 0.85) return { color: 'rgba(220,60,60,.90)', cls: 'mi-red', track: '#dc3c3c' };
  if (mi > 0.65) return { color: 'rgba(220,130,60,.90)', cls: 'mi-orange', track: '#dc823c' };
  if (mi > 0.40) return { color: 'rgba(201,160,80,.90)', cls: 'mi-amber', track: '#c9a050' };
  return { color: 'rgba(52,211,153,.85)', cls: 'mi-cold', track: '#34d399' };
}

function _mythDesc(mi) {
  if (mi > 0.85) return 'Near-total ideological loading';
  if (mi > 0.65) return 'High ideological loading';
  if (mi > 0.40) return 'Moderate ideological loading';
  if (mi > 0.20) return 'Lower loading — mostly denotative';
  return 'Predominantly denotative';
}

function buildMythGauge(mi) {
  if (!mi && mi !== 0) return '';
  var pct = Math.round(mi * 100);
  var col = _mythColor(mi);
  // Arc: 180deg semicircle, r=36, cx=50, cy=52
  var r = 36, cx = 50, cy = 52;
  var angle = mi * 180; // 0-180 degrees
  var rad = (angle - 90) * Math.PI / 180;
  var ex = cx + r * Math.cos(rad);
  var ey = cy + r * Math.sin(rad);
  var largeArc = angle > 180 ? 1 : 0;
  var arcD = 'M ' + (cx - r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + ex.toFixed(1) + ' ' + ey.toFixed(1);

  return '<div class="myth-gauge-wrap">' +
    '<svg class="myth-gauge-svg" width="100" height="58" viewBox="0 0 100 58">' +
    '<path d="M14 52 A36 36 0 0 1 86 52" fill="none" stroke="rgba(234,226,214,.08)" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="' + arcD + '" fill="none" stroke="' + col.track + '" stroke-width="6" stroke-linecap="round" opacity="0.85"/>' +
    '<circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="4" fill="' + col.track + '"/>' +
    '</svg>' +
    '<div class="myth-gauge-info">' +
    '<div class="myth-gauge-score" style="color:' + col.color + '">' + pct + '%</div>' +
    '<div class="myth-gauge-label">MYTH INDEX</div>' +
    '<div class="myth-gauge-desc">' + _mythDesc(mi) + '</div>' +
    '</div></div>';
}

function buildWavefunctionChart(wf) {
  if (!wf || !wf.amplitudes) return '';
  var html = '<div class="wf-chart">';
  var keys = Object.keys(wf.amplitudes);
  keys.forEach(function(k) {
    var d = wf.amplitudes[k];
    var col = _mythColor(d.myth_index);
    var barW = Math.round(d.amplitude * 100);
    html += '<div class="wf-row">' +
      '<div class="wf-label">' + k.replace(/_/g,' ') + '</div>' +
      '<div class="wf-track"><div class="wf-fill" style="width:' + barW + '%;background:' + col.track + '"></div></div>' +
      '<div class="wf-mi">' + Math.round(d.myth_index*100) + '%</div>' +
      '</div>';
  });
  return html + '</div>';
}

function buildAffectGrid(affects) {
  if (!affects) return '';
  var items = [
    { key: 'power_to_question',              label: 'QUESTION' },
    { key: 'power_to_imagine_alternatives',  label: 'IMAGINE' },
    { key: 'power_to_act',                   label: 'ACT' },
    { key: 'power_to_connect',               label: 'CONNECT' }
  ];
  var html = '<div class="affect-grid">';
  items.forEach(function(item) {
    var v = affects[item.key] || 0;
    var pos = v > 0;
    var pct = Math.min(100, Math.abs(v) * 100);
    var trackColor = pos ? '#34d399' : '#dc3c3c';
    var trackStart = pos ? 50 : (50 - pct/2);
    html += '<div class="affect-item">' +
      '<div class="affect-label">' + item.label + '</div>' +
      '<div class="affect-bar"><div class="affect-fill" style="left:' + (pos?'50':''+((50-pct)+'')) + '%;width:' + pct/2 + '%;background:' + trackColor + '"></div></div>' +
      '<div class="affect-val ' + (pos?'affect-pos':'affect-neg') + '">' + (v>0?'+':'') + v.toFixed(2) + '</div>' +
      '</div>';
  });
  return html + '</div>';
}

function buildEtymBox(etym) {
  if (!etym) return '';
  return '<div class="etym-box">' +
    '<div class="etym-root">' + (etym.root || '') + '</div>' +
    '<div class="etym-literal">' + (etym.language||'') + ' — ' + (etym.literal||'') + '</div>' +
    (etym.trace ? '<div class="etym-trace">' + etym.trace + '</div>' : '') +
    '</div>';
}

function buildGenealogy(gen) {
  if (!gen) return '';
  var html = '<div class="genealogy-line">';
  if (gen.pre_history) html += '<div class="gen-node"><div class="gen-date">Before</div><div class="gen-text">' + gen.pre_history + '</div></div>';
  if (gen.invention_moment) html += '<div class="gen-node"><div class="gen-date">' + gen.invention_moment + '</div><div class="gen-text">' + (gen.invention_context||gen.inventor_position||'') + '</div></div>';
  if (gen.naturalization_moment) html += '<div class="gen-node"><div class="gen-date">' + gen.naturalization_moment + '</div><div class="gen-text">Naturalized — contested becomes common sense.</div></div>';
  if (gen.current_formation) html += '<div class="gen-node"><div class="gen-date">Now</div><div class="gen-text">' + gen.current_formation + '</div></div>';
  return html + '</div>';
}

function closeAllSheets() {
  var backdrop = qs('sheet-backdrop');
  if (backdrop) backdrop.classList.remove('visible');
  ['history-panel','enc-panel','omnihub-panel'].forEach(function(id) {
    var el = qs(id); if (el) el.classList.remove('open');
  });
}

// ── MAIN SEND PIPELINE ───────────────────────────────────────
function send() {
  if (!welcomeDismissed) dismissWelcome();
  var inp = qs('inp');
  if (!inp) return;
  var txt = inp.value.trim();
  if (!txt) return;
  inp.value = '';
  inp.style.height = '48px';
  doSend(txt, '');
}

function doSend(txt, ctxOverride) {
  if (!welcomeDismissed) dismissWelcome();
  addMsg('user', txt.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  setSt('THINKING\u2026', 'thinking');
  var sbtn = qs('sbtn');
  if (sbtn) sbtn.disabled = true;

  var runPipeline = function() { _runPipeline(txt, ctxOverride || ''); };

  if (typeof getCachedResponse === 'function') {
    getCachedResponse(txt, 'auto').then(function(cached) {
      if (cached) {
        var mid = addMsg('ai', '', null, true);
        var words = cached.split(' ');
        var i = 0;
        var reveal = function() {
          if (i >= words.length) {
            updateBubble(mid, cached, true);
            setSt('READY', 'ready');
            if (sbtn) sbtn.disabled = false;
            var inp2 = qs('inp'); if (inp2) inp2.focus();
            return;
          }
          updateBubble(mid, words.slice(0, i + 1).join(' '), false);
          i++;
          if (i % 8 === 0) setTimeout(reveal, 12); else reveal();
        };
        reveal();
      } else {
        runPipeline();
      }
    }).catch(runPipeline);
  } else {
    runPipeline();
  }
}

function _runPipeline(txt, ctxOverride) {
  var msgs = qs('msgs');

  // ── Show village animation ──────────────────────────────
  var thinkDiv = document.createElement('div');
  thinkDiv.className = 'msg ai';
  thinkDiv.id = 'think-msg';
  thinkDiv.innerHTML = '<div id="village-anim-container" style="width:100%;height:200px;border-radius:12px;overflow:hidden;margin:4px 0;position:relative;"></div><div style="font-family:Cormorant Garamond,serif;font-style:italic;font-size:13px;color:rgba(201,160,80,.5);text-align:center;padding:6px 0;letter-spacing:.05em">Reading the structure of meaning…</div>';
  if (msgs) msgs.appendChild(thinkDiv);
  var conv = qs('conv'); if (conv) conv.scrollTop = 99999;

  // Start village animation
  setTimeout(function() {
    var container = document.getElementById('village-anim-container');
    if (container && typeof startVillageAnimation === 'function') startVillageAnimation(container);
  }, 50);

  setTimeout(function() {
    try {
      var lang = (typeof detectLanguageCode === 'function') ? detectLanguageCode(txt) : 'en';
      var ctxKey = ctxOverride || ((typeof detectCtx === 'function') ? detectCtx(txt) : '');

      // ── RHIZOME: Classifier with encoder feedback ───────
      setSt('ANALYZING…', 'thinking');
      var classification = classify(txt);
      classification.languageCode = lang;

      if (classification.type === 'IMAGE') {
        if (typeof _village !== 'undefined') _village.hide(null);
var _pl2 = qs('process-line'); if (_pl2) _pl2.classList.remove('active');
        var sbtn2 = qs('sbtn'); if (sbtn2) sbtn2.disabled = false;
        _handleImageRequest(txt); return;
      }

      // ── RHIZOME: Encode with pre-activated entanglements ─
      var encoding = encodeUnit(txt, ctxKey, SP, CA, classification);
      // Merge pre-activated entanglements from classifier feedback
      if (classification.activatedEnts && encoding.L5) {
        encoding.L5._activatedEnts = classification.activatedEnts;
      }
      _setState({ encoding: encoding });
      setBodyOrder(encoding);

      // ── RHIZOME: Streaming synthesis ─────────────────────
      // Start generating the response arc immediately
      // while sources arrive in background
      var synthState = (typeof createSynthesisState === 'function')
        ? createSynthesisState((encoding.L5 && encoding.L5.myth_index) || 0.5)
        : null;

      // Begin response arc planning from encoding alone (no sources yet)
      var earlyResponse = null;
      var mid = null;
      var responseStarted = false;

      function startStreaming(response) {
        if (responseStarted) return;
        responseStarted = true;
        if (typeof _village !== 'undefined') _village.hide(null);
var _pl2 = qs('process-line'); if (_pl2) _pl2.classList.remove('active');
        mid = addMsg('ai', '', encoding, true);
        var words = response.split(' ');
        var idx2 = 0;
        function reveal() {
          if (idx2 >= words.length) {
            updateBubble(mid, response, true);
            _afterGenerate(mid, encoding, synthState || {}, [], classification, txt, response);
            return;
          }
          updateBubble(mid, words.slice(0, idx2+1).join(' '), false);
          idx2++;
          if (idx2 % 5 === 0) setTimeout(reveal, 10); else reveal();
        }
        reveal();
      }

      // Source arrival handler — update synthesis in real time
      function onSourceReceived(source) {
        if (synthState && typeof updateSynthesis === 'function') {
          updateSynthesis(synthState, source);
        }
      }

      // All sources complete
      function onComplete(sources) {
        if (synthState && typeof finalizeSynthesis === 'function') {
          finalizeSynthesis(synthState);
        }
        var finalSynth = synthState || (typeof synthesize === 'function' ? synthesize(encoding, sources || []) : {});
        var response = generate(encoding, finalSynth, classification, sources || []);

        // If streaming already started with early response, update the bubble
        if (responseStarted && mid !== null) {
          updateBubble(mid, response, true);
          // Refresh analysis panel
          var ap = qs('ap-' + mid);
          if (ap) ap.innerHTML = buildAPHtml(encoding);
          _afterGenerate(mid, encoding, finalSynth, sources || [], classification, txt, response);
        } else {
          // No early response yet — stream the final response
          startStreaming(response);
        }
        setSt('READY', 'ready');
        var sbtn3 = qs('sbtn'); if (sbtn3) sbtn3.disabled = false;
        var inp3 = qs('inp'); if (inp3) inp3.focus();
      }

      // Start parallel streaming retrieval if needed
      if (classification.needsRetrieval &&
          typeof retrieveParallelStreaming === 'function' &&
          classification.retrievalSources && classification.retrievalSources.length) {

        setSt('RETRIEVING…', 'thinking');

        // Generate early response from encoding alone while retrieval runs
        setTimeout(function() {
          if (!responseStarted) {
            setSt('GENERATING…', 'streaming');
            earlyResponse = generate(encoding, synthState || {source_count:0}, classification, []);
            startStreaming(earlyResponse);
          }
        }, 400); // 400ms — if retrieval takes longer, show early response

        retrieveParallelStreaming(txt, classification.retrievalSources, onSourceReceived, onComplete);

      } else {
        // No retrieval needed — go straight to generate
        setSt('GENERATING…', 'streaming');
        var response2 = generate(encoding, {source_count:0, disagreement:null, live_myth_index: (encoding.L5 && encoding.L5.myth_index)||0.5}, classification, []);
        startStreaming(response2);
        setTimeout(function() {
          setSt('READY', 'ready');
          var sb = qs('sbtn'); if (sb) sb.disabled = false;
          var ip = qs('inp'); if (ip) ip.focus();
        }, 50);
      }

    } catch(err) {
      _handlePipelineError(thinkDiv, err);
    }
  }, 60);
}

function _afterGenerate(mid, encoding, synthesis, sources, classification, txt, response) {
  var drift = checkMythDrift(response, encoding);
  if (drift) {
    var bubble = qs('bubble-' + mid);
    if (bubble) {
      var driftEl = document.createElement('div');
      driftEl.className = 'drift-note';
      driftEl.textContent = drift;
      bubble.after(driftEl);
    }
  }

  addSourceBadges(mid, sources, synthesis);

  var followUps = generateFollowUps(encoding, classification);
  if (followUps.length) addFollowUpChips(mid, followUps);

  if (encoding.L5 && (encoding.L5.wavefunction || (encoding.L5.myth_index || 0) > 0.65)) {
    addQuantumPanel(mid, encoding, synthesis);
  }

  if (typeof shouldOfferOmniHub === 'function' && shouldOfferOmniHub(encoding)) {
    setTimeout(function() { offerOmniHub(txt, encoding); }, 800);
  }

  convoHistory.push({ user: txt, assistant: response });
  if (convoHistory.length > 10) convoHistory.shift();

  if (typeof cacheResponse === 'function') {
    cacheResponse(txt, classification.type, response, 86400000).catch(function() {});
  }

  if (typeof logInteraction === 'function') {
    logInteraction({
      question: txt,
      type: classification.type,
      concept: encoding.matched,
      myth_index: encoding.L5 && encoding.L5.myth_index,
      dominant_order: encoding.L5 && encoding.L5.dominant_order,
      cultural_anchor: encoding.L5 && encoding.L5.cultural_anchor,
      sources_used: synthesis.sources_used || [],
      response: response,
      derived: encoding.derived
    }).then(function(id) { _lastConvId = id; }).catch(function() {});
  }

  setSt('READY', 'ready');
  var sbtn = qs('sbtn'); if (sbtn) sbtn.disabled = false;
  var inp = qs('inp'); if (inp) inp.focus();
}

function _handlePipelineError(thinkDiv, err) {
  if (typeof _village !== 'undefined') _village.hide(null);
var _pl = qs('process-line'); if (_pl) _pl.classList.remove('active');
  setSt('ERROR', 'error');
  var msg = (err && err.message) || 'Unknown error';
  addMsg('ai',
    '<div style="font-family:DM Mono,monospace;font-size:12px;color:rgba(220,100,100,.9);' +
    'padding:12px 16px;background:rgba(168,48,48,.06);border:1px solid rgba(168,48,48,.2);' +
    'border-radius:10px"><strong>&#9888; Error</strong><br>' + msg + '</div>',
    null, false);
  console.error('SEMION:', err);
  var sbtn = qs('sbtn'); if (sbtn) sbtn.disabled = false;
  var inp = qs('inp'); if (inp) inp.focus();
}

// ── IMAGE ────────────────────────────────────────────────────
function _handleImageRequest(txt) {
  var concept = txt.replace(/generate|create|make|draw|visualize|image|picture|photo|visual|me|an?\s|of\s/gi, '').trim() || 'concept';
  var encoding = encodeUnit(concept, '', SP, CA, { type: 'IMAGE' });
  currentEncoding = encoding;
  var imgData = generateImagePrompt(encoding);
  var url = generatePollinationsURL(imgData.prompt);
  currentImageURL = url;
  currentImagePrompt = imgData.prompt;

  openImagePanel(url, imgData.prompt, concept);

  var mid = addMsg('ai', '', encoding, false);
  updateBubble(mid,
    '<div style="font-family:DM Mono,monospace;font-size:10px;color:rgba(201,160,80,.7);margin-bottom:8px">IMAGE &mdash; Pollinations.AI (free, no key)</div>' +
    '<div style="font-style:italic;color:var(--parchment-dim);font-size:13px;margin-bottom:10px">' + imgData.prompt.slice(0, 120) + '\u2026</div>' +
    '<img src="' + url + '" style="max-width:100%;border-radius:10px;margin-top:6px" loading="lazy" ' +
    'onerror="this.style.display=\'none\'" alt="' + concept + '">' +
    '<div style="margin-top:8px;display:flex;gap:8px">' +
    '<button class="share-btn" onclick="copyToClipboard(\'' + url.replace(/'/g, "\\'") + '\')">Copy URL</button>' +
    '<button class="share-btn" onclick="window.open(\'' + url.replace(/'/g, "\\'") + '\',\'_blank\')">Full Size</button>' +
    '</div>',
    false);
  setSt('READY', 'ready');
}

function openImagePanel(url, prompt, concept) {
  var panel = qs('image-panel');
  var img = qs('gen-image');
  var loading = qs('img-loading');
  var promptEl = qs('img-prompt-display');
  if (!panel) return;
  img.style.display = 'none';
  loading.style.display = 'block';
  loading.textContent = 'GENERATING IMAGE\u2026';
  if (promptEl) promptEl.textContent = prompt;
  panel.classList.add('open');
  img.onload = function() { loading.style.display = 'none'; img.style.display = 'block'; };
  img.onerror = function() { loading.textContent = '\u26a0 Image failed \u2014 Pollinations.AI may be busy. Try again.'; };
  img.src = url;
}

function closeImagePanel() {
  var p = qs('image-panel');
  if (p) p.classList.remove('open');
}

function copyImageURL() { copyToClipboard(currentImageURL || ''); }
function copyImagePrompt() { copyToClipboard(currentImagePrompt || ''); }
function openImageFull() { if (currentImageURL) window.open(currentImageURL, '_blank'); }

function generatePollinationsFromOH() {
  var promptText = qs('oh-prompt-text') && qs('oh-prompt-text').textContent;
  if (!promptText) return;
  currentImageURL = generatePollinationsURL(promptText);
  currentImagePrompt = promptText;
  openImagePanel(currentImageURL, promptText, ohTopic);
}

// ── VOICE ────────────────────────────────────────────────────
function toggleVoice() {
  var SpeechRec2 = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec2) {
    addMsg('ai',
      '<div style="font-family:DM Mono,monospace;font-size:11px;color:rgba(220,100,100,.9);padding:10px">' +
      'Voice input requires Chrome or Edge.</div>',
      null, false);
    return;
  }
  if (isListening) { if (speechRec) speechRec.stop(); return; }
  speechRec = new SpeechRec2();
  speechRec.continuous = false;
  speechRec.interimResults = true;
  speechRec.onstart = function() {
    isListening = true;
    var b = qs('voice-btn'); if (b) b.classList.add('listening');
    setSt('LISTENING\u2026', 'thinking');
  };
  speechRec.onresult = function(e) {
    var t = Array.from(e.results).map(function(r) { return r[0].transcript; }).join('');
    var inp = qs('inp'); if (inp) inp.value = t;
  };
  speechRec.onend = function() {
    isListening = false;
    var b = qs('voice-btn'); if (b) b.classList.remove('listening');
    setSt('READY', 'ready');
    var txt = qs('inp') && qs('inp').value.trim();
    if (txt) setTimeout(send, 300);
  };
  speechRec.onerror = function() {
    isListening = false;
    var b = qs('voice-btn'); if (b) b.classList.remove('listening');
    setSt('READY', 'ready');
  };
  speechRec.start();
}

// ── HISTORY ──────────────────────────────────────────────────
function openHistory() {
  var p = qs('history-panel'); if (p) p.classList.add('open');
  var b = qs('sheet-backdrop'); if (b) b.classList.add('visible');
  var list = qs('history-list');
  if (typeof getRecentConversations !== 'function' || !list) return;
  getRecentConversations(20).then(function(convs) {
    if (!convs.length) {
      list.innerHTML = '<div style="font-family:DM Mono,monospace;font-size:10px;color:rgba(234,226,214,.2);text-align:center;padding:20px">No history yet</div>';
      return;
    }
    list.innerHTML = convs.map(function(c) {
      var q = (c.question || '').slice(0, 60);
      var safe = q.replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/</g, '&lt;');
      var meta = (c.type || '') + ' &middot; ' + new Date(c.timestamp).toLocaleDateString() +
        (c.myth_index ? ' &middot; myth:' + Math.round(c.myth_index * 100) + '%' : '');
      return '<div class="hist-item" onclick="closeHistory();setTimeout(function(){askQ(\'' + safe + '\')},200)">' +
        '<div class="hist-q">' + q + '</div><div class="hist-meta">' + meta + '</div></div>';
    }).join('');
  }).catch(function() {});
}
function closeHistory() {
  var p = qs('history-panel'); if (p) p.classList.remove('open');
  var b = qs('sheet-backdrop'); if (b) b.classList.remove('visible');
}

// ── ENCODER ──────────────────────────────────────────────────
function openEnc() {
  var p = qs('enc-panel'); if (p) p.classList.add('open');
  var be = qs('bn-enc'); if (be) be.classList.add('on');
  var bc = qs('bn-chat'); if (bc) bc.classList.remove('on');
}
function closeEnc() {
  var p = qs('enc-panel'); if (p) p.classList.remove('open');
  var bc = qs('bn-chat'); if (bc) bc.classList.add('on');
  var be = qs('bn-enc'); if (be) be.classList.remove('on');
}

function runEnc() {
  var t = qs('einp') && qs('einp').value.trim();
  var ctx = (qs('ectx') && qs('ectx').value) || '';
  if (!t) return;
  var out = qs('enc-out');
  if (out) out.innerHTML = '<div style="text-align:center;padding:20px;font-family:DM Mono,monospace;font-size:10px;color:rgba(201,160,80,.5)">ENCODING\u2026</div>';
  setTimeout(function() {
    var enc = encodeUnit(t, ctx, SP, CA, { type: 'ANALYZE' });
    if (out) out.innerHTML = ucRender(enc);
  }, 100);
}

function qEnc(text, ctx) {
  var e = qs('einp'); if (e) e.value = text;
  var c = qs('ectx'); if (c && ctx) c.value = ctx;
  runEnc();
}

function ucRender(enc) {
  if (!enc || !enc.L5) return '<div style="padding:20px;color:rgba(234,226,214,.3);font-family:DM Mono,monospace;font-size:10px">No encoding</div>';
  var L5 = enc.L5;
  var mi = L5.myth_index || 0;
  var mc = mi > 0.7 ? 'rgba(220,100,100,.8)' : mi > 0.4 ? 'rgba(201,160,80,.8)' : 'rgba(80,180,100,.8)';
  var dom = L5.dominant_order || 1;
  var o1 = L5.order_1 || 0, o2 = L5.order_2 || 0, o3 = L5.order_3 || 0;
  var codes = L5.codes || {};
  var codeKeys = Object.keys(codes);
  var orderBars = [[o1, 'rgba(201,160,80,.7)'], [o2, 'rgba(220,100,100,.7)'], [o3, 'rgba(128,96,192,.7)']];

  var html = '<div class="uc ' + (dom === 3 ? 'o3' : dom === 2 ? 'o2' : '') + '">';
  html += '<div class="uctop">';
  html += '<span class="utag ut' + dom + '">' + ['', 'ORDER:1', 'ORDER:2', 'ORDER:3', 'ORDER:4'][dom] + '</span>';
  html += '<span class="usrc">' + ((enc.matched || (enc.text && enc.text.slice(0, 25)) || 'derived').replace(/</g, '&lt;')) + '</span>';
  if (enc.derived) html += '<span class="utag" style="background:rgba(201,160,80,.08);color:rgba(201,160,80,.6);border:1px solid rgba(201,160,80,.2)">NSM</span>';
  html += '</div>';

  html += '<div class="umets">';
  html += '<div class="umet"><div class="uv" style="color:' + mc + '">' + Math.round(mi * 100) + '%</div><div class="ulb">myth</div></div>';
  html += '<div class="umet"><div class="uv" style="color:rgba(80,180,100,.8)">' + Math.round((L5.certainty_index || 0) * 100) + '%</div><div class="ulb">certainty</div></div>';
  html += '<div class="umet"><div class="uv" style="color:rgba(128,96,192,.8)">' + Math.round((L5.punctum || 0) * 100) + '%</div><div class="ulb">punctum</div></div>';
  html += '<div class="umet"><div class="uv" style="color:rgba(160,100,220,.8)">' + Math.round((L5.obtuse_index || 0) * 100) + '%</div><div class="ulb">obtuse</div></div>';
  html += '</div>';

  html += '<div class="ubars">';
  for (var i = 0; i < orderBars.length; i++) {
    html += '<div class="ubar"><div class="ublbl">ORDER:' + (i + 1) + '</div>' +
      '<div class="ubtrk"><div class="ubfill" style="width:' + Math.round(orderBars[i][0] * 100) + '%;background:' + orderBars[i][1] + '"></div></div>' +
      '<div class="ubval">' + Math.round(orderBars[i][0] * 100) + '%</div></div>';
  }
  html += '</div>';

  html += '<div class="ucodes">';
  for (i = 0; i < codeKeys.length; i++) {
    var cv = parseFloat(codes[codeKeys[i]]) || 0;
    html += '<span class="cpill" style="border-color:rgba(201,160,80,' + (cv * 0.6) + ');color:rgba(201,160,80,' + (cv * 0.9) + ')">' + codeKeys[i] + ':' + Math.round(cv * 100) + '%</span>';
  }
  html += '</div>';

  if (L5.denotation) html += '<div class="udenot"><strong style="color:rgba(234,226,214,.5)">Denotation:</strong> ' + L5.denotation.slice(0, 200) + '</div>';
  if (L5.connotation) html += '<div class="uconnot">' + L5.connotation.slice(0, 200) + '</div>';
  if (L5.etymology) html += '<div style="font-size:9px;color:rgba(201,160,80,.6);padding:5px 8px;background:rgba(201,160,80,.04);border-radius:5px;margin-bottom:6px"><strong>Etymology:</strong> ' + L5.etymology.root + ' (' + L5.etymology.language + ') &mdash; ' + (L5.etymology.trace || L5.etymology.literal) + '</div>';
  if (dom === 3 && L5.note) html += '<div class="uo3box"><div class="uo3tit">&#10022; Order:3 &mdash; The Angelic Surplus</div><div style="font-size:11px;color:rgba(234,226,214,.6)">' + L5.note.slice(0, 200) + '</div></div>';
  else if (L5.note) html += '<div class="unote">' + L5.note.slice(0, 220) + '</div>';
  html += '<div class="urou"><span style="font-size:9px;color:rgba(234,226,214,.3)">&rarr;</span><span class="uroname">' + (enc.routing && enc.routing.primary || 'ANALYTICAL') + '</span><span style="font-size:8px;color:rgba(234,226,214,.3)">Anchor: ' + (L5.cultural_anchor || '&mdash;').replace(/_/g, ' ') + '</span></div>';
  html += '</div>';
  return html;
}

// ── OMNIHUB ───────────────────────────────────────────────────
function openOmniHub() {
  var p = qs('omnihub-panel'); if (p) p.classList.add('open');
  if (currentEncoding) {
    ohTopic = currentEncoding.matched || '';
    ohEncoding = currentEncoding;
    var label = qs('oh-topic-label'); if (label) label.textContent = ohTopic;
  }
  var bo = qs('bn-oh'); if (bo) bo.classList.add('on');
  var bc = qs('bn-chat'); if (bc) bc.classList.remove('on');
}
function closeOmniHub() {
  var p = qs('omnihub-panel'); if (p) p.classList.remove('open');
  var bc = qs('bn-chat'); if (bc) bc.classList.add('on');
  var bo = qs('bn-oh'); if (bo) bo.classList.remove('on');
}
function setOhMode(mode) {
  ohMode = mode;
  document.querySelectorAll('.oh-mode').forEach(function(el) { el.classList.remove('active'); });
  var b = qs('ohm-' + mode); if (b) b.classList.add('active');
}
function resetOhState() {
  ['oh-canvas','oh-loading','oh-overlay','oh-image-wrap','oh-progress','oh-play-btn','oh-prev-btn','oh-next-btn'].forEach(function(id) {
    var el = qs(id);
    if (!el) return;
    if (id === 'oh-loading') el.style.display = 'flex';
    else el.style.display = 'none';
  });
}
function generateOhContent() {
  if (!ohTopic && !currentEncoding) {
    var sub = qs('oh-loading-sub');
    if (sub) sub.textContent = 'Ask a question first to set the topic';
    return;
  }
  resetOhState();
  var enc = ohEncoding || currentEncoding || encodeUnit(ohTopic, '', SP, CA, { type: 'ANALYZE' });
  ohEncoding = enc;
  if (ohMode === 'picture') { _ohImagePrompt(enc); }
  else if (ohMode === 'lecture') { _ohLecture(enc); }
  else { _ohAnimation(enc); }
}
function copyPrompt() {
  var t = qs('oh-prompt-text') && qs('oh-prompt-text').textContent;
  copyToClipboard(t || '');
}
function _ohImagePrompt(enc) {
  var imgData = generateImagePrompt(enc);
  qs('oh-loading').style.display = 'none';
  qs('oh-image-wrap').style.display = 'flex';
  qs('oh-prompt-text').textContent = imgData.prompt;
  var brief = qs('oh-semiotic-brief');
  if (brief) {
    brief.textContent = 'O:' + (enc.L5 && enc.L5.dominant_order || 1) +
      ' myth:' + Math.round((enc.L5 && enc.L5.myth_index || 0) * 100) + '%' +
      ' route:' + (enc.routing && enc.routing.primary || '') +
      ' anchor:' + (enc.L5 && enc.L5.cultural_anchor || '');
  }
}
function _ohLecture(enc) {
  var L5 = enc.L5 || {};
  var topic = enc.matched || ohTopic || 'concept';
  var mi = L5.myth_index || 0.5;
  ohChapters = [
    { title: 'What ' + topic + ' Denotes', text: L5.denotation || 'The literal, factual dimension.', order: 1, progress: 20 },
    { title: 'What ' + topic + ' Connotes', text: L5.connotation || 'The ideological dimensions.', order: 2, progress: 40 },
    { title: 'The Myth', text: 'Myth_index: ' + Math.round(mi * 100) + '%. ' + (mi > 0.7 ? 'Near-maximum ideological loading.' : mi > 0.4 ? 'Moderate loading.' : 'Lower loading.'), order: 2, progress: 60 },
    { title: L5.etymology ? 'The Etymology' : 'Cultural Readings', text: L5.etymology ? 'From ' + L5.etymology.language + ' "' + L5.etymology.root + '" \u2014 ' + L5.etymology.literal + '. ' + (L5.etymology.trace || '') : 'Anchor: ' + (L5.cultural_anchor || '').replace(/_/g, ' '), order: 3, progress: 80 },
    { title: 'The Surplus', text: L5.note || 'What exceeds analysis \u2014 the irreducible surplus.', order: 3, progress: 100 }
  ];
  ohCurrentChapter = 0;
  _renderLecture(enc);
  qs('oh-play-btn').style.display = 'block';
  qs('oh-prev-btn').style.display = 'block';
  qs('oh-next-btn').style.display = 'block';
}
function _renderLecture(enc) {
  var ch = ohChapters[ohCurrentChapter];
  if (!ch) return;
  qs('oh-loading').style.display = 'none';
  var canvas = qs('oh-canvas'); canvas.style.display = 'block';
  qs('oh-overlay').style.display = 'block';
  qs('oh-progress').style.display = 'block';
  qs('oh-progress-fill').style.width = ch.progress + '%';
  qs('oh-chapter-label').textContent = 'Chapter ' + (ohCurrentChapter + 1) + ' of ' + ohChapters.length;
  qs('oh-narration').textContent = ch.text;
  var dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  var w = canvas.offsetWidth, h = canvas.offsetHeight;
  ctx.fillStyle = ch.order === 3 ? '#0a0610' : ch.order === 2 ? '#080208' : '#050608';
  ctx.fillRect(0, 0, w, h);
  if (ch.order === 1) {
    ctx.strokeStyle = 'rgba(201,160,80,.08)'; ctx.lineWidth = 0.5;
    for (var x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  } else if (ch.order === 2) {
    ctx.strokeStyle = 'rgba(168,48,48,.2)'; ctx.lineWidth = 1;
    for (var dx = -h; dx < w; dx += 80) { ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx + h, h); ctx.stroke(); }
  } else {
    for (var pi = 0; pi < 80; pi++) {
      var px = Math.random() * w, py = Math.random() * h, pr = Math.random() * 2 + 0.5;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(128,96,192,' + (Math.random() * 0.4 + 0.1) + ')';
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(201,160,80,.8)'; ctx.font = 'bold 11px DM Mono';
  ctx.fillText(ch.title.toUpperCase(), 24, 32);
}
function _ohAnimation(enc) {
  var mi = (enc.L5 && enc.L5.myth_index) || 0.5;
  qs('oh-loading').style.display = 'none';
  var canvas = qs('oh-canvas'); canvas.style.display = 'block';
  var dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  var w = canvas.offsetWidth, h = canvas.offsetHeight;
  var frame = 0;
  function animate() {
    ctx.fillStyle = 'rgba(5,6,8,.15)';
    ctx.fillRect(0, 0, w, h);
    var t = frame / 60;
    for (var i = 0; i < 8; i++) {
      var angle = t * (1 + i * 0.1) + i * Math.PI / 4;
      var r = 80 + mi * 120 + i * 20;
      var ax = w / 2 + Math.cos(angle) * r;
      var ay = h / 2 + Math.sin(angle) * r;
      ctx.beginPath(); ctx.arc(ax, ay, 2 + mi * 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + (mi > 0.7 ? '220,100,100' : '201,160,80') + ',' + (0.3 + mi * 0.5) + ')';
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 8 + mi * 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + (mi > 0.7 ? '168,48,48' : '201,160,80') + ',.6)';
    ctx.fill();
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
}
function ohPlayPause() {
  ohPlaying = !ohPlaying;
  var btn = qs('oh-play-btn');
  if (btn) btn.textContent = ohPlaying ? '\u23f8 Pause' : '\u25b6 Play';
  if (ohPlaying) ohAutoAdvance();
}
function ohAutoAdvance() {
  if (!ohPlaying) return;
  ohNext();
  setTimeout(function() { if (ohPlaying) ohAutoAdvance(); }, 6000);
}
function ohNext() { ohCurrentChapter = Math.min(ohCurrentChapter + 1, ohChapters.length - 1); if (ohEncoding) _renderLecture(ohEncoding); }
function ohPrev() { ohCurrentChapter = Math.max(0, ohCurrentChapter - 1); if (ohEncoding) _renderLecture(ohEncoding); }
function offerOmniHub(topic, enc) {
  ohTopic = topic; ohEncoding = enc;
  var msgs = qs('msgs'); if (!msgs) return;
  var offer = document.createElement('div');
  offer.style.cssText = 'text-align:center;padding:8px 0';
  var btn = document.createElement('button');
  btn.className = 'oh-offer-btn';
  btn.textContent = '\u29e1 Visualize "' + topic.slice(0, 30) + '" in OmniHub';
  btn.onclick = openOmniHub;
  offer.appendChild(btn);
  msgs.appendChild(offer);
  var conv = qs('conv'); if (conv) conv.scrollTop = 99999;
}
function shouldOfferOmniHub(enc) {
  return enc && enc.L5 && ((enc.L5.order_2 || 0) > 0.6 || (enc.L5.order_3 || 0) > 0.5);
}

// ── CONTEXT DETECTION ────────────────────────────────────────
function detectCtx(txt) {
  var tl = txt.toLowerCase();
  var keys = Object.keys(CA);
  for (var i = 0; i < keys.length; i++) {
    var terms = (CA[keys[i]].key_terms || []);
    for (var j = 0; j < terms.length; j++) {
      if (tl.indexOf(terms[j].toLowerCase()) >= 0) return keys[i];
    }
  }
  return '';
}
function detectVoice(txt) {
  var tl = txt.toLowerCase();
  if (/\b(i feel|i'm|i am|help me|my)\b/.test(tl)) return 'human';
  if (/\b(why|oppression|justice|power|colonialism)\b/.test(tl)) return 'critical';
  return 'analytical';
}

// ── STATUS + TEST ────────────────────────────────────────────
function testConnection() {
  dismissWelcome();
  addMsg('ai',
    '<div style="font-family:DM Mono,monospace;font-size:12px;color:rgba(52,211,153,.9);' +
    'padding:12px 16px;background:rgba(52,211,153,.06);border:1px solid rgba(52,211,153,.2);border-radius:10px">' +
    '<strong>&#10003; SEMION v4 ready</strong><br>' +
    'Knowledge base: ' + Object.keys(SP).length + ' profiles &middot; ' + Object.keys(CA).length + ' communities<br>' +
    'Engines: Classifier &middot; Encoder &middot; Synthesis &middot; Generator<br>' +
    'APIs: Wikipedia &middot; ConceptNet &middot; Scholar &middot; + 21 more (parallel)<br>' +
    'Images: Pollinations.AI (free, no key, no account)<br>' +
    'Architecture: Decoupled modules &middot; Node-verified syntax &middot; Zero build step<br>' +
    '<button style="margin-top:8px;padding:4px 12px;border-radius:999px;border:1px solid rgba(52,211,153,.3);' +
    'background:none;color:rgba(52,211,153,.8);font-family:DM Mono,monospace;font-size:9px;cursor:pointer" ' +
    'onclick="runTests()">&#9654; Run Test Suite</button></div>',
    null, false);
  setSt('READY', 'ready');
}

function runTests() {
  dismissWelcome();
  var pass = 0, fail = 0, results = [];
  function test(name, fn) {
    try {
      if (fn() !== false) { pass++; results.push('\u2713 ' + name); }
      else { fail++; results.push('\u2717 FAIL: ' + name); }
    } catch(e) { fail++; results.push('\u2717 ERROR: ' + name + ' \u2014 ' + e.message); }
  }
  test('classify RECALL', function() { return classify("Who was Fidel Castro?").type === 'RECALL'; });
  test('classify EXPLAIN', function() { return classify("What is postcolonialism?").type === 'EXPLAIN'; });
  test('classify DEBATE', function() { return classify("Was the Cuban Revolution good?").type === 'DEBATE'; });
  test('classify DECONSTRUCT', function() { return classify("Why is capitalism naturally the best?").type === 'DECONSTRUCT'; });
  test('classify HOLD grief', function() { return classify("What is grief?").type === 'HOLD'; });
  test('classify RESPOND', function() { return classify("I feel lost and anxious").type === 'RESPOND'; });
  test('classify IMAGE', function() { return classify("Generate an image of colonialism").type === 'IMAGE'; });
  test('classify COMPARE', function() { return classify("Compare freedom and liberty").type === 'COMPARE'; });
  test('classify lang ES', function() { return classify("\u00bfQu\u00e9 es la libertad?").languageCode === 'es'; });
  test('classify lang ZH', function() { return classify("\u4ec0\u4e48\u662f\u81ea\u7531\uff1f").languageCode === 'zh'; });
  test('classify lang JA', function() { return classify("\u54f2\u5b66\u3068\u306f\u4f55\u3067\u3059\u304b\uff1f").languageCode === 'ja'; });
  test('encode collateral damage mi>0.7', function() { return encodeUnit("collateral damage","",SP,CA,{type:'ANALYZE'}).L5.myth_index > 0.7; });
  test('encode buen vivir mi<0.4', function() { return encodeUnit("buen vivir","",SP,CA,null).L5.myth_index < 0.4; });
  test('encode unknown = derived', function() { return encodeUnit("polycrisis","",SP,CA,null).derived === true; });
  test('encode has wavefunction', function() { return encodeUnit("freedom","",SP,CA,null).L5.wavefunction !== undefined; });
  test('encode has affects', function() { return encodeUnit("collateral damage","",SP,CA,null).L5.affects !== undefined; });
  test('encode has etymology', function() { return encodeUnit("collateral damage","",SP,CA,null).L5.etymology !== null; });
  test('encode consistent', function() { return encodeUnit("freedom","",SP,CA,null).L5.myth_index === encodeUnit("freedom","",SP,CA,null).L5.myth_index; });
  test('synthesize empty sources', function() { return synthesize(encodeUnit("freedom","",SP,CA,null),[]).source_count === 0; });
  test('generate ANALYZE', function() { var e=encodeUnit("collateral damage","",SP,CA,{type:'ANALYZE'}); return generate(e,synthesize(e,[]),{type:'ANALYZE'},[]).length > 20; });
  test('generate HOLD short', function() { var e=encodeUnit("grief","",SP,CA,{type:'HOLD'}); return generate(e,synthesize(e,[]),{type:'HOLD'},[]).length < 600; });
  test('imagePrompt has prompt', function() { return generateImagePrompt(encodeUnit("colonialism","",SP,CA,null)).prompt.length > 30; });
  test('pollinationsURL format', function() { return generatePollinationsURL("test").startsWith('https://image.pollinations.ai/prompt/'); });
  test('followUps array', function() { return Array.isArray(generateFollowUps(encodeUnit("freedom","",SP,CA,null),{type:'ANALYZE'})); });
  test('drift detects myth', function() { var e=encodeUnit("collateral damage","",SP,CA,null); return checkMythDrift("This is obviously and naturally inevitable.",e) !== null; });
  test('drift clean text ok', function() { var e=encodeUnit("freedom","",SP,CA,null); return checkMythDrift("The study measured outcomes empirically.",e) === null; });
  test('SP count >=100', function() { return Object.keys(SP).length >= 100; });
  test('CA count >=90', function() { return Object.keys(CA).length >= 90; });
  test('SP.freedom.wavefunction', function() { return SP.freedom && SP.freedom.wavefunction !== undefined; });
  test('SP[collateral damage].etymology', function() { return SP['collateral damage'] && SP['collateral damage'].etymology !== null; });
  test('full pipeline', function() {
    var cl=classify("What is collateral damage?");
    var enc=encodeUnit("What is collateral damage?","",SP,CA,cl);
    var syn=synthesize(enc,[]);
    var resp=generate(enc,syn,cl,[]);
    return resp.length > 20 && enc.L5.myth_index > 0.7;
  });

  var output = 'SEMION v4 \u2014 Test Results\n' +
    '\u2550'.repeat(40) + '\n' +
    '\u2713 PASS: ' + pass + '  \u2717 FAIL: ' + fail + '\n\n';
  if (fail > 0) output += results.filter(function(r){ return r.charAt(0) === '\u2717'; }).join('\n') + '\n\n';
  output += 'STATUS: ' + (fail === 0 ? 'ALL PASS \u2713' : 'FAILURES \u2717');

  addMsg('ai',
    '<pre style="font-family:DM Mono,monospace;font-size:10px;color:rgba(234,226,214,.8);' +
    'white-space:pre-wrap;line-height:1.7">' + output + '</pre>',
    null, false);
  setSt(fail === 0 ? 'TESTS PASS' : 'TEST FAILURES', fail === 0 ? 'streaming' : 'error');
  setTimeout(function() { setSt('READY', 'ready'); }, 3000);
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Populate context selector
  var ectx = qs('ectx');
  if (ectx && typeof CA !== 'undefined') {
    var keys = Object.keys(CA).sort();
    for (var i = 0; i < keys.length; i++) {
      var opt = document.createElement('option');
      opt.value = keys[i];
      opt.textContent = keys[i].replace(/_/g, ' ');
      ectx.appendChild(opt);
    }
  }

  // Populate welcome chips
  var wChips = qs('w-chips-container');
  if (wChips) {
    var chips = [
      ['collateral damage', 'What is collateral damage?'],
      ['postcolonialism', 'What is postcolonialism?'],
      ['buen vivir', 'What is buen vivir?'],
      ['why is capitalism natural?', 'Why is capitalism naturally the best system?'],
      ["was Cuba's revolution good?", 'Was the Cuban Revolution good?'],
      ['grief', 'What is grief?'],
      ['ubuntu', 'What is ubuntu?'],
      ['freedom vs liberation', 'Compare freedom and liberation'],
      ['sumud', 'What is sumud?'],
      ['neoliberalism', 'What is neoliberalism?'],
      ['image: colonialism', 'Generate an image of colonialism'],
    ];
    chips.forEach(function(c) {
      var btn = document.createElement('button');
      btn.className = 'w-chip';
      btn.textContent = c[0];
      btn.setAttribute('onclick', "wAsk('" + c[1].replace(/'/g, "\\'") + "')");
      wChips.appendChild(btn);
    });
    var ohBtn = document.createElement('button');
    ohBtn.className = 'w-chip';
    ohBtn.style.cssText = 'border-color:var(--gold-dim);color:var(--gold)';
    ohBtn.innerHTML = '&#11041; OmniHub';
    ohBtn.onclick = openOmniHub;
    wChips.appendChild(ohBtn);
  }

  // Populate encoder chips
  var encChips = qs('enc-chips-container');
  if (encChips) {
    var encs = [
      ['collateral damage', 'collateral damage is a necessary cost of warfare', ''],
      ['grief', 'grief is the last act of love', ''],
      ['free market', 'the free market rewards innovation naturally', 'Neoliberal_economic'],
      ['sumud', 'sumud is the practice of remaining', 'Palestinian_Political_Thought'],
      ['ubuntu', 'ubuntu I am because we are', 'Ubuntu_Philosophy'],
      ['development', 'development brings prosperity to all nations', ''],
    ];
    encs.forEach(function(e) {
      var btn = document.createElement('button');
      btn.className = 'enc-chip';
      btn.textContent = e[0];
      btn.setAttribute('onclick', "qEnc('" + e[1] + "','" + e[2] + "')");
      encChips.appendChild(btn);
    });
  }

  // Input wiring
  var inp = qs('inp');
  if (inp) {
    inp.addEventListener('input', function() {
      this.style.height = '48px';
      this.style.height = Math.min(this.scrollHeight, 130) + 'px';
    });
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
    });
    inp.addEventListener('focus', function() {
      if (!welcomeDismissed) dismissWelcome();
      setTimeout(function() { var c = qs('conv'); if (c) c.scrollTop = 99999; }, 350);
    });
  }

  // Swipe to dismiss welcome
  var w = qs('welcome');
  if (w) {
    var sy = 0;
    w.addEventListener('touchstart', function(e) { sy = e.touches[0].clientY; }, { passive: true });
    w.addEventListener('touchmove', function(e) { if (sy - e.touches[0].clientY > 50) dismissWelcome(); }, { passive: true });
  }

  // URL param
  var q = new URLSearchParams(window.location.search).get('q');
  if (q) setTimeout(function() { wAsk(decodeURIComponent(q)); }, 600);

  // Init learning DB
  if (typeof initDB === 'function') {
    initDB().catch(function() {});
  }

  setSt('READY', 'ready');

  // Initialize session ID
  if (typeof generateSessionId === 'function') {
    SEMION_STATE.sessionId = generateSessionId();
    SEMION_STATE.started   = Date.now();
  }
});

// ── AUTH HANDLERS ─────────────────────────────────────────────

function _handleSignIn() {
  if (typeof signInWithGoogle !== 'function') {
    setSt('FIREBASE LOADING...', 'thinking');
    if (typeof loadFirebase === 'function') {
      loadFirebase(function() { _handleSignIn(); });
    }
    return;
  }
  setSt('SIGNING IN...', 'thinking');
  signInWithGoogle()
    .then(function(user) {
      setSt('READY', 'ready');
      if (typeof saveUserProfile === 'function') {
        saveUserProfile({ preferences: {} }).catch(function() {});
      }
    })
    .catch(function(err) {
      setSt('READY', 'ready');
      if (err.code !== 'auth/popup-closed-by-user') {
        console.warn('Sign in failed:', err.message);
      }
    });
}

function _handleAvatarClick() {
  var status = typeof getFirebaseStatus === 'function' ? getFirebaseStatus() : null;
  if (!status || !status.signedIn) return;
  var user = status.user;
  var msg = '<div style="font-family:DM Mono,monospace;font-size:11px;padding:12px 16px;background:rgba(234,226,214,.04);border:1px solid var(--border);border-radius:10px">';
  msg += '<strong style="color:var(--parchment)">' + (user.displayName || 'Signed in') + '</strong><br>';
  msg += '<span style="color:var(--parchment-dim)">' + (user.email || '') + '</span><br>';
  msg += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
  msg += '<button class="share-btn" onclick="openHistory()">My Analyses</button>';
  msg += '<button class="share-btn" onclick="_exportHistory()">Export JSON</button>';
  msg += '<button class="share-btn" onclick="signOut && signOut()" style="color:rgba(220,100,100,.7);border-color:rgba(220,100,100,.2)">Sign out</button>';
  msg += '</div></div>';
  dismissWelcome();
  addMsg('ai', msg, null, false);
}

function _exportHistory() {
  var getAll = typeof getRecentAnalyses === 'function' ? getRecentAnalyses(200) : (typeof getRecentConversations === 'function' ? getRecentConversations(200) : Promise.resolve([]));
  getAll.then(function(items) {
    var json = JSON.stringify(items, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'semion-analyses-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }).catch(function() {});
}
