import type { Card } from 'ts-fsrs';
import { allItems, flatLessons, type Flat } from '../content';
import type { Ex, Exercise, Item, Lang, LessonContent, Session, UnitContent } from '../types';
import { norm } from './check';
import { dueIds, strength } from './srs';
import type { Progress } from './storage';

const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** First lesson not yet done, in course order. */
export const currentLesson = (lang: Lang, p: Progress): Flat | undefined =>
  flatLessons(lang).find((f) => !p.lessonsDone.includes(f.lesson.id));

/** Content lists the correct option first: shuffle and remap the answer index. */
const shuffleOpts = (options: string[], answer: number) => {
  const o = shuffle(options.map((text, i) => ({ text, ok: i === answer })));
  return { options: o.map((x) => x.text), answer: o.findIndex((x) => x.ok) };
};

export function listenPick(item: Item, pool: Item[], why?: string): Extract<Exercise, { kind: 'listenPick' }> {
  const others = shuffle(pool.filter((o) => o.id !== item.id && o.english !== item.english));
  const seen = new Set([item.english]);
  const picked = others.filter((o) => !seen.has(o.english) && seen.add(o.english)).slice(0, 3).map((o) => o.english);
  const options = shuffle([item.english, ...picked]);
  return { kind: 'listenPick', audioText: item.target, english: item.english, options, answer: options.indexOf(item.english), itemId: item.id, why, translit: item.translit };
}

function reviewEx(item: Item, i: number, pool: Item[]): Ex {
  const k = i % 3;
  if (k === 0 && pool.length >= 4) return listenPick(item, pool);
  if (k === 1) return { kind: 'type', prompt: item.gender ? `${item.english} (with article)` : item.english, answer: item.target, itemId: item.id };
  return { kind: 'say', target: item.target, english: item.english, itemId: item.id, translit: item.translit };
}

function buildEx(l: Pick<LessonContent, 'sentences' | 'tip'>, s: { target: string; english: string }): Ex {
  const words = s.target.split(/\s+/);
  const have = new Set(words.map(norm));
  const extra = shuffle([...new Set(l.sentences.flatMap((x) => x.target.split(/\s+/)).filter((w) => !have.has(norm(w))))]).slice(0, 2);
  let tiles = shuffle([...words, ...extra]);
  if (tiles.join(' ') === words.join(' ')) tiles = shuffle(tiles);
  return { kind: 'build', prompt: s.english, tiles, answer: words, why: l.tip };
}

/** A unit is ready for its boss once all its lessons are done and the boss is not beaten yet. */
export const bossReady = (lang: Lang, p: Progress): UnitContent | undefined =>
  lang.stages.flatMap((s) => s.units).find((u) => u.lessons.length && u.lessons.every((l) => p.lessonsDone.includes(l.id)) && !p.bossesBeaten.includes(u.id));

/** 15 mixed exercises from everything in the unit, round-robin over the kinds so no kind runs dry first. */
function buildBoss(lang: Lang, unitId: string): { session: Session; lessonId: null } {
  const u = lang.stages.flatMap((s) => s.units).find((x) => x.id === unitId);
  const all = u?.lessons.flatMap((l) => l.items) ?? [];
  const items = shuffle(all);
  const sentences = shuffle(u?.lessons.flatMap((l) => l.sentences) ?? []);
  const fills = shuffle(u?.lessons.flatMap((l) => l.fills) ?? []);
  const ctx = { sentences: u?.lessons.flatMap((l) => l.sentences) ?? [], tip: undefined };
  const make: Record<string, () => Ex | undefined> = {
    listenPick: () => { const i = items.pop(); return i && all.length >= 4 ? listenPick(i, all) : undefined; },
    fill: () => { const f = fills.pop(); return f && { kind: 'fill', ...f, ...shuffleOpts(f.options, f.answer), why: f.english }; },
    build: () => { const s = sentences.pop(); return s && buildEx(ctx, s); },
    type: () => { const i = items.pop(); return i ? { kind: 'type', prompt: i.gender ? `${i.english} (with article)` : i.english, answer: i.target, itemId: i.id } : undefined; },
    say: () => { const s = sentences.pop(); return s && { kind: 'say', ...s }; },
  };
  const order = ['listenPick', 'fill', 'build', 'type', 'say'];
  const ex: Ex[] = [];
  for (let n = 0, dry = 0; ex.length < 15 && dry < order.length; n++) {
    const e = make[order[n % order.length]]();
    if (e) { ex.push(e); dry = 0; } else dry++;
  }
  return { session: { blocks: ex.length ? [{ name: 'boss', exercises: ex }] : [], current: { block: 0, exercise: 0 } }, lessonId: null };
}

export function buildSession(lang: Lang, p: Progress, mode: 'full' | 'five' | 'one' | 'boss', unitId = ''): { session: Session; lessonId: string | null } {
  if (mode === 'boss') return buildBoss(lang, unitId);
  const byId = new Map<string, Item>(allItems(lang).map((i) => [i.id, i]));
  const cur = currentLesson(lang, p);
  const learned = Object.keys(p.cards).map((id) => byId.get(id)).filter((i): i is Item => !!i);

  // review: due first, topped up with the weakest learned items
  const cap = mode === 'one' ? 3 : mode === 'five' ? 10 : 20;
  const ids = dueIds(p.cards).filter((id) => byId.has(id));
  if (ids.length < cap) {
    const rest = learned.filter((i) => !ids.includes(i.id)).sort((a, b) => strength(p.cards[a.id] as Card) - strength(p.cards[b.id] as Card));
    ids.push(...rest.slice(0, cap - ids.length).map((i) => i.id));
  }
  const pool = [...learned, ...(cur?.lesson.items ?? [])];
  const review: Ex[] = ids.slice(0, cap).map((id, i) => reviewEx(byId.get(id)!, i, pool));

  // new: intros (+ a quick listenPick after every 3), then build x2, fill x2, type x2
  const l = cur?.lesson;
  const fresh: Ex[] = [];
  if (l) {
    l.items.forEach((item, i) => {
      fresh.push({ kind: 'intro', item });
      if ((i + 1) % 3 === 0 && l.items.length >= 4) fresh.push(listenPick(pick(l.items.slice(i - 2, i + 1)), l.items, l.tip));
    });
    l.sentences.slice(0, 2).forEach((s) => fresh.push(buildEx(l, s)));
    l.fills.slice(0, 2).forEach((f) => fresh.push({ kind: 'fill', ...f, ...shuffleOpts(f.options, f.answer), why: l.tip ?? f.english }));
    l.sentences.slice(2, 4).forEach((s) => fresh.push({ kind: 'type', prompt: s.english, answer: s.target, why: l.tip }));
  }

  // speak: dialogue, shadow x3, say x3
  const speak: Ex[] = [];
  if (l) {
    if (l.dialogue) speak.push({ kind: 'dialogue', ...l.dialogue, ...shuffleOpts(l.dialogue.replyOptions, l.dialogue.answer), why: l.tip });
    l.sentences.slice(0, 3).forEach((s) => speak.push({ kind: 'shadow', ...s }));
    l.sentences.slice(3, 6).forEach((s) => speak.push({ kind: 'say', ...s }));
  }

  let blocks: Session['blocks'];
  let lessonId: string | null = null;
  if (mode !== 'full') {
    blocks = review.length ? [{ name: 'review', exercises: review }] : [{ name: 'new', exercises: fresh.slice(0, mode === 'one' ? 3 : 5) }];
  } else {
    lessonId = fresh.length ? l!.id : null;
    blocks = [{ name: 'review', exercises: review }, { name: 'new', exercises: fresh }, { name: 'speak', exercises: speak }];
  }
  return { session: { blocks: blocks.filter((b) => b.exercises.length), current: { block: 0, exercise: 0 } }, lessonId };
}
