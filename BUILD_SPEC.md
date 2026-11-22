# STRASSE — Build Spec (Phase 1: web app / PWA, German Stage 1)

Read `PLAN.md` for the why. The design is in `design/project/`:
- `*.dc.html` = one screen each (HTML + `{{hole}}` templating + a `renderVals()` class holding mock data/logic)
- `strasse.css` = the whole visual system. **Reuse it verbatim.** Don't restyle anything.
- `canvas.json` = screen list with titles.

## Stack (no extra deps beyond these)
- Vite + React 18 + TypeScript, in `app/`. Use `npm`.
- `ts-fsrs` for spaced repetition. Nothing else: no router lib (a `useState` screen switch is enough), no state lib, no CSS framework.
- Fonts: the same Google Fonts `<link>` the designs use (Anton, Inter, Permanent Marker), placed in `index.html`.
- Storage: `localStorage`, one key per language (`strasse:<lang>:progress`), plus `strasse:profile`.
- Audio: `speechSynthesis` with `lang` = the pack's `voice` (pick a matching voice, preferring names that contain "Enhanced"/"Premium"). Rate comes from settings; the 🐢 button plays at 0.6×.
- Speech recognition: `window.SpeechRecognition || webkitSpeechRecognition` with `lang` = the pack's voice. If unavailable or it errors, the Say/Shadow screens fall back to "Play mine / I said it ✓" self-grading. Never block progress on the mic.
- PWA: `public/manifest.webmanifest` (name STRASSE, display standalone, dark theme colour from the css) + a hand-written `public/sw.js` (cache-first app shell, ~30 lines) registered in production only. Apple meta tags (`apple-mobile-web-app-capable`, status-bar-style black-translucent, apple-touch-icon). Generate a simple 180/512 png icon (yellow "S" on black) with a tiny node script or an inline SVG converted at build time. Keep it simple.
- `vite.config.ts`: `base: './'`, `server.host: true` (so the phone can reach the dev server on Wi-Fi).

## Folder layout
```
app/
  src/
    main.tsx, App.tsx            screen switch + tab bar
    strasse.css                  copied from design/project/strasse.css
    types.ts                     the data types below
    content/index.ts             loads packs: import.meta.glob('./*/pack.json'), stage*.json, stories.json, street.json
    content/de/...               ← CONTENT WORKER OWNS THIS FOLDER. App worker never writes here.
    engine/srs.ts                ts-fsrs wrapper: card state per item id, due list, grade(id, good|again)
    engine/session.ts            builds a Session (see below)
    engine/check.ts              answer normalising + checking
    engine/storage.ts            load/save profile + progress, export/import JSON
    engine/speech.ts             speak(text, {slow}), listen() → Promise<string>
    screens/*.tsx                one per design screen
    exercises/*.tsx              one per exercise kind + Feedback sheet
```

## Content schema (content worker writes, app worker reads)
```ts
// content/<lang>/pack.json
type Pack = { id: string; name: string; nativeName: string; flag: string; voice: string;
              articles: Record<"m"|"f"|"n", string> | null; stages: string[] /* ["stage1.json", ...] */ };

type Gender = "m" | "f" | "n" | null;
type Item = { id: string;               // globally unique within pack, e.g. "s1u2l3-kaffee"
  target: string; english: string; gender: Gender; emoji?: string; cognateHint?: string;
  example?: { target: string; english: string }; kind: "word" | "phrase" };
type Sentence = { target: string; english: string };        // used for build / type / say / shadow
type Fill = { before: string; after: string; options: string[]; answer: number; english: string };
type DialogueEx = { scene: string; lines: { who: "them"|"me"; target: string; english: string }[];
                    replyOptions: string[]; answer: number };
type LessonContent = { id: string; title: string; items: Item[]; sentences: Sentence[];
                       fills: Fill[]; dialogue: DialogueEx; tip?: string /* one grammar-as-pattern note */ };
type UnitContent = { id: string; title: string; lessons: LessonContent[] };
type StageContent = { id: string; title: string; level: "A1"|"A2"|"B1"; units: UnitContent[] };
// content/<lang>/stage1.json : StageContent
// content/<lang>/stories.json : Story[]      (Story as in the design prompt)
// content/<lang>/street.json  : StreetItem[] (StreetItem as in the design prompt)
```
Rules: every `Sentence`/`Fill`/`DialogueEx` in a lesson uses only items from that lesson or earlier ones (plus obvious cognates). Each lesson has ~12 items, 6 sentences, 4 fills, and 1 dialogue.

## UI types (from the design, used as props)
`Item` (above, plus `strength: 0-5` computed from the SRS card's stability), `Exercise`, `Session`, `Lesson`/`Unit`/`Stage` (with `state: locked|current|done`), `Story`, `StreetItem`, `Profile`. These are exactly as in `CLAUDE_DESIGN_PROMPT.md` and the designs' `data-props` tsType. Add `Exercise` variant fields as needed: `listenPick` also needs `english` for feedback; `type` also takes `english`.

## Converting a design screen
For each `design/project/X.dc.html`, make a component that:
- renders the same markup (`class` → `className`, inline `style="a: b"` → style objects, `<sc-for>` → `.map`, `<sc-if>` → `&&`, `{{x}}` → `{x}`)
- moves `renderVals()` logic into the component and swaps the mock defaults for real props/data
- replaces `href="Other.dc.html"` links with navigation callbacks
- keeps every class name so `strasse.css` applies unchanged. Keep the aria attributes.

## Session engine (`engine/session.ts`)
`buildSession(lang, mode: "full" | "five")`, roughly 30 s per exercise:
- **review** (~10 min ≈ 20 ex): due SRS items, oldest-due first, each as one of listenPick / type / say (rotate). If fewer are due, top up with weakest-strength learned items. If nothing has been learned yet (day 1), skip the block.
- **new** (~12 min ≈ 24 ex): the current lesson. For each item: `intro`, then after every 3 intros a quick listenPick on one of them. Then the lesson's build ×2 (tiles = sentence words shuffled + 2 distractor words from the lesson), fill ×2, and type ×2.
- **speak** (~8 min ≈ 12 ex): the lesson's dialogue, then shadow ×3, say ×3 from the sentences.
- `five` mode = the review block only, capped at 10 (or, on day 1, the first 5 exercises of the new block).
- listenPick options = the correct english + 3 others drawn from learned/lesson items.
- Completing the new block marks the lesson done and advances to the next one. Items become SRS cards when introduced.
- Grading: correct → `Good`, wrong → `Again`. The wrong exercise gets re-queued once, 3 exercises later.
- Minutes are tracked by real elapsed time in the session and added to `profile.minutesToday` (reset daily). A day counts toward the streak once it has ≥5 min. Streak logic: 1 freeze per ISO week, used automatically for one missed day, and shows the MissedDay banner.

## Answer checking (`engine/check.ts`)
Lowercase; trim; strip `.,!?¿¡"'` ; collapse spaces; `ae→ä oe→ö ue→ü ss→ß` applied to the *input* only where it then matches the answer; also accept a missing umlaut entirely (Kase for Käse) but show "watch the umlaut" in feedback. Sentences: exact token match after normalising. Include `check.test.ts` runnable with `npx tsx` (plain asserts).

## Screens to wire
Onboarding 1–4 (first run only; Russian shows "coming soon") → Today (Main / FirstDay / MissedDay variants chosen by state) → Session player (exercise components + Feedback sheet) → Session complete (Bonus round = a story) → tabs: Course map (from content + progress), Stories (+ Reader, tap a word → popover with translation if it matches a known item; else no popover), Talk (static coming-soon), Me = Stats (real minutes per day, last 14 days) / Word bank / Street (visible only if streetEnabled) / Settings (all settings wired: goal, reminder time stored [notifications come later with the native app], voice speed, street toggle, export/import JSON, reset with confirm).

## Done =
- `npm run build` passes with no TS errors; `npx tsx src/engine/check.test.ts` passes
- `npm run dev` → the full first-run flow works in a 390×844 viewport: onboarding → day-1 session → complete → home shows streak 1
- No console errors
