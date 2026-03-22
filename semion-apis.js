// SEMION™ v4 — API Retrieval Module
// 24 free APIs called in parallel via Promise.allSettled
// Copyright © 2026 Sebastian Iturriaga — synapsecopilot.com

// Firebase Function URL — set by semion-firebase.js
var FIREBASE_FN = (typeof FB_FN !== 'undefined') ? FB_FN : 'https://us-central1-semion-cca1c.cloudfunctions.net/fetchSecureAPI';
var API_TIMEOUT = 800;

function fetchWithTimeout(url, options, timeout) {
  timeout = timeout || API_TIMEOUT;
  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, timeout);
  return fetch(url, Object.assign({}, options || {}, { signal: ctrl.signal }))
    .then(function(res) { clearTimeout(timer); return res; })
    .catch(function(err) { clearTimeout(timer); throw err; });
}

function makeResult(source, url, content, metadata, reliability) {
  return { source: source, url: url, content: content || '',
           metadata: metadata || {}, reliability: reliability || 0.80,
           retrieved_at: Date.now(), error: null };
}

function makeError(source, url, err) {
  return { source: source, url: url, content: null, metadata: {},
           reliability: 0, retrieved_at: Date.now(),
           error: (err && err.message) || 'Failed' };
}

function extractText(html, maxChars) {
  maxChars = maxChars || 1500;
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

// ── API WRAPPERS ─────────────────────────────────────────────

function fetchWikipedia(query) {
  var url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query);
  return fetchWithTimeout(url)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      var content = data.extract || data.description || '';
      return makeResult('wikipedia', url, content,
        { title: data.title, url: data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page }, 0.75);
    })
    .catch(function(err) {
      // Fallback to search API
      var altUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&exsentences=5&titles=' + encodeURIComponent(query) + '&format=json&origin=*';
      return fetchWithTimeout(altUrl)
        .then(function(res2) { return res2.json(); })
        .then(function(data2) {
          var pages = (data2.query && data2.query.pages) || {};
          var keys = Object.keys(pages);
          var page = keys.length ? pages[keys[0]] : {};
          var content = extractText(page.extract || '', 400);
          return makeResult('wikipedia', altUrl, content, { title: page.title }, 0.75);
        })
        .catch(function() { return makeError('wikipedia', url, err); });
    });
}

function fetchWiktionary(word) {
  var firstWord = word.split(' ')[0];
  var url = 'https://en.wiktionary.org/w/api.php?action=parse&page=' + encodeURIComponent(firstWord) + '&prop=wikitext&format=json&origin=*';
  return fetchWithTimeout(url)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var wikitext = (data.parse && data.parse.wikitext && data.parse.wikitext['*']) || '';
      var etymMatch = wikitext.match(/==Etymology==\s*([\s\S]+?)(?:\n==|\n===|$)/);
      var etym = etymMatch ? etymMatch[1].replace(/\{\{[^}]+\}\}/g, '').trim().slice(0, 400) : '';
      return makeResult('wiktionary', url, etym || wikitext.slice(0, 400), { word: firstWord }, 0.85);
    })
    .catch(function(err) { return makeError('wiktionary', url, err); });
}

function fetchConceptNet(concept) {
  var url = 'https://api.conceptnet.io/c/en/' + encodeURIComponent(concept.replace(/\s+/g, '_')) + '?limit=15';
  return fetchWithTimeout(url)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var edges = (data.edges || []).slice(0, 10);
      var relations = edges.map(function(e) {
        return ((e.start && e.start.label) || '') + ' ' + ((e.rel && e.rel.label) || '') + ' ' + ((e.end && e.end.label) || '');
      }).join('. ');
      return makeResult('conceptnet', url, relations, { edgeCount: edges.length }, 0.80);
    })
    .catch(function(err) { return makeError('conceptnet', url, err); });
}

function fetchSemanticScholar(query) {
  var url = 'https://api.semanticscholar.org/graph/v1/paper/search?query=' + encodeURIComponent(query) + '&fields=title,abstract,year&limit=3';
  return fetchWithTimeout(url, { headers: { 'User-Agent': 'SEMION/4.0' } }, 1200)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var papers = (data.data || []).slice(0, 3);
      var content = papers.map(function(p) {
        return p.title + ' (' + (p.year||'') + '): ' + ((p.abstract||'').slice(0, 200));
      }).join('\n\n');
      return makeResult('scholar', url, content, { count: papers.length }, 0.90);
    })
    .catch(function(err) { return makeError('scholar', url, err); });
}

function fetchPubMed(query) {
  var searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=' + encodeURIComponent(query) + '&retmax=3&retmode=json';
  return fetchWithTimeout(searchUrl)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var ids = (data.esearchresult && data.esearchresult.idlist) || [];
      if (!ids.length) return makeResult('pubmed', searchUrl, '', {}, 0.90);
      var summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' + ids.join(',') + '&retmode=json';
      return fetchWithTimeout(summaryUrl)
        .then(function(res2) { return res2.json(); })
        .then(function(data2) {
          var results = data2.result || {};
          var content = ids.map(function(id) {
            var r = results[id];
            return r ? r.title + ' (' + ((r.pubdate||'').slice(0,4)) + ')' : '';
          }).filter(Boolean).join('\n');
          return makeResult('pubmed', summaryUrl, content, { ids: ids }, 0.92);
        });
    })
    .catch(function(err) { return makeError('pubmed', searchUrl, err); });
}

function fetchWorldBank(query) {
  var url = 'https://search.worldbank.org/api/v2/wds?format=json&qterm=' + encodeURIComponent(query) + '&rows=3&fl=docdt,display_title,abstracts';
  return fetchWithTimeout(url)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var docs = data.documents || {};
      var items = Object.values(docs).slice(0, 3);
      var content = items.map(function(d) {
        return (d.display_title||'') + ': ' + ((d.abstracts||'').slice(0,200));
      }).join('\n\n');
      return makeResult('worldbank', url, content, { count: items.length }, 0.82);
    })
    .catch(function(err) { return makeError('worldbank', url, err); });
}

function fetchCongressionalRecord(query) {
  var url = 'https://api.congress.gov/v3/congressional-record?format=json&q=' + encodeURIComponent(query) + '&limit=3';
  return fetchWithTimeout(url)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var issues = (data.results && data.results.issues) || [];
      var content = issues.map(function(i) { return i.updateDate + ': ' + (i.volumeNumber||''); }).join('\n');
      return makeResult('congress', url, content || 'Congressional Record accessed', {}, 0.88);
    })
    .catch(function(err) { return makeError('congress', url, err); });
}

function fetchLibraryOfCongress(query) {
  var url = 'https://www.loc.gov/search/?q=' + encodeURIComponent(query) + '&fo=json&at=results&fa=online-format:online+text&c=5';
  return fetchWithTimeout(url, {}, 1000)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var results = (data.results || []).slice(0, 3);
      var content = results.map(function(r) {
        return (r.title||'') + ' (' + (r.date||'') + '): ' + ((r.description && r.description[0])||'').slice(0,150);
      }).join('\n\n');
      return makeResult('loc', url, content, { count: results.length }, 0.92);
    })
    .catch(function(err) { return makeError('loc', url, err); });
}

function fetchGutenberg(query) {
  var url = 'https://gutendex.com/books/?search=' + encodeURIComponent(query) + '&mime_type=text';
  return fetchWithTimeout(url)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var books = (data.results || []).slice(0, 3);
      var content = books.map(function(b) {
        return '"' + (b.title||'') + '" by ' + ((b.authors && b.authors[0] && b.authors[0].name)||'Unknown') + ' (' + ((b.subjects||[]).slice(0,2).join(', ')) + ')';
      }).join('\n');
      return makeResult('gutenberg', url, content, { count: books.length }, 0.88);
    })
    .catch(function(err) { return makeError('gutenberg', url, err); });
}

function fetchDOAJ(query) {
  var url = 'https://doaj.org/api/search/articles/' + encodeURIComponent(query) + '?pageSize=3';
  return fetchWithTimeout(url)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var results = (data.results || []).slice(0, 3);
      var content = results.map(function(r) {
        var bib = r.bibjson || {};
        return (bib.title||'') + ': ' + ((bib.abstract||'').slice(0, 200));
      }).join('\n\n');
      return makeResult('doaj', url, content, { count: results.length }, 0.88);
    })
    .catch(function(err) { return makeError('doaj', url, err); });
}

function fetchGDELT(query) {
  var url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(query) + '&mode=artlist&maxrecords=5&format=json&timespan=2w';
  return fetchWithTimeout(url, {}, 1000)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) {
      var articles = (data.articles || []).slice(0, 5);
      var content = articles.map(function(a) {
        return (a.title||'') + ' (' + (a.domain||'') + ', ' + ((a.seendate||'').slice(0,8)) + ')';
      }).join('\n');
      return makeResult('gdelt', url, content, { count: articles.length }, 0.68);
    })
    .catch(function(err) { return makeError('gdelt', url, err); });
}

function fetchFirebaseSource(source, query) {
  // Use callFirebaseFn from semion-firebase.js (includes auth token)
  if (typeof callFirebaseFn === 'function') {
    return callFirebaseFn(source, query)
      .then(function(data) { return makeResult(source, FIREBASE_FN, data.content||'', data.metadata||{}, data.reliability||0.85); })
      .catch(function(err) { return makeError(source, FIREBASE_FN, err); });
  }
  // Fallback: unauthenticated (will return 401, handled gracefully)
  var url = FIREBASE_FN + '?source=' + source + '&query=' + encodeURIComponent(query);
  return fetchWithTimeout(url, {}, 1500)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) { return makeResult(source, url, data.content||'', data.metadata||{}, data.reliability||0.85); })
    .catch(function(err) { return makeError(source, url, err); });
}

function fetchSEP(query)         { return fetchFirebaseSource('sep', query); }
function fetchIEP(query)         { return fetchFirebaseSource('iep', query); }
function fetchMarxists(query)    { return fetchFirebaseSource('marxists', query); }
function fetchIACTHR(query)      { return fetchFirebaseSource('iacthr', query); }
function fetchAfricanUnion(query){ return fetchFirebaseSource('africaunion', query); }
function fetchEuroparl(query)    { return fetchFirebaseSource('europarl', query); }
function fetchWordNet(query)     { return fetchFirebaseSource('wordnet', query); }
function fetchParadisec(query)   { return fetchFirebaseSource('paradisec', query); }

var SOURCE_MAP = {
  wikipedia: fetchWikipedia,
  wiktionary: fetchWiktionary,
  conceptnet: fetchConceptNet,
  scholar: fetchSemanticScholar,
  pubmed: fetchPubMed,
  worldbank: fetchWorldBank,
  congress: fetchCongressionalRecord,
  loc: fetchLibraryOfCongress,
  gutenberg: fetchGutenberg,
  doaj: fetchDOAJ,
  gdelt: fetchGDELT,
  sep: fetchSEP,
  iep: fetchIEP,
  marxists: fetchMarxists,
  iacthr: fetchIACTHR,
  africaunion: fetchAfricanUnion,
  europarl: fetchEuroparl,
  wordnet: fetchWordNet,
  paradisec: fetchParadisec
};

function retrieveParallel(query, sources) {
  sources = sources || ['wikipedia', 'conceptnet'];
  var valid = sources.filter(function(s) { return SOURCE_MAP[s]; });
  if (!valid.length) return Promise.resolve([]);

  var promises = valid.map(function(source) {
    return SOURCE_MAP[source](query)
      .catch(function(err) { return makeError(source, '', err); });
  });

  return Promise.allSettled(promises).then(function(results) {
    return results.map(function(r, i) {
      if (r.status === 'fulfilled') return r.value;
      return makeError(valid[i], '', r.reason || new Error('Unknown'));
    }).filter(function(r) { return r.content && r.content.length > 0; });
  });
}

function fetchURL(targetUrl) {
  var proxyUrl = FIREBASE_FN + '?source=url&query=' + encodeURIComponent(targetUrl);
  return fetchWithTimeout(proxyUrl, {}, 3000)
    .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function(data) { return makeResult('url', targetUrl, data.content || '', { originalUrl: targetUrl }, 0.85); })
    .catch(function(err) { return makeError('url', targetUrl, err); });
}

function searchLexica(query) {
  var url = 'https://lexica.art/api/v0/search?q=' + encodeURIComponent(query);
  return fetch(url)
    .then(function(res) { if (!res.ok) throw new Error('Lexica unavailable'); return res.json(); })
    .then(function(data) {
      return (data.images || []).slice(0, 4).map(function(img) {
        return { url: img.src, prompt: img.prompt, width: img.width, height: img.height };
      });
    })
    .catch(function() { return []; });
}
