import { useEffect, useMemo, useRef, useState } from 'react';
import { allItems } from '../content';
import { speak, stopSpeaking } from '../engine/speech';
import type { Item, Lang, Level, Story } from '../types';
import { A, BACK, CLOSE, Ico, nounOnly, Screen, SPEAKER, Tab, TabBar, Tag } from '../ui';

const BG = ['var(--c-paper)', 'var(--c-yellow)', 'var(--c-paper)', 'var(--c-cyan)', 'var(--c-pink)'];
const ROT = ['-1.5deg', '1.2deg', '-0.8deg', '1.6deg', '-1.2deg'];

export function Stories({ lang, go, open }: { lang: Lang; go: (t: Tab) => void; open: (s: Story) => void }) {
  const [level, setLevel] = useState<Level | 'All'>('All');
  const shown = lang.stories.filter((s) => level === 'All' || s.level === level);
  return <Screen>
    <header className="pad" style={{ paddingTop: 8 }}>
      <p className="eyebrow">Read &amp; listen</p>
      <h1 className="display" style={{ fontSize: 48 }}>Stories</h1>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }} role="group" aria-label="Filter by level">
        {(['All', 'A1', 'A2', 'B1'] as const).map((l) => <button key={l} type="button" className={'chip dark' + (l === level ? ' sel' : '')} aria-pressed={l === level} onClick={() => setLevel(l)}>{l}</button>)}
      </div>
    </header>
    <ul className="grow scroll pad" style={{ paddingTop: 22, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {shown.map((s, i) =>
        <li key={s.id}>
          <A className="story paper tilt" onClick={() => open(s)} style={{ ['--rot' as string]: ROT[i % 5], padding: '16px 16px 14px', position: 'relative', background: BG[i % 5] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sticker" style={{ ['--rot' as string]: '-4deg', background: 'var(--c-ink)', color: 'var(--c-paper)' }}>{s.level}</span>
              <span className="small" style={{ fontWeight: 700 }}>{s.minutes} min · audio</span>
            </div>
            <h2 lang={lang.pack.voice} className="display" style={{ fontSize: 34, marginTop: 10 }}>{s.title}</h2>
            <p lang={lang.pack.voice} className="small" style={{ marginTop: 6, fontWeight: 500, color: 'var(--c-ink-dim)' }}>“{s.lines[0]?.target ?? ''}”</p>
          </A>
        </li>)}
      {!shown.length && <li className="dim">No stories here yet.</li>}
    </ul>
    <TabBar tab="stories" go={go} />
  </Screen>;
}

const key = (t: string) => t.toLowerCase().replace(/[.,!?"„“”:;]/g, '');
const SPEEDS = [1, 0.8, 0.6];

export function Reader({ story, lang, back }: { story: Story; lang: Lang; back: () => void }) {
  const glossary = useMemo(() => {
    const g = new Map<string, Item>();
    for (const i of allItems(lang)) { const k = key(nounOnly(i)); if (!k.includes(' ') && !g.has(k)) g.set(k, i); }
    return g;
  }, [lang]);
  const [line, setLine] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [en, setEn] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const live = useRef(false);
  const spd = useRef(1);
  spd.current = SPEEDS[speed];
  const n = story.lines.length;

  const playFrom = (i: number) => {
    live.current = true; setPlaying(true); setLine(i);
    speak(story.lines[i].target, { rate: spd.current, onend: () => {
      if (!live.current) return;
      if (i + 1 < n) playFrom(i + 1); else { live.current = false; setPlaying(false); }
    } });
  };
  const pause = () => { live.current = false; setPlaying(false); stopSpeaking(); };
  const step = (d: number) => { const i = Math.min(Math.max(line + d, 0), n - 1); if (playing) playFrom(i); else setLine(i); };
  useEffect(() => () => { live.current = false; stopSpeaking(); }, []);

  const p = picked ? glossary.get(picked) : undefined;
  const round = { width: 64, height: 64 } as const;
  return <Screen>
    <div className="pad session-top">
      <A className="icon-btn" aria-label="Back to stories" onClick={back}><Ico d={BACK} /></A>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p lang={lang.pack.voice} style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{story.title}</p>
        <div className="bar thin" role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={n} aria-valuenow={line + 1} style={{ marginTop: 4 }}><i style={{ width: `${Math.round(((line + 1) / n) * 100)}%` }} /></div>
      </div>
      <span className="sticker y" style={{ ['--rot' as string]: '4deg' }}>{story.level}</span>
    </div>

    <article className="grow scroll pad" lang={lang.pack.voice} style={{ paddingTop: 18, paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {story.lines.map((ln, i) =>
        <div key={i} className={'line' + (i === line ? ' now' : '')}>
          {ln.speaker && <p className="eyebrow" style={{ color: 'var(--c-pink)', marginBottom: 2 }}>{ln.speaker}</p>}
          <p style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.5 }}>
            {ln.target.split(' ').map((w, j) => {
              const k = key(w); const known = glossary.has(k);
              return <span key={j}><button type="button" className={'wb' + (known ? ' tap' : '') + (k === picked ? ' sel' : '')}
                onClick={() => { if (known) { setPicked(k); speak(glossary.get(k)!.target); } }}>{w}</button> </span>;
            })}
          </p>
          {en && i === line && <p lang="en" className="small" style={{ color: 'var(--c-cyan)', fontWeight: 600, marginTop: 2 }}>{ln.english}</p>}
        </div>)}
    </article>

    {p && <div className="pad" style={{ position: 'relative', zIndex: 2, marginBottom: -6 }}>
      <div className="paper rise" role="dialog" aria-label="Word translation" style={{ padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span aria-hidden="true" style={{ fontSize: 38, lineHeight: 1 }}>{p.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p lang={lang.pack.voice} style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag g={p.gender} articles={lang.pack.articles} size={15} />{nounOnly(p)}
          </p>
          <p style={{ fontWeight: 600, color: 'var(--c-ink-dim)' }}>{p.english}</p>
        </div>
        <button type="button" className="audio" aria-label="Hear the word" onClick={() => speak(p.target)}><Ico d={SPEAKER} /></button>
        <button type="button" className="icon-btn plain" aria-label="Close" onClick={() => setPicked(null)} style={{ color: 'var(--c-ink)', width: 36 }}><Ico d={CLOSE} /></button>
      </div>
    </div>}

    <div className="foot" style={{ background: 'var(--c-ink)', borderTop: '2px solid var(--c-surface-2)', flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 18 }}>
      <button type="button" className="audio" aria-label="Previous line" onClick={() => step(-1)} style={{ background: 'var(--c-surface-2)', color: 'var(--c-text)', borderColor: 'var(--c-line)' }}><Ico d={['M18 6 10 12l8 6zM6 6v12']} /></button>
      <button type="button" className="audio" aria-label={playing ? 'Pause' : 'Play'} onClick={() => (playing ? pause() : playFrom(line))} style={{ ...round, background: 'var(--c-yellow)' }}>
        {playing
          ? <svg className="ico fill" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28 }}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          : <Ico fill d={['M7 4v16l13-8z']} style={{ width: 28, height: 28 }} />}
      </button>
      <button type="button" className="audio" aria-label="Next line" onClick={() => step(1)} style={{ background: 'var(--c-surface-2)', color: 'var(--c-text)', borderColor: 'var(--c-line)' }}><Ico d={['M6 6l8 6-8 6zM18 6v12']} /></button>
      <div style={{ flex: 1 }}></div>
      <button type="button" className="chip dark" aria-label="Playback speed" onClick={() => setSpeed((speed + 1) % SPEEDS.length)}>{SPEEDS[speed]}×</button>
      <button type="button" className={'chip dark' + (en ? ' sel' : '')} aria-pressed={en} onClick={() => setEn(!en)}>EN</button>
    </div>
  </Screen>;
}
