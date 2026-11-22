// ---- content (written by the content worker) ----
export type Gender = 'm' | 'f' | 'n' | null;
export type Level = 'A1' | 'A2' | 'B1';
export type Pack = { id: string; name: string; nativeName: string; flag: string; voice: string;
  articles: Record<'m' | 'f' | 'n', string> | null; stages: string[] };
export type Item = { id: string; target: string; english: string; gender: Gender; emoji?: string; cognateHint?: string;
  example?: { target: string; english: string }; kind: 'word' | 'phrase' };
export type Sentence = { target: string; english: string };
export type Fill = { before: string; after: string; options: string[]; answer: number; english: string };
export type DialogueEx = { scene: string; lines: { who: 'them' | 'me'; target: string; english: string }[];
  replyOptions: string[]; answer: number };
export type LessonContent = { id: string; title: string; items: Item[]; sentences: Sentence[]; fills: Fill[];
  dialogue: DialogueEx; tip?: string };
export type UnitContent = { id: string; title: string; lessons: LessonContent[] };
export type StageContent = { id: string; title: string; level: Level; units: UnitContent[] };
export type Story = { id: string; title: string; level: Level; minutes: number;
  lines: { speaker?: string; target: string; english: string }[] };
export type StreetItem = { id: string; target: string; english: string; rudeness: 1 | 2 | 3; whenToUse: string; example: string };
export type Lang = { pack: Pack; stages: StageContent[]; stories: Story[]; street: StreetItem[] };

// ---- UI ----
export type Strength = 0 | 1 | 2 | 3 | 4 | 5;
export type Exercise =
  | { kind: 'intro'; item: Item }
  | { kind: 'listenPick'; audioText: string; english: string; options: string[]; answer: number; itemId?: string; why?: string }
  | { kind: 'build'; prompt: string; tiles: string[]; answer: string[]; why?: string }
  | { kind: 'type'; prompt: string; answer: string; alts?: string[]; itemId?: string; why?: string }
  | { kind: 'say'; target: string; english: string; itemId?: string }
  | { kind: 'fill'; before: string; after: string; options: string[]; answer: number; english: string; why?: string }
  | { kind: 'dialogue'; scene: string; lines: { who: 'them' | 'me'; target: string; english: string }[];
      replyOptions: string[]; answer: number; why?: string }
  | { kind: 'shadow'; target: string; english: string };
export type Ex = Exercise & { retry?: boolean };
export type Session = { blocks: { name: 'review' | 'new' | 'speak'; exercises: Ex[] }[]; current: { block: number; exercise: number } };
export type Result = { correct: boolean; answer: string; given?: string; why?: string; silent?: boolean };

export type Profile = { language: string; streak: number; freezesLeft: number; wordsKnown: number; dailyGoalMin: number;
  minutesToday: number; level: Level; streetEnabled: boolean };
export type ExProps<K extends Exercise['kind']> = { ex: Extract<Exercise, { kind: K }>; pack: Pack; done: (r: Result | null) => void };
