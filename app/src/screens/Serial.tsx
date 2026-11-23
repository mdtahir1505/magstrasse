import { useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking } from '../engine/speech';
import type { Episode, Lang } from '../types';
import { A, BACK, Ico, Screen, SPEAKER_SM } from '../ui';
import { TapWords, useGlossary, WordPopover } from './Stories';

const BG = ['var(--c-paper)', 'var(--c-yellow)', 'var(--c-paper)', 'var(--c-cyan)', 'var(--c-paper)', 'var(--c-pink)'];

/** Comic-strip reader for one Kiez Chronicles episode. */
export default function EpisodeReader({ ep, lang, tr, back }: { ep: Episode; lang: Lang; tr: boolean; back: () => void }) {
  const glossary = useGlossary(lang);
  const [en, setEn] = useState(true);
  const [now, setNow] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const live = useRef(false);
  const n = ep.panels.length;

  const playFrom = (i: number) => {
    live.current = true; setNow(i);
    document.getElementById(`panel-${i}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    speak(ep.panels[i].target, { onend: () => {
      if (!live.current) return;
      if (i + 1 < n) playFrom(i + 1); else { live.current = false; setNow(null); }
    } });
  };
  const stop = () => { live.current = false; setNow(null); stopSpeaking(); };
  useEffect(() => () => { live.current = false; stopSpeaking(); }, []);

  const p = picked ? glossary.get(picked) : undefined;
  return <Screen>
    <div className="pad session-top">
      <A className="icon-btn" aria-label="Back" onClick={back}><Ico d={BACK} /></A>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="eyebrow">Kiez Chronicles · Episode {ep.n}</p>
        <p lang={lang.pack.voice} style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.title}</p>
      </div>
    </div>

    <article className="grow scroll pad comic" lang={lang.pack.voice}>
      {ep.panels.map((pn, i) =>
        <section key={i} id={`panel-${i}`} className={'paper tilt panel' + (i === now ? ' now' : '')} style={{ ['--rot' as string]: i % 2 ? '1.1deg' : '-1.1deg', background: BG[i % BG.length] }}>
          <header className="who">
            {pn.emoji && <span className="avatar" aria-hidden="true">{pn.emoji}</span>}
            {pn.speaker && <span className="marker">{pn.speaker}</span>}
            <button type="button" className="audio sm" aria-label={`Hear panel ${i + 1}`} onClick={() => { stop(); speak(pn.target); }} style={{ marginLeft: 'auto' }}><Ico d={SPEAKER_SM} /></button>
          </header>
          <div className="bubble">
            <p style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.45 }}><TapWords text={pn.target} glossary={glossary} picked={picked} pick={setPicked} /></p>
            {tr && pn.translit && <p className="small translit" style={{ marginTop: 2 }}>{pn.translit}</p>}
            {en && <p lang="en" className="small" style={{ marginTop: 4, fontWeight: 600, color: 'var(--c-ink-dim)' }}>{pn.english}</p>}
          </div>
        </section>)}
      <section className="paper tilt panel tbc" style={{ ['--rot' as string]: '-1deg' }}>
        <div className="halftone" aria-hidden="true" style={{ position: 'absolute', inset: 0, color: 'var(--c-pink)', opacity: 0.35 }} />
        <p className="marker" style={{ position: 'relative', fontSize: 34, color: 'var(--c-yellow)' }}>To be continued…</p>
        <p lang="en" style={{ position: 'relative', marginTop: 8, fontWeight: 700, color: 'var(--c-paper)' }}>{ep.cliffhanger}</p>
      </section>
    </article>

    {p && <WordPopover p={p} lang={lang} tr={tr} close={() => setPicked(null)} />}

    <div className="foot" style={{ background: 'var(--c-ink)', borderTop: '2px solid var(--c-surface-2)', flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 18 }}>
      <button type="button" className="audio" aria-label={now === null ? 'Play all' : 'Stop'} onClick={() => (now === null ? playFrom(0) : stop())} style={{ width: 64, height: 64, background: 'var(--c-yellow)' }}>
        {now === null
          ? <svg className="ico fill" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28 }}><path d="M7 4v16l13-8z" /></svg>
          : <svg className="ico fill" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28 }}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>}
      </button>
      <span className="small dim" style={{ flex: 1, fontWeight: 700 }}>{now === null ? 'Play all' : `Panel ${now + 1}/${n}`}</span>
      <button type="button" className={'chip dark' + (en ? ' sel' : '')} aria-pressed={en} onClick={() => setEn(!en)}>EN</button>
    </div>
  </Screen>;
}
