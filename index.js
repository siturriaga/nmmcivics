// SEMION™ v4 — Firebase Cloud Functions (Complete)
// fetchSecureAPI · setRole · onSignUp · collectiveWrite · setCacheVersion · batchSync
// Copyright © 2026 Sebastian Iturriaga — synapsecopilot.com
// Project: semion-cca1c
'use strict';

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');
const cors      = require('cors')({ origin: [
  'https://semion-cca1c.web.app',
  'https://synapsecopilot.com',
  'http://localhost:5000',
  'http://127.0.0.1:5500'
]});

admin.initializeApp();
const db = admin.firestore();

const CFG         = functions.config().semion || {};

// ── RATE LIMITING ────────────────────────────────────────────
const RATE = { standard:{h:30,d:150}, teacher:{h:100,d:500}, admin:{h:999,d:9999} };

async function checkRate(uid, role) {
  const lim = RATE[role] || RATE.standard;
  const now  = Date.now();
  const hw   = Math.floor(now/3600000);
  const dw   = Math.floor(now/86400000);
  const ref  = db.collection('users').doc(uid).collection('rate_limits');
  const [hd, dd] = await Promise.all([ref.doc('h_'+hw).get(), ref.doc('d_'+dw).get()]);
  const hc = hd.exists ? (hd.data().count||0) : 0;
  const dc = dd.exists ? (dd.data().count||0) : 0;
  if (hc >= lim.h) return {ok:false, msg:'Hourly limit ('+lim.h+'/hr). Try again shortly.'};
  if (dc >= lim.d) return {ok:false, msg:'Daily limit ('+lim.d+'/day). Resets at midnight UTC.'};
  const batch = db.batch();
  batch.set(ref.doc('h_'+hw), {count:hc+1,ts:now},{merge:true});
  batch.set(ref.doc('d_'+dw), {count:dc+1,ts:now},{merge:true});
  await batch.commit();
  return {ok:true, rem:{h:lim.h-hc-1, d:lim.d-dc-1}};
}

async function verifyTok(req) {
  const a = req.headers.authorization || '';
  if (!a.startsWith('Bearer ')) return null;
  try { return await admin.auth().verifyIdToken(a.slice(7)); } catch(e){ return null; }
}

function withCors(fn) { return (q,s) => cors(q,s,()=>fn(q,s)); }

async function _get(url, hdrs, ms) {
  const AbortController = require('abort-controller');
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), ms||2500);
  try {
    const r = await fetch(url, {headers:hdrs||{},signal:ctrl.signal});
    clearTimeout(t); return r;
  } catch(e){ clearTimeout(t); throw e; }
}

function _text(html, max) {
  return (html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,max||1500);
}

// ── fetchSecureAPI ───────────────────────────────────────────
exports.fetchSecureAPI = functions.https.onRequest(withCors(async (req, res) => {
  const tok = await verifyTok(req);
  if (!tok) return res.status(401).json({error:'Unauthorized'});
  const rc = await checkRate(tok.uid, tok.role||'standard');
  if (!rc.ok) return res.status(429).json({error:rc.msg});

  const src   = (req.query.source||'').toLowerCase().trim();
  const query = (req.query.query||'').trim().slice(0,500);
  if (!src||!query) return res.status(400).json({error:'source and query required'});

  const handlers = {
    sep:         _sep,  iep:     _iep,  marxists: _marxists,
    iacthr:   _iacthr,  africaunion: _africaunion,
    europarl: _europarl,  wordnet:  _wordnet,  paradisec: _paradisec,
    loc:         _loc,        worldbank:_worldbank, url:       _url
  };

  const fn = handlers[src];
  if (!fn) return res.status(400).json({error:'Unknown source: '+src});

  try {
    const r = await fn(query);
    return res.json({source:src, content:r.content||'', metadata:r.meta||{}, reliability:r.rel||0.80});
  } catch(e) {
    console.error('fetchSecureAPI',src,e.message);
    return res.status(500).json({error:'Source unavailable',source:src});
  }
}));

async function _sep(q) {
  const slug = q.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const r = await _get('https://plato.stanford.edu/entries/'+slug+'/',{'User-Agent':'SEMION/4.0'});
  return {content:_text(await r.text(),1200), rel:0.95};
}
async function _iep(q) {
  const slug = q.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const r = await _get('https://iep.utm.edu/'+slug+'/',{'User-Agent':'SEMION/4.0'});
  return {content:_text(await r.text(),1000), rel:0.88};
}
async function _marxists(q) {
  const r = await _get('https://www.marxists.org/glossary/terms/'+q[0].toLowerCase()+'/'+encodeURIComponent(q.replace(/\s+/g,'').toLowerCase())+'.htm',{'User-Agent':'SEMION/4.0'});
  return {content:_text(await r.text(),1000), rel:0.88};
}

async function _iacthr(q) {
  const r = await _get('https://www.corteidh.or.cr/cf/Jurisprudencia2/busqueda_casos_contenciosos.cfm?lang=en&busqueda='+encodeURIComponent(q),{'User-Agent':'SEMION/4.0'});
  return {content:_text(await r.text(),800), rel:0.90};
}
async function _africaunion(q) {
  const r = await _get('https://au.int/en/search?search_api_fulltext='+encodeURIComponent(q),{'User-Agent':'SEMION/4.0'});
  return {content:_text(await r.text(),800), rel:0.85};
}
async function _europarl(q) {
  const r = await _get('https://www.europarl.europa.eu/search/en/s?q='+encodeURIComponent(q),{'User-Agent':'SEMION/4.0'});
  return {content:_text(await r.text(),800), rel:0.85};
}



async function _wordnet(q) {
  const r = await _get('http://wordnetweb.princeton.edu/perl/webwn?s='+encodeURIComponent(q),{'User-Agent':'SEMION/4.0'});
  return {content:_text(await r.text(),600), rel:0.82};
}
async function _paradisec(q) {
  const r = await _get('https://catalog.paradisec.org.au/search?query='+encodeURIComponent(q)+'&format=json');
  const d = await r.json();
  const c = ((d.items)||[]).slice(0,3).map(i=>(i.title||'')+': '+(i.description||'').slice(0,200)).join('\n');
  return {content:c, meta:{total:d.total}, rel:0.85};
}
async function _loc(q) {
  const r = await _get('https://www.loc.gov/search/?q='+encodeURIComponent(q)+'&fo=json&at=results&fa=online-format:online+text&c=3');
  const d = await r.json();
  const c = ((d.results)||[]).slice(0,3).map(i=>(i.title||'')+' ('+(i.date||'):')+' '+((i.description||[])[0]||'').slice(0,150)).join('\n');
  return {content:c, rel:0.92};
}
async function _worldbank(q) {
  const r = await _get('https://search.worldbank.org/api/v2/wds?format=json&qterm='+encodeURIComponent(q)+'&rows=3&fl=docdt,display_title,abstracts');
  const d = await r.json();
  const c = Object.values(d.documents||{}).slice(0,3).map(doc=>(doc.display_title||'')+': '+((doc.abstracts||'').slice(0,200))).join('\n');
  return {content:c, rel:0.82};
}
async function _url(url) {
  if (!url.startsWith('http')) throw new Error('Invalid URL');
  const r = await _get(url,{'User-Agent':'SEMION/4.0'},5000);
  return {content:_text(await r.text(),2000), rel:0.80};
}

// ── fluency ──────────────────────────────────────────────────
// SEMION uses its own SLE (Semantic Language Engine) for fluency.
// This runs entirely client-side. No external AI model is used.
// This endpoint is intentionally not implemented — SLE needs no server.
exports.fluency = functions.https.onRequest(withCors(async (req, res) => {
  return res.status(410).json({
    error: 'Fluency runs client-side via SLE. No server endpoint needed.',
    info:  'SEMION generates prose entirely through its own architecture.'
  });
}));

// ── tts ──────────────────────────────────────────────────────
// Voice handled client-side via Pollinations.AI TTS — no server function needed.
// Pollinations: free, no key, no account. See semion-firebase.js callTTS().
exports.tts = functions.https.onRequest(withCors(async (req, res) => {
  return res.status(410).json({
    error: 'TTS runs client-side via Pollinations.AI. No server endpoint needed.',
    info:  'Use https://text.pollinations.ai/ directly from the client.'
  });
}));

// ── setRole (callable) ────────────────────────────────────────
exports.setRole = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated','Sign in required');
  if (ctx.auth.token.role !== 'admin') throw new functions.https.HttpsError('permission-denied','Admin only');
  const {targetUid, role} = data;
  if (!targetUid||!role) throw new functions.https.HttpsError('invalid-argument','targetUid and role required');
  if (!['standard','teacher','admin'].includes(role)) throw new functions.https.HttpsError('invalid-argument','Invalid role');
  await admin.auth().setCustomUserClaims(targetUid, {role});
  await db.collection('users').doc(targetUid).set({role},{merge:true});
  return {success:true,uid:targetUid,role};
});

// ── onSignUp — set default role + create profile ───────────────
exports.onSignUp = functions.auth.user().onCreate(async (user) => {
  await admin.auth().setCustomUserClaims(user.uid, {role:'standard'});
  await db.collection('users').doc(user.uid).set({
    display_name: user.displayName||'',
    email:        user.email||'',
    photo_url:    user.photoURL||'',
    role:         'standard',
    created_at:   admin.firestore.FieldValue.serverTimestamp(),
    last_active:  admin.firestore.FieldValue.serverTimestamp(),
    opt_in_collective: false,
    preferences: {language:'en',voice_enabled:false,voice_provider:'browser'}
  },{merge:true});
});

// ── collectiveWrite (callable) ────────────────────────────────
exports.collectiveWrite = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated','Sign in required');
  const {concept, delta, optin} = data;
  if (!optin) return {skipped:true};
  if (!concept||typeof concept!=='string'||concept.length>200) throw new functions.https.HttpsError('invalid-argument','Invalid concept');
  if (typeof delta!=='number'||delta<-0.05||delta>0.05) throw new functions.https.HttpsError('invalid-argument','Delta must be -0.05 to 0.05');
  const ud = await db.collection('users').doc(ctx.auth.uid).get();
  if (!ud.exists||!ud.data().opt_in_collective) return {skipped:true,reason:'Not opted in'};
  const dw = Math.floor(Date.now()/86400000);
  const rl = db.collection('users').doc(ctx.auth.uid).collection('rate_limits').doc('coll_'+dw);
  const rld = await rl.get();
  const cnt = rld.exists?(rld.data().count||0):0;
  if (cnt>=10) return {skipped:true,reason:'Daily collective limit reached'};
  const ck = concept.replace(/[^a-zA-Z0-9_-]/g,'_');
  await db.runTransaction(async t => {
    const doc = await t.get(db.collection('collective').doc('myth_adjustments'));
    const ex = doc.exists?(doc.data()[ck]||{total_delta:0,sample_count:0}):{total_delta:0,sample_count:0};
    const nd = {total_delta:ex.total_delta+delta, sample_count:ex.sample_count+1, avg_delta:(ex.total_delta+delta)/(ex.sample_count+1), last_updated:Date.now()};
    const upd = {}; upd[ck] = nd;
    t.set(db.collection('collective').doc('myth_adjustments'), upd, {merge:true});
    t.set(rl, {count:cnt+1,ts:Date.now()},{merge:true});
  });
  return {success:true, concept};
});

// ── setCacheVersion (callable) ────────────────────────────────
exports.setCacheVersion = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated','Sign in required');
  if (ctx.auth.token.role!=='admin') throw new functions.https.HttpsError('permission-denied','Admin only');
  const v = data.version||Date.now().toString();
  await db.collection('cache_version').doc('semion_data').set({version:v, updated_at:admin.firestore.FieldValue.serverTimestamp()});
  return {success:true,version:v};
});

// ── batchSyncAnalyses ─────────────────────────────────────────
exports.batchSyncAnalyses = functions.https.onRequest(withCors(async (req, res) => {
  if (req.method!=='POST') return res.status(405).json({error:'POST only'});
  const tok = await verifyTok(req);
  if (!tok) return res.status(401).json({error:'Unauthorized'});
  const {analyses} = req.body;
  if (!Array.isArray(analyses)||!analyses.length) return res.status(400).json({error:'analyses array required'});
  if (analyses.length>50) return res.status(400).json({error:'max 50 per batch'});
  const batch = db.batch();
  let written = 0;
  for (const a of analyses) {
    if (!a.question||!a.type) continue;
    const ref = db.collection('users').doc(tok.uid).collection('analyses').doc();
    batch.set(ref,{
      concept:        a.concept||null,
      question:       (a.question||'').slice(0,1000),
      type:           (a.type||'EXPLAIN').slice(0,30),
      myth_index:     typeof a.myth_index==='number'?a.myth_index:null,
      dominant_order: typeof a.dominant_order==='number'?a.dominant_order:null,
      cultural_anchor:a.cultural_anchor||null,
      language:       (a.language||'en').slice(0,10),
      sources_used:   Array.isArray(a.sources_used)?a.sources_used.slice(0,10):[],
      created_at:     a.created_at||Date.now(),
      synced_from:    'batch'
    });
    written++;
  }
  await batch.commit();
  return res.json({success:true,written});
}));
