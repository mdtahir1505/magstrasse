import type { Card } from 'ts-fsrs';
import { reviveCard } from './srs';

export type StoredProfile = { onboarded: boolean; language: string; reason: string; dailyGoalMin: number;
  reminder: string; voiceSpeed: number; streetEnabled: boolean; lastBackup: string;
  translit: 'auto' | 'always' | 'never'; stickers: { id: string; at: string }[] };
export type Progress = { cards: Record<string, Card>; lessonsDone: string[];
  days: Record<string, { min: number; freeze?: boolean; done?: boolean }>;
  streak: number; bestStreak: number; freezesLeft: number; freezeWeek: string; lastDay: string; bannerDay: string;
  bossesBeaten: string[]; bossDismissed: string; speedBest: number; speedPlays: number;
  serialSeen: number; serialUnlocked: number; serialUnlockedOn: string };
export type State = { profile: StoredProfile; progress: Progress };

const PROFILE_KEY = 'strasse:profile';
const progressKey = (lang: string) => `strasse:${lang}:progress`;
// The streak belongs to the profile, not the language: these fields live in one shared key and overlay every language's progress.
const SHARED_KEY = 'strasse:shared';
const SHARED = ['days', 'streak', 'bestStreak', 'freezesLeft', 'freezeWeek', 'lastDay', 'bannerDay'] as const;

export const defaultProfile = (): StoredProfile => ({ onboarded: false, language: 'de', reason: 'people', dailyGoalMin: 30,
  reminder: '19:00', voiceSpeed: 0.9, streetEnabled: false, lastBackup: '', translit: 'auto', stickers: [] });
export const emptyProgress = (): Progress => ({ cards: {}, lessonsDone: [], days: {}, streak: 0, bestStreak: 0,
  freezesLeft: 1, freezeWeek: '', lastDay: '', bannerDay: '',
  bossesBeaten: [], bossDismissed: '', speedBest: 0, speedPlays: 0, serialSeen: 0, serialUnlocked: 0, serialUnlockedOn: '' });

const read = (k: string): unknown => { try { return JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { return null; } };

const reviveProgress = (raw: unknown): Progress => {
  const p = { ...emptyProgress(), ...(raw as Partial<Progress> | null) };
  p.cards = Object.fromEntries(Object.entries(p.cards ?? {}).map(([k, c]) => [k, reviveCard(c)]));
  return p;
};

const loadProgress = (lang: string): Progress => ({ ...reviveProgress(read(progressKey(lang))), ...(read(SHARED_KEY) as Partial<Progress> | null) });

export function load(): State {
  const profile = { ...defaultProfile(), ...(read(PROFILE_KEY) as Partial<StoredProfile> | null) };
  return { profile, progress: loadProgress(profile.language) };
}

/** Switch the active language; the streak and day log carry over, words and lessons are that language's own. */
export function setLanguage(s: State, code: string) {
  s.profile.language = code;
  s.progress = loadProgress(code);
}

export function save(s: State) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(s.profile));
    localStorage.setItem(progressKey(s.profile.language), JSON.stringify(s.progress));
    localStorage.setItem(SHARED_KEY, JSON.stringify(Object.fromEntries(SHARED.map((k) => [k, s.progress[k]]))));
  } catch { /* storage full or blocked: keep playing in memory */ }
}

export const exportJson = (s: State) =>
  JSON.stringify({ app: 'strasse', version: 1, profile: s.profile, progress: { [s.profile.language]: s.progress } }, null, 2);

/** Throws on anything that does not look like an export. */
export function importJson(text: string): State {
  const j = JSON.parse(text);
  if (j?.app !== 'strasse' || !j.profile || !j.progress) throw new Error('Not a STRASSE backup');
  const profile = { ...defaultProfile(), ...j.profile } as StoredProfile;
  return { profile, progress: reviveProgress(j.progress[profile.language]) };
}

export function reset(lang: string): State {
  try { localStorage.removeItem(PROFILE_KEY); localStorage.removeItem(progressKey(lang)); localStorage.removeItem(SHARED_KEY); } catch { /* ignore */ }
  return { profile: defaultProfile(), progress: emptyProgress() };
}

// ---- dates + streak ----
const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const utc = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const dayDiff = (a: string, b: string) => Math.round((utc(b) - utc(a)) / 864e5);
export const addDays = (s: string, n: number) => {
  const d = new Date(utc(s) + n * 864e5);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const isoWeek = (s: string) => {
  const t = new Date(utc(s)); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3); // Thursday of this week
  const y = t.getUTCFullYear(); const w1 = new Date(Date.UTC(y, 0, 4));
  return `${y}-W${pad(1 + Math.round(((+t - +w1) / 864e5 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7))}`;
};

/** Run on open: weekly freeze refill, auto-freeze for exactly one missed day, else streak resets. */
export function rollDay(p: Progress, today = ymd()) {
  const wk = isoWeek(today);
  if (p.freezeWeek !== wk) { p.freezeWeek = wk; p.freezesLeft = 1; }
  if (!p.lastDay) return;
  const gap = dayDiff(p.lastDay, today);
  if (gap <= 1) return;
  if (gap === 2 && p.freezesLeft > 0) {
    const y = addDays(today, -1);
    p.freezesLeft--; p.days[y] = { min: p.days[y]?.min ?? 0, freeze: true }; p.lastDay = y; p.bannerDay = today;
  } else p.streak = 0;
}

/** Add practice minutes; the day counts toward the streak at >= 5 min or once any session is completed (done). */
export function addMinutes(p: Progress, min: number, today = ymd(), done = false) {
  const d = (p.days[today] ??= { min: 0 });
  d.min += min;
  if (done) d.done = true;
  if ((d.min >= 5 || d.done) && p.lastDay !== today) {
    p.streak = p.lastDay && dayDiff(p.lastDay, today) === 1 ? p.streak + 1 : 1;
    p.lastDay = today; p.bestStreak = Math.max(p.bestStreak, p.streak);
  }
}
