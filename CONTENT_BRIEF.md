# Content worker brief (shared by every stage/serial writer)

You write course JSON for MAG STRASSE: a phone app for a lazy, procrastinating English speaker who gives 30 min/day and wants to become **conversational**. Words and chunks first, no alphabet drills, grammar as patterns, natural current speech.

## Files you own
You own only the files named in your task, inside `app/src/content/<lang>/`. Never touch anything else (other workers are writing sibling files at the same time).

## Schema (exact; see BUILD_SPEC.md "Content schema" for the base)
```ts
type Gender = "m" | "f" | "n" | null;
type Item = { id: string; target: string; english: string; gender: Gender; emoji?: string; cognateHint?: string;
  example?: { target: string; english: string; translit?: string }; kind: "word" | "phrase"; translit?: string };
type Sentence = { target: string; english: string; translit?: string };
type Fill = { before: string; after: string; options: string[]; answer: number; english: string };
type DialogueEx = { scene: string; lines: { who: "them"|"me"; target: string; english: string }[];
                    replyOptions: string[]; answer: number };
type LessonContent = { id: string; title: string; items: Item[]; sentences: Sentence[]; fills: Fill[];
                       dialogue: DialogueEx; tip?: string };
type StageContent = { id: string; title: string; level: "A1"|"A2"|"B1"; units: { id: string; title: string; lessons: LessonContent[] }[] };
type Story = { id: string; title: string; level: "A1"|"A2"|"B1"; minutes: number;
               lines: { speaker?: string; target: string; english: string }[] };
```

## Rules
- **Follow the syllabus** `app/src/content/<lang>/syllabus.json`: same stage/unit/lesson ids and titles. Each lesson's `items` are exactly its 12 `vocab` entries (fix an obvious syllabus typo if you must, and say so in your report).
- Item ids: `s{stage}u{unit}l{lesson}-{ascii-slug}` (transliterate umlauts/ß/Cyrillic in the slug). They must be unique.
- Per lesson: 12 items, 6 sentences, 4 fills, 1 dialogue (3–5 lines plus 3 reply options), and a `tip` (one short grammar-as-pattern note tied to THIS lesson's words).
- **Known vocabulary** = everything in earlier lessons per the syllabus (and German stage1.json for de) + this lesson + obvious cognates + basic function words already taught. Sentences, fills, and dialogues must stay inside known vocabulary. Each sentence should reuse 1–2 older words (spaced review for free).
- Fills: `before + options[answer] + after` = the full sentence (mind the spaces). Distractors must be plausibly wrong (wrong ending/case/word), never absurd. Exactly one correct answer.
- Dialogue: the correct reply is natural. Wrong replies are plausible but clearly don't fit the last `them` line. Put the correct one at index 0 (the app shuffles).
- Nouns: correct `gender`. Non-nouns: null. `cognateHint` like "Wasser ≈ water" only for real look-alikes. Use an emoji wherever there's a sensible one.
- **German**: `target` for nouns includes the article ("das Wasser"). Correct umlauts/ß. No translit fields.
- **Russian**: `target` in Cyrillic without stress marks. Add `translit` on every item, sentence, and example (simple readable Latin: privet, spasibo, ya, zh, sh, shch, ts, ch, y for ы, ' for ь). Gender m/f/n on nouns. Early tips may carry a tiny letter tip ("Р = R").
- Stories: 5 per stage (one per unit), 8–12 lines, level = the stage level, using only that stage's known vocabulary. A recurring cast is welcome. Story ids `{lang}-s{stage}-st{unit}`.
- Natural, current, idiomatic. Tone: friendly, a bit cheeky, street-smart. No slurs.
- Write the stage file **unit by unit, saving after each unit** (so partial progress survives).

## Validate before reporting
Run a node one-off (in your scratchpad, not in the repo) that checks: JSON parses; counts per lesson; ids unique (also against the other stage files that exist); genders valid; fill answer indexes in range and `before+opt+after` has no double spaces; every Russian item/sentence has translit. Report the counts + the validation output.
