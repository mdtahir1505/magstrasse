Design a complete mobile app UI for a language-learning app for iPhone. German first; Russian gets added later, so nothing can be hard-coded to German. The working name is "STRASSE" (feel free to suggest a better one).

## Output format (important: the result gets plugged straight into a real app)
- **React + TypeScript components with plain CSS (CSS variables for every colour, font, radius and spacing).** No Tailwind, no UI kit, no external image URLs.
- iPhone frame 390×844. Respect safe areas (`env(safe-area-inset-*)`). Thumb-reachable: primary actions sit in the bottom third.
- One component per screen and per exercise type. Each one takes its data as **props**, using the data shapes below, and ships with mock data. No logic beyond local UI state; I'll wire up the real logic.
- Include light haptic-style micro-animations (button press, correct/wrong, streak), all CSS-only.
- Icons as inline SVG or emoji only.

## Vibe: Street / edgy
Berlin street culture. Graffiti tags, sticker-bomb labels, paste-up posters, U-Bahn signage, spray-paint drips, halftone and xerox textures, slightly rotated sticker cards with thick black outlines and hard offset shadows. Dark base (concrete/asphalt near-black), with a loud accent palette: acid yellow, hot pink, electric cyan. Display font is a chunky condensed grotesk or marker style for headings. **Body text must be a highly readable clean sans.** The edge lives in the decoration; the learning content stays crisp and easy to read. It should feel rebellious and fun, not childish. No mascot.

**Grammatical gender colours** (used on every German noun, everywhere): der = cyan, die = hot pink, das = acid yellow. Show them as a sticker-style article tag before the noun.

## Core principle: built for a procrastinator
Opening the app shows ONE giant button: Start. No decisions to make before learning starts. Every screen answers "how much is left?" with a visible progress bar. Missing a day should feel forgiving, never guilt-trippy.

## Screens

1. **Onboarding (4 steps)**
   1. Pick a language (German active; Russian shown as a "coming soon" sticker)
   2. Why are you learning? (travel / friends & partner / work / just because)
   3. Daily goal: 5 / 15 / 30 / 45 min (30 pre-selected)
   4. Reminder time picker + "Street German (18+): slang & swearing" toggle
2. **Home / Today**
   - Streak counter (spray-paint flame) with streak-freeze indicator (1 per week)
   - Giant START button
   - Today's session as 3 blocks: Review ~10 min · New lesson ~12 min · Listen & speak ~8 min
   - "Only got 5 minutes?" small link
   - Stat line: "412 words · Stage 1 · Unit 3"
   - Bottom tab bar: Today · Course · Stories · Talk · Me
3. **Session player** (shared shell): top progress bar split into the 3 blocks, a close (X) button, then the current exercise. Exercise types, one component each:
   - **New word card:** German word with gender tag, 🔊 audio button, big emoji, English meaning, "cognate hint" sticker (e.g. *Haus ≈ house*), example sentence
   - **Listen & pick:** big play button + slow-play (🐢), 4 answer options
   - **Build the sentence:** English prompt, German word tiles to tap into order
   - **Type it:** English prompt, text field, umlaut helper keys (ä ö ü ß)
   - **Say it:** German sentence, big mic button with pulsing state; words light up green one by one as they're recognised
   - **Fill the chunk:** `Ich ___ gern Kaffee` with 3–4 option chips
   - **Dialogue:** chat bubbles (other person left, you right); pick your reply from 3 options; play audio for each bubble
   - **Shadowing:** play line → record yourself → compare (two waveforms)
   - **Feedback sheet** (slides up from the bottom): correct (yellow, "Sauber!") or wrong (pink, shows the right answer plus a one-line "why" tip), Continue button
4. **Session complete:** minutes done, new words learned, words reviewed, streak +1 animation, two buttons: "Done" and "Bonus round?"
5. **Course map:** vertical path like a U-Bahn line map. Stages are lines, units are stations, lessons are dots. States: locked / current / done. The current station pulses.
6. **Stories:** library cards (title, level tag A1/A2/B1, length) → reader view with audio play/pause; tap any word to get a translation popover with gender tag and 🔊
7. **Word bank (in "Me"):** search, filter by stage/gender/strength, list rows with word, gender tag, meaning, and a 5-bar strength meter; tap to hear
8. **Street German:** its own section, unlocked via the toggle. Slang/phrase cards with a **rudeness meter** (😏 mild → 🌶️ spicy → 🔥 never at work), a "when to use it" line, and an example
9. **Talk (placeholder for later):** "AI conversation partner, coming soon" poster-style empty state with a locked preview of a café role-play chat
10. **Stats (in "Me"):** minutes per day bar chart (last 14 days), total words known, level estimate meter A1 → A2 → B1, streak history
11. **Settings (in "Me"):** active language switcher, daily goal, reminder time, voice speed slider, Street German toggle, export/import progress (backup), reset

Also design: the empty state (first-day home), a "you missed yesterday — freeze used 🧊" banner, and the 5-minute mode start screen.

## Data shapes (props must use these)

```ts
type Gender = "m" | "f" | "n" | null;            // der / die / das
type Item = {
  id: string; target: string; english: string;  // target = German (later Russian)
  gender: Gender; emoji?: string; cognateHint?: string;
  example?: { target: string; english: string };
  strength: 0 | 1 | 2 | 3 | 4 | 5;
};
type Exercise =
  | { kind: "intro"; item: Item }
  | { kind: "listenPick"; audioText: string; options: string[]; answer: number }
  | { kind: "build"; prompt: string; tiles: string[]; answer: string[] }
  | { kind: "type"; prompt: string; answer: string }
  | { kind: "say"; target: string; english: string }
  | { kind: "fill"; before: string; after: string; options: string[]; answer: number }
  | { kind: "dialogue"; lines: { who: "them" | "me"; target: string; english: string }[];
      replyOptions: string[]; answer: number }
  | { kind: "shadow"; target: string; english: string };
type Session = { blocks: { name: "review" | "new" | "speak"; exercises: Exercise[] }[];
                 current: { block: number; exercise: number } };
type Lesson = { id: string; title: string; state: "locked" | "current" | "done" };
type Unit = { id: string; title: string; lessons: Lesson[] };
type Stage = { id: string; title: string; level: "A1" | "A2" | "B1"; units: Unit[] };
type Story = { id: string; title: string; level: "A1" | "A2" | "B1"; minutes: number;
               lines: { speaker?: string; target: string; english: string }[] };
type StreetItem = { id: string; target: string; english: string;
                    rudeness: 1 | 2 | 3; whenToUse: string; example: string };
type Profile = { language: string; streak: number; freezesLeft: number;
                 wordsKnown: number; dailyGoalMin: number; minutesToday: number;
                 level: "A1" | "A2" | "B1"; streetEnabled: boolean };
```

Use realistic German mock content from beginner lessons (ordering coffee, introducing yourself). Example items: der Kaffee ☕ "coffee", das Wasser 💧 "water" (cognate: water), die Stadt 🏙️ "city", "Ich hätte gern…" "I'd like…", "Wie geht's?" "How's it going?".
