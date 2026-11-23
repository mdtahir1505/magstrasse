import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { Gender, Pack } from './types';

/** An <a> that behaves like a button (the design uses anchors for buttons and links). */
export function A({ onClick, ...p }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> & { onClick: () => void }) {
  return <a href="#" {...p} onClick={(e) => { e.preventDefault(); onClick(); }} />;
}

export const Screen = ({ children }: { children: ReactNode }) =>
  <main className="screen" style={{ width: '100%', maxWidth: 480, height: '100dvh', margin: '0 auto' }}>{children}</main>;

export const Ico = ({ d, fill, style }: { d: string[]; fill?: boolean; style?: React.CSSProperties }) =>
  <svg className={fill ? 'ico fill' : 'ico'} viewBox="0 0 24 24" aria-hidden="true" style={style}>{d.map((x) => <path key={x} d={x} />)}</svg>;

export const SPEAKER = ['M4 9h4l5-4v14l-5-4H4z', 'M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12'];
export const SPEAKER_SM = ['M4 9h4l5-4v14l-5-4H4z', 'M16.5 8.5a5 5 0 0 1 0 7'];
export const CLOSE = ['M6 6l12 12M18 6 6 18'];
export const BACK = ['M15 5l-7 7 7 7'];
export const CHECK = ['M4 12.5 9.5 18 20 6'];

/** What the gender tag shows: articles (de) or labels (ru м/ж/ср). */
export const genderTags = (p: Pack) => p.articles ?? p.genderLabels ?? null;
export const Tag = ({ g, articles, size }: { g: Gender; articles: Record<'m' | 'f' | 'n', string> | null; size: number }) =>
  g && articles ? <span className={`tag ${g}`} style={{ fontSize: size }}>{articles[g]}</span> : null;

export const Flame = ({ grey }: { grey?: boolean }) =>
  <svg className="flame" viewBox="0 0 30 36" aria-hidden="true" style={grey ? { animation: 'none', filter: 'grayscale(1)' } : undefined}>
    <path d="M15 1c3 7 11 11 11 21a11 11 0 0 1-22 0c0-6 3-9 5-13 1.5 3.5 3.5 5 4.5 5 0-5 .5-9 1.5-13z" style={{ fill: 'var(--c-pink)', stroke: 'var(--c-ink)', strokeWidth: 2.2, strokeLinejoin: 'round' }} />
    {!grey && <path d="M15 18c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4.5 3-6.5.6 1.4 1.4 2 2 2z" style={{ fill: 'var(--c-yellow)' }} />}
  </svg>;

export const Drips = ({ d, color }: { d: string; color: string }) =>
  <svg className="drips" viewBox="0 0 350 30" preserveAspectRatio="none" aria-hidden="true"><path d={d} style={{ fill: color }} /></svg>;

export type Tab = 'today' | 'course' | 'stories' | 'talk' | 'me';
const TABS: [Tab, string, string[]][] = [
  ['today', 'Today', ['M13 2 4 14h7l-1 8 9-12h-7z']],
  ['course', 'Course', ['M6 7.5V12a3 3 0 0 0 3 3h6a3 3 0 0 1 3 1.5']],
  ['stories', 'Stories', ['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11']],
  ['talk', 'Talk', ['M4 5h16v11H9l-5 4z']],
  ['me', 'Me', ['M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6']],
];
export const TabBar = ({ tab, go }: { tab: Tab; go: (t: Tab) => void }) =>
  <nav className="tabbar" aria-label="Main">
    {TABS.map(([t, label, d]) =>
      <A key={t} className={'tab' + (t === tab ? ' on' : '')} aria-current={t === tab ? 'page' : undefined} onClick={() => go(t)}>
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          {t === 'course' && <><circle cx="6" cy="5" r="2.5" /><circle cx="18" cy="19" r="2.5" /></>}
          {t === 'me' && <circle cx="12" cy="8" r="4" />}
          {d.map((x) => <path key={x} d={x} />)}
        </svg>{label}
      </A>)}
  </nav>;

/** Noun items carry the article in `target` ("das Wasser"); the gender tag shows it separately. */
export const nounOnly = (i: { target: string; gender: Gender }) => (i.gender ? i.target.replace(/^(der|die|das)\s+/i, '') : i.target);
