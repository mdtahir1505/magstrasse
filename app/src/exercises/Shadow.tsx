import { useRef, useState } from 'react';
import { record, speak } from '../engine/speech';
import type { ExProps } from '../types';
import { Ico, SPEAKER_SM } from '../ui';

type Rec = Awaited<ReturnType<typeof record>>;

export default function Shadow({ ex, pack, tr, done }: ExProps<'shadow'>) {
  const [phase, setPhase] = useState<'idle' | 'rec' | 'done'>('idle');
  const [mine, setMine] = useState<{ url: string; bars: number[] } | null>(null);
  const [noMic, setNoMic] = useState(false);
  const rec = useRef<Rec>(null);
  // Decorative: we can't get the TTS audio, so the "native" bars are a stable pattern per sentence.
  const native = Array.from({ length: 32 }, (_, i) => 15 + ((ex.target.charCodeAt(i % ex.target.length) * (i + 7)) % 80));

  const start = async () => {
    setPhase('rec');
    rec.current = await record();
    if (!rec.current) { setNoMic(true); setPhase('done'); }
  };
  const stop = async () => {
    const r = await rec.current?.stop(); rec.current = null;
    if (r) setMine(r);
    setPhase('done');
  };

  return <>
    <h1 className="instruction pad" style={{ marginTop: 18 }}>Shadow it</h1>
    <ol className="pad" style={{ marginTop: 12, display: 'flex', gap: 8 }} aria-label="Steps">
      <li className="sticker" style={{ ['--rot' as string]: '-2deg' }}>1 · Play</li>
      <li className="sticker" style={{ ['--rot' as string]: '2deg' }}>2 · Record</li>
      <li className="sticker y" style={{ ['--rot' as string]: '-3deg' }}>3 · Compare</li>
    </ol>

    <section className="pad" style={{ marginTop: 24 }}>
      <p lang={pack.voice} style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25 }}>{ex.target}</p>
      {tr && ex.translit && <p className="small dim translit" style={{ marginTop: 4 }}>{ex.translit}</p>}
      <p className="dim" style={{ marginTop: 4, fontSize: 17 }}>{ex.english}</p>
    </section>

    <section className="pad" style={{ marginTop: 24 }}>
      <div className="paper" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="audio" aria-label="Play native speaker" onClick={() => speak(ex.target)}><Ico fill d={['M7 4v16l13-8z']} /></button>
          <div style={{ flex: 1 }}>
            <p className="eyebrow">Native</p>
            <div className="wave" role="img" aria-label="Native speaker waveform" style={{ height: 44, color: 'var(--c-ink)' }}>
              {native.map((b, i) => <i key={i} style={{ height: `${b}%` }} />)}
            </div>
          </div>
        </div>
        <div className="divider-tape" aria-hidden="true" style={{ height: 6 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="audio" aria-label="Play your recording" disabled={!mine} onClick={() => mine && new Audio(mine.url).play()} style={{ background: 'var(--c-pink)' }}><Ico fill d={['M7 4v16l13-8z']} /></button>
          <div style={{ flex: 1 }}>
            <p className="eyebrow">You</p>
            <div className="wave" role="img" aria-label="Your recording waveform" style={{ height: 44, color: 'var(--c-pink)' }}>
              {(mine?.bars ?? []).map((b, i) => <i key={i} style={{ height: `${b}%`, outline: '1px solid var(--c-ink)' }} />)}
            </div>
          </div>
        </div>
      </div>
      <p className="small" style={{ marginTop: 14, fontWeight: 600 }}>
        {phase === 'idle' && 'Play it, then hit the mic and say it right over the top.'}
        {phase === 'rec' && 'Recording… tap the mic again when you are done.'}
        {phase === 'done' && (noMic ? "No mic here. Say it out loud anyway, then move on." : 'Play yours next to the native one. Go again or move on.')}
      </p>
    </section>

    <div className="foot" style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'center' }}>
      <button type="button" className={'mic' + (phase === 'rec' ? ' live' : '')} aria-label={phase === 'rec' ? 'Stop recording' : 'Record'} onClick={phase === 'rec' ? stop : start} style={{ width: 64, height: 64, borderWidth: 3 }}>
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28 }}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
      </button>
      <button type="button" className="btn" style={{ flex: 1 }} onClick={() => done({ correct: true, answer: ex.target, silent: true })}>Next</button>
    </div>
  </>;
}
