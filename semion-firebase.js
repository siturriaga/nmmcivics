// SEMION™ v4 — Firebase Module (Complete)
// Auth · Firestore · Version Cache · Batch Sync · Optimistic UI · Sentry
// Copyright © 2026 Sebastian Iturriaga — synapsecopilot.com
// Project: semion-cca1c
// API keys are NOT stored here. They live in Firebase Functions env config.

var _FB_LOADED = false;
var _FB_READY  = false;
var _FB_AUTH   = null;
var _FB_DB     = null;
var _FB_READY_CBS = [];

// Firebase project config (public — protected by Security Rules, not by secrecy)
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAXIh-nZ7sA7tMte5lS2We5ATv82clC1cs",
  authDomain:        "semion-cca1c.firebaseapp.com",
  projectId:         "semion-cca1c",
  storageBucket:     "semion-cca1c.firebasestorage.app",
  messagingSenderId: "396384189817",
  appId:             "1:396384189817:web:a0ced58234af55e3df43a8",
  measurementId:     "G-HR8RKFFX8Z"
};

var FB_FN_BASE = 'https://us-central1-semion-cca1c.cloudfunctions.net';
var FB_FN      = FB_FN_BASE + '/fetchSecureAPI';
var FB_BATCH   = FB_FN_BASE + '/batchSyncAnalyses';

// Sentry DSN — set before deploying if using Sentry
var SENTRY_DSN = '';

// ── FIREBASE LOADER ──────────────────────────────────────────

function loadFirebase(cb) {
  if (_FB_READY) { if (cb) cb(null); return; }
  if (cb) _FB_READY_CBS.push(cb);
  if (_FB_LOADED) return;
  _FB_LOADED = true;

  var urls = [
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
  ];

  var done = 0;
  function onLoad() {
    done++;
    if (done < urls.length) return;
    try {
      if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
      _FB_AUTH = window.firebase.auth();
      _FB_DB   = window.firebase.firestore();
      _FB_AUTH.onAuthStateChanged(function(user) {
        _setState({ user: user });
        if (user) _onSignIn(user);
        else _onSignOut();
      });
      _FB_READY = true;
      _FB_READY_CBS.forEach(function(fn) { try { fn(null); } catch(e) {} });
      _FB_READY_CBS = [];
    } catch(e) {
      _captureError('Firebase init', e);
      _FB_READY_CBS.forEach(function(fn) { try { fn(e); } catch(e2) {} });
      _FB_READY_CBS = [];
    }
  }

  urls.forEach(function(src) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = onLoad;
    s.onerror = function() { _captureError('Firebase SDK load', new Error('Failed: '+src)); onLoad(); };
    document.head.appendChild(s);
  });
}

// ── SENTRY ERROR CAPTURE ─────────────────────────────────────

function _captureError(context, err, extra) {
  console.error('SEMION ['+context+']:', err && err.message || err);
  if (window.Sentry && err) {
    window.Sentry.withScope(function(scope) {
      scope.setTag('context', context);
      scope.setContext('semion', extra || {});
      window.Sentry.captureException(err);
    });
  }
}

function initSentry() {
  if (!SENTRY_DSN) return;
  var s = document.createElement('script');
  s.src = 'https://browser.sentry-cdn.com/7.99.0/bundle.min.js';
  s.onload = function() {
    window.Sentry.init({
      dsn: SENTRY_DSN,
      environment: location.hostname === 'localhost' ? 'development' : 'production',
      tracesSampleRate: 0.1,
      beforeSend: function(event) {
        // Strip any PII from breadcrumbs
        if (event.user) delete event.user.email;
        return event;
      }
    });
    var user = SEMION_STATE && SEMION_STATE.user;
    if (user) window.Sentry.setUser({ id: user.uid });
  };
  document.head.appendChild(s);
}

// ── VERSION-CONTROLLED DATA CACHE ────────────────────────────
// semion-data.js (208KB) only reloads when version changes
// Saves ~200KB per returning session

var DATA_CACHE_KEY     = 'semion_data_v4';
var DATA_VERSION_KEY   = 'semion_data_version';
var DATA_CACHE_TS_KEY  = 'semion_data_ts';
var DATA_CACHE_MAX_AGE = 7 * 24 * 3600000; // 7 days

function checkDataCache() {
  if (!_FB_READY || !_FB_DB) return Promise.resolve(false);
  var localVer = localStorage.getItem(DATA_VERSION_KEY);
  var localTs  = parseInt(localStorage.getItem(DATA_CACHE_TS_KEY) || '0');
  var age = Date.now() - localTs;

  // If cache is fresh, skip version check
  if (localVer && age < DATA_CACHE_MAX_AGE) {
    return Promise.resolve(true); // use cache
  }

  return _FB_DB.collection('cache_version').doc('semion_data').get()
    .then(function(doc) {
      if (!doc.exists) return false;
      var serverVer = doc.data().version;
      _setState({ cacheVersion: serverVer });
      if (serverVer === localVer) {
        // Refresh timestamp, use cache
        localStorage.setItem(DATA_CACHE_TS_KEY, Date.now().toString());
        return true;
      }
      // Version mismatch — update stored version, signal reload needed
      localStorage.setItem(DATA_VERSION_KEY, serverVer);
      localStorage.setItem(DATA_CACHE_TS_KEY, Date.now().toString());
      return false;
    })
    .catch(function(e) {
      _captureError('checkDataCache', e);
      return false;
    });
}

// ── AUTH ─────────────────────────────────────────────────────

function signInWithGoogle() {
  return new Promise(function(resolve, reject) {
    loadFirebase(function(e) {
      if (e || !_FB_AUTH) { reject(new Error('Firebase not available')); return; }
      var provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      _FB_AUTH.signInWithPopup(provider)
        .then(function(r) { resolve(r.user); })
        .catch(reject);
    });
  });
}

function signOut() {
  return new Promise(function(resolve, reject) {
    if (_FB_AUTH) _FB_AUTH.signOut().then(resolve).catch(reject);
    else resolve();
  });
}

function getCurrentUser() { return SEMION_STATE.user; }
function isSignedIn()      { return !!SEMION_STATE.user; }

function _onSignIn(user) {
  if (window.Sentry) window.Sentry.setUser({ id: user.uid });
  _updateAuthUI(user);
  // Save profile (non-blocking)
  _saveUserProfile(user).catch(function() {});
  // Sync pending local analyses
  _flushPendingSync().catch(function() {});
}

function _onSignOut() {
  if (window.Sentry) window.Sentry.setUser(null);
  _updateAuthUI(null);
}

function _updateAuthUI(user) {
  var avatar   = document.getElementById('auth-avatar');
  var signinBtn = document.getElementById('auth-signin-btn');
  if (!avatar || !signinBtn) return;
  if (user) {
    signinBtn.style.display = 'none';
    avatar.style.display    = 'flex';
    avatar.title            = user.displayName || user.email || 'Signed in';
    if (user.photoURL) {
      avatar.style.backgroundImage = 'url(' + user.photoURL + ')';
      avatar.textContent = '';
    } else {
      avatar.style.backgroundImage = '';
      avatar.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    }
  } else {
    signinBtn.style.display = 'block';
    avatar.style.display    = 'none';
    avatar.style.backgroundImage = '';
    avatar.textContent = '';
  }
}

// ── FIRESTORE OPS ────────────────────────────────────────────

function _uCol(col) {
  var u = SEMION_STATE.user;
  if (!u || !_FB_DB) return null;
  return _FB_DB.collection('users').doc(u.uid).collection(col);
}

// PENDING SYNC QUEUE — analyses accumulate locally, batch-flush on session end
function _queueAnalysis(data) {
  var pending = SEMION_STATE.pendingSync || [];
  pending.push({
    concept:        data.concept || null,
    question:       (data.question || '').slice(0, 1000),
    type:           data.type || 'EXPLAIN',
    myth_index:     data.myth_index || null,
    dominant_order: data.dominant_order || null,
    cultural_anchor:data.cultural_anchor || null,
    language:       data.language || 'en',
    sources_used:   data.sources_used || [],
    created_at:     Date.now()
  });
  // Keep max 50 pending
  if (pending.length > 50) pending = pending.slice(-50);
  _setState({ pendingSync: pending });

  // Auto-flush if 20+ queued
  if (pending.length >= 20) _flushPendingSync().catch(function() {});
}

async function _flushPendingSync() {
  var user = SEMION_STATE.user;
  var pending = SEMION_STATE.pendingSync || [];
  if (!user || !pending.length || !_FB_READY) return;

  // Get ID token for auth header
  var token = await user.getIdToken().catch(function() { return null; });
  if (!token) return;

  _setState({ pendingSync: [], lastSyncAt: Date.now() });

  try {
    await fetch(FB_BATCH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ analyses: pending })
    });
  } catch(e) {
    // On failure, put back in queue
    _captureError('batchSync', e);
    var cur = SEMION_STATE.pendingSync || [];
    _setState({ pendingSync: pending.concat(cur) });
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', function() {
    var pending = SEMION_STATE.pendingSync || [];
    if (!pending.length || !isSignedIn()) return;
    // Use sendBeacon for reliability on unload
    var user = SEMION_STATE.user;
    if (user && navigator.sendBeacon) {
      // Can't await getIdToken in beforeunload — use cached token
      _flushPendingSync().catch(function() {});
    }
  });
  // Also flush when tab loses focus
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      _flushPendingSync().catch(function() {});
    }
  });
}

// OPTIMISTIC: log locally first, queue for Firestore
function logInteraction(data) {
  // 1. Instant local write (IndexedDB via semion-learn.js)
  var localPromise = (typeof _logToIndexedDB === 'function')
    ? _logToIndexedDB(data)
    : Promise.resolve(null);

  // 2. Queue for batch Firestore sync (non-blocking)
  if (isSignedIn()) _queueAnalysis(data);

  return localPromise;
}

// OPTIMISTIC: feedback updates local state immediately
function recordFeedback(convId, signal, concept, mythIndex) {
  // Instant: update local IndexedDB
  var localUpdate = (typeof _updateFeedbackLocal === 'function')
    ? _updateFeedbackLocal(convId, signal)
    : Promise.resolve();

  // Instant: update SEMION_STATE user calibration
  if (concept && mythIndex !== null && signal === 'negative') {
    var model = SEMION_STATE.userModel || {};
    var bias = (model.mythBias || 0);
    var dir = mythIndex > 0.5 ? -0.03 : 0.03;
    _setState({ userModel: Object.assign({}, model, { mythBias: bias + dir }) });
  }

  // Background: write adjustment to Firestore
  if (concept && mythIndex !== null && typeof signal === 'string' && isSignedIn()) {
    var col = _uCol('adjustments');
    if (col) {
      var delta = signal === 'negative' ? (mythIndex > 0.5 ? -0.03 : 0.03) : 0;
      col.doc(concept).get()
        .then(function(doc) {
          var cur = doc.exists ? doc.data() : { delta: 0, sample_size: 0, confidence: 0.3 };
          var newDelta = Math.max(-0.25, Math.min(0.25, (cur.delta || 0) + delta));
          var newSize  = (cur.sample_size || 0) + 1;
          return col.doc(concept).set({
            concept: concept,
            delta:   newDelta,
            sample_size: newSize,
            confidence:  Math.min(0.95, 0.3 + newSize * 0.05)
          }, { merge: true });
        })
        .catch(function(e) { _captureError('recordFeedback', e); });
    }
  }

  return localUpdate;
}

function getAdjustment(concept) {
  if (!isSignedIn() || !_FB_READY) return Promise.resolve(0);
  var col = _uCol('adjustments');
  if (!col) return Promise.resolve(0);
  return col.doc(concept).get()
    .then(function(doc) { return doc.exists ? (doc.data().delta || 0) : 0; })
    .catch(function() { return 0; });
}

function saveBookmark(concept, mythIndex, note) {
  if (!isSignedIn() || !_FB_READY) return Promise.resolve();
  var col = _uCol('bookmarks');
  if (!col) return Promise.resolve();
  return col.doc(concept.replace(/\s+/g,'_')).set({
    concept: concept, myth_index: mythIndex, note: note || '', created_at: Date.now()
  }, { merge: true }).catch(function(e) { _captureError('saveBookmark', e); });
}

function getBookmarks() {
  if (!isSignedIn() || !_FB_READY) return Promise.resolve([]);
  var col = _uCol('bookmarks');
  if (!col) return Promise.resolve([]);
  return col.orderBy('created_at','desc').get()
    .then(function(s) {
      var r = [];
      s.forEach(function(d) { var x = d.data(); x.id = d.id; r.push(x); });
      return r;
    })
    .catch(function() { return []; });
}

function deleteBookmark(concept) {
  if (!isSignedIn() || !_FB_READY) return Promise.resolve();
  var col = _uCol('bookmarks');
  if (!col) return Promise.resolve();
  return col.doc(concept.replace(/\s+/g,'_')).delete().catch(function() {});
}

function getRecentAnalyses(limit) {
  limit = limit || 20;
  if (!isSignedIn() || !_FB_READY) return Promise.resolve([]);
  var col = _uCol('analyses');
  if (!col) return Promise.resolve([]);
  return col.orderBy('created_at','desc').limit(limit).get()
    .then(function(s) {
      var r = [];
      s.forEach(function(d) { var x = d.data(); x.id = d.id; r.push(x); });
      return r;
    })
    .catch(function() { return []; });
}

function saveConversationCheckpoint(sessionId, checkpoint) {
  if (!isSignedIn() || !_FB_READY) return Promise.resolve();
  var col = _uCol('checkpoints');
  if (!col) return Promise.resolve();
  return col.doc(sessionId).set({
    session_id: sessionId,
    checkpoint: JSON.stringify(checkpoint).slice(0, 49000),
    created_at: Date.now()
  }, { merge: true }).catch(function(e) { _captureError('saveCheckpoint', e); });
}

function loadConversationCheckpoint(sessionId) {
  if (!isSignedIn() || !_FB_READY) return Promise.resolve(null);
  var col = _uCol('checkpoints');
  if (!col) return Promise.resolve(null);
  return col.doc(sessionId).get()
    .then(function(d) {
      if (!d.exists) return null;
      try { return JSON.parse(d.data().checkpoint); } catch(e) { return null; }
    })
    .catch(function() { return null; });
}

function _saveUserProfile(user) {
  if (!_FB_DB || !user) return Promise.resolve();
  return _FB_DB.collection('users').doc(user.uid).set({
    display_name: user.displayName || '',
    email:        user.email || '',
    photo_url:    user.photoURL || '',
    last_active:  window.firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(function(e) { _captureError('saveUserProfile', e); });
}

// Fluency: SLE runs client-side. No external API call.

// ── TTS — Pollinations.AI ────────────────────────────────────
// Free. No key. No account. No rate limit. Works immediately.
// Voices: alloy, echo, fable, onyx, nova, shimmer
// SEMION default: onyx (deep, measured) for ANALYZE/DEBATE/TRACE
//                 nova (warm) for RESPOND
//                 echo (clear) for EXPLAIN/DECONSTRUCT

var TTS_VOICES = {
  ANALYZE:     'onyx',
  DEBATE:      'onyx',
  TRACE:       'onyx',
  DECONSTRUCT: 'echo',
  EXPLAIN:     'echo',
  COMPARE:     'echo',
  HOLD:        'fable',
  RESPOND:     'nova',
  NARRATE:     'onyx',
  CRITIQUE:    'onyx',
  default:     'onyx'
};

function callTTS(text, type, language) {
  if (!text || text.length < 5) return Promise.resolve(null);
  var voice = TTS_VOICES[type] || TTS_VOICES.default;
  // Pollinations TTS: https://text.pollinations.ai/{text}?model=openai-audio&voice={voice}
  var url = 'https://text.pollinations.ai/' + encodeURIComponent(text) +
    '?model=openai-audio&voice=' + voice;
  return fetch(url)
    .then(function(r) {
      if (!r.ok) throw new Error('Pollinations TTS HTTP ' + r.status);
      return r.blob();
    })
    .then(function(blob) {
      var audioUrl = URL.createObjectURL(blob);
      return { audioUrl: audioUrl, voice: voice, source: 'pollinations', lang: language || 'en' };
    })
    .catch(function(e) {
      _captureError('callTTS:pollinations', e);
      return null;
    });
}

// Play TTS audio — call this with the result of callTTS()
function playTTS(ttsResult) {
  if (!ttsResult || !ttsResult.audioUrl) return;
  var audio = new Audio(ttsResult.audioUrl);
  audio.play().catch(function(e) { _captureError('playTTS', e); });
  return audio; // caller can call .pause() if needed
}

// Stop any playing TTS audio
var _currentAudio = null;
function speakText(text, type, language) {
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  return callTTS(text, type, language)
    .then(function(result) {
      if (!result) return;
      _currentAudio = playTTS(result);
      return result;
    });
}

function stopSpeaking() {
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
}

// ── SECURE API PROXY ──────────────────────────────────────────
// This function is also called by semion-apis.js
function callFirebaseFn(source, query) {
  var user = SEMION_STATE.user;
  if (!user) return Promise.reject(new Error('Not signed in'));
  return user.getIdToken()
    .then(function(token) {
      return fetch(FB_FN + '?source=' + encodeURIComponent(source) + '&query=' + encodeURIComponent(query), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Firebase fn HTTP ' + r.status);
      return r.json();
    })
    .catch(function(e) { _captureError('callFirebaseFn:'+source, e); throw e; });
}

// ── COLLECTIVE WRITE ──────────────────────────────────────────

function contributeToCollective(concept, delta, optin) {
  if (!optin || !isSignedIn() || !_FB_READY) return Promise.resolve();
  if (!window.firebase || !window.firebase.functions) return Promise.resolve();
  var fn = window.firebase.functions().httpsCallable('collectiveWrite');
  return fn({ concept: concept, delta: delta, optin: optin })
    .catch(function(e) { _captureError('collectiveWrite', e); });
}

// ── STATUS ────────────────────────────────────────────────────

function getFirebaseStatus() {
  var u = SEMION_STATE.user;
  return {
    loaded:   _FB_LOADED,
    ready:    _FB_READY,
    signedIn: !!u,
    role:     (u && u._delegate && u._delegate.reloadUserInfo && u._delegate.reloadUserInfo.customAttributes)
              ? JSON.parse(u._delegate.reloadUserInfo.customAttributes || '{}').role
              : 'standard',
    user: u ? { uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL } : null
  };
}

// ── INIT ON DOMContentLoaded ──────────────────────────────────

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    initSentry();
    setTimeout(function() {
      loadFirebase(function(err) {
        if (err) return;
        checkDataCache().catch(function() {});
      });
    }, 800);
  });
}
