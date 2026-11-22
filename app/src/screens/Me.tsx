import { useState } from 'react';
import { flatLessons } from '../content';
import { addDays, dayDiff, type Progress, type State, type StoredProfile } from '../engine/storage';
import type { Lang, Profile } from '../types';
import { Screen, Tab, TabBar } from '../ui';
import Settings from './Settings';
import Street from './Street';
import WordBank from './WordBank';

export type MeProps = { lang: Lang; profile: Profile; stored: StoredProfile; progress: Progress; today: string;
  update: (fn: (s: State) => void) => void; replace: (s: State) => void; go: (t: Tab) => void };
export type Sub = 'stats' | 'words' | 'street' | 'settings';

export default function Me(p: MeProps) {
  const [sub, setSub] = useState<Sub>('stats');
  const street = p.profile.streetEnabled;
  const cur = sub === 'street' && !street ? 'stats' : sub;
  const tabs: [Sub, string][] = [['stats', 'Stats'], ['words', 'Word bank'], ...(street ? [['street', `Street ${p.lang.pack.name}`] as [Sub, string]] : []), ['settings', 'Settings']];
  return <Screen>
    <header className="pad" style={{ paddingTop: 8 }}>
      <h1 className="display" style={{ fontSize: 48 }}>Me</h1>
      <nav className="subnav" aria-label="Me sections" style={{ marginTop: 10 }}>
        {tabs.map(([s, label]) =>
          <a key={s} href="#" className={s === cur ? 'on' : undefined} aria-current={s === cur ? 'page' : undefined} onClick={(e) => { e.preventDefault(); setSub(s); }}>{label}</a>)}
      </nav>
    </header>
    {cur === 'stats' && <Stats {...p} />}
    {cur === 'words' && <WordBank {...p} />}
    {cur === 'street' && <Street {...p} />}
    {cur === 'settings' && <Settings {...p} />}
    <TabBar tab="me" go={p.go} />
  </Screen>;
}

function Stats({ lang, profile, progress, today }: MeProps) {
  const mins = Array.from({ length: 14 }, (_, i) => Math.round(progress.days[addDays(today, i - 13)]?.min ?? 0));
  const PLOT = 128, max = Math.max(45, ...mins);
  const scale = (m: number) => Math.round((m / max) * (PLOT - 10));
  const goalH = scale(profile.dailyGoalMin);
  const letter = (i: number) => 'SMTWTFS'[new Date(Date.parse(addDays(today, i - 13))).getUTCDay()];

  const all = flatLessons(lang);
  const lp = all.length ? (progress.lessonsDone.length / all.length) / 3 : 0; // stage 1 fills the A1 third
  const a2pct = Math.round(Math.min(Math.max((lp - 1 / 3) * 3, 0), 1) * 100);

  const monday = addDays(today, -((new Date(Date.parse(today)).getUTCDay() + 6) % 7) - 21);
  const cal = Array.from({ length: 28 }, (_, i) => {
    const d = addDays(monday, i), rec = progress.days[d];
    return dayDiff(today, d) > 0 ? 'future' : rec?.freeze ? 'freeze' : (rec?.min ?? 0) >= 5 ? 'done' : 'miss';
  });
  const H2 = { fontWeight: 800, fontSize: 17 } as const;

  return <div className="grow scroll pad" style={{ paddingTop: 16, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
      <div className="paper tilt" style={{ ['--rot' as string]: '-2deg', padding: '12px 14px' }}><p className="display" style={{ fontSize: 52 }}>{profile.wordsKnown}</p><p style={{ fontWeight: 700 }}>words known</p></div>
      <div className="paper tilt" style={{ ['--rot' as string]: '1.5deg', padding: '12px 14px', background: 'var(--c-pink)' }}><p className="display" style={{ fontSize: 52 }}>{profile.streak}</p><p style={{ fontWeight: 700 }}>day streak</p></div>
    </div>

    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={H2}>Minutes per day</h2>
        <p className="small dim">last 14 days · avg {Math.round(mins.reduce((a, b) => a + b, 0) / 14)} min</p>
      </div>
      <div role="img" aria-label={`Minutes per day over the last 14 days. Today ${mins[13]} minutes so far; goal ${profile.dailyGoalMin}.`} style={{ position: 'relative', height: 150, marginTop: 12, display: 'flex', gap: 5, alignItems: 'flex-end', paddingBottom: 16 }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 16 + goalH, borderTop: '2px dashed var(--c-pink)' }} />
        <span aria-hidden="true" className="sticker p" style={{ position: 'absolute', right: -4, bottom: 20 + goalH, ['--rot' as string]: '3deg', fontSize: 10, padding: '2px 6px' }}>goal {profile.dailyGoalMin}</span>
        {mins.map((m, i) =>
          <div key={i} className="col"><i className={m === 0 ? 'zero' : i === 13 ? 'today' : ''} style={{ height: scale(m) }}></i><span>{i === 13 ? 'now' : letter(i)}</span></div>)}
      </div>
    </section>

    <section>
      <h2 style={H2}>Level estimate</h2>
      <div style={{ marginTop: 12, position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4 }}>
          <div className="bar" style={{ height: 18, borderRadius: 4 }}><i style={{ width: `${Math.round(Math.min(lp * 3, 1) * 100)}%` }} /></div>
          <div className="bar" style={{ height: 18, borderRadius: 4 }}><i style={{ width: `${a2pct}%` }} /></div>
          <div className="bar" style={{ height: 18, borderRadius: 4 }}><i style={{ width: '0%' }} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 6 }}>
          <span className="display" style={{ fontSize: 22, color: 'var(--c-yellow)' }}>A1</span>
          <span className="display" style={{ fontSize: 22 }}>A2</span>
          <span className="display" style={{ fontSize: 22, color: 'var(--c-text-dim)' }}>B1</span>
        </div>
        <p className="small dim" style={{ marginTop: 4 }}>{progress.lessonsDone.length} of {all.length} lessons down. Keep going.</p>
      </div>
    </section>

    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={H2}>Streak history</h2>
        <p className="small dim">best: {progress.bestStreak} days</p>
      </div>
      <div className="cal" role="img" aria-label="Last four weeks: yellow days practised, blue days covered by a freeze" style={{ marginTop: 12 }}>
        {cal.map((c, i) => <i key={i} className={c}>{c === 'freeze' ? '🧊' : ''}</i>)}
      </div>
      <div className="small dim" style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--c-yellow)', borderRadius: 2 }}></span> practised</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--c-ice)', borderRadius: 2 }}></span> freeze</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, border: '2px dashed var(--c-line)', borderRadius: 2 }}></span> rest day</span>
      </div>
    </section>
  </div>;
}
