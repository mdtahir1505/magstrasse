// Language-level helpers that need the loaded content.
import { loadLang, packs } from '../content';
import type { Episode, Lang, Pack } from '../types';
import { currentLesson } from './session';
import type { Progress, StoredProfile } from './storage';

/** Any pack with at least one stage is selectable. */
export const availablePacks = (): Pack[] => packs().filter((p) => loadLang(p.id)?.stages.length);

/** Language picker entries: playable packs, plus a "coming soon" Russian while its pack is missing. */
export const langChoices = () => {
  const have = availablePacks();
  return [...have.map((p) => ({ code: p.id, name: p.name, native: p.nativeName, tagline: p.tagline, available: true })),
    ...(have.some((p) => p.id === 'ru') ? [] : [{ code: 'ru', name: 'Russian', native: 'Русский', tagline: undefined, available: false }])];
};

export const hasTranslit = (p: Pack) => p.translitUntilStage != null;

/** Auto = while the learner is in stage <= translitUntilStage. */
export const showTranslit = (lang: Lang, mode: StoredProfile['translit'], p: Progress) =>
  hasTranslit(lang.pack) && mode !== 'never' &&
  (mode === 'always' || (currentLesson(lang, p)?.stageIdx ?? lang.stages.length - 1) + 1 <= lang.pack.translitUntilStage!);

const serials = import.meta.glob('../content/*/serial.json', { eager: true, import: 'default' }) as Record<string, Episode[]>;
export const serialOf = (code: string): Episode[] => [...(serials[`../content/${code}/serial.json`] ?? [])].sort((a, b) => a.n - b.n);
