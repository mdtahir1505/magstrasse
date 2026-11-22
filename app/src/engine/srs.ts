import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';
import type { Strength } from '../types';

const f = fsrs();

/** Cards are plain JSON in storage; dates come back as strings. */
export const reviveCard = (c: Card): Card =>
  ({ ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined });

export const introduce = (cards: Record<string, Card>, id: string) => {
  if (!cards[id]) cards[id] = createEmptyCard(new Date());
};

export const grade = (cards: Record<string, Card>, id: string, good: boolean) => {
  if (cards[id]) cards[id] = f.next(cards[id], new Date(), good ? Rating.Good : Rating.Again).card;
};

/** Item ids whose card is due, oldest-due first. */
export const dueIds = (cards: Record<string, Card>, now = new Date()) =>
  Object.keys(cards).filter((id) => cards[id].due <= now).sort((a, b) => +cards[a].due - +cards[b].due);

export const strength = (c?: Card): Strength => {
  const s = c?.stability ?? 0;
  return (s >= 30 ? 5 : s >= 14 ? 4 : s >= 6 ? 3 : s >= 2 ? 2 : s > 0 ? 1 : 0) as Strength;
};
