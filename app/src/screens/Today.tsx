import { useState } from 'react';
import { bossReady, currentLesson } from '../engine/session';
import { dueIds } from '../engine/srs';
import type { Progress } from '../engine/storage';
import type { Lang, Profile } from '../types';
import { A, BACK, CLOSE, CHECK, Drips, Flame, Ico, nounOnly, Screen, Tab, TabBar, Tag } from '../ui';

type Props = { lang: Lang; profile: Profile; progress: Progress; today: string; go: (t: Tab) => void; start: (m: 'full' | 'five' | 'one') => void; openFive: () => void;
  speed: () => void; startBoss: (unitId: string) => void; dismissBoss: () => void };
const DRIPS = 'M40 0v14a4 4 0 0 0 8 0V0zM118 0v22a5 5 0 0 0 10 0V0zM205 0v9a3.5 3.5 0 0 0 7 0V0zM288 0v18a4.5 4.5 0 0 0 9 0V0z';
const LABEL = { review: 'Review', new: 'New lesson', speak: 'Listen & speak' };
const TINT = { review: 'var(--c-cyan)', new: 'var(--c-yellow)', speak: 'var(--c-pink)' };
const ROT = ['-4deg', '3deg', '-2deg'];

const Header = ({ lang, profile, frozen, first }: { lang: Lang; profile: Profile; frozen?: boolean; first?: boolean }) =>
  <header className="pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
    <div className="logo"><span className="display">STRASSE</span><span className="marker">{lang.pack.nativeName}</span></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="streak" aria-label={first ? 'No streak yet' : `${profile.streak} day streak`} style={first ? { opacity: 0.9 } : undefined}><Flame grey={first} /><b>{profile.streak}</b></div>
      {!first && <div className={'freeze' + (profile.freezesLeft === 0 ? ' used' : '')} aria-label={frozen ? 'No freezes left this week, refills Monday' : `${profile.freezesLeft} streak freeze left this week`}><span aria-hidden="true">🧊</span>{profile.freezesLeft}</div>}
    </div>
  </header>;

const StartButton = ({ onClick }: { onClick: () => void }) =>
  <div className="drip-wrap"><A className="btn giant block" onClick={onClick}>Start</A><Drips d={DRIPS} color="var(--c-yellow)" /></div>;

export default function Today({ lang, profile, progress, today, go, start, openFive, speed, startBoss, dismissBoss }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const cur = currentLesson(lang, progress);
  const hasCards = Object.keys(progress.cards).length > 0;
  const missed = progress.bannerDay === today && !dismissed;
  const first = !hasCards && !progress.lessonsDone.length;
  const stageLabel = cur ? `Stage ${cur.stageIdx + 1}` : 'Stage 1';
  const unitLabel = cur ? `Unit ${cur.unitIdx + 1}` : 'Unit 1';

  const plan: { name: 'review' | 'new' | 'speak'; minutes: number }[] = [
    ...(hasCards ? [{ name: 'review' as const, minutes: 10 }] : []),
    ...(cur ? [{ name: 'new' as const, minutes: 12 }, { name: 'speak' as const, minutes: 8 }] : []),
  ];
  const goal = profile.dailyGoalMin;
  const done = Math.min(Math.round(profile.minutesToday), goal);
  let acc = 0, nextFound = false;
  const blocks = plan.map((b, i) => {
    acc += b.minutes;
    const isDone = done >= acc;
    const isNext = !isDone && !nextFound;
    if (isNext) nextFound = true;
    return { ...b, n: i + 1, isNext, cls: 'plan-block' + (isDone ? ' done' : isNext ? ' now' : '') };
  });
  const due = dueIds(progress.cards).length;
  const boss = progress.bossDismissed === today ? undefined : bossReady(lang, progress);

  return <Screen>
    <Header lang={lang} profile={profile} frozen={missed} first={first} />

    {first && cur && <>
      <section className="pad" style={{ marginTop: 26, position: 'relative' }}>
        <div className="paper torn tilt" style={{ ['--rot' as string]: '-2deg', padding: '22px 20px 34px', position: 'relative' }}>
          <div className="halftone" aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, width: 120, height: 110, color: 'var(--c-pink)', opacity: 0.55 }} />
          <p className="eyebrow" style={{ position: 'relative' }}>Day one</p>
          <h1 className="display" style={{ fontSize: 56, position: 'relative', marginTop: 6 }}>Fresh<br />wall.</h1>
          <p style={{ position: 'relative', marginTop: 12, fontWeight: 600, fontSize: 17 }}>
            Your first spot: {cur.lesson.title}.{cur.lesson.items[0] && <> You'll say <span className="noun target"><Tag it={cur.lesson.items[0]} pack={lang.pack} size={0} />{nounOnly(cur.lesson.items[0], lang.pack)}</span> out loud in about 15 minutes.</>}
          </p>
        </div>
        <span className="sticker c" style={{ position: 'absolute', right: 30, bottom: -14, ['--rot' as string]: '5deg' }}>0 words · so far</span>
      </section>
      <ol className="blocks pad" style={{ marginTop: 26 }}>
        <li className="plan-block now"><span className="num" style={{ background: 'var(--c-yellow)', ['--rot' as string]: '-4deg' }}>1</span><div style={{ flex: 1 }}><div className="title">New lesson · {cur.lesson.title}</div><div className="sub">~10 min</div></div><span className="sticker y" style={{ ['--rot' as string]: '3deg' }}>Up next</span></li>
        <li className="plan-block"><span className="num" style={{ background: 'var(--c-pink)', ['--rot' as string]: '3deg' }}>2</span><div style={{ flex: 1 }}><div className="title">Listen &amp; speak</div><div className="sub">~5 min</div></div></li>
      </ol>
      <p className="small dim pad" style={{ marginTop: 12 }}>No review today. Nothing to review yet.</p>
      <div className="pad" style={{ marginTop: 'auto', paddingBottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <StartButton onClick={() => start('full')} />
        <p className="statline" style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}><b>0</b>&nbsp;words · {stageLabel} · {unitLabel}</p>
      </div>
    </>}

    {!first && <>
      {missed && <div className="pad rise" style={{ marginTop: 12 }}>
        <div className="banner tilt" role="status" style={{ ['--rot' as string]: '-1deg' }}>
          <span className="big" aria-hidden="true">🧊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>You missed yesterday. Freeze used.</div>
            <div className="small" style={{ color: 'var(--c-ink-dim)' }}>Streak's safe at {profile.streak}. New freeze on Monday.</div>
          </div>
          <button type="button" className="icon-btn plain" aria-label="Dismiss" onClick={() => setDismissed(true)} style={{ color: 'var(--c-ink)' }}><Ico d={CLOSE} /></button>
        </div>
      </div>}

      <section className="pad" style={{ marginTop: missed ? 22 : 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="eyebrow">{missed ? 'Welcome back' : "Today's session"}</p>
        <h1 className="display" style={{ fontSize: 72, display: 'flex', alignItems: 'baseline', gap: 10 }}>{Math.max(goal - done, 0)}<span style={{ fontSize: 34, color: 'var(--c-yellow)' }}>min left</span></h1>
        <div className="bar" role="progressbar" aria-label="Daily goal" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={done}><i style={{ width: `${Math.round((done / goal) * 100)}%` }} /></div>
        <p className="small dim">{missed ? 'Same plan as always. Pick up right where you left off.' : `${done} of ${goal} min · ${blocks.length === 1 ? 'one block' : 'three blocks'}, then you're free`}</p>
      </section>

      <ol className="blocks pad" style={{ marginTop: missed ? 20 : 22 }}>
        {blocks.map((b, i) =>
          <li key={b.name} className={b.cls}>
            <span className="num" style={{ background: TINT[b.name], ['--rot' as string]: ROT[i % 3] }}>{b.n}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{LABEL[b.name]}</div>
              <div className="sub">~{b.minutes} min{b.name === 'review' && due ? ` · ${due} words due` : ''}</div>
            </div>
            {b.isNext && <span className="sticker y" style={{ ['--rot' as string]: '3deg' }}>Up next</span>}
          </li>)}
      </ol>
      {!cur && <p className="small dim pad" style={{ marginTop: 12 }}>That's every lesson so far. Review keeps it fresh.</p>}

      {boss && <div className="pad" style={{ marginTop: 16 }}>
        <div className="paper tilt" role="status" style={{ ['--rot' as string]: '-1deg', padding: '10px 10px 10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--c-pink)' }}>
          <span aria-hidden="true" style={{ fontSize: 30 }}>👹</span>
          <p style={{ flex: 1, minWidth: 0, fontWeight: 800, lineHeight: 1.2 }}>Boss fight ready: <span lang={lang.pack.voice}>{boss.title}</span></p>
          <A className="btn" onClick={() => startBoss(boss.id)} style={{ minHeight: 44, padding: '0 14px', fontSize: 18, background: 'var(--c-yellow)' }}>Fight</A>
          <button type="button" className="icon-btn plain" aria-label="Dismiss boss fight for today" onClick={dismissBoss} style={{ color: 'var(--c-ink)', width: 36 }}><Ico d={CLOSE} /></button>
        </div>
      </div>}

      {Object.keys(progress.cards).length >= 8 && <div className="pad" style={{ marginTop: 14 }}>
        <button type="button" className="chip dark" onClick={speed} style={{ width: '100%', justifyContent: 'space-between', padding: '0 14px', minHeight: 44 }}>
          <span><span aria-hidden="true">⚡</span> Speed round · 60 s</span><span style={{ color: 'var(--c-yellow)' }}>best {progress.speedBest}</span>
        </button>
      </div>}

      {!missed && <p className="statline pad" style={{ marginTop: 16 }}><b>{profile.wordsKnown}</b> words · {stageLabel} · {unitLabel}</p>}

      <div className="pad" style={{ marginTop: 'auto', paddingBottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <StartButton onClick={() => start('full')} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -14 }}>
          <A className="link" onClick={openFive}>Only got 5 minutes?</A>
          <A className="link" onClick={() => start('one')}>Just 1 minute</A>
        </div>
      </div>
    </>}

    {first && !cur && <p className="pad dim" style={{ marginTop: 40 }}>Content is still loading in. Check back soon.</p>}
    <TabBar tab="today" go={go} />
  </Screen>;
}

export function Five({ dueCount, back, start }: { dueCount: number; back: () => void; start: () => void }) {
  const Row = ({ children }: { children: string }) =>
    <li className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px' }}><Ico d={CHECK} style={{ color: 'var(--c-yellow)' }} /><span>{children}</span></li>;
  return <Screen>
    <div className="pad session-top">
      <A className="icon-btn" aria-label="Close" onClick={back}><Ico d={CLOSE} /></A>
      <span className="eyebrow" style={{ flex: 1, textAlign: 'center' }}>5-minute mode</span>
      <span style={{ width: 44 }}></span>
    </div>
    <section className="pad" style={{ marginTop: 30, position: 'relative' }}>
      <span className="marker" style={{ position: 'absolute', left: 26, top: -6, color: 'var(--c-pink)', fontSize: 26, transform: 'rotate(-8deg)' }}>quick hit</span>
      <h1 className="display" style={{ fontSize: 168, lineHeight: 0.85, marginTop: 26, color: 'var(--c-yellow)', textShadow: '6px 6px 0 var(--c-pink)' }}>5:00</h1>
      <p style={{ marginTop: 16, fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{dueCount ? `${Math.min(dueCount, 10)} words you're about to forget. That's it.` : "Five new words to get you started. That's it."}</p>
    </section>
    <ul className="pad" style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Row>Counts for your streak</Row>
      <Row>{dueCount ? 'Review only. No new stuff, no speaking' : 'Just the first words. No pressure'}</Row>
      <Row>Stop whenever. Progress saves per card</Row>
    </ul>
    <div className="foot" style={{ marginTop: 'auto', alignItems: 'center', gap: 22 }}>
      <div className="drip-wrap"><A className="btn giant block" onClick={start} style={{ background: 'var(--c-cyan)' }}>Go</A><Drips d="M52 0v18a4.5 4.5 0 0 0 9 0V0zM160 0v10a3.5 3.5 0 0 0 7 0V0zM262 0v24a5 5 0 0 0 10 0V0z" color="var(--c-cyan)" /></div>
      <A className="link" onClick={back}>Actually, I've got time. Full session</A>
    </div>
  </Screen>;
}

export { BACK };
