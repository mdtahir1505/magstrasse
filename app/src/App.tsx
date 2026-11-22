import { useEffect, useState } from 'react';
import { loadLang, packs } from './content';
import { configureSpeech } from './engine/speech';
import { disableLock, isLockEnabled } from './engine/lock';
import { load, reset, rollDay, save, ymd, type State } from './engine/storage';
import Complete from './screens/Complete';
import Course from './screens/Course';
import Lock from './screens/Lock';
import Me from './screens/Me';
import Onboarding, { type LangOption } from './screens/Onboarding';
import Player, { type Stats } from './screens/Player';
import { Reader, Stories } from './screens/Stories';
import Talk from './screens/Talk';
import Today, { Five } from './screens/Today';
import type { Profile, Story } from './types';
import type { Tab } from './ui';
import { dueIds } from './engine/srs';

type Screen =
  | { s: 'onboard' } | { s: 'tab'; tab: Tab } | { s: 'five' } | { s: 'play'; mode: 'full' | 'five' }
  | { s: 'complete'; stats: Stats } | { s: 'read'; story: Story; fromComplete: boolean };

const FLAGS: Record<string, [string, string, string]> = { de: ['#0a0a0a', '#dd2b2b', '#ffce00'], ru: ['#f3efe4', '#2457d6', '#dd2b2b'] };
const BLURB: Record<string, string> = { de: 'Berlin-ready' };

export default function App() {
  const [state, setState] = useState<State>(() => { const s = load(); rollDay(s.progress); save(s); return s; });
  const [screen, setScreen] = useState<Screen>(() => (state.profile.onboarded ? { s: 'tab', tab: 'today' } : { s: 'onboard' }));
  const [locked, setLocked] = useState(isLockEnabled);
  const { profile: stored, progress } = state;
  const lang = loadLang(stored.language);
  const today = ymd();

  const update = (fn: (s: State) => void) => setState((prev) => { const n = structuredClone(prev); fn(n); save(n); return n; });
  const replace = (s: State) => { save(s); setState(s); setScreen(s.profile.onboarded ? { s: 'tab', tab: 'today' } : { s: 'onboard' }); };

  useEffect(() => { if (lang) configureSpeech(lang.pack.voice, stored.voiceSpeed); }, [lang?.pack.voice, stored.voiceSpeed]);
  useEffect(() => {
    const f = () => { if (!document.hidden) update((s) => rollDay(s.progress)); };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);
  useEffect(() => { // re-lock after more than 60 s in the background
    let hiddenAt = 0;
    const f = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 60_000 && isLockEnabled()) setLocked(true);
    };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);

  if (locked) {
    const forgot = () => {
      if (!window.confirm("There's no PIN recovery: the app has no server. The only way in is to wipe all progress on this phone (words, streak, settings). If you exported a backup, you can import it afterwards. Continue?")) return;
      if (!window.confirm('Really erase everything on this phone?')) return;
      disableLock(); replace(reset(stored.language)); setLocked(false);
    };
    return <Lock mode="unlock" onDone={() => setLocked(false)} onForgot={forgot} />;
  }
  if (!lang) return <main className="screen pad" style={{ height: '100dvh' }}><h1 className="display" style={{ fontSize: 40, marginTop: 40 }}>No content found.</h1></main>;

  const profile: Profile = { language: stored.language, streak: progress.streak, freezesLeft: progress.freezesLeft,
    wordsKnown: Object.keys(progress.cards).length, dailyGoalMin: stored.dailyGoalMin,
    minutesToday: progress.days[today]?.min ?? 0, level: 'A1', streetEnabled: stored.streetEnabled };
  const tab = (t: Tab) => setScreen({ s: 'tab', tab: t });
  const home = () => tab('today');

  if (screen.s === 'onboard') {
    const langs: LangOption[] = [...packs().map((p) => ({ code: p.id, name: p.name, native: p.nativeName, blurb: BLURB[p.id] ?? '', available: true, flag: FLAGS[p.id] ?? FLAGS.de })),
      { code: 'ru', name: 'Russian', native: 'Русский', blurb: 'next up', available: false, flag: FLAGS.ru }];
    return <Onboarding langs={langs} initial={stored} done={(p) => { update((s) => { Object.assign(s.profile, p); }); home(); }} />;
  }
  if (screen.s === 'play')
    return <Player lang={lang} progress={progress} mode={screen.mode} update={update} exit={(stats) => (stats ? setScreen({ s: 'complete', stats }) : home())} />;
  if (screen.s === 'five')
    return <Five dueCount={dueIds(progress.cards).length} back={home} start={() => setScreen({ s: 'play', mode: 'five' })} />;
  if (screen.s === 'complete') {
    const stories = lang.stories;
    return <Complete stats={screen.stats} streak={progress.streak} freezesLeft={progress.freezesLeft} done={home}
      bonus={stories.length ? () => setScreen({ s: 'read', story: stories[Math.floor(Math.random() * stories.length)], fromComplete: true }) : null} />;
  }
  if (screen.s === 'read') return <Reader story={screen.story} lang={lang} back={() => (screen.fromComplete ? home() : tab('stories'))} />;

  switch (screen.tab) {
    case 'course': return <Course lang={lang} progress={progress} go={tab} />;
    case 'stories': return <Stories lang={lang} go={tab} open={(story) => setScreen({ s: 'read', story, fromComplete: false })} />;
    case 'talk': return <Talk go={tab} practise={() => setScreen({ s: 'play', mode: 'full' })} />;
    case 'me': return <Me lang={lang} profile={profile} stored={stored} progress={progress} today={today} update={update} replace={replace} go={tab} />;
    default: return <Today lang={lang} profile={profile} progress={progress} today={today} go={tab}
      start={(mode) => setScreen({ s: 'play', mode })} openFive={() => setScreen({ s: 'five' })} />;
  }
}
