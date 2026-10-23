/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE. */
/* v11.2 music engine: a small step sequencer that synthesises drums, bass, arpeggios, keys and pads with WebAudio.
   Tracks are data (assets/data/music.json). No samples, nothing to download beyond the JSON.
   API: ProfMusic.init(ctx, dest, data) · setTrack(id) · setVolume(v) · current() · stop(). Scheduling uses a
   look-ahead timer on the audio clock, so tempo stays steady when the game's frame rate drops. */
(function (root) {
  'use strict';
  const CH = { maj: [0, 4, 7], min: [0, 3, 7], sus2: [0, 2, 7], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10],
    maj9: [0, 4, 7, 11, 14], min9: [0, 3, 7, 10, 14], dom9: [0, 4, 7, 10, 14] };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const TONAL = 2.4;   // tonal parts vs drums: measured offline (tools/e2e/music_render.mjs) so bass and chords sit level with the kick
  let ctx = null, out = null, data = null, tr = null, step = 0, next = 0, timer = null, noise = null, arpI = 0, bar = 0;

  function init(c, dest, d) {
    ctx = c; data = d; out = ctx.createGain(); out.gain.value = 0.0001; out.connect(dest);
    const n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
    noise = b;
  }
  const env = (g, t, peak, a, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  function osc(type, f, t, dur, peak, cutoff, a = 0.005) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    let node = o; if (cutoff) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(cutoff, t); lp.Q.value = 2; o.connect(lp); node = lp; }
    node.connect(g); g.connect(out); env(g, t, peak * TONAL, a, dur); o.start(t); o.stop(t + a + dur + 0.05); return o;
  }
  function noiseHit(t, dur, peak, type, freq, q = 1) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f); f.connect(g); g.connect(out); env(g, t, peak, 0.002, dur); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const DRUM = {
    kick: (t, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); o.connect(g); g.connect(out); env(g, t, 0.42 * v, 0.003, 0.28); o.start(t); o.stop(t + 0.35); },
    snare: (t, v) => { noiseHit(t, 0.16, 0.22 * v, 'bandpass', 1800, 0.7); osc('triangle', 190, t, 0.08, 0.12 * v); },
    clap: (t, v) => { [0, 0.012, 0.024].forEach(d => noiseHit(t + d, 0.06, 0.12 * v, 'bandpass', 1300, 1.2)); },
    hat: (t, v) => noiseHit(t, 0.035, 0.07 * v, 'highpass', 8000),
    shaker: (t, v) => noiseHit(t, 0.05, 0.04 * v, 'highpass', 6000),
    brush: (t, v) => noiseHit(t, 0.12, 0.035 * v, 'bandpass', 4500, 0.5),
    rim: (t, v) => { osc('square', 820, t, 0.03, 0.05 * v, 3000); noiseHit(t, 0.02, 0.05 * v, 'highpass', 3000); },
  };
  const chordAt = (b) => { const k = tr.barsPerChord || 1, c = tr.chords[Math.floor(b / k) % tr.chords.length]; return { root: c[0], iv: CH[c[1]] || CH.maj }; };
  function play(t, s) {
    const T = tr, c = chordAt(bar), sixteenth = 60 / T.bpm / 4;
    for (const [k, pat] of Object.entries(T.drums || {})) { const ch = pat[s]; if (ch === 'x' || ch === 'o') DRUM[k] && DRUM[k](t, ch === 'x' ? 1 : 0.45); }
    const B = T.bass;
    if (B && B.pattern[s] === 'x') {
      let len = 1; while (B.pattern[(s + len) % 16] === '-' && len < 16) len++;
      let note = (c.root % 12) + B.octave; if (B.walk) note += [0, c.iv[1], c.iv[2], c.iv[2] + 2][Math.floor(s / 4) % 4] || 0;
      osc(B.wave, hz(note), t, len * sixteenth * 0.9, B.gain, B.cutoff, 0.008);
    }
    const A = T.arp;
    if (A && A.pattern[s] === 'x') {
      const tones = c.iv.map(i => c.root % 12 + A.octave + i), n = tones.length;
      let notes;
      if (A.order === 'chord') notes = tones.slice(0, 3);
      else if (A.order === 'random') notes = [tones[(Math.random() * n) | 0]];
      else if (A.order === 'updown') { const seq = tones.concat(tones.slice(1, -1).reverse()); notes = [seq[arpI++ % seq.length]]; }
      else notes = [tones[arpI++ % n] + (Math.floor(arpI / n) % 2 ? 12 : 0)];
      notes.forEach(m => { osc(A.wave, hz(m), t, A.decay || 0.15, A.gain, A.cutoff, 0.003); if (A.marimba) osc('sine', hz(m + 24), t, (A.decay || 0.2) * 0.4, A.gain * 0.3); });
    }
    const K = T.keys;   // electric-piano comp: chord tones with a soft bell partial
    if (K && K.pattern[s] === 'x') c.iv.slice(1).forEach((i, j) => { const f = hz(c.root % 12 + K.octave + i); osc('sine', f, t + j * 0.012, 0.9, K.gain, null, 0.01); osc('sine', f * 2, t + j * 0.012, 0.25, K.gain * 0.25); });
    const P = T.pad;
    if (P && s === 0 && bar % (T.barsPerChord || 1) === 0) {
      const dur = 16 * sixteenth * (T.barsPerChord || 1);
      c.iv.forEach(i => [-6, 6].forEach(det => { const o = osc(P.wave, hz(c.root % 12 + P.octave + i), t, dur, P.gain, P.cutoff, dur * 0.25); o.detune.value = det; }));
    }
  }
  function schedule() {
    if (!tr || !ctx) return;
    const sixteenth = 60 / tr.bpm / 4;
    while (next < ctx.currentTime + 0.15) {
      const sw = step % 2 ? (tr.swing || 0) * sixteenth : 0;
      play(next + sw, step);
      next += sixteenth; step = (step + 1) % 16; if (step === 0) bar++;
    }
  }
  function setTrack(id) {
    const t = data && data.tracks.find(x => x.id === id); if (!t || t === tr) return;
    tr = t; step = 0; bar = 0; arpI = 0; next = ctx.currentTime + 0.1;
    if (!timer && !(ctx instanceof (root.OfflineAudioContext || function () {}))) timer = setInterval(schedule, 25);
  }
  root.ProfMusic = {
    init, setTrack,
    setVolume(v) { if (out) out.gain.setTargetAtTime(v, ctx.currentTime, 0.4); },
    current: () => (tr ? tr.id : null),
    prime(sec) { if (!tr) return; const keep = next; while (next < ctx.currentTime + sec) { const sx = 60 / tr.bpm / 4, sw = step % 2 ? (tr.swing || 0) * sx : 0; play(next + sw, step); next += sx; step = (step + 1) % 16; if (step === 0) bar++; } return keep; },   // offline rendering (tests, previews)
    tracks: () => (data ? data.tracks : []),
    stop() { tr = null; if (timer) { clearInterval(timer); timer = null; } },
  };
})(typeof window !== 'undefined' ? window : globalThis);
