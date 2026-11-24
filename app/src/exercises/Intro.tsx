import { useEffect } from 'react';
import { speak } from '../engine/speech';
import { altLabel } from '../engine/variants';
import type { ExProps } from '../types';
import { Ico, nounOnly, SPEAKER, SPEAKER_SM, Tag } from '../ui';

export default function Intro({ ex, pack, tr, done }: ExProps<'intro'>) {
  const { item } = ex;
  const lang = pack.voice;
  useEffect(() => { speak(item.target); }, [item.target]);
  return <>
    <section className="pad" style={{ marginTop: 30 }}>
      <div className="paper tape tilt" style={{ ['--rot' as string]: '-1.5deg', padding: '26px 22px 22px', position: 'relative' }}>
        <div className="halftone" aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, width: 140, height: 90, color: 'var(--c-pink)', opacity: 0.45 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span aria-hidden="true" style={{ fontSize: 96, lineHeight: 1 }}>{item.emoji}</span>
          <button type="button" className="audio" aria-label="Play pronunciation" onClick={() => speak(item.target)}><Ico d={SPEAKER} /></button>
        </div>
        <h1 lang={lang} className="target" style={{ position: 'relative', marginTop: 18, fontSize: 52, lineHeight: 1.05, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tag it={item} pack={pack} size={26} />{nounOnly(item, pack)}
        </h1>
        {tr && item.translit && <p className="small dim translit" style={{ position: 'relative', marginTop: 4, fontSize: 18 }}>{item.translit}</p>}
        <p style={{ position: 'relative', marginTop: 6, fontSize: 22, fontWeight: 600, color: 'var(--c-ink-dim)' }}>{item.english}</p>
        {item.alt && <p lang={lang} className="small dim" style={{ position: 'relative', marginTop: 2 }}>{altLabel(item)}</p>}
        {item.cognateHint && <span className="sticker y lower" style={{ position: 'absolute', right: -10, bottom: 74, ['--rot' as string]: '6deg', fontSize: 15 }}>{item.cognateHint}</span>}
      </div>
    </section>

    {item.example && <section className="pad" style={{ marginTop: 34 }}>
      <p className="eyebrow">In a sentence</p>
      <div className="card" style={{ marginTop: 10, padding: '14px 14px 14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <p lang={lang} style={{ fontSize: 19, fontWeight: 700 }}>{item.example.target}</p>
          {tr && item.example.translit && <p className="small dim translit" style={{ marginTop: 2 }}>{item.example.translit}</p>}
          <p className="dim small" style={{ marginTop: 2 }}>{item.example.english}</p>
          {item.example.alt && <p lang={lang} className="small dim" style={{ marginTop: 2 }}>{altLabel(item.example)}</p>}
        </div>
        <button type="button" className="audio sm" aria-label="Play example" onClick={() => speak(item.example!.target)}><Ico d={SPEAKER_SM} /></button>
      </div>
    </section>}

    <div className="foot" style={{ marginTop: 'auto' }}>
      <button type="button" className="btn block" onClick={() => done(null)}>Got it</button>
    </div>
  </>;
}
