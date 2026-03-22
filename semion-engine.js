// SEMION™ v4 — Engine Module (Rhizome Architecture)
// Quantum Superposition Classifier · Encoder Feedback Loop ·
// Entanglement Pre-activation · Interference Pruning ·
// Streaming Synthesis · SLE Fluency Generator
// Copyright © 2026 Sebastian Iturriaga — synapsecopilot.com
// Depends on: semion-data.js (SP, CA, CT must be loaded first)

// SECTION 1 — TYPES, MOVES, SEQUENCES
// ════════════════════════════════════════════════════════════

var TYPES = {
  RECALL:'RECALL', EXPLAIN:'EXPLAIN', ANALYZE:'ANALYZE', DEBATE:'DEBATE',
  DECONSTRUCT:'DECONSTRUCT', HOLD:'HOLD', RESPOND:'RESPOND', COMPARE:'COMPARE',
  TRACE:'TRACE', CRITIQUE:'CRITIQUE', TRANSLATE:'TRANSLATE', NARRATE:'NARRATE',
  MAP:'MAP', DATA:'DATA', IMAGE:'IMAGE', URL:'URL', DOCUMENT:'DOCUMENT'
};

var LANG = {
  EN:'en', ES:'es', FR:'fr', DE:'de', PT:'pt', IT:'it', RU:'ru',
  AR:'ar', JA:'ja', ZH:'zh', KO:'ko', HI:'hi', BN:'bn', UR:'ur',
  TR:'tr', FA:'fa', NL:'nl', PL:'pl', SV:'sv', NO:'no', DA:'da',
  FI:'fi', EL:'el', HE:'he', TH:'th', VI:'vi', ID:'id', MS:'ms',
  SW:'sw', ZH_TW:'zh-tw'
};

var MOVE = {
  NAMING:'NAMING', PROVOCATION:'PROVOCATION', CONCESSION:'CONCESSION',
  HISTORICAL_ANCHOR:'HISTORICAL_ANCHOR', OBSERVATION:'OBSERVATION',
  ELABORATION:'ELABORATION', CONTRAST:'CONTRAST', EVIDENCE:'EVIDENCE',
  EXEMPLIFICATION:'EXEMPLIFICATION', GENEALOGY:'GENEALOGY',
  QUALIFICATION:'QUALIFICATION', ETYMOLOGY_REVEAL:'ETYMOLOGY_REVEAL',
  INSTITUTION:'INSTITUTION', SILENCE:'SILENCE', INTENSIFICATION:'INTENSIFICATION',
  MATERIALIZATION:'MATERIALIZATION', QUANTIFICATION:'QUANTIFICATION',
  AFFECT_MAPPING:'AFFECT_MAPPING', ANALOGY:'ANALOGY', INVERSION:'INVERSION',
  REVERSAL:'REVERSAL', COMPLICATION:'COMPLICATION',
  WAVEFUNCTION_SHIFT:'WAVEFUNCTION_SHIFT', GENEALOGICAL_BREAK:'GENEALOGICAL_BREAK',
  OPACITY_MARKER:'OPACITY_MARKER', SYNTHESIS:'SYNTHESIS',
  IMPLICATION:'IMPLICATION', INVITATION:'INVITATION',
  OPEN_QUESTION:'OPEN_QUESTION', SILENCE_CLOSE:'SILENCE_CLOSE'
};

var MOVE_SEQUENCES = {
  RECALL:      [MOVE.NAMING,MOVE.EVIDENCE,MOVE.ELABORATION],
  EXPLAIN:     [MOVE.OBSERVATION,MOVE.ELABORATION,MOVE.EXEMPLIFICATION,MOVE.QUALIFICATION,MOVE.INVITATION],
  ANALYZE:     [MOVE.NAMING,MOVE.ETYMOLOGY_REVEAL,MOVE.GENEALOGY,MOVE.QUANTIFICATION,MOVE.WAVEFUNCTION_SHIFT,MOVE.AFFECT_MAPPING,MOVE.SILENCE,MOVE.INVITATION],
  DEBATE:      [MOVE.CONCESSION,MOVE.CONTRAST,MOVE.INSTITUTION,MOVE.WAVEFUNCTION_SHIFT,MOVE.COMPLICATION,MOVE.IMPLICATION],
  DECONSTRUCT: [MOVE.PROVOCATION,MOVE.SILENCE,MOVE.GENEALOGY,MOVE.INSTITUTION,MOVE.ETYMOLOGY_REVEAL,MOVE.REVERSAL,MOVE.IMPLICATION],
  HOLD:        [MOVE.OBSERVATION,MOVE.QUALIFICATION,MOVE.SILENCE_CLOSE],
  RESPOND:     [MOVE.OBSERVATION,MOVE.ELABORATION,MOVE.QUALIFICATION,MOVE.INVITATION],
  COMPARE:     [MOVE.NAMING,MOVE.CONTRAST,MOVE.WAVEFUNCTION_SHIFT,MOVE.OPACITY_MARKER,MOVE.IMPLICATION],
  TRACE:       [MOVE.HISTORICAL_ANCHOR,MOVE.GENEALOGY,MOVE.INSTITUTION,MOVE.GENEALOGICAL_BREAK,MOVE.MATERIALIZATION,MOVE.IMPLICATION],
  CRITIQUE:    [MOVE.OBSERVATION,MOVE.INSTITUTION,MOVE.SILENCE,MOVE.INVERSION,MOVE.AFFECT_MAPPING,MOVE.OPEN_QUESTION],
  TRANSLATE:   [MOVE.NAMING,MOVE.OPACITY_MARKER,MOVE.WAVEFUNCTION_SHIFT,MOVE.CONTRAST,MOVE.IMPLICATION],
  NARRATE:     [MOVE.HISTORICAL_ANCHOR,MOVE.GENEALOGY,MOVE.GENEALOGICAL_BREAK,MOVE.WAVEFUNCTION_SHIFT,MOVE.MATERIALIZATION,MOVE.SYNTHESIS],
  MAP:         [MOVE.NAMING,MOVE.ELABORATION,MOVE.CONTRAST,MOVE.WAVEFUNCTION_SHIFT,MOVE.OPACITY_MARKER,MOVE.OPEN_QUESTION],
  DATA:        [MOVE.OBSERVATION,MOVE.INSTITUTION,MOVE.SILENCE,MOVE.AFFECT_MAPPING,MOVE.IMPLICATION],
  IMAGE:       [],
  URL:         [MOVE.OBSERVATION,MOVE.INSTITUTION,MOVE.SILENCE,MOVE.WAVEFUNCTION_SHIFT,MOVE.IMPLICATION],
  DOCUMENT:    [MOVE.NAMING,MOVE.INSTITUTION,MOVE.GENEALOGY,MOVE.SILENCE,MOVE.WAVEFUNCTION_SHIFT,MOVE.IMPLICATION]
};

// ════════════════════════════════════════════════════════════
// SECTION 2 — 30-LANGUAGE DETECTION
// ════════════════════════════════════════════════════════════

function _scriptOf(cp) {
  if (cp >= 0x3040 && cp <= 0x30FF) return LANG.JA;
  if (cp >= 0x31F0 && cp <= 0x31FF) return LANG.JA;
  if (cp >= 0xAC00 && cp <= 0xD7AF) return LANG.KO;
  if (cp >= 0x4E00 && cp <= 0x9FFF) return LANG.ZH;
  if (cp >= 0x3400 && cp <= 0x4DBF) return LANG.ZH;
  if (cp >= 0x0E00 && cp <= 0x0E7F) return LANG.TH;
  if (cp >= 0x0980 && cp <= 0x09FF) return LANG.BN;
  if (cp >= 0x0900 && cp <= 0x097F) return LANG.HI;
  if (cp >= 0x0370 && cp <= 0x03FF) return LANG.EL;
  if (cp >= 0x0590 && cp <= 0x05FF) return LANG.HE;
  if (cp >= 0x0400 && cp <= 0x04FF) return LANG.RU;
  if (cp >= 0x1E00 && cp <= 0x1EFF) return LANG.VI;
  if (cp >= 0x0600 && cp <= 0x06FF) return 'arab';
  return null;
}

var _LEX_PATTERNS = [
  {l:LANG.SW, r:/\b(ni|ya|wa|na|kwa|katika|lakini|pia|hakuna|pamoja|watu|mtoto)\b/},
  {l:LANG.ID, r:/\b(yang|dan|di|ini|itu|dengan|untuk|tidak|ada|juga|adalah|pada|akan)\b/},
  {l:LANG.MS, r:/\b(yang|dan|di|ini|itu|dengan|untuk|tidak|ada|juga|adalah|ialah|telah)\b/},
  {l:LANG.FI, r:/\b(on|ei|se|hän|että|olla|myös|kun|niin|kaikki|mutta|jos|tai|vaan)\b/},
  {l:LANG.SV, r:/\b(och|att|det|en|ett|som|på|är|för|med|av|inte|den|till|om|men)\b/},
  {l:LANG.NO, r:/\b(og|å|det|en|et|som|på|er|for|med|av|ikke|den|til|om|men|jeg)\b/},
  {l:LANG.DA, r:/\b(og|at|det|en|et|som|på|er|for|med|af|ikke|den|til|om|men|jeg)\b/},
  {l:LANG.NL, r:/\b(de|het|een|en|van|is|dat|niet|zijn|er|op|te|ook|voor|maar|met)\b/},
  {l:LANG.PL, r:/\b(i|w|z|na|do|to|że|się|nie|jest|jak|ale|jego|przez|po|gdy|co)\b/},
  {l:LANG.TR, r:/\b(ve|bir|bu|da|de|ile|için|ne|var|çok|daha|olan|ama|gibi|sonra)\b/},
  {l:LANG.PT, r:/\b(de|que|e|o|a|em|um|uma|para|com|por|não|na|do|da|os|mas)\b/},
  {l:LANG.IT, r:/\b(di|che|il|la|e|in|un|una|per|con|del|della|non|si|lo|da|ma)\b/},
  {l:LANG.FR, r:/\b(de|le|la|les|et|en|un|une|du|des|que|qui|est|pas|pour|dans)\b/},
  {l:LANG.ES, r:/\b(de|la|el|y|en|un|una|que|es|por|con|los|las|del|para|su|se)\b/},
  {l:LANG.DE, r:/\b(der|die|das|und|ist|ein|eine|in|zu|von|den|des|im|mit|auf|dem)\b/}
];

function detectLanguageCode(txt) {
  if (!txt || txt.length < 3) return LANG.EN;
  var hits = {};
  var limit = Math.min(txt.length, 300);
  for (var i = 0; i < limit; i++) {
    var cp = txt.charCodeAt(i);
    if (cp < 128) continue;
    var sc = _scriptOf(cp);
    if (sc) hits[sc] = (hits[sc] || 0) + 1;
  }
  if (hits[LANG.JA]) return LANG.JA;
  if (hits[LANG.KO]) return LANG.KO;
  if (hits[LANG.ZH] >= 2) return LANG.ZH;
  if (hits[LANG.TH]) return LANG.TH;
  if (hits[LANG.BN]) return LANG.BN;
  if (hits[LANG.HI]) return LANG.HI;
  if (hits[LANG.EL]) return LANG.EL;
  if (hits[LANG.HE]) return LANG.HE;
  if (hits[LANG.RU]) return LANG.RU;
  if (hits[LANG.VI]) return LANG.VI;
  if (hits['arab']) {
    if (/[\u06A9\u06AF\u067E\u0686\u0698\u06CC]/.test(txt)) return LANG.FA;
    if (/[\u06BE\u06D2\u0679\u0688\u0691\u06C1]/.test(txt)) return LANG.UR;
    return LANG.AR;
  }
  var tl = txt.toLowerCase();
  var sc_map = {};
  for (var li = 0; li < _LEX_PATTERNS.length; li++) {
    var m = tl.match(new RegExp(_LEX_PATTERNS[li].r.source, 'g'));
    sc_map[_LEX_PATTERNS[li].l] = m ? m.length : 0;
  }
  if (/[äöüÄÖÜß]/.test(txt)) sc_map[LANG.DE] = (sc_map[LANG.DE]||0) + 5;
  if (/[áéíóúüñ¿¡]/.test(txt)) sc_map[LANG.ES] = (sc_map[LANG.ES]||0) + 4;
  if (/[àâæçéèêëîïôœùûüÿ]/.test(txt)) sc_map[LANG.FR] = (sc_map[LANG.FR]||0) + 4;
  if (/[ãõç]/.test(txt)) sc_map[LANG.PT] = (sc_map[LANG.PT]||0) + 4;
  if (/[àèéìòùó]/.test(txt)) sc_map[LANG.IT] = (sc_map[LANG.IT]||0) + 3;
  if (/[åæø]/.test(txt)) {
    sc_map[LANG.DA] = (sc_map[LANG.DA]||0) + 3;
    sc_map[LANG.NO] = (sc_map[LANG.NO]||0) + 3;
    sc_map[LANG.SV] = (sc_map[LANG.SV]||0) + 3;
  }
  if (/[äöå]/.test(txt)) sc_map[LANG.FI] = (sc_map[LANG.FI]||0) + 3;
  if (/(\bist\b|\bsind\b|\bwar\b|\bwird\b|\bhaben\b)/.test(tl)) sc_map[LANG.DE] = (sc_map[LANG.DE]||0) + 2;
  var best = LANG.EN, bestS = 1;
  var lkeys = Object.keys(sc_map);
  for (var lk = 0; lk < lkeys.length; lk++) {
    if (sc_map[lkeys[lk]] > bestS) { bestS = sc_map[lkeys[lk]]; best = lkeys[lk]; }
  }
  return best;
}

// ════════════════════════════════════════════════════════════
// SECTION 3 — RHIZOME CLASSIFIER (Quantum Superposition Model)
// ════════════════════════════════════════════════════════════
// The classifier no longer picks ONE type and commits.
// It returns a SUPERPOSITION — all possible types with amplitudes.
// The encoder's myth_index and dominant_order feed BACK into the
// superposition to collapse it correctly. This is the feedback loop.
//
// Architecture: Question → Field Activation → Parallel Signal Scoring
//               → Superposition → Encoder feedback → Final Collapse
// ════════════════════════════════════════════════════════════

// Signal definitions — weight per type
var _SIG = {
  RECALL:[
    {r:/^(who (was|is|were|are))\s/i,w:0.92},
    {r:/^(what was|what is)\s+the\s+(name|date|year|capital|population|president|leader|founder|author|birthplace|currency|flag)/i,w:0.95},
    {r:/^(when (did|was|were|is|are))\s/i,w:0.90},
    {r:/^(where (is|was|are|were))\s/i,w:0.88},
    {r:/^(how (many|much|long|old|tall|far|deep|wide|heavy))\s/i,w:0.90},
    {r:/'s (real|full|birth|maiden|original|legal) name/i,w:0.92},
    {r:/^(what year|what date|what time)\s/i,w:0.88},
    {r:/^(what is the (capital|population|area|height|distance|gdp|president) of)/i,w:0.93},
    {r:/^(who (wrote|painted|composed|directed|invented|founded|created|discovered|built|led|ruled))/i,w:0.88},
    {r:/^(in what (year|century|decade|country|city|region))/i,w:0.87},
    {r:/^(how many (people|countries|members|planets|continents|elements|years|states))/i,w:0.88},
    {r:/\b(born in|died in|founded in|established in|invented in) \d{4}/i,w:0.90}
  ],
  EXPLAIN:[
    {r:/^(what (does|do|did) .{1,40} (mean|signify|represent|stand for|refer to|denote))/i,w:0.88},
    {r:/^(explain|describe|define|clarify|outline|summarize) /i,w:0.85},
    {r:/^(what is|what are|what was|what were) (?!the (name|date|year|capital|population))/i,w:0.78},
    {r:/^(how (does|do|did) .{1,40} (work|function|operate|happen|come about))/i,w:0.85},
    {r:/^(can you (explain|tell me about|describe|define))/i,w:0.83},
    {r:/^(tell me (about|more about|what you know about))/i,w:0.80},
    {r:/^(give me (an? )?(overview|summary|introduction|explanation|definition))/i,w:0.82},
    {r:/^(what happened (in|at|to|with|during|after|before))/i,w:0.80},
    {r:/^(help me understand)/i,w:0.82}
  ],
  ANALYZE:[
    {r:/\b(semiotically|ideologically|politically|rhetorically|critically) (analyze|read|examine|unpack|interrogate)/i,w:0.96},
    {r:/\b(myth_index|wavefunction|ideological (operation|loading|weight)|hegemony|discourse analysis)\b/i,w:0.93},
    {r:/^(analyze|analyse|unpack|interrogate|critically examine|read semiotically) /i,w:0.90},
    {r:/\b(barthes|foucault|gramsci|althusser|stuart hall|derrida|spivak|said|fanon|hooks|glissant)\b/i,w:0.88},
    {r:/^(what (does|do) .{1,40} (do|perform|accomplish|achieve) (ideologically|politically|rhetorically))/i,w:0.90},
    {r:/\b(power|domination|hegemony|naturalization|normalization).{0,30}\b(language|word|phrase|term|concept|sign)\b/i,w:0.87},
    {r:/\b(sign|symbol|signifier|signified|semiotics|symbolic order|myth)\b/i,w:0.85}
  ],
  DEBATE:[
    {r:/^(was|were|is|are) .{1,60}(good|bad|right|wrong|justified|fair|ethical|moral|immoral|legitimate|just|unjust)/i,w:0.88},
    {r:/^(should|ought|must|need to) .{0,60}(we|they|society|government|people)/i,w:0.87},
    {r:/^(is it (right|wrong|fair|just|ethical|moral|good|bad|justified))/i,w:0.88},
    {r:/^(do you think|what do you think|what is your (opinion|view|take|position))/i,w:0.82},
    {r:/\b(pros and cons|advantages and disadvantages|for and against)\b/i,w:0.85},
    {r:/^(was the .{3,40} (revolution|war|coup|invasion|occupation|genocide|reform) (justified|right|wrong|necessary))/i,w:0.90},
    {r:/\b(moral|ethical|normative|value judgment|ought|should) .{0,20}(we|society|they|people)\b/i,w:0.78}
  ],
  DECONSTRUCT:[
    {r:/\b(naturally?|obviously?|of course|everyone knows|simply|just is|goes without saying)\b/i,w:0.85},
    {r:/^why (is|are|was|were) .{0,70}(natural|normal|obvious|inevitable|necessary|always been|universal|self.evident)/i,w:0.90},
    {r:/\b(human nature|just the way (things|it|they) (are|is|were)|natural (law|order|hierarchy)|biologically determined)\b/i,w:0.88},
    {r:/\b(capitalism is natural|markets are natural|hierarchy is natural|war is (natural|inevitable))\b/i,w:0.95},
    {r:/\b(always (been|existed|happened)|has always|will always|since the beginning|since time immemorial)\b/i,w:0.80},
    {r:/\b(common sense|self.evident truth|universally (true|accepted|recognized))\b/i,w:0.83},
    {r:/^why (do|don't|can't|won't) (some (people|countries|cultures)|they|the poor|women|minorities)/i,w:0.82}
  ],
  HOLD:[
    {r:/^what (is|are) (grief|death|love|consciousness|silence|god|being|nothingness|loss|mourning|the sublime|the sacred|beauty|time|the void|home|trauma|the face)\b/i,w:0.90},
    {r:/\b(irreducible|ineffable|beyond (words|language|explanation)|unspeakable|what cannot be (said|expressed|named))\b/i,w:0.88},
    {r:/^what does it (mean|feel like) to (die|grieve|love|exist|disappear|mourn|lose someone|be human)/i,w:0.90},
    {r:/\b(the grain of the voice|the punctum|the obtuse meaning|ma |saudade|mono no aware)\b/i,w:0.95},
    {r:/^what (remains|persists|exceeds|cannot be (translated|captured|contained|explained|reduced))/i,w:0.85}
  ],
  RESPOND:[
    {r:/^(i (feel|am feeling|felt|have been feeling|keep feeling))\b/i,w:0.96},
    {r:/^(i('m| am) (feeling|struggling|going through|dealing with|experiencing|suffering|lost|confused|scared))\b/i,w:0.95},
    {r:/^(help me|i need help|i don't know what to do)\b/i,w:0.88},
    {r:/^(i (lost|am losing|have lost|am grieving|am mourning))/i,w:0.90},
    {r:/\b(depressed|anxious|scared|afraid|lonely|hopeless|overwhelmed|suicidal|hurt|broken|empty|numb)\b/i,w:0.88},
    {r:/^(how (can|do) i (cope|deal|handle|manage|get through|survive|live with))/i,w:0.87}
  ],
  COMPARE:[
    {r:/\b(compare|comparison between|contrast|difference(s)? between|distinguish between)\b/i,w:0.92},
    {r:/^(what('s| is) the difference between)\s/i,w:0.94},
    {r:/\b(similar(ities)?|different(ly)?).{0,20}\b(and|between|with)\b/i,w:0.78},
    {r:/^(how (is|are|does|do) .{3,40} (different from|similar to|compare (to|with)))/i,w:0.88},
    {r:/ vs\.? /i,w:0.85},
    {r:/\b(versus|compared to|in contrast to|as opposed to)\b/i,w:0.82}
  ],
  TRACE:[
    {r:/\b(history of|origins? of|genealogy of|etymology of|trace the (history|origins?|development|evolution) of)\b/i,w:0.92},
    {r:/^(where did .{1,40} come from|how did .{1,40} (develop|evolve|originate|begin|emerge))/i,w:0.88},
    {r:/\b(when was .{1,40} (invented|coined|developed|introduced|first used))\b/i,w:0.85},
    {r:/\b(historically|over time|throughout history|across centuries)\b/i,w:0.72},
    {r:/\b(how (did|has) .{1,40} (changed?|evolved?|transformed?|shifted?))\b/i,w:0.82}
  ],
  CRITIQUE:[
    {r:/\b(critique|criticize|critically (assess|evaluate|examine)|what('s| is) wrong with|flaws? in|problems? with)\b/i,w:0.90},
    {r:/^(what (does|do|did) .{1,40} (get wrong|miss|overlook|suppress|ignore|erase|obscure))/i,w:0.88},
    {r:/\b(argument|claim|position|thesis|theory|framework) .{0,20}(problematic|flawed|wrong|mistaken|biased)\b/i,w:0.85}
  ],
  TRANSLATE:[
    {r:/\b(how (do you|would you|can you) (translate|say|express) .{1,40} in (another|a different|english))\b/i,w:0.90},
    {r:/\b(untranslatable|no (direct|equivalent|exact) translation|loses (something|meaning) in translation)\b/i,w:0.93},
    {r:/\b(equivalent (of|for|to)|closest (word|concept|translation) (in|for|to))\b/i,w:0.85}
  ],
  NARRATE:[
    {r:/\b(tell (me )?the story of|narrate|recount|walk me through the (history|story|development) of)\b/i,w:0.90},
    {r:/^(how did .{3,50} (change|transform|shift|evolve|become what it is today))/i,w:0.85}
  ],
  MAP:[
    {r:/\b(map (out|the)|conceptual (map|field|space)|related (concepts|ideas|words|terms)|what (connects|relates|links))\b/i,w:0.88},
    {r:/\b(field of|conceptual (network|web|cluster)|semantic (field|network|space))\b/i,w:0.85}
  ],
  DATA:[
    {r:/\b(data|dataset|statistics|numbers|figures|metrics|measurements|indicators|csv|spreadsheet)\b/i,w:0.85},
    {r:/\b(what (does|do) (the data|these (numbers|figures|statistics)) (show|mean|say|reveal))\b/i,w:0.88},
    {r:/\b(analyze|analyse) .{0,30}\b(data|statistics|numbers|dataset)\b/i,w:0.87}
  ]
};

// Premise complexity scoring
var _PREMISE_HIGH = ['human nature','natural order','natural law','biologically determined','self-evident truth','always has been','since the beginning of time','goes without saying','universally true'];
var _PREMISE_MED  = ['naturally','obviously','of course','everyone knows','simply','just is','inevitable','always been','normal','common sense','inherent','innate','just the way'];
var _PREMISE_LOW  = ['traditional','historical','typical','usual','standard','conventional'];

// Domain flags → retrieval sources
var _DOMAIN_FLAGS = {
  currentEvents: /\b(today|yesterday|this week|month|year|recently|latest|current|now|ongoing|breaking|2024|2025|2026)\b/i,
  academic:      /\b(study|research|paper|journal|published|found that|evidence|data shows|peer.reviewed|meta.analysis|scholar)\b/i,
  philosophy:    /\b(philosophy|kant|hegel|heidegger|nietzsche|derrida|foucault|deleuze|spinoza|aristotle|plato|phenomenology|ontology|epistemology|dialectic)\b/i,
  legal:         /\b(court|law|legal|ruling|decision|treaty|convention|rights|violation|jurisdiction|legislation|constitution|jurisprudence)\b/i,
  indigenous:    /\b(indigenous|native|aboriginal|first nations|oral tradition|traditional knowledge|decolonial|land back|buen vivir|ubuntu|pachamama|sumud|kapwa)\b/i,
  political:     /\b(economy|capitalism|neoliberal|imf|world bank|gdp|poverty|inequality|debt|austerity|structural adjustment|colonialism|imperialism|hegemony)\b/i,
  scientific:    /\b(physics|chemistry|biology|neuroscience|quantum|genetics|evolution|climate|medical|clinical|empirical|experiment|hypothesis)\b/i,
  literature:    /\b(novel|poem|poetry|literary|fiction|narrative|author|wrote|writing|text|passage|excerpt|chapter|verse)\b/i,
  media:         /\b(news|media|newspaper|article|report|broadcast|coverage|framing|propaganda|journalism|press)\b/i
};

var _DOMAIN_SRCS = {
  currentEvents:['gdelt','wikipedia'],
  academic:     ['scholar','doaj','pubmed'],
  philosophy:   ['sep','iep','marxists','gutenberg'],
  legal:        ['iacthr','europarl','congress'],
  indigenous:   ['paradisec'],
  political:    ['worldbank','congress','marxists'],
  scientific:   ['pubmed','scholar'],
  literature:   ['gutenberg','loc'],
  media:        ['gdelt','wikipedia']
};

// ── PHASE 1: RAW SIGNAL SCORING ──────────────────────────────
// Score ALL types simultaneously — no early exit, no first-match

function _scoreAllTypes(text) {
  var tl = text.toLowerCase().trim();
  var scores = {};
  var typeKeys = Object.keys(_SIG);

  for (var ti = 0; ti < typeKeys.length; ti++) {
    var tn = typeKeys[ti];
    var sigs = _SIG[tn];
    var typeScore = 0, matchCount = 0;
    for (var si = 0; si < sigs.length; si++) {
      if (sigs[si].r.test(text)) {
        typeScore += sigs[si].w;
        matchCount++;
      }
    }
    // Multi-match constructive interference bonus
    if (matchCount > 1) typeScore += (matchCount - 1) * 0.04;
    typeScore = Math.min(1.0, typeScore);
    if (typeScore > 0) scores[tn] = typeScore;
  }

  // Premise amplitude scoring — naturalizing language → DECONSTRUCT
  var premiseScore = 0;
  for (var ph = 0; ph < _PREMISE_HIGH.length; ph++) {
    if (tl.indexOf(_PREMISE_HIGH[ph]) >= 0) premiseScore += 0.8;
  }
  for (var pm = 0; pm < _PREMISE_MED.length; pm++) {
    if (tl.indexOf(_PREMISE_MED[pm]) >= 0) premiseScore += 0.4;
  }
  for (var pl = 0; pl < _PREMISE_LOW.length; pl++) {
    if (tl.indexOf(_PREMISE_LOW[pl]) >= 0) premiseScore += 0.15;
  }
  if (premiseScore >= 0.8) {
    scores['DECONSTRUCT'] = Math.max(scores['DECONSTRUCT'] || 0, Math.min(1.0, 0.65 + premiseScore * 0.2));
  }

  return { scores: scores, premiseScore: premiseScore };
}

// ── PHASE 2: SUPERPOSITION ────────────────────────────────────
// Return ALL types with amplitude > threshold
// This is the quantum superposition — no collapse yet

function _buildSuperposition(scores, threshold) {
  threshold = threshold || 0.35;
  var superpos = [];
  var keys = Object.keys(scores);
  for (var k = 0; k < keys.length; k++) {
    if (scores[keys[k]] >= threshold) {
      superpos.push({ type: keys[k], amplitude: scores[keys[k]] });
    }
  }
  // Normalize amplitudes
  var total = 0;
  for (var i = 0; i < superpos.length; i++) total += superpos[i].amplitude;
  if (total > 0) {
    for (i = 0; i < superpos.length; i++) {
      superpos[i].amplitude = Math.round(superpos[i].amplitude / total * 1000) / 1000;
    }
  }
  superpos.sort(function(a, b) { return b.amplitude - a.amplitude; });
  return superpos;
}

// ── PHASE 3: ENCODER FEEDBACK LOOP ───────────────────────────
// myth_index and dominant_order from a quick concept probe
// feed back into the superposition BEFORE final collapse.
// This is the key innovation: classification is informed by
// what the concept actually IS, not just how the question is phrased.

function _encoderFeedback(text, superpos) {
  var tl = text.toLowerCase();
  if (typeof SP === 'undefined') return superpos; // guard

  // Quick concept probe — find the concept without full encoding
  var keys = Object.keys(SP).sort(function(a, b) { return b.length - a.length; });
  var quickProfile = null;
  for (var i = 0; i < keys.length; i++) {
    var phrase = keys[i].replace(/_/g, ' ');
    try {
      if (new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(tl)) {
        quickProfile = SP[keys[i]];
        break;
      }
    } catch(e) {
      if (tl.indexOf(phrase) >= 0) { quickProfile = SP[keys[i]]; break; }
    }
  }

  if (!quickProfile) return superpos; // no concept found — return unchanged

  var mi  = parseFloat(quickProfile.myth_index) || 0.5;
  var dom = quickProfile.dominant_order || 2;

  // Apply encoder feedback adjustments to amplitudes
  var adjusted = superpos.map(function(item) {
    var boost = 0;

    // High myth_index → ANALYZE and DECONSTRUCT amplified
    if (mi > 0.75) {
      if (item.type === 'ANALYZE')     boost += mi * 0.25;
      if (item.type === 'DECONSTRUCT') boost += mi * 0.20;
      if (item.type === 'RECALL')      boost -= 0.15; // high myth → probably not a recall Q
    }

    // ORDER:3 → HOLD amplified
    if (dom === 3) {
      if (item.type === 'HOLD')    boost += 0.35;
      if (item.type === 'ANALYZE') boost += 0.15;
      if (item.type === 'EXPLAIN') boost -= 0.10;
    }

    // ORDER:2 → ideological types amplified
    if (dom === 2) {
      if (item.type === 'DECONSTRUCT') boost += 0.20;
      if (item.type === 'CRITIQUE')    boost += 0.15;
      if (item.type === 'DEBATE')      boost += 0.10;
    }

    // Very low myth → RECALL and EXPLAIN amplified
    if (mi < 0.15) {
      if (item.type === 'RECALL')  boost += 0.20;
      if (item.type === 'EXPLAIN') boost += 0.15;
    }

    return { type: item.type, amplitude: Math.min(1.0, item.amplitude + boost) };
  });

  // Re-sort after feedback
  adjusted.sort(function(a, b) { return b.amplitude - a.amplitude; });

  return { superpos: adjusted, quickProfile: quickProfile, feedbackApplied: true };
}

// ── PHASE 4: ENTANGLEMENT PRE-ACTIVATION ─────────────────────
// When a concept is matched, immediately activate its entangled
// concepts in the semantic field. These are available to the
// generator without requiring a second encode cycle.

function _activateEntanglements(quickProfile) {
  if (!quickProfile || !quickProfile.entanglements) return {};
  var activated = {};
  var ents = quickProfile.entanglements.slice(0, 5);
  for (var i = 0; i < ents.length; i++) {
    var ent = ents[i];
    var entKey = ent.concept ? ent.concept.replace(/\s+/g, '_') : null;
    if (entKey && SP[entKey]) {
      activated[ent.concept] = {
        profile:  SP[entKey],
        coupling: ent.coupling || 0.5,
        type:     ent.type || 'entangled'
      };
    }
  }
  return activated;
}

// ── PHASE 5: INTERFERENCE PRUNING ────────────────────────────
// Before committing to a final type, check if two high-amplitude
// types are constructively or destructively interfering.
// Destructive: HOLD + ANALYZE (explaining what should be held)
// Constructive: DECONSTRUCT + ANALYZE (deepens the analysis)
// Constructive: DEBATE + DECONSTRUCT (the debate has a premise)
// Constructive: TRACE + ANALYZE (genealogy enriches analysis)

var _CONSTRUCTIVE_PAIRS = [
  ['DECONSTRUCT', 'ANALYZE'],
  ['DEBATE',      'DECONSTRUCT'],
  ['TRACE',       'ANALYZE'],
  ['CRITIQUE',    'ANALYZE'],
  ['COMPARE',     'ANALYZE'],
  ['NARRATE',     'TRACE']
];

var _DESTRUCTIVE_PAIRS = [
  ['HOLD',    'ANALYZE'],
  ['HOLD',    'DECONSTRUCT'],
  ['RESPOND', 'ANALYZE'],
  ['RESPOND', 'DECONSTRUCT'],
  ['RECALL',  'ANALYZE'],
  ['RECALL',  'DECONSTRUCT']
];

function _applyInterference(superpos) {
  if (!superpos || superpos.length < 2) return superpos;
  var top = superpos[0];
  var second = superpos[1];

  // Check for destructive interference between top two
  for (var di = 0; di < _DESTRUCTIVE_PAIRS.length; di++) {
    var pair = _DESTRUCTIVE_PAIRS[di];
    if ((top.type === pair[0] && second.type === pair[1]) ||
        (top.type === pair[1] && second.type === pair[0])) {
      // Destructive: amplify the winner, suppress the other
      var winner = top.amplitude >= second.amplitude ? top.type : second.type;
      return superpos.map(function(item) {
        if (item.type === winner) return { type: item.type, amplitude: Math.min(1.0, item.amplitude * 1.3) };
        if (item.type === (winner === top.type ? second.type : top.type))
          return { type: item.type, amplitude: item.amplitude * 0.3 };
        return item;
      }).sort(function(a, b) { return b.amplitude - a.amplitude; });
    }
  }

  // Check for constructive interference
  for (var ci = 0; ci < _CONSTRUCTIVE_PAIRS.length; ci++) {
    var cpair = _CONSTRUCTIVE_PAIRS[ci];
    if ((top.type === cpair[0] && second.type === cpair[1]) ||
        (top.type === cpair[1] && second.type === cpair[0])) {
      // Constructive: both amplified, dominant one wins but keeps the secondary
      return superpos.map(function(item) {
        if (item.type === cpair[0] || item.type === cpair[1])
          return { type: item.type, amplitude: Math.min(1.0, item.amplitude * 1.15) };
        return item;
      }).sort(function(a, b) { return b.amplitude - a.amplitude; });
    }
  }

  return superpos;
}

// ── PHASE 6: FINAL COLLAPSE ───────────────────────────────────
// The wavefunction collapses to a single type for the generator.
// The full superposition is preserved on the result object for
// the UI to show and for the conversation state to track.

function _collapse(superpos, premiseScore, text) {
  if (!superpos || !superpos.length) return TYPES.EXPLAIN;

  // RESPOND is always highest priority — safety
  for (var i = 0; i < superpos.length; i++) {
    if (superpos[i].type === 'RESPOND' && superpos[i].amplitude > 0.5) return TYPES.RESPOND;
  }

  // Hard overrides
  var tl = text.toLowerCase();
  if (/https?:\/\/[^\s]+/.test(text)) return TYPES.URL;
  if (/\b(generate|create|make|draw|visualize|paint)\s.{0,15}(image|picture|photo|visual|artwork)\b/i.test(text)) return TYPES.IMAGE;
  if (/\b(analyze|read|examine)\s.{0,10}(image|photo|picture)\b/i.test(text)) return TYPES.IMAGE;
  if (/\b(uploaded?|pdf|docx|spreadsheet|this file|the file|this document)\b/i.test(text)) return TYPES.DOCUMENT;

  return superpos[0].type;
}

// ── RETRIEVAL SOURCES ─────────────────────────────────────────

function _buildSources(text, type) {
  var sources = [];
  var flags = {};
  var dkeys = Object.keys(_DOMAIN_FLAGS);
  for (var dk = 0; dk < dkeys.length; dk++) {
    if (_DOMAIN_FLAGS[dkeys[dk]].test(text)) {
      flags[dkeys[dk]] = true;
      var ds = _DOMAIN_SRCS[dkeys[dk]] || [];
      for (var dsi = 0; dsi < ds.length; dsi++) {
        if (sources.indexOf(ds[dsi]) < 0) sources.push(ds[dsi]);
      }
    }
  }
  // Always include baseline
  if (sources.indexOf('wikipedia') < 0)  sources.unshift('wikipedia');
  if (sources.indexOf('conceptnet') < 0 && sources.length < 3) sources.splice(1, 0, 'conceptnet');
  // Dedupe, cap 6
  var seen = {}, deduped = [];
  for (var sx = 0; sx < sources.length; sx++) {
    if (!seen[sources[sx]]) { seen[sources[sx]] = true; deduped.push(sources[sx]); }
    if (deduped.length >= 6) break;
  }
  return { sources: deduped, flags: flags };
}

// ── MAIN CLASSIFY — THE FULL RHIZOME PIPELINE ────────────────

function classify(text) {
  var lang = detectLanguageCode(text);

  // ── HARD OVERRIDES — run before any scoring ──────────────
  if (/https?:\/\/[^\s]+/.test(text))
    return _mkResult(TYPES.URL, 0.97, [], {}, lang, 'analytical', []);

  if (/(generate|create|make|draw|visualize|paint|illustrate)\s.{0,20}(image|picture|photo|visual|illustration|artwork)/i.test(text) ||
      /^(generate|draw|paint|illustrate)\s+(an?\s+)?/i.test(text))
    return _mkResult(TYPES.IMAGE, 0.95, [], {imageGenerate:true}, lang, 'analytical', []);

  if (/(analyze|analyse|read|examine|what is in|what does)\s.{0,15}(image|photo|picture|photograph)/i.test(text))
    return _mkResult(TYPES.IMAGE, 0.95, [], {imageAnalysis:true}, lang, 'analytical', []);

  if (/(uploaded?|pdf|docx|spreadsheet|this file|the file|this document|the document)/i.test(text))
    return _mkResult(TYPES.DOCUMENT, 0.92, ['wikipedia'], {}, lang, 'analytical', []);

  // RESPOND — safety priority
  for (var ri = 0; ri < _SIG.RESPOND.length; ri++) {
    if (_SIG.RESPOND[ri].r.test(text) && _SIG.RESPOND[ri].w >= 0.88) {
      return _mkResult(TYPES.RESPOND, 0.95, [], {}, lang, 'human', []);
    }
  }

  // PHASE 1: Score all types
  var scored = _scoreAllTypes(text);

  // PHASE 2: Build superposition
  var superpos = _buildSuperposition(scored.scores, 0.30);

  // PHASE 3: Encoder feedback
  var feedbackResult = _encoderFeedback(text, superpos);
  var activatedEnts  = {};
  var quickProfile   = null;
  if (feedbackResult && feedbackResult.feedbackApplied) {
    superpos    = feedbackResult.superpos;
    quickProfile = feedbackResult.quickProfile;
    // PHASE 4: Entanglement pre-activation
    activatedEnts = _activateEntanglements(quickProfile);
  }

  // PHASE 5: Interference pruning
  superpos = _applyInterference(superpos);

  // PHASE 6: Final collapse
  var collapsed = _collapse(superpos, scored.premiseScore, text);

  // Retrieval sources
  var retrieval = _buildSources(text, collapsed);

  // Voice
  var voice = collapsed === TYPES.RESPOND    ? 'human'    :
              collapsed === TYPES.HOLD       ? 'poetic'   :
              (collapsed === TYPES.DEBATE || collapsed === TYPES.CRITIQUE) ? 'critical' : 'analytical';

  // EXPLAIN vs ANALYZE disambiguation via encoder feedback
  if (collapsed === TYPES.EXPLAIN && quickProfile) {
    var mi = parseFloat(quickProfile.myth_index) || 0.5;
    if (mi > 0.65 && text.length < 100) collapsed = TYPES.ANALYZE;
  }

  var confidence = superpos.length > 0 ? superpos[0].amplitude : 0.72;

  return _mkResult(collapsed, confidence, retrieval.sources, retrieval.flags, lang, voice, superpos, activatedEnts);
}

function _mkResult(type, confidence, sources, flags, lang, voice, superpos, activatedEnts) {
  return {
    type:           type,
    confidence:     Math.round((confidence || 0.72) * 100) / 100,
    needsRetrieval: type !== TYPES.RESPOND && type !== TYPES.HOLD,
    retrievalSources: sources && sources.length ? sources : ['wikipedia', 'conceptnet'],
    flags:          flags || {},
    languageCode:   lang || LANG.EN,
    voice:          voice || 'analytical',
    moveSequence:   MOVE_SEQUENCES[type] || MOVE_SEQUENCES[TYPES.EXPLAIN],
    // Rhizome additions
    superposition:  superpos || [],    // full type amplitudes — preserved for UI/conversation
    activatedEnts:  activatedEnts || {} // pre-activated entanglements — available to generator
  };
}
// SECTION 4 — QUANTUM ENCODER
// ════════════════════════════════════════════════════════════

var _AMP = [
  'natural','naturally','obvious','obviously','always','everyone','universal',
  'inevitable','necessary','simply','just','inherent','innate','biological',
  'human nature','tradition','normal','common sense','self-evident',
  'goes without saying','scientifically proven','backed by science',
  'just the way','since time immemorial','has always been'
];

var _DAMP = [
  'data shows','study found','research indicates','measured','observed',
  'experiment','peer reviewed','statistically','empirically','evidence',
  'documented','verified','falsifiable','replicable','the literature suggests',
  'meta-analysis','according to the data','clinical trial'
];

var _NSM = {
  'good|positive|benefit|help|valuable|worth':           'GOOD',
  'bad|harm|hurt|damage|negative|wrong|evil':            'BAD',
  'know|knowledge|understand|aware|conscious':           'KNOW',
  'think|thought|idea|concept|belief|opinion':           'THINK',
  'want|desire|need|require|wish|hope|seek':             'WANT',
  'feel|emotion|feeling|affect|sense|experience':        'FEEL',
  'see|visible|look|watch|observe':                      'SEE',
  'hear|sound|listen|voice|word|say':                    'HEAR',
  'do|action|act|perform|make|create|build':             'DO',
  'happen|occur|event|situation|moment':                 'HAPPEN',
  'move|motion|travel|flow|change|transform':            'MOVE',
  'exist|being|real|there is|present':                   'THERE_IS',
  'live|alive|life|living|survive':                      'BE_ALIVE',
  'die|death|dead|end|finish|cease':                     'DIE',
  'cause|because|result|produce|lead to':                'BECAUSE',
  'people|person|human|individual|someone':              'PEOPLE',
  'many|multiple|various|diverse|all|every':             'MUCH_MANY',
  'not|no|without|absence|lack|never|nothing':           'NOT',
  'if|when|condition|provided|assuming|unless':          'IF',
  'before|past|history|origin|previously|ancient':       'BEFORE',
  'after|future|progress|develop|later|next':            'AFTER',
  'big|large|great|major|vast|enormous|significant':     'BIG',
  'small|minor|little|micro|minimal|slight':             'SMALL',
  'same|equal|identical|equivalent|universal|standard':  'THE_SAME',
  'other|different|distinct|alternative|diverse':        'OTHER',
  'above|higher|superior|dominant|power|over':           'ABOVE',
  'below|lower|inferior|subordinate|under|oppressed':    'BELOW',
  'near|close|local|community|together|collective':      'NEAR',
  'far|distant|foreign|global|abstract':                 'FAR',
  'like|similar|resembles|as if|analogous':              'LIKE_AS',
  'more|greater|increase|expand|grow|rise':              'MORE',
  'very|extremely|highly|intensely|deeply':              'VERY'
};

// Extended cultural wavefunction clusters (using all 94 communities)
var _WF_CLUSTERS = {
  Institutional:  ['Liberal_international','Neoliberal_economic','Western_liberal','Military_institutional','US_security_state','State_security','Mainstream_economics','Conservative_traditional','Realist_international'],
  Academic:       ['Academic_humanities','Academic_economics','Academic_AI','Keynesian','Secular_humanist','Enlightenment_Western','Historical_consensus','Philosophy_of_mind','Neuroscience'],
  Liberation:     ['Postcolonial','Marxist_socialist','Pan_African_Liberation','Afrocentric','Subaltern_Studies','Dependency_Theory','Négritude','Black_Feminist_Thought','African_Feminist_Thought','Prison_Abolition','Disability_Justice'],
  Indigenous:     ['Indigenous_worldview','Buen_Vivir','Ubuntu_Philosophy','Bantu_Philosophy','Filipino_Kapwa_Philosophy','Amazigh_Berber_Framework','Oral_Epistemology','Indigenous_Science','Indigenous_alternative','Vietnamese_Philosophy'],
  Spiritual:      ['Islamic_traditional','Buddhist','Advaita_Vedanta','Religious_fundamentalist','Liberation_Theology','Jewish_memory','Persian_Philosophical_Tradition','East_Asian_Confucian'],
  Feminist:       ['Feminist','Latin_American_Feminism','Black_Feminist_Thought','Queer_of_Color_Critique','Disability_Justice','Afro_Latin_Perspectives'],
  Resistance:     ['Palestinian_Political_Thought','Zapatismo','Resistance_movements','Anarchist','Pan_Arabism','Peasant_and_Landless_Thought'],
  Scientific:     ['Scientific_consensus','Biology_consensus','Physics_consensus','Medical_consensus','Astrophysics_consensus','Computer_science'],
  Aesthetic:      ['Western_aesthetic','Western_romantic','Romantic','Existentialist','Psychoanalytic','Music_theory']
};

function _communityCluster(communityName) {
  var ckeys = Object.keys(_WF_CLUSTERS);
  for (var ck = 0; ck < ckeys.length; ck++) {
    if (_WF_CLUSTERS[ckeys[ck]].indexOf(communityName) >= 0) return ckeys[ck];
  }
  return 'Institutional';
}

function _buildLiveWF(mi, anchors) {
  var primary = (anchors && anchors[0]) || 'Liberal_international';
  var primaryCluster = _communityCluster(primary);
  var amps = {};

  // Assign reading per cluster based on primary anchor and myth_index
  var clusterMIs = {
    Institutional: mi,
    Academic:      Math.max(0.05, mi - 0.08),
    Liberation:    Math.min(1.0, mi + 0.18),
    Indigenous:    Math.min(1.0, mi + 0.22),
    Spiritual:     mi > 0.6 ? Math.min(1.0, mi + 0.10) : mi * 0.92,
    Feminist:      Math.min(1.0, mi + 0.14),
    Resistance:    Math.min(1.0, mi + 0.20),
    Scientific:    Math.max(0.02, mi - 0.25),
    Aesthetic:     mi * 0.88
  };

  var clusterAmps = {
    Institutional: 0.35, Academic: 0.22, Liberation: 0.18,
    Indigenous: 0.12, Spiritual: 0.07, Feminist: 0.03,
    Resistance: 0.02, Scientific: 0.01, Aesthetic: 0.01
  };
  // Boost the primary cluster
  if (clusterAmps[primaryCluster]) clusterAmps[primaryCluster] = Math.min(0.55, clusterAmps[primaryCluster] + 0.20);

  // Normalize
  var total = 0;
  var cks = Object.keys(clusterAmps);
  for (var i = 0; i < cks.length; i++) total += clusterAmps[cks[i]];
  for (i = 0; i < cks.length; i++) {
    var cl = cks[i];
    amps[cl] = {
      amplitude: Math.round(clusterAmps[cl]/total*100)/100,
      myth_index: Math.round(clusterMIs[cl]*1000)/1000,
      phase: i * 0.12,
      sample_communities: (_WF_CLUSTERS[cl]||[]).slice(0,3)
    };
  }
  return { amplitudes: amps };
}

function matchConcept(tl) {
  var keys = Object.keys(SP).sort(function(a,b){ return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    var phrase = keys[i].replace(/_/g,' ');
    var esc = _escRe(phrase);
    try {
      if (new RegExp('\\b'+esc+'\\b','i').test(tl)) return keys[i];
    } catch(e) {
      if (tl.indexOf(phrase.toLowerCase()) >= 0) return keys[i];
    }
  }
  return null;
}

function _escRe(s) {
  var r='', sp='.^$*+?()[]{}|\\';
  for (var i=0;i<s.length;i++){ if(sp.indexOf(s[i])>=0)r+='\\'; r+=s[i]; }
  return r;
}

function encodeUnit(text, ctx, profiles, communities, classification) {
  profiles = profiles||SP; communities = communities||CA;
  var tl = text.toLowerCase().trim();
  var matched = matchConcept(tl);
  var profile = matched ? profiles[matched] : null;
  var derived = !profile;

  var L5 = profile ? _fromProfile(profile) : _fromNSM(tl);

  // Wavefunction — use profile's if exists, else build live
  if (!L5.wavefunction) {
    L5.wavefunction = _buildLiveWF(L5.myth_index, L5.cultural_anchors);
  }

  // Cultural context collapse
  if (ctx && communities[ctx]) {
    var cl = _communityCluster(ctx);
    L5.cultural_anchor = ctx;
    L5.collapsed_reading = cl;
    if (L5.wavefunction.amplitudes[cl]) {
      L5.myth_index = Math.round(L5.wavefunction.amplitudes[cl].myth_index*1000)/1000;
    }
    var comm = communities[ctx];
    var ht = comm.high_myth_terms||[];
    for (var k=0;k<ht.length;k++) {
      if (tl.indexOf(ht[k].toLowerCase())>=0) {
        L5.myth_index = Math.min(1.0, L5.myth_index+0.12); break;
      }
    }
  } else {
    L5.collapsed_reading = 'Institutional';
  }

  // Interference
  var ac=0, dc=0;
  for (var ai=0;ai<_AMP.length;ai++) if(tl.indexOf(_AMP[ai])>=0) ac++;
  for (var di=0;di<_DAMP.length;di++) if(tl.indexOf(_DAMP[di])>=0) dc++;
  var interference = Math.min(0.25, ac*0.05) - Math.min(0.25, dc*0.07);
  L5.myth_index = Math.min(1.0, Math.max(0.0, L5.myth_index+interference));
  L5.myth_index = Math.round(L5.myth_index*1000)/1000;
  L5.interference = interference;

  // ORDER:4
  L5.order_4 = Math.round(Math.min(1.0, L5.myth_index*0.5+(L5.order_2||0)*0.5)*1000)/1000;

  // ── FEEDBACK LOOP: encoding adjusts classification ────────────
  if (classification && L5) {
    var mi = L5.myth_index || 0;
    var dom = L5.dominant_order || 2;
    // High myth + EXPLAIN → upgrade to ANALYZE
    if (classification.type === TYPES.EXPLAIN && mi > 0.70) {
      classification.type = TYPES.ANALYZE;
      classification.confidence = Math.max(classification.confidence, 0.80);
      if (classification.moveSequence) classification.moveSequence = MOVE_SEQUENCES[TYPES.ANALYZE];
    }
    // ORDER:3 concept + factual question → shift toward HOLD
    if (dom === 3 && (classification.type === TYPES.EXPLAIN || classification.type === TYPES.RECALL)) {
      if (mi < 0.4) { // Only for genuinely obtuse concepts, not political ones
        classification.type = TYPES.HOLD;
        classification.voice = 'poetic';
      }
    }
    // DECONSTRUCT signal + political concept → strengthen confidence
    if (classification.flags && classification.flags.suppressedPremise && mi > 0.65) {
      if (classification.type !== TYPES.DECONSTRUCT) {
        classification.superposition = classification.superposition || {};
        classification.superposition[TYPES.DECONSTRUCT] = 0.75;
      }
    }
  }
  var routing = _routing(L5, classification);

  // Entanglement pre-activation — pull related concepts immediately
  var activatedEntanglements = [];
  if (L5.entanglements && L5.entanglements.length && profiles) {
    for (var ei = 0; ei < Math.min(3, L5.entanglements.length); ei++) {
      var ent = L5.entanglements[ei];
      var entKey = ent.concept && ent.concept.replace(/\s+/g,'_').toLowerCase();
      var entProfile = profiles[ent.concept] || profiles[entKey];
      if (entProfile) {
        activatedEntanglements.push({
          concept: ent.concept,
          type: ent.type,
          coupling: ent.coupling,
          myth_index: parseFloat(entProfile.myth_index) || 0.5,
          dominant_order: entProfile.dominant_order || 2,
          note: entProfile.note || null
        });
      }
    }
  }

  return {
    L5: L5,
    routing: routing,
    matched: matched, text: text, derived: derived,
    lang: classification && classification.languageCode,
    activatedEntanglements: activatedEntanglements
  };
}

function _fromProfile(p) {
  var mi=parseFloat(p.myth_index)||0.5, o1=parseFloat(p.order_1)||0.5,
      o2=parseFloat(p.order_2)||0.5, o3=parseFloat(p.order_3)||0.5;
  var dom=p.dominant_order||(o3>0.65?3:o2>o1?2:1);
  return {
    myth_index:mi, order_1:o1, order_2:o2, order_3:o3, order_4:0,
    dominant_order:dom, certainty_index:parseFloat(p.certainty_index)||0.6,
    punctum:parseFloat(p.punctum)||0.3, obtuse_index:parseFloat(p.obtuse_index)||0.3,
    cultural_anchor:p.cultural_anchor||(p.cultural_anchors&&p.cultural_anchors[0])||'Liberal_international',
    cultural_anchors:p.cultural_anchors||[p.cultural_anchor||'Liberal_international'],
    peircean_type:p.peircean_type||'symbol',
    codes:p.codes||{HER:0.3,ACT:0.3,SEM:0.4,SYM:0.4,REF:0.3},
    denotation:p.denotation||'', connotation:p.connotation||'',
    note:p.note||null, etymology:p.etymology||null,
    genealogy:p.genealogy||null, multiplicities:p.multiplicities||null,
    affects:p.affects||_defAffects(mi), intensities:p.intensities||_defIntensities(mi,o1,o2,o3),
    wavefunction:p.wavefunction||null, entanglements:p.entanglements||[],
    key_thinkers:p.key_thinkers||[], key_concepts:p.key_concepts||[],
    deconstructs:p.deconstructs||[], opacities:(p.multiplicities&&p.multiplicities.opacities)||[],
    english_approximation:p.english_approximation||null
  };
}

function _fromNSM(tl) {
  var mi=0.35, ac=0, dc=0;
  for (var ai=0;ai<_AMP.length;ai++) if(tl.indexOf(_AMP[ai])>=0) ac++;
  for (var di=0;di<_DAMP.length;di++) if(tl.indexOf(_DAMP[di])>=0) dc++;
  mi = Math.min(0.92, Math.max(0.05, 0.35+ac*0.08-dc*0.10));
  var hasAbs=/\b(freedom|justice|democracy|power|truth|meaning|consciousness|love|death|god|time|space|reality|being|identity|culture)\b/i.test(tl);
  var hasCon=/\b(data|study|experiment|measurement|number|statistic|fact|evidence|proof)\b/i.test(tl);
  var hasPol=/\b(state|government|capitalism|economy|class|race|gender|colonialism|war|violence|law|rights)\b/i.test(tl);
  var o1=hasCon?0.72:0.42, o2=(mi>0.5||hasPol)?0.65:0.32, o3=hasAbs?0.58:0.22;
  var tot=o1+o2+o3;
  o1=Math.round(o1/tot*100)/100; o2=Math.round(o2/tot*100)/100; o3=Math.round(o3/tot*100)/100;
  var dom=o3>0.65?3:(o2>o1?2:1);
  var prims=[];
  var nkeys=Object.keys(_NSM);
  for (var ni=0;ni<nkeys.length;ni++) {
    try { if(new RegExp('\\b('+nkeys[ni]+')\\b').test(tl)) prims.push(_NSM[nkeys[ni]]); } catch(e){}
  }
  return {
    myth_index:Math.round(mi*1000)/1000, order_1:o1, order_2:o2, order_3:o3, order_4:0,
    dominant_order:dom, certainty_index:0.42, punctum:o3>0.5?0.58:0.28,
    obtuse_index:o3>0.6?0.68:0.28,
    cultural_anchor:'Liberal_international', cultural_anchors:['Liberal_international'],
    peircean_type:mi>0.6?'symbol':'index',
    codes:{HER:hasAbs?0.48:0.22, ACT:hasPol?0.55:0.28, SEM:hasAbs?0.62:0.32, SYM:mi>0.5?0.65:0.28, REF:hasCon?0.58:0.28},
    denotation:'Concept derived from NSM analysis', connotation:mi>0.6?'Elevated ideological loading detected':'Moderate loading',
    note:'NSM primitives: '+prims.slice(0,6).join(', '),
    etymology:null, genealogy:null, multiplicities:null,
    affects:_defAffects(mi), intensities:_defIntensities(mi,o1,o2,o3),
    wavefunction:null, entanglements:[], key_thinkers:[], key_concepts:[],
    deconstructs:[], opacities:[], nsm_primitives:prims, derivation_confidence:0.42
  };
}

function _defAffects(mi) {
  return {
    power_to_question:         Math.round((-mi*0.80+0.40)*100)/100,
    power_to_imagine_alternatives: Math.round((-mi*0.70+0.35)*100)/100,
    power_to_act:              Math.round((0.50-mi*0.20)*100)/100,
    power_to_connect:          Math.round((-mi*0.50+0.25)*100)/100
  };
}

function _defIntensities(mi,o1,o2,o3) {
  return {
    power_axis:       Math.round(mi*0.90*100)/100,
    visibility_axis:  Math.round((o1*0.70-o3*0.30)*100)/100,
    temporality_axis: Math.round(o2*0.60*100)/100,
    collectivity_axis:Math.round((o3*0.40-o1*0.20)*100)/100,
    materiality_axis: Math.round((o1*0.50-mi*0.30)*100)/100
  };
}

function _routing(L5, cl) {
  var mi=L5.myth_index||0.5, codes=L5.codes||{}, dom=L5.dominant_order||2;
  var sc={
    FACTUAL:    (1-mi)*0.65+(codes.REF||0)*0.35,
    IDEOLOGICAL:mi*0.60+(codes.SYM||0)*0.40,
    NARRATIVE:  (codes.ACT||0)*0.50+(codes.HER||0)*0.50,
    ANALYTICAL: (codes.SEM||0)*0.55+(L5.certainty_index||0.5)*0.45,
    EMPATHIC:   (L5.punctum||0)*0.60+(dom===3?0.40:0),
    POETIC:     (L5.obtuse_index||0)*0.65+(dom===3?0.35:0),
    GENEALOGICAL:(L5.genealogy?0.60:0)+(L5.etymology?0.40:0),
    MATERIAL:   (L5.order_4||0)*0.70+(mi>0.7?0.30:0)
  };
  if (cl) {
    var t=cl.type;
    if(t===TYPES.RESPOND)     sc.EMPATHIC    +=0.60;
    if(t===TYPES.DEBATE)      sc.IDEOLOGICAL +=0.35;
    if(t===TYPES.DECONSTRUCT) sc.IDEOLOGICAL +=0.45;
    if(t===TYPES.HOLD)        sc.POETIC      +=0.55;
    if(t===TYPES.RECALL)      sc.FACTUAL     +=0.65;
    if(t===TYPES.TRACE)       sc.GENEALOGICAL+=0.50;
    if(t===TYPES.NARRATE)     sc.NARRATIVE   +=0.50;
    if(t===TYPES.CRITIQUE)    sc.IDEOLOGICAL +=0.35;
    if(t===TYPES.DATA)        sc.FACTUAL     +=0.40;
  }
  var primary='ANALYTICAL', top=0;
  var rk=Object.keys(sc);
  for(var i=0;i<rk.length;i++) if(sc[rk[i]]>top){top=sc[rk[i]];primary=rk[i];}
  return {primary:primary, scores:sc};
}

// ════════════════════════════════════════════════════════════
// SECTION 5 — RHIZOME SYNTHESIS ENGINE (Streaming / As-You-Receive)
// ════════════════════════════════════════════════════════════
// Sources are scored as they arrive — synthesis begins immediately.
// No waiting for all 17 sources. No sequential processing.
// The synthesis state is a live field that updates with each source.
// ════════════════════════════════════════════════════════════

var _SRC_BASE = {
  wikipedia:0.45, worldbank:0.72, congress:0.68, europarl:0.55,
  iacthr:0.35,    africaunion:0.38, marxists:0.28, sep:0.48, iep:0.48,
  scholar:0.46,   doaj:0.46,   pubmed:0.40,   loc:0.52, gutenberg:0.48,
  gdelt:0.54,     acled:0.38,  conceptnet:0.44, wiktionary:0.38,
  paradisec:0.28, vdem:0.42,   manifesto:0.50, europeana:0.50, wordnet:0.42
};

// Ideological cluster assignments — for wavefunction mapping of sources
var _SRC_CLUSTER = {
  worldbank:   'Institutional',   congress:   'Institutional',
  europarl:    'Institutional',   sep:        'Academic',
  iep:         'Academic',        scholar:    'Academic',
  doaj:        'Academic',        pubmed:     'Academic',
  marxists:    'Liberation',      iacthr:     'Liberation',
  africaunion: 'Indigenous',      paradisec:  'Indigenous',
  gdelt:       'Academic',        gutenberg:  'Academic',
  wikipedia:   'Institutional',   conceptnet: 'Academic',
  wiktionary:  'Academic',        loc:        'Institutional',
  acled:       'Liberation',      vdem:       'Academic',
  manifesto:   'Institutional',   europeana:  'Academic',
  wordnet:     'Academic'
};

// ── QUICK MYTH SCORE ─────────────────────────────────────────
// Scores a single source's content for myth_index
// Called once per source as it arrives — not after all arrive

function _qms(text, src) {
  if (!text || text.length < 15) return null;
  var tl = text.toLowerCase();
  var s  = _SRC_BASE[src] || 0.50;
  var AMP = ['natural','naturally','obvious','obviously','always','everyone','universal',
             'inevitable','necessary','simply','just','inherent','innate','human nature',
             'tradition','normal','common sense','self-evident','goes without saying'];
  var DAMP= ['data shows','study found','research indicates','measured','observed',
             'experiment','peer reviewed','statistically','empirically','evidence',
             'documented','verified','falsifiable','replicable','meta-analysis'];
  for (var ai = 0; ai < AMP.length; ai++)  if (tl.indexOf(AMP[ai]) >= 0)  s += 0.032;
  for (var di = 0; di < DAMP.length; di++) if (tl.indexOf(DAMP[di]) >= 0) s -= 0.042;
  return Math.min(1.0, Math.max(0.0, Math.round(s * 1000) / 1000));
}

function _sd(vals) {
  if (!vals.length) return 0;
  var m = 0;
  for (var i = 0; i < vals.length; i++) m += vals[i];
  m /= vals.length;
  var v = 0;
  for (i = 0; i < vals.length; i++) v += Math.pow(vals[i] - m, 2);
  return Math.sqrt(v / vals.length);
}

// ── LIVE SYNTHESIS STATE ──────────────────────────────────────
// A running synthesis object that can be updated incrementally
// as sources arrive. The generator can read from this at any time
// — even before all sources are received — getting the best
// available reading from whatever has arrived so far.

function createSynthesisState(profileMI) {
  return {
    profileMI:       profileMI || 0.5,
    scored:          [],       // { source, mythScore, reliability, cluster }
    clusterScores:   {},       // { clusterName: { total, count, avg } }
    live_myth_index: profileMI || 0.5,
    source_divergence: 0,
    source_count:    0,
    disagreement:    null,
    sources_used:    [],
    confidence:      0.50,
    complete:        false
  };
}

// Call this each time a source arrives — O(1) per source
function updateSynthesis(state, source) {
  if (!source || !source.content || source.content.length < 20) return state;

  var ms = _qms(source.content, source.source);
  if (ms === null) return state;

  var entry = {
    source:      source.source,
    mythScore:   ms,
    reliability: source.reliability || 0.75,
    cluster:     _SRC_CLUSTER[source.source] || 'Academic'
  };

  state.scored.push(entry);
  state.sources_used.push(source.source);
  state.source_count = state.scored.length;

  // Update cluster scores
  var cl = entry.cluster;
  if (!state.clusterScores[cl]) state.clusterScores[cl] = { total: 0, count: 0, avg: 0 };
  state.clusterScores[cl].total += ms;
  state.clusterScores[cl].count += 1;
  state.clusterScores[cl].avg   = state.clusterScores[cl].total / state.clusterScores[cl].count;

  // Recompute live_myth_index
  var scores     = state.scored.map(function(s) { return s.mythScore; });
  var divergence = _sd(scores);
  var tw = 0, ws = 0;
  for (var i = 0; i < state.scored.length; i++) {
    tw += state.scored[i].reliability;
    ws += state.scored[i].mythScore * state.scored[i].reliability;
  }
  var avg = tw > 0 ? ws / tw : 0.5;
  var divAmp = Math.min(0.18, divergence * 0.55);

  state.live_myth_index  = Math.min(1.0, Math.max(0.0,
    state.profileMI * 0.42 + avg * 0.33 + divAmp * 0.25));
  state.live_myth_index  = Math.round(state.live_myth_index * 1000) / 1000;
  state.source_divergence= Math.round(divergence * 1000) / 1000;
  state.confidence       = Math.min(0.94, Math.max(0.35, 0.52 + state.scored.length * 0.045 - divergence * 0.22));

  // Update disagreement string
  if (divergence >= 0.15) {
    var sorted     = state.scored.slice().sort(function(a, b) { return b.mythScore - a.mythScore; });
    var hiSrc      = sorted[0];
    var loSrc      = sorted[sorted.length - 1];
    state.disagreement = divergence > 0.35
      ? 'High ideological divergence across sources (' + Math.round(divergence * 100) + '% spread). ' +
        hiSrc.source + ' reads it at ' + Math.round(hiSrc.mythScore * 100) + '% ideological loading; ' +
        loSrc.source + ' at ' + Math.round(loSrc.mythScore * 100) + '%. The spread is the measurement.'
      : 'Moderate divergence (' + Math.round(divergence * 100) + '% spread) — sources agree on denotation but differ on ideological weight.';
  } else {
    state.disagreement = null;
  }

  return state;
}

// Finalize a synthesis state
function finalizeSynthesis(state) {
  state.complete  = true;
  state.most_mythic = state.scored.length
    ? state.scored.reduce(function(a, b) { return a.mythScore > b.mythScore ? a : b; }, state.scored[0])
    : null;
  state.least_mythic = state.scored.length
    ? state.scored.reduce(function(a, b) { return a.mythScore < b.mythScore ? a : b; }, state.scored[0])
    : null;
  return state;
}

// Batch synthesize (legacy path — called with all sources at once)
function synthesize(encoding, sources) {
  var profileMI = (encoding && encoding.L5 && encoding.L5.myth_index) || 0.5;
  var state     = createSynthesisState(profileMI);

  if (!sources || !sources.length) {
    state.complete = true;
    return state;
  }

  for (var i = 0; i < sources.length; i++) {
    updateSynthesis(state, sources[i]);
  }

  return finalizeSynthesis(state);
}

// ── RHIZOME RETRIEVAL WRAPPER ─────────────────────────────────
// Fires all API calls in parallel and calls a callback
// for EACH result as it arrives — feeding the synthesis
// state incrementally instead of waiting for all 17.

function retrieveParallelStreaming(query, sourceNames, onSourceReceived, onComplete) {
  sourceNames = sourceNames || ['wikipedia', 'conceptnet'];
  if (typeof SOURCE_MAP === 'undefined' || !SOURCE_MAP) {
    if (onComplete) onComplete([]);
    return;
  }

  var valid = sourceNames.filter(function(s) { return SOURCE_MAP[s]; });
  if (!valid.length) { if (onComplete) onComplete([]); return; }

  var received = [];
  var pending  = valid.length;

  valid.forEach(function(source) {
    SOURCE_MAP[source](query)
      .then(function(result) {
        received.push(result);
        if (result && result.content && onSourceReceived) {
          onSourceReceived(result); // fire immediately — don't wait
        }
      })
      .catch(function(err) {
        // Source failed — just skip it
      })
      .finally(function() {
        pending--;
        if (pending === 0 && onComplete) onComplete(received);
      });
  });
}

// Legacy non-streaming version (used in tests and fallback)
function retrieveParallel(query, sources) {
  sources = sources || ['wikipedia', 'conceptnet'];
  if (typeof SOURCE_MAP === 'undefined') return Promise.resolve([]);
  var valid = sources.filter(function(s) { return SOURCE_MAP[s]; });
  if (!valid.length) return Promise.resolve([]);
  var promises = valid.map(function(s) {
    return SOURCE_MAP[s](query).catch(function() { return null; });
  });
  return Promise.allSettled
    ? Promise.allSettled(promises).then(function(results) {
        return results.map(function(r) { return r.status === 'fulfilled' ? r.value : null; }).filter(Boolean);
      })
    : Promise.all(promises).then(function(results) { return results.filter(Boolean); });
}

// SECTION 6 — SLE FLUENCY GENERATOR (Sprint 3)
// Move-planned. Register-precise. Prose that reads as written, not assembled.
// No scores visible. No technical codes. Finished sentences only.
// ════════════════════════════════════════════════════════════

// ── SENTENCE TERMINATION HELPER ─────────────────────────────
// Ensures every part ends with proper punctuation before joining
function _cap(s) {
  if (!s) return '';
  s = s.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function _end(s) {
  if (!s) return '';
  s = s.trim();
  if (!s) return '';
  var last = s[s.length - 1];
  if (last === '.' || last === '?' || last === '!' || last === ':' || last === '\u2014') return s;
  return s + '.';
}

// Join prose parts with double space (paragraph-like breathing)
function _join(parts) {
  return parts.filter(Boolean).map(function(p) { return _end(p.trim()); }).join(' ');
}

// Interference pruning — removes parts that destructively interfere
// (repeat semantic content already established)
function _prune(parts) {
  if (!parts || parts.length <= 2) return parts;
  var pruned = [parts[0]];
  var established = parts[0].toLowerCase().split(/\s+/).slice(0,8).join(' ');
  for (var i = 1; i < parts.length; i++) {
    var p = parts[i].toLowerCase();
    var words = p.split(/\s+/).slice(0,6).join(' ');
    // Skip if this part starts with the same semantic field as established content
    if (established.indexOf(words) >= 0 || p.indexOf(established.slice(0,30)) >= 0) {
      continue; // destructive interference — prune
    }
    pruned.push(parts[i]);
    established += ' ' + words;
  }
  return pruned;
}

function _p(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── LINGUISTICS DATABASE ─────────────────────────────────────

var _LD = {

  // ── OPENINGS ─────────────────────────────────────────────

  NAMING: [
    'The phrase does something specific, and it is worth examining what.',
    'This word is doing more work than it appears to be doing.',
    'Before reaching for a definition, it is worth asking what this concept performs.',
    'The interesting question here is not what the term means but what it does.',
    'Language is rarely neutral, and this phrase is a useful case in point.',
    'There is a gap between what this term says and what it accomplishes \u2014 and that gap is the analysis.'
  ],

  PROVOCATION: [
    'The most interesting thing about this phrase is what it conceals.',
    'What this concept does is almost the inverse of what it appears to say.',
    'This is one of the most deliberately constructed phrases in political language.',
    'The phrase sounds like description. It functions as instruction.',
    'Most people who use this term have no idea how carefully it was designed.',
    'Beneath the neutral surface of this phrase, a specific operation is running.',
    'The word arrives wearing the clothes of objectivity. The clothes do not fit.'
  ],

  HISTORICAL: [
    'This concept has a precise origin, and the origin matters.',
    'The phrase entered common usage at a very specific moment in history \u2014 one that explains its shape.',
    'To understand what this word does, it helps to know when and why it was made.',
    'This concept was produced. It did not simply emerge from the natural evolution of language.',
    'There is a specific room, at a specific moment, where this phrase was chosen over the alternatives.',
    'The history of this concept is the history of a deliberate decision about which reality to make visible.'
  ],

  OBSERVATION: [
    'Starting with what is directly visible:',
    'At the surface, the denotation is relatively clear.',
    'The literal meaning is not where the difficulty lies.',
    'On its face, the concept is uncomplicated enough.',
    'What the word points to, in its most basic sense, is this:',
    'The first thing that needs to be said is also the simplest.'
  ],

  CONCESSION: [
    'The standard reading of this concept is not without basis.',
    'There is a genuine sense in which the conventional understanding holds.',
    'The dominant definition captures something real \u2014 the problem is what it leaves out.',
    'Before examining what is missing, it is worth acknowledging what is present.',
    'The mainstream account is not wrong so much as it is incomplete in a specific and consequential way.'
  ],

  // ── TRANSITIONS ──────────────────────────────────────────

  T_ADD: [
    'This is compounded by the fact that',
    'There is a further dimension worth noting.',
    'Beyond this, and perhaps more significantly,',
    'There is a dimension here that goes beyond semantics:',
    'What amplifies this further is worth naming directly:',
    'The ideological work becomes visible when you notice:',
    'The analysis deepens when you notice that'
  ],

  T_CONTRAST: [
    'The reading looks very different from a different position.',
    'Set against this, another tradition sees it entirely differently.',
    'The picture is more complicated than this account suggests.',
    'A different framework produces a radically different reading.',
    'Where the dominant view finds evidence, a critical reading finds erasure.'
  ],

  T_CAUSE: [
    'This is not arbitrary \u2014 it follows from a specific logic.',
    'The mechanism is worth naming directly.',
    'What produces this effect is',
    'This is not accidental. It follows from'
  ],

  T_EXAMPLE: [
    'Consider what this looks like in practice.',
    'A concrete case makes this visible.',
    'The clearest instance of this pattern is',
    'To make this specific rather than abstract:'
  ],

  T_GEN: [
    'The etymology is instructive here.',
    'The word\u2019s history tells a story its current usage suppresses.',
    'Going back to the root reveals something the dominant usage has buried.',
    'What the word originally meant illuminates what its current usage hides.',
    'The Latin is direct in a way the current usage is not.'
  ],

  T_TURN: [
    'Here is where the analysis becomes genuinely interesting.',
    'The picture shifts when you hold it against a different cultural position.',
    'A different reading tradition produces something quite different.',
    'What complicates and enriches this is',
    'This is where the semiotic reading diverges from the obvious one.'
  ],

  T_SYNTH: [
    'What emerges from this, taken together, is',
    'The threads pull toward a single conclusion:',
    'Assembling this:',
    'The picture, in full, is this:'
  ],

  T_AFFECT: [
    'At the level of what it enables or forecloses \u2014 in terms of thinking, imagining, questioning \u2014 this sign',
    'What this phrase does to the space of the thinkable is',
    'The political effect of this language, at the level of the imagination, is that it'
  ],

  T_MATERIAL: [
    'This reading depends on specific material conditions.',
    'The institutional infrastructure that makes this meaning possible is',
    'The economic conditions that produce this framing include'
  ],

  T_OPACITY: [
    'This is the point at which translation breaks down entirely.',
    'Something is lost in every rendering of this concept, and that loss is significant.',
    'The concept resists translation in a way that is itself part of its meaning.',
    'There is no equivalent in English, and the absence of an equivalent is information.'
  ],

  // ── MYTH DESCRIPTION ─────────────────────────────────────

  MYTH_HUMAN: {
    vhigh: 'The concept is doing almost entirely ideological work at this point \u2014 it presents a political arrangement as natural fact with near-total effectiveness.',
    high:  'The ideological loading is substantial: the concept naturalizes a specific political arrangement, presenting it as though it were simply a description of reality.',
    mid:   'The concept operates in contested terrain \u2014 partly factual, partly ideological, with both dimensions pulling simultaneously.',
    low:   'The concept is predominantly denotative, naming something relatively directly, though not without undertow.',
    vlow:  'The concept is doing largely descriptive work here \u2014 it names something with low ideological loading.'
  },

  MYTH_CMP: [
    'For comparison: gravity carries 1% ideological loading, love 61%, freedom 74%, collateral damage 91%.',
    'To put this in context: gravity scores 1%, democracy 66%, capitalism 78%.',
    'By comparison: scientific terms cluster below 10%, political terms between 50\u201380%, euphemisms above 85%.',
    'Context: the average political concept scores around 55\u201360%. The concept you are reading now sits considerably above that.'
  ],

  // ── ORDER DESCRIPTIONS ─────────────────────────────────

  ORDER_PROSE: {
    1: 'This concept works primarily at the level of the literal \u2014 it names something verifiable, something that can in principle be observed and measured.',
    2: 'This is a concept that operates at the level of myth \u2014 where Barthes means not fiction but the naturalization of ideology, the place where political arrangements come to appear as natural facts.',
    3: 'The concept moves in a register that exceeds what analysis can fully account for. It holds something that resists being made entirely transparent.',
    4: 'What this concept does depends on specific material and institutional conditions \u2014 the economic infrastructure that makes this particular meaning not just available but inevitable.'
  }
};

function _mythHuman(mi) {
  if (mi > 0.88) return _LD.MYTH_HUMAN.vhigh;
  if (mi > 0.70) return _LD.MYTH_HUMAN.high;
  if (mi > 0.45) return _LD.MYTH_HUMAN.mid;
  if (mi > 0.20) return _LD.MYTH_HUMAN.low;
  return _LD.MYTH_HUMAN.vlow;
}

function _mythCtx(mi) {
  return Math.round(mi * 100) + '%, ' + _p(_LD.MYTH_CMP);
}

// ── MAIN GENERATE FUNCTION ───────────────────────────────────

function generate(encoding, synthesis, classification, sources) {
  var type    = (classification && classification.type) || TYPES.EXPLAIN;
  var L5      = (encoding && encoding.L5) || {};
  var matched = (encoding && encoding.matched) || null;
  var derived = encoding && encoding.derived;
  sources     = sources || [];
  synthesis   = synthesis || {};

  switch (type) {
    case TYPES.RECALL:      return _gRecall(L5, matched, sources);
    case TYPES.EXPLAIN:     return _gExplain(L5, matched, derived, sources, synthesis);
    case TYPES.ANALYZE:     return _gAnalyze(L5, matched, derived, sources, synthesis);
    case TYPES.DEBATE:      return _gDebate(L5, matched, synthesis);
    case TYPES.DECONSTRUCT: return _gDeconstruct(L5, matched);
    case TYPES.HOLD:        return _gHold(L5, matched);
    case TYPES.RESPOND:     return _gRespond();
    case TYPES.COMPARE:     return _gCompare(L5, matched, synthesis);
    case TYPES.TRACE:       return _gTrace(L5, matched);
    case TYPES.CRITIQUE:    return _gCritique(L5, matched, synthesis);
    case TYPES.TRANSLATE:   return _gTranslate(L5, matched);
    case TYPES.NARRATE:     return _gNarrate(L5, matched);
    case TYPES.MAP:         return _gMap(L5, matched);
    case TYPES.DATA:        return _gData(L5, matched, synthesis);
    default:                return _gExplain(L5, matched, derived, sources, synthesis);
  }
}

// ── RECALL ───────────────────────────────────────────────────

function _gRecall(L5, matched, sources) {
  for (var i = 0; i < sources.length; i++) {
    if (sources[i].source === 'wikipedia' && sources[i].content && sources[i].content.length > 40) {
      return sources[i].content.slice(0, 500);
    }
  }
  return L5.denotation || 'That specific factual information is not in the current knowledge base. Try rephrasing.';
}

// ── EXPLAIN ──────────────────────────────────────────────────

function _gExplain(L5, matched, derived, sources, synthesis) {
  var concept = matched || 'this concept';
  var mi = L5.myth_index || 0.5;
  var parts = [];

  // Opening: plain, clear, not labeled
  if (L5.denotation) {
    var obs = _p(_LD.OBSERVATION);
    // Some observation openings end with colon — handle as intro
    if (obs.slice(-1) === ':') {
      parts.push(obs + ' ' + concept + ' refers to ' + L5.denotation.toLowerCase());
    } else {
      // Ends with period — new sentence
      var cap = concept.charAt(0).toUpperCase() + concept.slice(1);
      parts.push(obs + ' ' + cap + ' refers to ' + L5.denotation.toLowerCase());
    }
  }

  // Wikipedia content if available
  for (var i = 0; i < sources.length; i++) {
    if (sources[i].source === 'wikipedia' && sources[i].content && sources[i].content.length > 60) {
      parts.push(sources[i].content.slice(0, 280));
      break;
    }
  }

  // Etymology as story, not data
  if (L5.etymology) {
    parts.push(_p(_LD.T_GEN) + ' The word comes from ' + L5.etymology.language + ' \u2014 ' + L5.etymology.root + ' \u2014 literally meaning \u201c' + L5.etymology.literal + '.\u201d' + (L5.etymology.trace ? ' ' + L5.etymology.trace : ''));
  }

  // Connotation only if significantly loaded
  if (L5.connotation && mi > 0.45) {
    parts.push('Beyond the denotation, ' + concept + ' carries ideological weight: ' + L5.connotation.toLowerCase());
  }

  // Note
  if (L5.note && !derived) parts.push(L5.note.slice(0, 260));
  if (derived) parts.push('Note: this concept was derived from first principles rather than from the core knowledge base. Treat it as a starting point.');

  return _join(parts);
}

// ── ANALYZE ──────────────────────────────────────────────────

function _gAnalyze(L5, matched, derived, sources, synthesis) {
  var concept = matched || 'this concept';
  var mi = L5.myth_index || 0.5;
  var dom = L5.dominant_order || 2;
  var parts = [];

  // MOVE 1: NAMING — lead with the operation, not the label
  parts.push(_p(_LD.NAMING));

  // MOVE 2: DENOTATION — establish the ground
  if (L5.denotation) {
    parts.push('In its most basic sense, ' + concept + ' refers to ' + L5.denotation.toLowerCase());
  }

  // MOVE 3: CONNOTATION — what it actually does
  if (L5.connotation) {
    parts.push(_p(_LD.T_ADD) + ' what the concept actually performs, at the ideological level, is ' + L5.connotation.toLowerCase());
  }

  // MOVE 4: ETYMOLOGY REVEAL — the buried political history
  if (L5.etymology) {
    parts.push(_p(_LD.T_GEN) + ' The word derives from ' + L5.etymology.language + ' \u201c' + L5.etymology.root + '\u201d \u2014 literally \u201c' + L5.etymology.literal + '.\u201d' +
      (L5.etymology.trace ? ' ' + _cap(L5.etymology.trace) : '') + (L5.etymology.suppression ? ' ' + _cap(L5.etymology.suppression) : ''));
  }

  // MOVE 5: MYTH LOADING — score arrives as conclusion with context
  parts.push(_mythHuman(mi) + ' The ideological loading registers at ' + _mythCtx(mi));

  // MOVE 6: ORDER — which register this operates in
  parts.push(_LD.ORDER_PROSE[dom] || _LD.ORDER_PROSE[2]);

  // MOVE 7: WAVEFUNCTION SHIFT — how different communities read it
  if (L5.wavefunction && L5.wavefunction.amplitudes) {
    var amps = L5.wavefunction.amplitudes;
    var keys = Object.keys(amps);
    if (keys.length >= 2) {
      var readings = keys.slice(0, 3).map(function(k) {
        var d = amps[k];
        var verb = d.myth_index > 0.75 ? 'reads this as near-total ideological operation' :
                   d.myth_index > 0.50 ? 'finds significant ideological loading' :
                   d.myth_index > 0.30 ? 'holds this with some ambivalence' : 'reads this as relatively straightforward';
        return k.replace(/_/g, ' ') + ' ' + verb;
      });
      parts.push(_p(_LD.T_TURN) + ' The concept does not mean the same thing from every position. ' + readings.join('; ') + '.');
    }
  }

  // MOVE 8: CROSS-SOURCE — divergence as data
  if (synthesis && synthesis.live_myth_index && synthesis.source_count > 0 && synthesis.disagreement) {
    parts.push(synthesis.disagreement);
  }

  // MOVE 9: AFFECT MAPPING — what it does to thinking
  if (L5.affects) {
    var af = [];
    if (L5.affects.power_to_question < -0.35) af.push('closes the capacity to question');
    if (L5.affects.power_to_question > 0.35) af.push('opens the capacity to question');
    if (L5.affects.power_to_imagine_alternatives < -0.35) af.push('narrows what can be imagined as possible');
    if (L5.affects.power_to_imagine_alternatives > 0.35) af.push('expands the space of imaginable alternatives');
    if (L5.affects.power_to_connect < -0.35) af.push('severs solidarities');
    if (L5.affects.power_to_connect > 0.35) af.push('builds solidarities');
    if (af.length) {
      parts.push(_p(_LD.T_AFFECT) + ' ' + af.join(', ') + '.');
    }
  }

  // MOVE 10: SILENCE — what the concept suppresses
  if (L5.genealogy && L5.genealogy.silenced_genealogy) {
    parts.push('What this framing makes invisible: ' + L5.genealogy.silenced_genealogy.toLowerCase());
  }

  // KEY THINKERS
  if (L5.key_thinkers && L5.key_thinkers.length) {
    parts.push('The thinkers who have worked most rigorously on this include ' + L5.key_thinkers.slice(0, 4).join(', ') + '.');
  }

  // NOTE
  if (L5.note) parts.push(L5.note.slice(0, 300));
  if (derived) parts.push('This analysis was derived from first principles \u2014 the concept was not in the core knowledge base. Treat it with slightly lower confidence than a curated profile.');

  return _join(parts);
}

// ── DEBATE ───────────────────────────────────────────────────

function _gDebate(L5, matched, synthesis) {
  var concept = matched || 'this';
  var parts = [];

  parts.push(_p(_LD.CONCESSION) + ' The disagreement here runs deeper than the surface argument suggests.');
  parts.push('What is at stake is not primarily a factual dispute. It is a disagreement about which values are treated as primary, whose experience counts as evidence, and which historical narrative provides the frame for reading this question.');

  if (L5.wavefunction && L5.wavefunction.amplitudes) {
    var entries = [];
    var amps = L5.wavefunction.amplitudes;
    var keys = Object.keys(amps);
    for (var i = 0; i < keys.length; i++) entries.push([keys[i], amps[keys[i]]]);
    entries.sort(function(a, b) { return b[1].amplitude - a[1].amplitude; });

    if (entries.length >= 2) {
      var posA = entries[0], posB = entries[1];
      parts.push('The position of ' + posA[0].replace(/_/g, ' ') + ' builds its case on the values and frameworks most legible within that tradition \u2014 and from inside that tradition, the case is coherent. The ideological loading of this reading is ' + _mythHuman(posA[1].myth_index).split(' \u2014')[0] + '.');
      parts.push(_p(_LD.T_CONTRAST) + ' The position of ' + posB[0].replace(/_/g, ' ') + ' operates from different foundational commitments. It does not simply reach different conclusions \u2014 it is asking different questions, because it starts from different foundational premises about what counts as real and what counts as harm.');
    }
  } else {
    if (L5.denotation) parts.push('The case for the mainstream position draws on: ' + L5.denotation.toLowerCase());
    if (L5.connotation) parts.push(_p(_LD.T_CONTRAST) + ' a critical reading attends to: ' + L5.connotation.toLowerCase());
  }

  parts.push('Neither position is arguing in bad faith. They are starting from different premises about what counts as real, whose experience is the test case, and which history provides the relevant frame.');

  if (synthesis && synthesis.disagreement) parts.push(synthesis.disagreement);

  return _join(parts);
}

// ── DECONSTRUCT ──────────────────────────────────────────────

function _gDeconstruct(L5, matched) {
  var concept = matched || 'this concept';
  var parts = [];

  // Lead with the provocation — name what's hidden
  parts.push(_p(_LD.PROVOCATION));

  // Name the premise in the question
  if (L5.connotation && L5.connotation.length > 20 && L5.connotation.indexOf('varies dramatically') < 0 && L5.connotation.indexOf('by cultural anchor') < 0) {
    parts.push('The question carries a premise that deserves to be named rather than assumed: ' + L5.connotation.toLowerCase() + '. This is presented as background fact rather than as the contested claim that it is.');
  } else if (L5.denotation) {
    parts.push('The question contains an assumption built into its framing. The concept at issue — ' + L5.denotation.toLowerCase() + ' — is not the neutral description it presents itself as.');
  }

  // Etymology reveals
  if (L5.etymology) {
    parts.push(_p(_LD.T_GEN) + ' the etymology is unusually direct. The root is ' + L5.etymology.language + ' \u201c' + L5.etymology.root + '\u201d \u2014 literally \u201c' + L5.etymology.literal + '.\u201d' +
      (L5.etymology.trace ? ' ' + _cap(L5.etymology.trace) : '') + (L5.etymology.suppression ? ' ' + _cap(L5.etymology.suppression) : ''));
  }

  // Genealogy — when did this become naturalized
  if (L5.genealogy) {
    var gen = L5.genealogy;
    parts.push('The premise was not always self-evident. It became naturalized' +
      (gen.invention_moment ? ' around ' + gen.invention_moment : ' at a specific historical moment') +
      (gen.inventor_position ? ', produced by ' + gen.inventor_position : '') + '.');
    if (gen.silenced_genealogy) {
      parts.push('What this naturalization suppresses: ' + gen.silenced_genealogy.toLowerCase());
    }
  }

  // Answer with the premise now visible
  if (L5.denotation) {
    parts.push('With that premise visible: ' + L5.denotation.toLowerCase() + '. But that denotation only holds within the specific framework that produced the question \u2014 and different frameworks produce genuinely different answers, which is itself the most important finding here.');
  } else {
    parts.push('The question is answerable, but the answer looks different once the premise is visible rather than assumed.');
  }

  return _join(parts);
}

// ── HOLD ─────────────────────────────────────────────────────
// Sparse. Centered. Does not explain. Holds.

function _gHold(L5, matched) {
  var concept = matched || null;

  // If there's a note written for holding, use that
  if (L5.note && L5.note.length > 30 && L5.note !== 'Something that exceeds cultural codification') {
    return L5.note;
  }
  // Build a held response — minimal, elliptical, not explanatory
  var parts = [];
  var holdFallbacks = [
    concept ? (concept + ' names something that resists full explanation. It holds its meaning against any attempt to make it entirely transparent.') : 'Some things hold more than they explain. This is one of them.',
    concept ? ('There are things ' + concept + ' names that analysis can approach but not exhaust. The naming is already most of the work.') : 'The question is real. The answer that would close it is not available.',
    (concept ? (_cap(concept) + ' exceeds') : 'This exceeds') + ' what can be said about it. That irreducibility is part of what it is.'
  ];

  if (L5.denotation && (L5.dominant_order || 2) !== 3) {
    parts.push(concept ? (concept + ': ' + L5.denotation.slice(0, 120)) : L5.denotation.slice(0, 120));
  }

  // For ORDER:3, the connotation is the held meaning
  if (L5.connotation && (L5.obtuse_index || 0) > 0.4) {
    parts.push(L5.connotation.slice(0, 180));
  }

  if (!parts.length) parts.push(_p(holdFallbacks));
  // Add supporting elements
  if (L5.denotation && L5.denotation.length > 10) {
    parts.push('In its most literal sense: ' + L5.denotation.toLowerCase() + '.');
  }
  if (L5.etymology && L5.etymology.literal) {
    parts.push('The word comes from a root meaning \u201c' + L5.etymology.literal + '.\u201d' + (L5.etymology.trace ? ' ' + _cap(L5.etymology.trace) + '.' : ''));
  }
  return parts.filter(Boolean).join('\n\n');
}

// ── RESPOND ──────────────────────────────────────────────────

function _gRespond() {
  var responses = [
    'What you\'re describing sounds significant. You don\'t have to rush past it. If talking through what\'s happening would help, I\'m here for that. If you\'d rather look for something more concrete \u2014 a framework, a next step, a resource \u2014 we can do that too. What would feel most useful right now?',
    'That sounds like a lot to be carrying. I\'m not going to offer you an analysis or a framework unless you want one. If you want to talk through what\'s happening, we can do that. What would help?',
    'I hear you. There\'s no pressure to explain or make sense of it before you\'re ready. If it would help to think out loud, or to find something concrete to hold onto, I\'m here. What feels most necessary right now?'
  ];
  return _p(responses);
}

// ── COMPARE ──────────────────────────────────────────────────

function _gCompare(L5, matched, synthesis) {
  var concept = matched || 'these concepts';
  var parts = [];

  parts.push('Comparison here requires holding multiple encodings at once rather than collapsing them into a simple hierarchy.');

  if (L5.denotation) {
    parts.push('The primary concept \u2014 ' + concept + ' \u2014 refers to ' + L5.denotation.toLowerCase() + ' This reading carries ' + _mythHuman(L5.myth_index || 0.5).split(' \u2014')[0] + '.');
  }

  if (L5.multiplicities) {
    var m = L5.multiplicities;
    if (m.why_binary_fails) parts.push(m.why_binary_fails);
    if (m.multiplicities && m.multiplicities.length) {
      var names = m.multiplicities.slice(0, 5).map(function(x) { return x.concept; });
      parts.push('Rather than a simple binary, the field contains: ' + names.join(', ') + '.');
    }
    if (m.opacities && m.opacities.length) {
      parts.push(_p(_LD.T_OPACITY) + ' ' + m.opacities.map(function(o) {
        return 'For ' + o.community.replace(/_/g, ' ') + ', this concept is ' + o.type.replace(/_/g, ' ');
      }).join('; ') + '.');
    }
  }

  if (synthesis && synthesis.disagreement) parts.push(synthesis.disagreement);
  return _join(parts);
}

// ── TRACE ────────────────────────────────────────────────────

function _gTrace(L5, matched) {
  var concept = matched || 'this concept';
  var parts = [];

  parts.push(_p(_LD.HISTORICAL));

  if (L5.genealogy) {
    var gen = L5.genealogy;
    if (gen.invention_moment) {
      parts.push(concept + ' in its current form emerged around ' + gen.invention_moment + '.' + (gen.invention_context ? ' ' + gen.invention_context : ''));
    }
    if (gen.inventor_position) parts.push('It was produced by ' + gen.inventor_position + '.');
    if (gen.pre_history) parts.push('Before this moment existed: ' + gen.pre_history.toLowerCase());
    if (gen.naturalization_moment) {
      parts.push('The concept moved from contested to natural around ' + gen.naturalization_moment + '. This is the crucial transition \u2014 the moment when a political choice becomes a fact.');
    }
    if (gen.silenced_genealogy) {
      parts.push('Running alongside the official account, a different story: ' + gen.silenced_genealogy.toLowerCase());
    }
    if (gen.current_formation) {
      parts.push('Its current institutional home is: ' + gen.current_formation.toLowerCase());
    }
  } else if (L5.etymology) {
    parts.push('The trace begins with the word itself: from ' + L5.etymology.language + ' \u2014 ' + L5.etymology.root + ', meaning ' + L5.etymology.literal + '. ' + (L5.etymology.trace || ''));
  } else {
    parts.push('A full genealogical trace for this concept is not in the current knowledge base.' + (L5.denotation ? ' What is available: ' + L5.denotation.toLowerCase() : ''));
  }

  return _join(parts);
}

// ── CRITIQUE ─────────────────────────────────────────────────

function _gCritique(L5, matched, synthesis) {
  var parts = [];

  parts.push(_p(_LD.OBSERVATION) + ' what the argument claims on its surface.');
  if (L5.denotation) parts.push('The stated position: ' + L5.denotation.toLowerCase());
  parts.push(_p(_LD.T_TURN) + ' a critical reading asks what the argument cannot accommodate, whose experience it erases, and which premises it requires without stating.');
  if (L5.connotation) parts.push('What the framing actually does: ' + L5.connotation.toLowerCase());
  if (L5.genealogy && L5.genealogy.silenced_genealogy) {
    parts.push('What it makes invisible: ' + L5.genealogy.silenced_genealogy.toLowerCase());
  }
  if (L5.affects && L5.affects.power_to_imagine_alternatives < -0.3) {
    parts.push(_p(_LD.T_AFFECT) + ' narrows what can be imagined as possible \u2014 which is itself a political operation, not a neutral analytical consequence.');
  }

  return _join(parts);
}

// ── TRANSLATE ────────────────────────────────────────────────

function _gTranslate(L5, matched) {
  var concept = matched || 'this concept';
  var parts = [];

  parts.push(_p(_LD.T_OPACITY));

  if (L5.english_approximation) {
    parts.push('The closest English approximation is: ' + L5.english_approximation + '. But approximation is the operative word \u2014 something is damaged in the translation, and that damage is part of the meaning.');
  }

  if (L5.note) parts.push(L5.note.slice(0, 300));

  if (L5.wavefunction) {
    parts.push('The concept holds different amplitudes in different reading communities, and those differences are not a problem to be solved but a property of what the concept is.');
  }

  return _join(parts);
}

// ── NARRATE ──────────────────────────────────────────────────

function _gNarrate(L5, matched) {
  var concept = matched || 'this concept';
  var parts = [];

  parts.push('The story of ' + concept + ' is a story about language doing political work across time.');

  if (L5.genealogy) {
    var gen = L5.genealogy;
    if (gen.pre_history) parts.push('Before its current meaning existed: ' + gen.pre_history.toLowerCase());
    if (gen.invention_moment && gen.invention_context) {
      parts.push('Then, around ' + gen.invention_moment + ': ' + gen.invention_context.toLowerCase());
    }
    if (gen.naturalization_moment) {
      parts.push('Around ' + gen.naturalization_moment + ' the concept stopped being contested and started being obvious. This is the moment that matters most in any genealogy \u2014 the moment when a political choice becomes a natural fact.');
    }
    if (gen.silenced_genealogy) {
      parts.push('Running alongside the dominant story, a different account that the official narrative displaced: ' + gen.silenced_genealogy.toLowerCase());
    }
    if (gen.current_formation) parts.push('Today, its institutional form is: ' + gen.current_formation.toLowerCase());
  } else if (L5.etymology) {
    parts.push('The word itself carries its own history: from ' + L5.etymology.language + ' \u2014 ' + L5.etymology.literal + '. ' + (L5.etymology.trace || ''));
  } else {
    parts.push('A full narrative genealogy for this concept is not available here.' + (L5.denotation ? ' What is: ' + L5.denotation.toLowerCase() : ''));
  }

  return _join(parts);
}

// ── MAP ──────────────────────────────────────────────────────

function _gMap(L5, matched) {
  var concept = matched || 'this concept';
  var parts = [];

  parts.push('The conceptual field around ' + concept + ' is not a list of synonyms. It is a structured space of tensions, resonances, and fractures.');

  if (L5.entanglements && L5.entanglements.length) {
    parts.push('The most significant entanglements: ' +
      L5.entanglements.slice(0, 5).map(function(e) {
        return e.concept + ' (' + e.type + ')';
      }).join(', ') + '.');
  }

  if (L5.multiplicities && L5.multiplicities.multiplicities) {
    parts.push('Rather than simple oppositions, the field contains: ' +
      L5.multiplicities.multiplicities.slice(0, 5).map(function(m) {
        return m.concept + ' (' + m.relation.replace(/_/g, ' ') + ')';
      }).join('; ') + '.');
  }

  if (L5.wavefunction && L5.wavefunction.amplitudes) {
    parts.push('The concept carries different amplitudes across different cultural positions \u2014 and mapping those differences is equivalent to mapping the ideological territory of the field.');
  }

  return _join(parts);
}

// ── DATA ─────────────────────────────────────────────────────

function _gData(L5, matched, synthesis) {
  var parts = [];

  parts.push('Starting with what the data claims to measure \u2014 and then asking why it measures that and not something else.');
  parts.push('Every dataset encodes political choices as though they were neutral technical decisions. The most consequential of these is the choice of what to count, which structures all subsequent analysis.');
  if (L5.connotation) parts.push(_p(_LD.T_ADD) + ' ' + L5.connotation.toLowerCase());
  if (synthesis && synthesis.disagreement) parts.push(synthesis.disagreement);
  parts.push('The question to ask of any dataset: what is systematically absent? What would need to be measured differently for a different conclusion to be available? The absence is not neutral \u2014 it was chosen.');

  return _join(parts);
}

// ── IMAGE GENERATION ─────────────────────────────────────────

function generateImagePrompt(encoding) {
  var L5      = (encoding && encoding.L5) || {};
  var matched = encoding && encoding.matched;
  var dom     = L5.dominant_order || 2;
  var mi      = L5.myth_index || 0.5;

  var orderVis = {
    1: 'documentary photography, Magnum Photos aesthetic, precise editorial clarity, clean directional light, factual weight in composition, scientific illustration precision',
    2: 'photojournalism tradition, stark contrast, institutional framing visible in geometry, power asymmetry embedded in the frame, diagonal tension, Salgado aesthetic of witnessing',
    3: 'liminal light, soft grain, that which cannot be shown but is present, Tarkovsky slow cinema, impressionistic not symbolic, what holds against explanation visible as texture',
    4: 'industrial infrastructure as subject, material conditions made aesthetically legible, Edward Burtynsky scale of human systems, production relations as landscape'
  };

  var mythReg = mi > 0.80
    ? 'ideological naturalization made strange by form \u2014 the thing that hides itself is here made visible'
    : mi > 0.55
    ? 'contested framing, ambiguity as formal principle, multiple readings available simultaneously'
    : mi > 0.30
    ? 'factual precision with conceptual undertow'
    : 'documentary clarity, low symbolic loading';

  var etymVis = L5.etymology && L5.etymology.visual_metaphor
    ? L5.etymology.visual_metaphor + ' \u2014 the root meaning ' + L5.etymology.literal + ' made visible'
    : '';

  var affVis = '';
  if (L5.affects) {
    var ab = [];
    if (L5.affects.power_to_question < -0.55)              ab.push('foreclosure visible in tight framing');
    if (L5.affects.power_to_imagine_alternatives < -0.55)  ab.push('constraint of possibility in spatial compression');
    if (L5.affects.power_to_connect > 0.55)                ab.push('solidarity as compositional openness');
    if (L5.affects.power_to_connect < -0.55)               ab.push('severed connections in fragmented composition');
    affVis = ab.join(', ');
  }

  var concept = matched || 'the concept';
  var pp = [
    'Subject: ' + concept + '.',
    'Conceptual ground: ' + (L5.denotation ? L5.denotation.slice(0, 100) : concept) + '.',
    'Visual register: ' + (orderVis[dom] || orderVis[2]) + '.',
    'Ideological atmosphere: ' + mythReg + '.'
  ];
  if (etymVis) pp.push('Etymology visual: ' + etymVis + '.');
  if (affVis)  pp.push('Compositional affect: ' + affVis + '.');
  pp.push('Technical: 16:9 cinematic, high contrast, fine grain, no text, no watermarks, no identifiable portraits, no flags.');

  return {
    prompt:        pp.join(' '),
    negativePrompt:'NEGATIVE PROMPT: no text overlay, no watermarks, no logos, no cartoon style, no stock photography, no identifiable real people, no explicit violence, no flags, no diagrams',
    concept:       concept,
    orderVisual:   orderVis[dom] || orderVis[2],
    mythRegister:  mythReg
  };
}

function generatePollinationsURL(prompt, width, height, seed, model) {
  return 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) +
    '?width=' + (width || 1024) + '&height=' + (height || 768) +
    '&seed=' + (seed || Math.floor(Math.random() * 999999)) +
    '&model=' + (model || 'flux') + '&nologo=true';
}

// ── FOLLOW-UPS ────────────────────────────────────────────────

function generateFollowUps(encoding, classification) {
  var L5      = (encoding && encoding.L5) || {};
  var matched = (encoding && encoding.matched) || null;
  var type    = (classification && classification.type) || TYPES.EXPLAIN;
  var concept = matched || 'this concept';
  var fups    = [];

  if (L5.entanglements && L5.entanglements.length) {
    fups.push('What is the relationship between ' + concept + ' and ' + L5.entanglements[0].concept + '?');
  }
  if (L5.etymology) {
    fups.push('What does the etymology of \u201c' + concept + '\u201d reveal about its history?');
  }
  if (L5.genealogy && !L5.etymology) {
    fups.push('How did \u201c' + concept + '\u201d acquire its current meaning, and when?');
  }
  if (L5.wavefunction && L5.wavefunction.amplitudes) {
    var ak = Object.keys(L5.wavefunction.amplitudes);
    if (ak.length >= 2) {
      fups.push('How does the ' + ak[ak.length - 1].replace(/_/g, ' ') + ' read \u201c' + concept + '\u201d differently?');
    }
  }
  if ((L5.dominant_order || 2) === 2) {
    fups.push('What does \u201c' + concept + '\u201d make invisible by naming it this way?');
  }
  if ((L5.dominant_order || 2) === 3) {
    fups.push('What in \u201c' + concept + '\u201d exceeds analysis and holds against explanation?');
  }
  if ((L5.myth_index || 0) > 0.60) {
    fups.push('What material conditions are required for \u201c' + concept + '\u201d to seem natural?');
  }
  if (type === TYPES.DEBATE) {
    fups.push('Which values are actually in conflict here, beneath the surface argument?');
  }
  if (type === TYPES.DECONSTRUCT) {
    fups.push('What would this question look like if the suppressed premise were made explicit?');
  }
  if (L5.entanglements && L5.entanglements.length > 1) {
    fups.push('How does \u201c' + concept + '\u201d compare to ' + L5.entanglements[1].concept + '?');
  }

  // Shuffle
  for (var i = fups.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = fups[i]; fups[i] = fups[j]; fups[j] = tmp;
  }
  return fups.slice(0, 3);
}

// ── DRIFT CHECK ───────────────────────────────────────────────

function checkMythDrift(responseText, encoding) {
  var mi = (encoding && encoding.L5 && encoding.L5.myth_index) || 0;
  if (mi < 0.55) return null;
  var tl = responseText.toLowerCase();
  var flagged = [];
  var dw = ['naturally', 'obviously', 'of course', 'simply', 'everyone knows', 'always', 'inevitable', 'common sense', 'goes without saying', 'self-evident'];
  for (var i = 0; i < dw.length; i++) {
    if (tl.indexOf(dw[i]) >= 0) flagged.push(dw[i]);
  }
  if (flagged.length >= 2) {
    return 'Response uses naturalization language (' + flagged.join(', ') + ') for a concept with high ideological loading. These terms may inadvertently present contested positions as obvious facts.';
  }
  return null;
}
