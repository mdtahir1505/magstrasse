// Sticker wall: every sticker is a rule over progress. Text is slang from the pack (or a built-in list), so it follows the language.
import type { Lang } from '../types';
import type { Progress } from './storage';

export type Rarity = 'c' | 'y' | 'p'; // css: cyan common, yellow rare, pink epic
export type Sticker = { id: string; emoji: string; text: string; rarity: Rarity; hint: string; ok: (p: Progress) => boolean };

const SLANG: Record<string, string[]> = {
  de: ['Krass', 'Läuft', 'Geil', 'Digga', 'Alter', 'Mega', 'Sauber', 'Bock', 'Stabil', 'Hammer', 'Zack', 'Boah', 'Wahnsinn', 'Ehrenmann', 'Fix', 'Lecker', 'Na klar', 'Genau', 'Klasse', 'Spitze', 'Los', 'Prima', 'Eyy', 'Kiez', 'Moin', 'Servus', 'Jawoll', 'Safe', 'Wild', 'Fett', 'Heftig', 'Chillig', 'Easy', 'Top', 'Bombe', 'Granate', 'Kracher', 'Knaller', 'Echt jetzt', 'Bingo', 'Treffer', 'Gönn dir', 'Gemacht', 'Feierabend', 'Gute Laune', 'Volltreffer', 'Ach was', 'Tschau', 'Mensch', 'Nice'],
  ru: ['Круто', 'Класс', 'Огонь', 'Бро', 'Ништяк', 'Жесть', 'Респект', 'Кайф', 'Топ', 'Мощно', 'Красавчик', 'Вперёд', 'Давай', 'Ого', 'Чётко', 'Поехали', 'Супер', 'Отлично', 'Молодец', 'Ура', 'Блин', 'Ладно', 'Ну да', 'Зашибись', 'Здорово', 'Балдёж', 'Бомба', 'Тема', 'Лайк', 'Хит', 'Фишка', 'Драйв', 'Вау', 'Годно', 'Норм', 'Шик', 'Браво', 'Победа', 'Рекорд', 'Сила', 'Мастер', 'Герой', 'Легенда', 'Босс', 'Чемпион', 'Звезда', 'Бинго', 'Ого-го', 'Бесподобно', 'Победитель'],
};
const GENERIC = ['Nice', 'Boom', 'Yes', 'Fire', 'Legend', 'Boss', 'Wow', 'Big', 'Hot', 'Gold', 'Epic', 'Ace'];
const BOSS_EMOJI = ['💥', '🥊', '👊', '⚡', '🔨', '🗡️', '🏆', '🔥'];

export function stickerDefs(lang: Lang): Sticker[] {
  const words = lang.pack.stickerWords ?? SLANG[lang.pack.id] ?? GENERIC;
  const out: Sticker[] = [];
  const add = (id: string, emoji: string, rarity: Rarity, hint: string, ok: Sticker['ok']) =>
    out.push({ id, emoji, text: words[out.length % words.length], rarity, hint, ok });
  lang.stages.flatMap((s) => s.units).forEach((u, i) =>
    add(`boss:${u.id}`, BOSS_EMOJI[i % BOSS_EMOJI.length], 'y', `Beat the boss of "${u.title}"`, (p) => p.bossesBeaten.includes(u.id)));
  ([[3, 'c'], [7, 'c'], [14, 'y'], [30, 'y'], [60, 'p'], [100, 'p'], [365, 'p']] as const).forEach(([n, r]) =>
    add(`streak:${n}`, '🔥', r, `Reach a ${n}-day streak`, (p) => p.bestStreak >= n));
  ([[50, 'c'], [100, 'c'], [250, 'y'], [500, 'y'], [1000, 'p'], [1500, 'p'], [2000, 'p']] as const).forEach(([n, r]) =>
    add(`words:${n}`, '📚', r, `Know ${n} words`, (p) => Object.keys(p.cards).length >= n));
  add('speed:1', '⚡', 'c', 'Play your first speed round', (p) => p.speedPlays >= 1);
  ([[20, 'c'], [40, 'y'], [60, 'p']] as const).forEach(([n, r]) =>
    add(`speed:${n}`, '🏁', r, `Score ${n} in a speed round`, (p) => p.speedBest >= n));
  ([[1, 'c'], [10, 'y'], [25, 'y'], [50, 'p']] as const).forEach(([n, r]) =>
    add(`serial:${n}`, '📖', r, `Read ${n === 1 ? 'your first' : `${n}`} Kiez Chronicles episode${n === 1 ? '' : 's'}`, (p) => p.serialSeen >= n));
  return out;
}

/** Defined stickers whose rule now holds and that the profile does not own yet. */
export const newStickers = (lang: Lang, p: Progress, owned: { id: string }[]) =>
  stickerDefs(lang).filter((d) => d.ok(p) && !owned.some((o) => o.id === d.id));
