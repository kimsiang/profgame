/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   学者 Pro 版 · AI 设置
   ---------------------------------------------------------
   在电脑上用自己的 API Key：
   1) 最简单：打开游戏 → 首页「AI 设置」→ 填写 Key → 「测试连接」。
      Key 只保存在这台电脑的浏览器里（localStorage），不会上传到别处。
   2) 或者直接改下面这几行（用文本编辑器打开本 HTML 文件，搜索 PRO_CONFIG）：
   ========================================================= */
const PRO_CONFIG = {
  provider: 'anthropic',        // 'anthropic'（Claude 官方 API）或 'openai'（任何 OpenAI 兼容接口）
  apiKey: '',                   // 在这里粘贴你的 API Key，例如 'sk-ant-...'
  model: 'claude-haiku-5-5',    // Claude 可填 claude-haiku-5-5（快、便宜）或 claude-sonnet-5-5（更聪明）；OpenAI 兼容接口填对应模型名
  baseURL: '',                  // 仅 'openai' 需要，例如 https://api.deepseek.com/v1
};

const AI = (() => {
  const KEY = 'prof-day-ai';
  let cfg = Object.assign({ provider: 'anthropic', apiKey: '', model: 'claude-haiku-5-5', baseURL: '' }, PRO_CONFIG);
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && !PRO_CONFIG.apiKey) cfg = Object.assign(cfg, s); } catch (e) { /* storage blocked */ }
  function save(c) { cfg = Object.assign(cfg, c); try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* storage blocked */ } }
  function ready() { return cfg.provider === 'claude-app' ? !!sampleFn : !!(cfg.apiKey && cfg.model && (cfg.provider !== 'openai' || cfg.baseURL)); }
  function parseJSON(text) {
    const t = String(text || '').trim();
    try { return JSON.parse(t); } catch (e) { /* fall through */ }
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (fence) { try { return JSON.parse(fence[1]); } catch (e) { /* fall through */ } }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw { code: 'invalid_json', message: '回复不是 JSON' };
  }
  async function json(prompt, signal) {
    if (cfg.provider === 'claude-app') return sampleFn.json(prompt, { modelTier: 'quick', cache: false, signal });
    let res;
    try {
      if (cfg.provider === 'openai') {
        res = await fetch(cfg.baseURL.replace(/\/+$/, '') + '/chat/completions', {
          method: 'POST', signal,
          headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.apiKey },
          body: JSON.stringify({ model: cfg.model, temperature: 0.8, max_tokens: 500, messages: [{ role: 'system', content: '你只输出一个 JSON 对象，不要输出其他文字。' }, { role: 'user', content: prompt }] }),
        });
      } else {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal,
          headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: cfg.model, max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
        });
      }
    } catch (e) {
      if (e && e.name === 'AbortError') throw { code: 'cancelled' };
      throw { code: 'network', message: '连不上 API 服务器：检查网络，或这个接口不允许浏览器直接访问。' };
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (body.error && (body.error.message || body.error.type)) || res.statusText;
      throw { code: res.status === 401 || res.status === 403 ? 'auth' : res.status === 429 ? 'rate_limited' : 'upstream_error', message: `HTTP ${res.status}：${msg}` };
    }
    const text = cfg.provider === 'openai' ? (body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content) : (body.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    return parseJSON(text);
  }
  return { get cfg() { return cfg; }, save, ready, json };
})();

/* settings panel */
function openAI(note) {
  const c = AI.cfg;
  $('aiProv').value = c.provider; $('aiKey').value = c.apiKey || ''; $('aiModel').value = c.model || ''; $('aiBase').value = c.baseURL || '';
  $('aiNote').textContent = note || ''; $('aiTest').textContent = ''; syncAIForm();
  $('aiModal').classList.remove('hidden');
  if (S && S.running && !S.paused) togglePause(true);
}
function syncAIForm() {
  const p = $('aiProv').value;
  $('aiBaseRow').classList.toggle('hidden', p !== 'openai');
  $('aiKeyRow').classList.toggle('hidden', p === 'claude-app');
  $('aiModelRow').classList.toggle('hidden', p === 'claude-app');
  if (p === 'anthropic' && !/claude/.test($('aiModel').value)) $('aiModel').value = 'claude-haiku-5-5';
  if (p === 'openai' && /claude/.test($('aiModel').value)) $('aiModel').value = '';
}
function readAIForm() { return { provider: $('aiProv').value, apiKey: $('aiKey').value.trim(), model: $('aiModel').value.trim(), baseURL: $('aiBase').value.trim() }; }
function initAI() {
$('aiProv').onchange = syncAIForm;
$('aiSave').onclick = () => { AI.save(readAIForm()); $('aiModal').classList.add('hidden'); refreshProCard(); toast(AI.ready() ? '已保存。学者 Pro 版可以用了。' : '已保存，但还缺少 Key 或模型名。'); };
$('aiCancel').onclick = () => { $('aiModal').classList.add('hidden'); };
$('aiTestBtn').onclick = async () => {
  AI.save(readAIForm());
  $('aiTest').textContent = '正在测试…'; $('aiTest').style.color = 'var(--muted)';
  try {
    const r = await AI.json('只回复一个 JSON：{"ok":true,"reply":"用一句中文跟物理系教授打个招呼"}');
    $('aiTest').textContent = '连接成功：' + String((r && r.reply) || 'OK').slice(0, 60); $('aiTest').style.color = 'var(--ok)';
  } catch (e) {
    $('aiTest').textContent = '连接失败：' + ((e && e.message) || (e && e.code) || '未知错误'); $('aiTest').style.color = 'var(--danger)';
  }
  refreshProCard();
};
}
function refreshProCard() {
  const ok = AI.ready();
  $('proNote').textContent = ok ? `进入 Pro 版 ▸（${AI.cfg.provider === 'claude-app' ? 'Claude 应用' : AI.cfg.model}）` : '先在「AI 设置」里填写 API Key ▸';
}
