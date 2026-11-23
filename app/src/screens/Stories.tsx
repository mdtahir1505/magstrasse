import { useEffect, useMemo, useRef, useState } from 'react';
import { allItems } from '../content';
import { speak, stopSpeaking } from '../engine/speech';
import { flatLessons } from '../content';
import type { Progress } from '../engine/storage';
import type { Episode, Item, Lang, Level, Story } from '../types';
import { A, BACK, CLOSE, genderTags, Ico, nounOnly, Screen, SPEAKER, Tab, TabBar, Tag } from '../ui';

const BG = ['var(--c-paper)', 'var(--c-yellow)', 'var(--c-paper)', 'var(--c-cyan)', 'var(--c-pink)'];
const ROT = ['-1.5deg', '1.2deg', '-0.8deg', '1.6deg', '-1.2deg'];

const untilMidnight = () => { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1); const mins = Math.ceil((+m - +n) / 60000); return `${Math.floor(mins / 60)}h ${mins % 60}m`; };

/** "Kiez Chronicles" header: the newest episode, when the next one comes, and the ones already read. */
function Chronicles({ lang, eps, progress, today, openEp }: { lang: Lang; eps: Episode[]; progress: Progress; today: string; openEp: (e: Episode) => void }) {
  const cur = eps.find((e) => e.n === progress.serialUnlocked);
  const next = eps.find((e) => e.n === progress.serialUnlocked + 1);
  const unread = cur && cur.n > progress.serialSeen;
  const need = next && !progress.lessonsDone.includes(next.minLesson) ? flatLessons(lang).find((f) => f.lesson.id === next.minLesson)?.lesson.title : undefined;
  const status = !next ? 'You are all caught up. More episodes soon.'
    : !progress.lessonsDone.includes(next.minLesson) ? `Episode ${next.n} unlocks after you finish ${need ? `"${need}"` : 'more of the course'}.`
    : progress.serialUnlockedOn === today ? `Next one tomorrow · in ${untilMidnight()}`
    : `Finish a session today to unlock episode ${next.n}.`;
  const read = eps.filter((e) => e.n <= progress.serialSeen);
  return <li>
    <div className="paper tilt" style={{ ['--rot' as string]: '-1deg', padding: '16px 16px 14px', position: 'relative', overflow: 'hidden' }}>
      <div className="halftone" aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, width: 130, height: 100, color: 'var(--c-pink)', opacity: 0.4 }} />
      <p className="eyebrow" style={{ position: 'relative' }}>Daily serial</p>
      <h2 className="display" style={{ fontSize: 38, marginTop: 4, position: 'relative' }}>Kiez Chronicles</h2>
      {cur ? <A className="story" onClick={() => openEp(cur)} style={{ marginTop: 12, position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="sticker y" style={{ ['--rot' as string]: '-3deg' }}>{unread ? 'New · ' : ''}Ep. {cur.n}</span>
        <span lang={lang.pack.voice} style={{ flex: 1, fontWeight: 800, fontSize: 18 }}>{cur.title}</span>
        <span className="btn" style={{ minHeight: 40, padding: '0 14px', fontSize: 16 }}>{unread ? 'Read' : 'Again'}</span>
      </A> : <p style={{ position: 'relative', marginTop: 10, fontWeight: 700 }}>No episode yet.</p>}
      <p className="small" style={{ position: 'relative', marginTop: 10, fontWeight: 600, color: 'var(--c-ink-dim)' }}>{status}</p>
      {read.length > 0 && <div role="group" aria-label="Episodes you have read" style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {read.map((e) => <button key={e.id} type="button" className="chip" aria-label={`Episode ${e.n}: ${e.title}`} onClick={() => openEp(e)} style={{ minHeight: 34, padding: '0 10px', fontSize: 14 }}>{e.n}</button>)}
      </div>}
    </div>
  </li>;
}

export function Stories({ lang, go, open, eps, progress, today, openEp }: { lang: Lang; go: (t: Tab) => void; open: (s: Story) => void;
  eps: Episode[]; progress: Progress; today: string; openEp: (e: Episode) => void }) {
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
      {eps.length > 0 && <Chronicles lang={lang} eps={eps} progress={progress} today={today} openEp={openEp} />}
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

/** Single words of the course, for tap-a-word translations (shared with the episode reader). */
export function useGlossary(lang: Lang) {
  return useMemo(() => {
    const g = new Map<string, Item>();
    for (const i of allItems(lang)) { const k = key(nounOnly(i)); if (!k.includes(' ') && !g.has(k)) g.set(k, i); }
    return g;
  }, [lang]);
}

export const TapWords = ({ text, glossary, picked, pick }: { text: string; glossary: Map<string, Item>; picked: string | null; pick: (k: string) => void }) =>
  <>{text.split(' ').map((w, j) => {
    const k = key(w); const known = glossary.has(k);
    return <span key={j}><button type="button" className={'wb' + (known ? ' tap' : '') + (k === picked ? ' sel' : '')}
      onClick={() => { if (known) { pick(k); speak(glossary.get(k)!.target); } }}>{w}</button> </span>;
  })}</>;

export const WordPopover = ({ p, lang, tr, close }: { p: Item; lang: Lang; tr: boolean; close: () => void }) =>
  <div className="pad" style={{ position: 'relative', zIndex: 2, marginBottom: -6 }}>
    <div className="paper rise" role="dialog" aria-label="Word translation" style={{ padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span aria-hidden="true" style={{ fontSize: 38, lineHeight: 1 }}>{p.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p lang={lang.pack.voice} style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag g={p.gender} articles={genderTags(lang.pack)} size={15} />{nounOnly(p)}
        </p>
        {tr && p.translit && <p className="small translit" style={{ color: 'var(--c-ink-dim)' }}>{p.translit}</p>}
        <p style={{ fontWeight: 600, color: 'var(--c-ink-dim)' }}>{p.english}</p>
      </div>
      <button type="button" className="audio" aria-label="Hear the word" onClick={() => speak(p.target)}><Ico d={SPEAKER} /></button>
      <button type="button" className="icon-btn plain" aria-label="Close" onClick={close} style={{ color: 'var(--c-ink)', width: 36 }}><Ico d={CLOSE} /></button>
    </div>
  </div>;

export function Reader({ story, lang, tr, back }: { story: Story; lang: Lang; tr: boolean; back: () => void }) {
  const glossary = useGlossary(lang);
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
            <TapWords text={ln.target} glossary={glossary} picked={picked} pick={setPicked} />
          </p>
          {en && i === line && <p lang="en" className="small" style={{ color: 'var(--c-cyan)', fontWeight: 600, marginTop: 2 }}>{ln.english}</p>}
        </div>)}
    </article>

    {p && <WordPopover p={p} lang={lang} tr={tr} close={() => setPicked(null)} />}

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
