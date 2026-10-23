/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v14.1 the share card: a 1080×1350 (4:5) picture of the week — grade, the one sentence, the moments, the fiction note
   and a QR code to the game — drawn on a canvas and saved (share sheet on phones, download elsewhere).
   Text comes from the same templates as the review (src/moments.js); nothing is generated. */
'use strict';
const CARD = { W: 1080, H: 1350, url: 'https://kimsiang.github.io/profgame/', navy: '#051C2C', blue: '#2251FF', cyan: '#00A9F4', gold: '#FFC857', ink: '#EAF4FB', dim: '#9FBCCD' };
/* Word-wrap for mixed Chinese / Latin text: Chinese breaks anywhere, Latin at spaces. */
function cardWrap(g, text, maxW) {
  const lines = []; let line = '';
  const tokens = String(text).split(/(\s+|(?<=[　-鿿＀-￯])|(?=[　-鿿＀-￯]))/).filter(t => t !== '');
  for (let i = 0; i < tokens.length; i++) { let tk = tokens[i]; if (/^[“‘「（(]$/.test(tk) && tokens[i + 1]) { tk += tokens[i + 1]; i++; } const test = line + tk; if (g.measureText(test).width > maxW && line) { lines.push(line.trimEnd()); line = tk.trimStart(); } else line = test; }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}
function cardFont(weight, px, serif) { return `${weight} ${px}px ${serif ? '"Noto Serif SC","Playfair Display","Songti SC",Georgia,serif' : 'Inter,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif'}`; }
/* Draw the card for the week just reviewed. Returns the canvas. */
function weeklyCardCanvas() {
  const W = CARD.W, H = CARD.H, M = 76, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  // background: navy with a faint royal-blue gradient and a thin cyan rule
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0A2436'); bg.addColorStop(1, CARD.navy); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = CARD.cyan; g.fillRect(M, 118, 56, 4);
  // eyebrow + title
  g.fillStyle = CARD.cyan; g.font = cardFont(600, 24, false); g.textBaseline = 'alphabetic'; g.letterSpacing = '0.18em'; g.fillText(`第 ${S.week} 周 · ${DAYS[S.day] ? DAYS[S.day].name : '周日'}`.toUpperCase(), M, 100);
  g.letterSpacing = '0px';
  g.fillStyle = CARD.ink; g.font = cardFont(900, 64, true); g.fillText('导师的一周', M, 200);
  g.fillStyle = CARD.dim; g.font = cardFont(600, 22, false); g.letterSpacing = '0.3em'; g.fillText("MY ADVISOR'S WEEK", M, 236); g.letterSpacing = '0px';
  // grade
  const R = S.weekResult || {}, grade = R.grade || '?';
  const gg = g.createLinearGradient(0, 270, 0, 430); gg.addColorStop(0, '#fff7d6'); gg.addColorStop(0.6, CARD.gold); gg.addColorStop(1, '#a8730f');
  g.fillStyle = gg; g.font = cardFont(900, 170, true); g.fillText(grade, M - 6, 420);
  const title = ($('wkTitle') && $('wkTitle').textContent) || '';
  g.fillStyle = CARD.ink; g.font = cardFont(900, 34, true); cardWrap(g, title, W - M * 2 - 230).slice(0, 2).forEach((l, i) => g.fillText(l, M + 210, 352 + i * 44));
  g.fillStyle = CARD.dim; g.font = cardFont(400, 22, false); g.fillText(($('wkSub') && $('wkSub').textContent) || '', M + 210, 410);
  // the sentence
  let y = 520; const line = weeklyLine();
  if (line) { g.fillStyle = CARD.ink; g.font = cardFont(600, 36, true); for (const l of cardWrap(g, line, W - M * 2).slice(0, 4)) { g.fillText(l, M, y); y += 52; } }
  // moments
  y += 30; g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
  for (const m of weeklyTop(5)) {
    g.beginPath(); g.moveTo(M, y - 34); g.lineTo(W - M, y - 34); g.stroke();
    g.fillStyle = CARD.dim; g.font = cardFont(600, 20, false); g.fillText(`${DAYS[m.day] ? DAYS[m.day].name : ''} ${fmt(m.t)}`, M, y);
    g.fillStyle = CARD.ink; g.font = cardFont(400, 26, false); g.fillText(m.icon, M + 150, y + 1);
    const ls = cardWrap(g, momentText(m), W - M * 2 - 200).slice(0, 2); ls.forEach((l, i) => g.fillText(l, M + 196, y + i * 34));
    y += 34 * ls.length + 26;
    if (y > H - 220) break;
  }
  // footer: fiction note, brand mark, QR
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(M, H - 150, W - M * 2, 1);
  g.fillStyle = CARD.dim; g.font = cardFont(400, 20, false); g.fillText('虚构设定，不针对任何单位和个人 · A work of fiction', M, H - 104);
  g.fillText(CARD.url.replace(/^https?:\/\//, ''), M, H - 68);
  try {
    if (typeof qrcode === 'function') { const q = qrcode(0, 'M'); q.addData(CARD.url); q.make(); const n = q.getModuleCount(), size = 120, cell = size / n, x0 = W - M - size, y0 = H - 150 - size - 10;
      g.fillStyle = '#ffffff'; g.fillRect(x0 - 8, y0 - 8, size + 16, size + 16); g.fillStyle = CARD.navy;
      for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) g.fillRect(x0 + col * cell, y0 + r * cell, cell + 0.5, cell + 0.5); }
  } catch (e) { /* no QR: the URL is printed anyway */ }
  return c;
}
/* Save or share the card. Phones with a share sheet get it as a file; everything else downloads a PNG. */
function weeklyCardSave() {
  const c = weeklyCardCanvas(), name = `my-advisors-week-W${S.week}.png`;
  c.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: '导师的一周' }); return; } catch (e) { /* cancelled: fall through to download */ } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    if (typeof toast === 'function') toast('卡片已保存。', 'good');
  }, 'image/png');
}
