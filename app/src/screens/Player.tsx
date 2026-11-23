import { useRef, useState } from 'react';
import Build from '../exercises/Build';
import Dialogue from '../exercises/Dialogue';
import Feedback from '../exercises/Feedback';
import Fill from '../exercises/Fill';
import Intro from '../exercises/Intro';
import ListenPick from '../exercises/ListenPick';
import Say from '../exercises/Say';
import Shadow from '../exercises/Shadow';
import TypeIt from '../exercises/TypeIt';
import { buildSession } from '../engine/session';
import { finishSession } from '../engine/serial';
import { grade, introduce } from '../engine/srs';
import { addMinutes, type Progress, type State } from '../engine/storage';
import { stopSpeaking } from '../engine/speech';
import type { Episode, Lang, Result } from '../types';
import { A, CLOSE, Ico, Screen } from '../ui';

export type Stats = { minutes: number; newWords: number; reviewed: number; streakBefore: number };
const BLOCK = { review: 'Review', new: 'New lesson', speak: 'Listen & speak', boss: 'Boss fight' };
const MAX_GAP_MS = 120_000; // idle time past 2 min per exercise is not practice

export default function Player({ lang, progress, mode, unitId = '', tr, eps, update, exit, onEnd, retry }: {
  lang: Lang; progress: Progress; mode: 'full' | 'five' | 'one' | 'boss'; unitId?: string; tr: boolean; eps: Episode[];
  update: (fn: (s: State) => void) => void; exit: (stats: Stats | null) => void; onEnd: () => void; retry: () => void;
}) {
  const boss = mode === 'boss';
  const [built] = useState(() => buildSession(lang, progress, mode, unitId));
  const [lives, setLives] = useState(3);
  const [end, setEnd] = useState<null | 'won' | 'lost'>(null);
  const session = built.session; // mutated in place when a wrong answer is re-queued
  const [pos, setPos] = useState({ block: 0, exercise: 0 });
  const [fb, setFb] = useState<{ res: Result; requeued: boolean } | null>(null);
  const clock = useRef({ last: Date.now(), ms: 0 });
  const counts = useRef({ newWords: 0, reviewed: 0 });
  const streakBefore = useRef(progress.streak);

  const tick = () => { const n = Date.now(); clock.current.ms += Math.min(n - clock.current.last, MAX_GAP_MS); clock.current.last = n; };

  if (end) {
    const unit = lang.stages.flatMap((s) => s.units).find((u) => u.id === unitId);
    return <Screen>
      <div className="pad session-top"><A className="icon-btn" aria-label="Close" onClick={() => exit(null)}><Ico d={CLOSE} /></A></div>
      <section className="pad" style={{ marginTop: 40, textAlign: 'center' }}>
        <p lang={lang.pack.voice} className="marker" style={{ fontSize: 28, color: 'var(--c-cyan)' }}>{unit?.title}</p>
        {end === 'won'
          ? <><h1 className="display boss-stamp" role="status" style={{ marginTop: 40 }}>Boss down</h1>
              <p style={{ marginTop: 34, fontSize: 19, fontWeight: 700 }}>Unit cleared. {lives === 3 ? 'Not a scratch.' : `${lives} ${lives === 1 ? 'life' : 'lives'} to spare.`}</p></>
          : <><h1 className="display" style={{ fontSize: 72, marginTop: 40, color: 'var(--c-pink)' }}>Knocked out.</h1>
              <p style={{ marginTop: 18, fontSize: 19, fontWeight: 700 }}>Retry anytime. No penalty, nothing lost.</p></>}
      </section>
      <div className="foot" style={{ marginTop: 'auto' }}>
        {end === 'lost' && <button type="button" className="btn block" onClick={retry}>Retry</button>}
        <button type="button" className={'btn block' + (end === 'lost' ? ' ghost' : '')} onClick={() => exit(null)}>Back to Today</button>
      </div>
    </Screen>;
  }

  if (!session.blocks.length) {
    return <Screen>
      <div className="pad session-top"><A className="icon-btn" aria-label="Close" onClick={() => exit(null)}><Ico d={CLOSE} /></A></div>
      <section className="pad" style={{ marginTop: 40 }}>
        <h1 className="display" style={{ fontSize: 52 }}>All caught up.</h1>
        <p className="dim" style={{ marginTop: 12 }}>No review due and no lessons left. Come back tomorrow.</p>
      </section>
    </Screen>;
  }

  const block = session.blocks[pos.block];
  const ex = block.exercises[pos.exercise];

  const complete = () => {
    tick();
    if (boss) {
      update((s) => { if (!s.progress.bossesBeaten.includes(unitId)) s.progress.bossesBeaten.push(unitId); finishSession(s.progress, eps, clock.current.ms / 60000); });
      setEnd('won'); onEnd();
      return;
    }
    const minutes = Math.max(clock.current.ms / 60000, mode === 'one' ? 1 : 5); // a finished session counts as at least 5 min (1-minute mode: 1)
    update((s) => finishSession(s.progress, eps, minutes));
    exit({ minutes: Math.round(minutes), ...counts.current, streakBefore: streakBefore.current });
  };
  const close = () => {
    tick(); stopSpeaking();
    if (clock.current.ms > 3000) update((s) => addMinutes(s.progress, clock.current.ms / 60000));
    exit(null);
  };
  const advance = () => {
    tick(); stopSpeaking(); setFb(null);
    if (boss && lives <= 0) { // knocked out: the time still counts, the boss stays
      if (clock.current.ms > 3000) update((s) => addMinutes(s.progress, clock.current.ms / 60000));
      setEnd('lost'); onEnd();
      return;
    }
    if (pos.exercise + 1 < block.exercises.length) return setPos({ ...pos, exercise: pos.exercise + 1 });
    if (block.name === 'new' && built.lessonId) {
      const id = built.lessonId;
      update((s) => { if (!s.progress.lessonsDone.includes(id)) s.progress.lessonsDone.push(id); });
    }
    if (pos.block + 1 < session.blocks.length) setPos({ block: pos.block + 1, exercise: 0 });
    else complete();
  };

  const onDone = (res: Result | null) => {
    if (ex.kind === 'intro') {
      update((s) => introduce(s.progress.cards, ex.item.id));
      counts.current.newWords++;
      return advance();
    }
    if (!res) return advance();
    const id = 'itemId' in ex ? ex.itemId : undefined;
    if (id && !ex.retry) {
      update((s) => grade(s.progress.cards, id, res.correct));
      if (block.name === 'review') counts.current.reviewed++;
    }
    let requeued = false;
    if (boss) { if (!res.correct) setLives(lives - 1); }
    else if (!res.correct && !ex.retry) {
      block.exercises.splice(Math.min(pos.exercise + 4, block.exercises.length), 0, { ...ex, retry: true });
      requeued = true;
    }
    if (res.silent) advance(); else setFb({ res, requeued });
  };

  const total = session.blocks.reduce((a, b) => a + b.exercises.length, 0);
  const at = session.blocks.slice(0, pos.block).reduce((a, b) => a + b.exercises.length, 0) + pos.exercise + 1;
  const props = { pack: lang.pack, tr, done: onDone };
  const key = `${pos.block}-${pos.exercise}`;

  return <Screen>
    <div className="pad session-top">
      <A className="icon-btn" aria-label="End session" onClick={close}><Ico d={CLOSE} /></A>
      <div className="segbar" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={at}>
        {session.blocks.map((b, i) => {
          const n = b.exercises.length;
          const d = i < pos.block ? n : i === pos.block ? pos.exercise : 0;
          return <div key={i} className={'bar' + (d === n ? ' done' : '')} style={{ ['--w' as string]: n }}><i style={{ width: `${Math.round((d / n) * 100)}%` }} /></div>;
        })}
      </div>
      {boss && <span className="lives" role="img" aria-label={`${lives} of 3 lives left`}>{[0, 1, 2].map((i) => <i key={i} className={i < lives ? 'on' : ''}>♥</i>)}</span>}
      <span className="count">{at}/{total}</span>
    </div>
    {ex.kind === 'dialogue'
      ? <div className="pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <p className="block-label">{BLOCK[block.name]}</p>
          <span className="sticker c" style={{ ['--rot' as string]: '3deg' }}>Scene: {ex.scene}</span>
        </div>
      : <p className="block-label pad" style={{ marginTop: 4 }}>{BLOCK[block.name]}{ex.kind === 'intro' ? ' · new word' : ''}</p>}

    {ex.kind === 'intro' && <Intro key={key} ex={ex} {...props} />}
    {ex.kind === 'listenPick' && <ListenPick key={key} ex={ex} {...props} />}
    {ex.kind === 'build' && <Build key={key} ex={ex} {...props} />}
    {ex.kind === 'type' && <TypeIt key={key} ex={ex} {...props} />}
    {ex.kind === 'say' && <Say key={key} ex={ex} {...props} />}
    {ex.kind === 'fill' && <Fill key={key} ex={ex} {...props} />}
    {ex.kind === 'dialogue' && <Dialogue key={key} ex={ex} {...props} />}
    {ex.kind === 'shadow' && <Shadow key={key} ex={ex} {...props} />}

    {fb && <Feedback res={fb.res} pack={lang.pack} requeued={fb.requeued} onContinue={advance} />}
  </Screen>;
}
