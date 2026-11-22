// speechSynthesis out, SpeechRecognition + MediaRecorder in. Nothing here may block progress.
let voiceLang = 'de-DE';
let rate = 0.9;
export const configureSpeech = (lang: string, r: number) => { voiceLang = lang; rate = r; };

function pickVoice(): SpeechSynthesisVoice | undefined {
  const vs = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(voiceLang.slice(0, 2).toLowerCase()));
  return vs.find((v) => /enhanced|premium/i.test(v.name)) ?? vs.find((v) => v.lang.replace('_', '-') === voiceLang) ?? vs[0];
}

export function speak(text: string, o: { slow?: boolean; rate?: number; onend?: () => void } = {}) {
  if (!('speechSynthesis' in window)) { o.onend?.(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voiceLang;
  const v = pickVoice(); if (v) u.voice = v;
  u.rate = o.slow ? 0.6 : (o.rate ?? 1) * rate;
  u.onend = () => o.onend?.();
  u.onerror = () => o.onend?.();
  speechSynthesis.speak(u);
}
export const stopSpeaking = () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); };

// ---- recognition ----
type Rec = { lang: string; interimResults: boolean; start(): void; stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
const Ctor = (): (new () => Rec) | undefined => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
export const canListen = () => !!Ctor();

/** null when unavailable. `done` resolves with the transcript, rejects on a recogniser error. */
export function listen(onPartial?: (t: string) => void): { done: Promise<string>; stop: () => void } | null {
  const R = Ctor(); if (!R) return null;
  try {
    const r = new R(); r.lang = voiceLang; r.interimResults = true;
    let last = '';
    const done = new Promise<string>((res, rej) => {
      r.onresult = (e) => { last = Array.from(e.results).map((x) => x[0].transcript).join(' '); onPartial?.(last); };
      r.onerror = (e) => rej(new Error(e.error));
      r.onend = () => res(last);
    });
    r.start();
    return { done, stop: () => { try { r.stop(); } catch { /* already stopped */ } } };
  } catch { return null; }
}

// ---- recording (for "Play mine" and the Shadow waveform) ----
/** Resolves null if the mic is unavailable or denied. stop() gives a playable url + 32 waveform bars (0-100). */
export async function record(): Promise<{ stop: () => Promise<{ url: string; bars: number[] }> } | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream); const chunks: Blob[] = [];
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.start();
    return {
      stop: () => new Promise((res) => {
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: mr.mimeType });
          let bars = Array.from({ length: 32 }, (_, i) => 20 + ((i * 37) % 60));
          try {
            const buf = await new AudioContext().decodeAudioData(await blob.arrayBuffer());
            const d = buf.getChannelData(0), step = Math.max(1, Math.floor(d.length / 32));
            const peaks = bars.map((_, i) => { let m = 0; for (let j = i * step; j < Math.min(d.length, (i + 1) * step); j += 8) m = Math.max(m, Math.abs(d[j])); return m; });
            const top = Math.max(...peaks, 0.001);
            bars = peaks.map((p) => Math.max(6, Math.round((p / top) * 100)));
          } catch { /* keep placeholder bars */ }
          res({ url: URL.createObjectURL(blob), bars });
        };
        mr.stop();
      }),
    };
  } catch { return null; }
}
