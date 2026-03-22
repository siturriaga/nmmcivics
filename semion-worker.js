// semion-worker.js
// SEMION™ Local Intelligence Worker
// Copyright © 2026 Sebastian Iturriaga — synapsecopilot.com
// Runs a local language model entirely in the browser.
// No API. No internet after first download. No cost per query.

import { pipeline, env, TextStreamer } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';

// Use browser cache — model downloads once, lives forever
env.allowLocalModels = false;
env.useBrowserCache = true;

// Available models — user can pick in settings
const MODELS = {
  fast:    { id: 'Xenova/Qwen2.5-0.5B-Instruct',              label: 'Fast (~400MB)',   dtype: 'q4' },
  default: { id: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',       label: 'Standard (~900MB)', dtype: 'q4' },
  best:    { id: 'onnx-community/Qwen2.5-1.5B-Instruct-q4',   label: 'Best (~1GB)',     dtype: 'q4' },
};

let pipe = null;
let currentModel = null;
let isLoading = false;

// ── LOAD MODEL
async function loadModel(modelKey = 'default') {
  if (pipe && currentModel === modelKey) {
    self.postMessage({ type: 'ready', modelKey });
    return;
  }
  if (isLoading) return;
  isLoading = true;

  const model = MODELS[modelKey] || MODELS.default;
  currentModel = modelKey;

  self.postMessage({
    type: 'loading',
    label: model.label,
    message: 'Initialising model…'
  });

  try {
    pipe = await pipeline('text-generation', model.id, {
      dtype: model.dtype,
      device: 'webgpu',
      progress_callback: (progress) => {
        if (progress.status === 'downloading') {
          const pct = progress.total
            ? Math.round((progress.loaded / progress.total) * 100)
            : null;
          const mb = progress.total
            ? Math.round(progress.total / 1024 / 1024)
            : null;
          self.postMessage({
            type: 'progress',
            file: progress.file,
            loaded: progress.loaded,
            total: progress.total,
            pct,
            mb,
            message: pct != null
              ? `Downloading model… ${pct}% of ${mb}MB`
              : `Downloading model files…`
          });
        } else if (progress.status === 'initiate') {
          self.postMessage({ type: 'progress', message: 'Preparing model…', pct: null });
        } else if (progress.status === 'ready') {
          self.postMessage({ type: 'progress', message: 'Loading into memory…', pct: 99 });
        }
      }
    });

    isLoading = false;
    self.postMessage({ type: 'ready', modelKey, label: model.label });

  } catch (err) {
    // WebGPU failed — try WASM fallback
    if (err.message && err.message.toLowerCase().includes('webgpu')) {
      self.postMessage({ type: 'progress', message: 'WebGPU unavailable — using CPU fallback (slower)…', pct: null });
      try {
        pipe = await pipeline('text-generation', model.id, {
          dtype: model.dtype,
          device: 'wasm',
          progress_callback: (progress) => {
            if (progress.status === 'downloading') {
              const pct = progress.total ? Math.round((progress.loaded / progress.total) * 100) : null;
              self.postMessage({ type: 'progress', pct, message: pct != null ? `Downloading… ${pct}%` : 'Downloading…' });
            }
          }
        });
        isLoading = false;
        self.postMessage({ type: 'ready', modelKey, label: model.label + ' (CPU)', device: 'wasm' });
      } catch (err2) {
        isLoading = false;
        self.postMessage({ type: 'error', message: 'Model load failed: ' + err2.message });
      }
    } else {
      isLoading = false;
      self.postMessage({ type: 'error', message: 'Model load failed: ' + err.message });
    }
  }
}

// ── GENERATE
async function generate({ id, userText, systemBrief, maxTokens = 600 }) {
  if (!pipe) {
    self.postMessage({ type: 'gen_error', id, message: 'Model not loaded yet.' });
    return;
  }

  const messages = [
    { role: 'system',    content: systemBrief },
    { role: 'user',      content: userText }
  ];

  let fullText = '';

  const streamer = new TextStreamer(pipe.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (token) => {
      fullText += token;
      self.postMessage({ type: 'token', id, token });
    }
  });

  try {
    await pipe(messages, {
      max_new_tokens: maxTokens,
      do_sample: true,
      temperature: 0.72,
      top_p: 0.9,
      repetition_penalty: 1.1,
      streamer,
    });
    self.postMessage({ type: 'gen_done', id, text: fullText });
  } catch (err) {
    self.postMessage({ type: 'gen_error', id, message: err.message });
  }
}

// ── MESSAGE HANDLER
self.onmessage = async (e) => {
  const { type, payload } = e.data;
  if (type === 'load')     await loadModel(payload?.modelKey || 'default');
  if (type === 'generate') await generate(payload);
  if (type === 'ping')     self.postMessage({ type: 'pong' });
};
