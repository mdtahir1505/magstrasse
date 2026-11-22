import { useState } from 'react';
import { lockAvailable } from '../engine/lock';
import Lock from './Lock';
import type { StoredProfile } from '../engine/storage';
import { A, BACK, CHECK, Ico, Screen } from '../ui';

export type LangOption = { code: string; name: string; native: string; blurb: string; available: boolean; flag: [string, string, string] };

const REASONS = [
  { id: 'travel', label: 'Travel', emoji: '✈️' }, { id: 'people', label: 'Friends & partner', emoji: '💬' },
  { id: 'work', label: 'Work', emoji: '💼' }, { id: 'fun', label: 'Just because', emoji: '🤘' },
];
const ROT = ['-2deg', '2deg', '1.5deg', '-2.5deg'];
const GOALS: Record<number, [string, string]> = {
  5: ['Snack', 'One quick block. Better than zero.'], 15: ['Casual', 'Review + a few new words.'],
  30: ['Serious', 'Full session: review, new, speak.'], 45: ['Obsessed', 'Full session plus a bonus round.'],
};
const PRESETS: [string, string][] = [['08:00', 'Breakfast'], ['12:30', 'Lunch'], ['19:00', 'After work'], ['22:00', 'In bed']];

function Top({ step, back }: { step: number; back?: () => void }) {
  return <div className="pad session-top">
    {back && <A className="icon-btn plain" aria-label="Back" onClick={back}><Ico d={BACK} /></A>}
    <div className="segbar" aria-label={`Step ${step} of 4`}>
      {[1, 2, 3, 4].map((n) => <div key={n} className="bar thin"><i style={{ width: n <= step ? '100%' : '0%' }} /></div>)}
    </div>
    <span className="count">{step}/4</span>
  </div>;
}

export default function Onboarding({ langs, initial, done }: { langs: LangOption[]; initial: StoredProfile; done: (p: Partial<StoredProfile>) => void }) {
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState(initial.language);
  const [reason, setReason] = useState(initial.reason);
  const [goal, setGoal] = useState(initial.dailyGoalMin);
  const [time, setTime] = useState(initial.reminder);
  const [street, setStreet] = useState(initial.streetEnabled);
  const [pinning, setPinning] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const next = () => setStep(step + 1);
  const back = () => setStep(step - 1);
  const langName = langs.find((l) => l.code === lang)?.name ?? '';

  if (pinning) return <Lock mode="set" onCancel={() => setPinning(false)} onDone={() => { setPinSet(true); setPinning(false); }} />;

  return <Screen>
    {step === 1 && <>
      <Top step={1} />
      <section className="pad" style={{ marginTop: 28, position: 'relative' }}>
        <div className="logo" style={{ marginBottom: 26 }}><span className="display" style={{ fontSize: 44 }}>STRASSE</span><span className="marker" style={{ fontSize: 20, right: -28, top: -18 }}>hallo!</span></div>
        <h1 className="display" style={{ fontSize: 52 }}>What are we<br /><span style={{ color: 'var(--c-yellow)' }}>learning?</span></h1>
        <p className="dim" style={{ marginTop: 12 }}>Pick one. You can add more later.</p>
      </section>
      <ul className="pad" style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {langs.map((l) => {
          const on = l.available && lang === l.code;
          return <li key={l.code}>
            <button type="button" className={(on ? 'paper' : 'card') + (l.available ? '' : ' tilt')} onClick={() => l.available && setLang(l.code)} disabled={!l.available} aria-pressed={on}
              style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: 18, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--f-body)' }}>
              <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', width: 52, height: 38, border: '2px solid var(--c-ink)', borderRadius: 4, overflow: 'hidden', flex: 'none' }}>
                {l.flag.map((c, i) => <i key={i} style={{ flex: 1, background: c }} />)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="display" style={{ display: 'block', fontSize: 32 }}>{l.native}</span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{l.name} · {l.blurb}</span>
              </span>
              {!l.available && <span className="sticker p" style={{ ['--rot' as string]: '8deg', position: 'absolute', right: 14, top: -12 }}>Coming soon</span>}
              {on && <Ico d={CHECK} style={{ width: 30, height: 30, strokeWidth: 3 }} />}
            </button>
          </li>;
        })}
      </ul>
    </>}

    {step === 2 && <>
      <Top step={2} back={back} />
      <section className="pad" style={{ marginTop: 30 }}>
        <p className="eyebrow">No wrong answers</p>
        <h1 className="display" style={{ fontSize: 52, marginTop: 10 }}>Why are you<br /><span style={{ color: 'var(--c-pink)' }}>learning?</span></h1>
        <p className="dim" style={{ marginTop: 12 }}>We'll pick example sentences that fit.</p>
      </section>
      <ul className="pad" style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
        {REASONS.map((r, i) =>
          <li key={r.id}>
            <button type="button" className={r.id === reason ? 'paper tilt' : 'card'} aria-pressed={r.id === reason} onClick={() => setReason(r.id)}
              style={{ ['--rot' as string]: ROT[i % 4], width: '100%', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--f-body)', transition: 'transform 90ms ease' }}>
              <span aria-hidden="true" style={{ fontSize: 44, lineHeight: 1 }}>{r.emoji}</span>
              <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{r.label}</span>
            </button>
          </li>)}
      </ul>
    </>}

    {step === 3 && <>
      <Top step={3} back={back} />
      <section className="pad" style={{ marginTop: 30 }}>
        <p className="eyebrow">Daily goal</p>
        <h1 className="display" style={{ fontSize: 52, marginTop: 10 }}>How long<br />per <span style={{ color: 'var(--c-cyan)' }}>day?</span></h1>
        <p className="dim" style={{ marginTop: 12 }}>Change it any time. Nobody's counting but you.</p>
      </section>
      <div className="pad" role="radiogroup" aria-label="Minutes per day" style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[5, 15, 30, 45].map((min) =>
          <button key={min} type="button" role="radio" aria-checked={goal === min} className={'opt' + (goal === min ? ' sel' : '')} onClick={() => setGoal(min)} style={{ position: 'relative' }}>
            <span className="display" style={{ fontSize: 40, width: 64, lineHeight: 1 }}>{min}</span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800 }}>{GOALS[min][0]} · {min} min</span>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.8 }}>{GOALS[min][1]}</span>
            </span>
            {min === 30 && <span className="sticker p" style={{ ['--rot' as string]: '6deg', position: 'absolute', right: -6, top: -12 }}>Recommended</span>}
          </button>)}
      </div>
    </>}

    {step === 4 && <>
      <Top step={4} back={back} />
      <section className="pad" style={{ marginTop: 30 }}>
        <p className="eyebrow">Last one</p>
        <h1 className="display" style={{ fontSize: 52, marginTop: 10 }}>When should<br />we <span style={{ color: 'var(--c-yellow)' }}>nudge</span> you?</h1>
      </section>
      <div className="pad" style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="paper tilt" style={{ ['--rot' as string]: '-1deg', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 16px 10px' }}>
          <span className="eyebrow">Daily reminder</span>
          <input className="time field" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ background: 'transparent', border: 0, color: 'var(--c-ink)', minHeight: 80, padding: 0, boxShadow: 'none' }} />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(([t, label]) => <button key={t} type="button" className={'chip dark' + (t === time ? ' sel' : '')} onClick={() => setTime(t)}>{label} · {t}</button>)}
        </div>
        <p className="small dim">One ping. No guilt trips, no "we miss you" spam.</p>
      </div>
      <div className="pad" style={{ marginTop: 26 }}>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center', borderColor: 'var(--c-pink)', position: 'relative' }}>
          <span className="sticker p" style={{ ['--rot' as string]: '-6deg', position: 'absolute', left: 12, top: -13 }}>18+</span>
          <div style={{ flex: 1, paddingTop: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Street {langName}</div>
            <div className="small dim">Slang &amp; swearing. The words textbooks skip.</div>
          </div>
          <label className="switch"><input type="checkbox" aria-label={`Enable Street ${langName} (18+)`} checked={street} onChange={(e) => setStreet(e.target.checked)} /><span></span></label>
        </div>
      </div>
      {lockAvailable() && <div className="pad" style={{ marginTop: 18 }}>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Lock it with a PIN?</div>
            <div className="small dim">Optional. Change it later in Settings.</div>
          </div>
          {pinSet ? <span className="sticker y">PIN set</span> : <button type="button" className="chip dark" style={{ minHeight: 44 }} onClick={() => setPinning(true)}>Set PIN</button>}
        </div>
      </div>}
    </>}

    <div className="foot" style={{ marginTop: 'auto' }}>
      {step < 4
        ? <button type="button" className="btn block" onClick={next}>Next</button>
        : <button type="button" className="btn block" onClick={() => done({ language: lang, reason, dailyGoalMin: goal, reminder: time, streetEnabled: street, onboarded: true })}>Let's go</button>}
    </div>
  </Screen>;
}
