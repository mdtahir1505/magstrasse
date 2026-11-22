import { useEffect, useRef, useState } from 'react';
import { lockoutMs, setPin, verifyPin } from '../engine/lock';
import { A, BACK, Ico } from '../ui';

type Props = {
  mode: 'unlock' | 'verify' | 'set';   // unlock = app start, verify = Settings check, set = choose + confirm a new PIN
  onDone: () => void;
  onCancel?: () => void;
  onForgot?: () => void;
};
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'];

export default function Lock({ mode, onDone, onCancel, onForgot }: Props) {
  const [pin, setPinText] = useState('');
  const [first, setFirst] = useState<string | null>(null);   // set mode: the PIN to confirm
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(0);
  const [left, setLeft] = useState(() => Math.ceil(lockoutMs() / 1000));
  const busy = useRef(false);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft(Math.ceil(lockoutMs() / 1000)), 500);
    return () => clearInterval(t);
  }, [left > 0]);
  useEffect(() => { if (left === 0 && msg.startsWith('Too many')) setMsg(''); }, [left]);

  const wrong = (text: string) => { setMsg(text); setShake((n) => n + 1); setPinText(''); };

  const submit = async (p: string) => {
    busy.current = true;
    try {
      if (mode === 'set') {
        if (first === null) { setFirst(p); setPinText(''); setMsg(''); }
        else if (first === p) { await setPin(p); onDone(); }
        else { setFirst(null); wrong("PINs didn't match. Start over."); }
      } else if (await verifyPin(p)) onDone();
      else {
        const ms = lockoutMs();
        setLeft(Math.ceil(ms / 1000));
        wrong(ms > 0 ? 'Too many tries. Wait for the timer.' : 'Falsch. Try again.');
      }
    } finally { busy.current = false; }
  };

  const press = (k: string) => {
    if (busy.current || left > 0) return;
    if (k === '<') { setPinText((p) => p.slice(0, -1)); return; }
    const next = pin + k;
    if (next.length > 4) return;
    setPinText(next); setMsg('');
    if (next.length === 4) void submit(next);
  };

  const pressRef = useRef(press);
  pressRef.current = press;
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) pressRef.current(e.key);
      else if (e.key === 'Backspace') pressRef.current('<');
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  const heading = mode === 'set' ? (first === null ? 'PICK A PIN' : 'ONCE MORE') : 'WER BIST DU?';
  const sub = mode === 'set' ? (first === null ? 'Choose 4 digits' : 'Confirm your PIN') : mode === 'verify' ? 'Enter your current PIN' : 'Enter your PIN';

  return <main className="screen lock" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div className="pad" style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      {onCancel && <div style={{ alignSelf: 'flex-start' }}><A className="icon-btn plain" aria-label="Back" onClick={onCancel}><Ico d={BACK} /></A></div>}
      <div className="logo" style={{ marginTop: onCancel ? 0 : 24 }}><span className="display" style={{ fontSize: 30 }}>STRASSE</span></div>
      <h1 className="display" style={{ fontSize: 52, marginTop: 22, textAlign: 'center' }}>{heading}</h1>
      <p className="dim" style={{ marginTop: 8 }}>{sub}</p>

      <div key={shake} className={'pin-dots' + (shake ? ' shake' : '')} role="img" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => <i key={i} className={i < pin.length ? 'on' : ''} />)}
      </div>
      <p className="lock-msg small" role="status" aria-live="polite">
        {left > 0 ? <span className="sticker p">Locked · {left >= 60 ? `${Math.floor(left / 60)}m ${left % 60}s` : `${left}s`}</span> : msg && <b style={{ color: 'var(--c-pink)' }}>{msg}</b>}
      </p>

      <div className="keypad">
        {KEYS.map((k, i) => k === '' ? <span key={i} /> :
          <button key={i} type="button" className="key" disabled={left > 0} aria-label={k === '<' ? 'Delete' : undefined} onClick={() => press(k)}>{k === '<' ? '⌫' : k}</button>)}
      </div>

      {mode === 'unlock' && onForgot && <button type="button" className="link" style={{ marginTop: 14, background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }} onClick={onForgot}>Forgot PIN?</button>}
    </div>
  </main>;
}
