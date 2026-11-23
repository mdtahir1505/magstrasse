// Run: npx tsx src/engine/features.test.ts  (streak rule, sticker unlocks, episode unlock rule)
import type { Episode, Lang } from '../types';
import { finishSession, unlockEpisode } from './serial';
import { addMinutes, emptyProgress } from './storage';
import { newStickers, stickerDefs } from './stickers';

let n = 0;
const t = (cond: boolean, msg: string) => { n++; if (!cond) throw new Error('FAIL: ' + msg); };

// ---- streak: any completed session counts, however short ----
{
  const p = emptyProgress();
  addMinutes(p, 1, '2026-03-02');
  t(p.streak === 0, '1 minute without completing does not count');
  addMinutes(p, 0, '2026-03-02', true);
  t(p.streak === 1 && p.lastDay === '2026-03-02', 'completed 1-minute session counts');
  addMinutes(p, 1, '2026-03-02', true);
  t(p.streak === 1, 'a second session the same day does not double count');
  finishSession(p, [], 1, '2026-03-03');
  t(p.streak === 2 && p.bestStreak === 2, 'next day extends the streak');
  addMinutes(p, 5, '2026-03-05');
  t(p.streak === 1, 'gap resets, and >= 5 min still counts without completion');
}

// ---- stickers ----
const lang = { pack: { id: 'de', name: 'German', nativeName: 'Deutsch', flag: '', voice: 'de-DE', articles: null, stages: [] },
  stages: [{ id: 's1', title: '', level: 'A1', units: [{ id: 'u1', title: 'Hello', lessons: [] }, { id: 'u2', title: 'Food', lessons: [] }] }], stories: [], street: [] } as Lang;
{
  const defs = stickerDefs(lang);
  t(new Set(defs.map((d) => d.id)).size === defs.length, 'sticker ids are unique');
  t(defs.some((d) => d.id === 'boss:u1') && defs.some((d) => d.id === 'boss:u2'), 'one boss sticker per unit');
  t(newStickers(lang, emptyProgress(), []).length === 0, 'nothing unlocked on a fresh profile');
  const p = emptyProgress();
  p.bestStreak = 7; p.bossesBeaten = ['u2']; p.speedPlays = 1; p.speedBest = 41; p.serialSeen = 10;
  p.cards = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`w${i}`, {} as never]));
  const ids = newStickers(lang, p, []).map((s) => s.id).sort();
  const want = ['boss:u2', 'streak:3', 'streak:7', 'words:50', 'words:100', 'speed:1', 'speed:20', 'speed:40', 'serial:1', 'serial:10'].sort();
  t(JSON.stringify(ids) === JSON.stringify(want), `unlock set: ${ids.join(',')}`);
  t(newStickers(lang, p, [{ id: 'streak:3' }]).every((s) => s.id !== 'streak:3'), 'owned stickers are not granted twice');
  t(stickerDefs({ ...lang, pack: { ...lang.pack, id: 'ru' } }).every((d) => /[А-Яа-яЁё ]/.test(d.text)), 'Russian slang for ru');
}

// ---- episodes: one per session-day, gated by minLesson ----
{
  const ep = (n: number, minLesson: string): Episode => ({ id: `e${n}`, n, title: `Ep ${n}`, minLesson, panels: [], cliffhanger: '' });
  const eps = [ep(1, 'l1'), ep(2, 'l1'), ep(3, 'l2')];
  const p = emptyProgress();
  t(unlockEpisode(p, eps, '2026-03-02') === null, 'locked until minLesson is done');
  p.lessonsDone.push('l1');
  t(unlockEpisode(p, eps, '2026-03-02')?.n === 1 && p.serialUnlocked === 1, 'episode 1 unlocks once its lesson is done');
  t(unlockEpisode(p, eps, '2026-03-02') === null, 'only one per day');
  finishSession(p, eps, 1, '2026-03-03');
  t(p.serialUnlocked === 2 && p.serialUnlockedOn === '2026-03-03', 'next day, next episode (via finishSession)');
  finishSession(p, eps, 1, '2026-03-04');
  t(p.serialUnlocked === 2, 'episode 3 waits for lesson l2');
  p.lessonsDone.push('l2');
  finishSession(p, eps, 1, '2026-03-05');
  t(p.serialUnlocked === 3, 'episode 3 unlocks after l2');
  t(unlockEpisode(p, eps, '2026-03-06') === null, 'no episode left');
}
console.log(`features.test.ts: ${n} assertions passed`);
