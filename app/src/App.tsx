import { useEffect, useState } from 'react';
import { loadLang } from './content';
import { langChoices, serialOf, showTranslit } from './engine/langs';
import { newStickers, type Sticker } from './engine/stickers';
import { configureSpeech } from './engine/speech';
import { disableLock, isLockEnabled } from './engine/lock';
import { localize, regionOf } from './engine/variants';
import { load, reset, rollDay, save, setLanguage, ymd, type State } from './engine/storage';
import Complete from './screens/Complete';
import Course from './screens/Course';
import Lock from './screens/Lock';
import Me from './screens/Me';
import Onboarding, { type LangOption } from './screens/Onboarding';
import Player, { type Stats } from './screens/Player';
import EpisodeReader from './screens/Serial';
import Speed, { SPEED_MIN_WORDS } from './screens/Speed';
import { Peel } from './screens/Stickers';
import { Reader, Stories } from './screens/Stories';
import Talk from './screens/Talk';
import Today, { Five } from './screens/Today';
import type { Episode, Profile, Story } from './types';
import type { Tab } from './ui';
import { dueIds } from './engine/srs';

type Screen =
  | { s: 'onboard' } | { s: 'tab'; tab: Tab } | { s: 'five' } | { s: 'play'; mode: 'full' | 'five' | 'one' | 'boss'; unit?: string; n: number } | { s: 'speed' }
  | { s: 'complete'; stats: Stats } | { s: 'read'; story: Story; fromComplete: boolean } | { s: 'episode'; ep: Episode; fromComplete: boolean };

const FLAGS: Record<string, [string, string, string]> = { de: ['#0a0a0a', '#dd2b2b', '#ffce00'], ru: ['#f3efe4', '#2457d6', '#dd2b2b'], es: ['#c60b1e', '#ffc400', '#c60b1e'] };
const BLURB: Record<string, string> = { de: 'Berlin-ready', ru: 'Cyrillic, step by step' };

export default function App() {
  const [state, setState] = useState<State>(() => { const s = load(); rollDay(s.progress); save(s); return s; });
  const [screen, setScreen] = useState<Screen>(() => (state.profile.onboarded ? { s: 'tab', tab: 'today' } : { s: 'onboard' }));
  const [locked, setLocked] = useState(isLockEnabled);
  const [peel, setPeel] = useState<Sticker[]>([]); // new stickers waiting for their "peel" card
  const [ended, setEnded] = useState(false);       // a boss fight / speed round has reached its result screen
  const { profile: stored, progress } = state;
  const raw = loadLang(stored.language);
  const lang = raw && localize(raw, progress.region);
  const voice = lang && (regionOf(lang.pack, progress.region)?.voice ?? lang.pack.voice);
  const today = ymd();

  const update = (fn: (s: State) => void) => setState((prev) => { const n = structuredClone(prev); fn(n); save(n); return n; });
  const replace = (s: State) => { save(s); setState(s); show(s.profile.onboarded ? { s: 'tab', tab: 'today' } : { s: 'onboard' }); };
  const show = (s: Screen) => { setEnded(false); setScreen(s); };

  useEffect(() => { if (voice) configureSpeech(voice, stored.voiceSpeed); }, [voice, stored.voiceSpeed]);
  useEffect(() => { // grant stickers whose rule now holds, and queue the peel card (not mid-session)
    if (!lang || locked || screen.s === 'onboard' || ((screen.s === 'play' || screen.s === 'speed') && !ended) || screen.s === 'read' || screen.s === 'episode') return;
    const fresh = newStickers(lang, progress, stored.stickers);
    if (!fresh.length) return;
    update((s) => { for (const f of fresh) if (!s.profile.stickers.some((x) => x.id === f.id)) s.profile.stickers.push({ id: f.id, at: today }); });
    setPeel((q) => [...q, ...fresh]);
  }, [progress, stored.stickers, screen, ended, locked]);
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
  const tr = showTranslit(lang, stored.translit, progress);
  const eps = serialOf(lang.pack.id);
  const learned = Object.keys(progress.cards).length;
  const speed = learned >= SPEED_MIN_WORDS ? () => show({ s: 'speed' }) : null;
  const openEp = (ep: Episode, fromComplete = false) => { update((s) => { s.progress.serialSeen = Math.max(s.progress.serialSeen, ep.n); }); show({ s: 'episode', ep, fromComplete }); };
  const startBoss = (unit: string) => show({ s: 'play', mode: 'boss', unit, n: Date.now() });
  const tab = (t: Tab) => show({ s: 'tab', tab: t });
  const home = () => tab('today');
  const peelCard = peel.length ? <Peel list={peel} close={() => setPeel(peel.slice(1))} /> : null;

  if (screen.s === 'onboard') {
    const langs: LangOption[] = langChoices().map((l) => ({ ...l, blurb: l.available ? l.tagline ?? BLURB[l.code] ?? '' : 'next up', flag: FLAGS[l.code] ?? FLAGS.de }));
    return <Onboarding langs={langs} initial={stored} done={(p) => { update((s) => { const { language, ...rest } = p; Object.assign(s.profile, rest); if (language && language !== s.profile.language) setLanguage(s, language); }); home(); }} />;
  }
  if (screen.s === 'play')
    return <><Player key={screen.n} lang={lang} progress={progress} mode={screen.mode} unitId={screen.unit} tr={tr} eps={eps} update={update} onEnd={() => setEnded(true)}
      retry={() => show({ ...screen, n: Date.now() })} exit={(stats) => (stats ? show({ s: 'complete', stats }) : home())} />{ended && peelCard}</>;
  if (screen.s === 'speed')
    return <><Speed lang={lang} progress={progress} tr={tr} eps={eps} update={update} onEnd={() => setEnded(true)} exit={home} />{ended && peelCard}</>;
  if (screen.s === 'five')
    return <Five dueCount={dueIds(progress.cards).length} back={home} start={() => show({ s: 'play', mode: 'five', n: Date.now() })} />;
  if (screen.s === 'complete') {
    const stories = lang.stories;
    const episode = eps.find((e) => e.n === progress.serialUnlocked && progress.serialUnlockedOn === today && progress.serialSeen < e.n) ?? null;
    return <><Complete stats={screen.stats} streak={progress.streak} freezesLeft={progress.freezesLeft} done={home} voice={lang.pack.voice}
      episode={episode} read={() => episode && openEp(episode, true)} speed={speed}
      bonus={stories.length ? () => show({ s: 'read', story: stories[Math.floor(Math.random() * stories.length)], fromComplete: true }) : null} />{peelCard}</>;
  }
  if (screen.s === 'read') return <Reader story={screen.story} lang={lang} tr={tr} back={() => (screen.fromComplete ? home() : tab('stories'))} />;
  if (screen.s === 'episode') return <EpisodeReader ep={screen.ep} lang={lang} tr={tr} back={() => (screen.fromComplete ? home() : tab('stories'))} />;

  const page = (() => { switch (screen.tab) {
    case 'course': return <Course lang={lang} progress={progress} go={tab} startBoss={startBoss} />;
    case 'stories': return <Stories lang={lang} go={tab} open={(story) => show({ s: 'read', story, fromComplete: false })} eps={eps} progress={progress} today={today} openEp={openEp} />;
    case 'talk': return <Talk go={tab} practise={() => show({ s: 'play', mode: 'full', n: Date.now() })} />;
    case 'me': return <Me lang={lang} profile={profile} stored={stored} progress={progress} today={today} update={update} replace={replace} go={tab} tr={tr} speed={speed} />;
    default: return <Today lang={lang} profile={profile} progress={progress} today={today} go={tab} speed={() => show({ s: 'speed' })} startBoss={startBoss}
      dismissBoss={() => update((s) => { s.progress.bossDismissed = today; })}
      start={(mode) => show({ s: 'play', mode, n: Date.now() })} openFive={() => show({ s: 'five' })} />;
  } })();
  return <>{page}{peelCard}</>;
}
