// SEMION™ v4 — Learning Module
// IndexedDB persistence, response cache, conversation history
// All data stays local. Nothing leaves the device.
// Copyright © 2026 Sebastian Iturriaga — synapsecopilot.com

var SEMION_DB_NAME = 'semion_v4';
var SEMION_DB_VER  = 1;
var _db = null;

var STORES = {
  CONV:   'conversations',
  ADJ:    'learned_adjustments',
  DERIVED:'derived_profiles',
  USER:   'user_model',
  CACHE:  'response_cache'
};

function initDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise(function(resolve, reject) {
    if (!window.indexedDB) { reject(new Error('IndexedDB not supported')); return; }
    var req = window.indexedDB.open(SEMION_DB_NAME, SEMION_DB_VER);
    req.onerror = function() { reject(req.error); };
    req.onsuccess = function() { _db = req.result; resolve(_db); };
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.CONV)) {
        var cs = db.createObjectStore(STORES.CONV, { keyPath: 'id' });
        cs.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains(STORES.ADJ)) {
        db.createObjectStore(STORES.ADJ, { keyPath: 'concept' });
      }
      if (!db.objectStoreNames.contains(STORES.DERIVED)) {
        db.createObjectStore(STORES.DERIVED, { keyPath: 'concept' });
      }
      if (!db.objectStoreNames.contains(STORES.USER)) {
        db.createObjectStore(STORES.USER, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        var cache = db.createObjectStore(STORES.CACHE, { keyPath: 'hash' });
        cache.createIndex('expires', 'expires');
      }
    };
  });
}

function dbGet(storeName, key) {
  return initDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var req = db.transaction([storeName], 'readonly').objectStore(storeName).get(key);
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  });
}

function dbPut(storeName, record) {
  return initDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var req = db.transaction([storeName], 'readwrite').objectStore(storeName).put(record);
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  });
}

function dbGetAll(storeName) {
  return initDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var req = db.transaction([storeName], 'readonly').objectStore(storeName).getAll();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  });
}

function hashStr(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h).toString(36);
}

function generateId() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// ── CONVERSATION LOGGING ─────────────────────────────────────

function logInteraction(data) {
  var record = {
    id: generateId(),
    timestamp: Date.now(),
    question: data.question || '',
    type: data.type || 'EXPLAIN',
    concept: data.concept || null,
    myth_index: data.myth_index || null,
    dominant_order: data.dominant_order || null,
    cultural_anchor: data.cultural_anchor || null,
    sources_used: data.sources_used || [],
    response_length: (data.response || '').length,
    derived: data.derived || false,
    feedback: { explicit: null, implicit: {} }
  };
  return dbPut(STORES.CONV, record)
    .then(function() {
      updateUserModelFromInteraction(record);
      if (data.derived && data.concept && data.encoding) {
        saveDerivedProfile(data.concept, data.encoding).catch(function() {});
      }
      return record.id;
    })
    .catch(function() { return null; });
}

function updateUserModelFromInteraction(record) {
  if (record.concept) {
    dbGet(STORES.USER, 'recent_concepts')
      .then(function(rec) {
        var list = (rec && rec.value) || [];
        list.unshift(record.concept);
        return dbPut(STORES.USER, { key: 'recent_concepts', value: list.slice(0, 50) });
      })
      .catch(function() {});
  }
  if (record.type) {
    dbGet(STORES.USER, 'type_frequency')
      .then(function(rec) {
        var map = (rec && rec.value) || {};
        map[record.type] = (map[record.type] || 0) + 1;
        return dbPut(STORES.USER, { key: 'type_frequency', value: map });
      })
      .catch(function() {});
  }
  dbPut(STORES.USER, { key: 'last_active', value: Date.now() }).catch(function() {});
}

// ── FEEDBACK ─────────────────────────────────────────────────

function recordFeedback(convId, signal, concept, mythIndex) {
  return dbGet(STORES.CONV, convId)
    .then(function(record) {
      if (!record) return;
      if (signal === 'positive' || signal === 'negative') {
        record.feedback.explicit = signal;
      } else {
        record.feedback.implicit[signal] = true;
      }
      return dbPut(STORES.CONV, record).then(function() {
        if (concept && mythIndex !== null && (signal === 'positive' || signal === 'negative')) {
          return adjustMythIndex(concept, mythIndex, signal === 'positive');
        }
      });
    })
    .catch(function() {});
}

// ── MYTH_INDEX ADJUSTMENT ────────────────────────────────────

function adjustMythIndex(concept, currentMI, positive) {
  return dbGet(STORES.ADJ, concept)
    .then(function(record) {
      if (!record) record = { concept: concept, myth_index_delta: 0, sample_size: 0, confidence: 0.3, last_updated: Date.now() };
      var delta = positive ? 0 : (currentMI > 0.5 ? -0.03 : 0.03);
      record.myth_index_delta = Math.max(-0.25, Math.min(0.25, record.myth_index_delta + delta));
      record.sample_size += 1;
      record.confidence = Math.min(0.95, 0.3 + record.sample_size * 0.05);
      record.last_updated = Date.now();
      return dbPut(STORES.ADJ, record);
    })
    .catch(function() {});
}

function getAdjustment(concept) {
  return dbGet(STORES.ADJ, concept)
    .then(function(record) { return (record && record.myth_index_delta) || 0; })
    .catch(function() { return 0; });
}

// ── DERIVED PROFILES ─────────────────────────────────────────

function saveDerivedProfile(concept, encoding) {
  return dbGet(STORES.DERIVED, concept)
    .then(function(record) {
      if (!record) {
        record = { concept: concept, encoding: encoding, interaction_count: 0,
                   positive_count: 0, status: 'provisional', created_at: Date.now(), last_seen: Date.now() };
      } else {
        record.interaction_count += 1;
        record.last_seen = Date.now();
        if (record.interaction_count >= 10 && record.positive_count >= 7) record.status = 'confirmed';
      }
      return dbPut(STORES.DERIVED, record);
    })
    .catch(function() {});
}

function getConfirmedProfiles() {
  return dbGetAll(STORES.DERIVED)
    .then(function(all) { return all.filter(function(p) { return p.status === 'confirmed'; }); })
    .catch(function() { return []; });
}

// ── USER MODEL ───────────────────────────────────────────────

function getUserModel() {
  var keys = ['recent_concepts', 'type_frequency', 'last_active'];
  var model = {};
  var promises = keys.map(function(key) {
    return dbGet(STORES.USER, key)
      .then(function(rec) { if (rec) model[key] = rec.value; })
      .catch(function() {});
  });
  return Promise.all(promises).then(function() { return model; });
}

// ── RESPONSE CACHE ───────────────────────────────────────────

function getCachedResponse(question, type) {
  var hash = hashStr(type + ':' + question.trim().toLowerCase());
  return dbGet(STORES.CACHE, hash)
    .then(function(record) {
      if (!record) return null;
      if (record.expires < Date.now()) {
        initDB().then(function(db) {
          db.transaction([STORES.CACHE], 'readwrite').objectStore(STORES.CACHE).delete(hash);
        }).catch(function() {});
        return null;
      }
      return record.response;
    })
    .catch(function() { return null; });
}

function cacheResponse(question, type, response, ttlMs) {
  ttlMs = ttlMs || 86400000; // 24 hours default
  var hash = hashStr(type + ':' + question.trim().toLowerCase());
  return dbPut(STORES.CACHE, {
    hash: hash, question: question, type: type, response: response,
    created: Date.now(), expires: Date.now() + ttlMs
  }).catch(function() {});
}

// ── HISTORY ──────────────────────────────────────────────────

function getRecentConversations(limit) {
  limit = limit || 20;
  return dbGetAll(STORES.CONV)
    .then(function(all) {
      return all.sort(function(a, b) { return b.timestamp - a.timestamp; }).slice(0, limit);
    })
    .catch(function() { return []; });
}

function clearCache() {
  return initDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var req = db.transaction([STORES.CACHE], 'readwrite').objectStore(STORES.CACHE).clear();
      req.onsuccess = function() { resolve(); };
      req.onerror = function() { reject(req.error); };
    });
  }).catch(function() {});
}

function clearAll() {
  return initDB().then(function(db) {
    var storeNames = Object.values(STORES);
    var promises = storeNames.map(function(name) {
      return new Promise(function(resolve) {
        var req = db.transaction([name], 'readwrite').objectStore(name).clear();
        req.onsuccess = resolve;
        req.onerror = resolve;
      });
    });
    return Promise.all(promises);
  }).catch(function() {});
}

// ── ALIASES FOR FIREBASE MODULE ──────────────────────────────
// semion-firebase.js calls these to do optimistic local writes

function _logToIndexedDB(data) {
  return logInteraction(data);
}

function _updateFeedbackLocal(convId, signal) {
  if (!convId) return Promise.resolve();
  return dbGet(STORES.CONV, convId)
    .then(function(rec) {
      if (!rec) return;
      if (signal === 'positive' || signal === 'negative') {
        rec.feedback = rec.feedback || { explicit: null, implicit: {} };
        rec.feedback.explicit = signal;
      } else {
        rec.feedback = rec.feedback || { explicit: null, implicit: {} };
        rec.feedback.implicit[signal] = true;
      }
      return dbPut(STORES.CONV, rec);
    })
    .catch(function() {});
}

// Expose session ID generator
function generateSessionId() {
  return 'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
}
