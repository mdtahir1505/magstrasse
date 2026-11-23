// Kiez Chronicles: one new episode per day on which a session was completed, once its lesson is done.
import type { Episode } from '../types';
import { addMinutes, ymd, type Progress } from './storage';

export function unlockEpisode(p: Progress, eps: Episode[], today = ymd()): Episode | null {
  const next = eps.find((e) => e.n === p.serialUnlocked + 1);
  if (!next || p.serialUnlockedOn === today || !p.lessonsDone.includes(next.minLesson)) return null;
  p.serialUnlocked = next.n; p.serialUnlockedOn = today;
  return next;
}

/** Every finished session (1-min, 5-min, full, speed round, boss) goes through here: minutes, streak, episode. */
export function finishSession(p: Progress, eps: Episode[], min: number, today = ymd()) {
  addMinutes(p, min, today, true);
  unlockEpisode(p, eps, today);
}
