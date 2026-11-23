import type { Item, Lang, LessonContent, Pack, StageContent, Story, StreetItem, UnitContent } from '../types';

// Whatever the content worker has written so far; missing/partial files are tolerated.
const files = import.meta.glob('./*/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export const packs = (): Pack[] =>
  Object.keys(files).filter((k) => k.endsWith('/pack.json')).map((k) => files[k] as Pack);

const lesson = (l: Partial<LessonContent>): LessonContent =>
  ({ id: '', title: '', items: [], sentences: [], fills: [], dialogue: undefined as never, ...l });

const merged = <T,>(code: string, base: string): T[] =>
  Object.keys(files).filter((k) => new RegExp(`^\\./${code}/${base}(-[\\w-]+)?\\.json$`).test(k)).sort()
    .flatMap((k) => (files[k] as T[] | undefined) ?? []);

export function loadLang(code: string): Lang | null {
  const pack = files[`./${code}/pack.json`] as Pack | undefined;
  if (!pack) return null;
  const stages = (pack.stages ?? []).map((f) => files[`./${code}/${f}`] as StageContent | undefined)
    .filter((s): s is StageContent => !!s)
    .map((s) => ({ ...s, units: (s.units ?? []).map((u: UnitContent) => ({ ...u, lessons: (u.lessons ?? []).map(lesson) })) }));
  return {
    pack, stages,
    // stories.json, stories-s2.json, … and street.json, street-s2.json, … are merged in file-name order
    stories: merged<Story>(code, 'stories'),
    street: merged<StreetItem>(code, 'street'),
  };
}

export type Flat = { stageIdx: number; unitIdx: number; stage: StageContent; unit: UnitContent; lesson: LessonContent };
export const flatLessons = (lang: Lang): Flat[] =>
  lang.stages.flatMap((stage, stageIdx) => stage.units.flatMap((unit, unitIdx) =>
    unit.lessons.map((l) => ({ stageIdx, unitIdx, stage, unit, lesson: l }))));

/** Every item in course order, tagged with its stage index. */
export const allItems = (lang: Lang): (Item & { stageIdx: number })[] =>
  flatLessons(lang).flatMap((f) => f.lesson.items.map((i) => ({ ...i, stageIdx: f.stageIdx })));
