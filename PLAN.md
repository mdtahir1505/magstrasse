# Language App — Plan (v1: German, Russian later)

## Decisions (2026-11-22)
- **Install:** web app on the home screen first (free), then Capacitor → TestFlight once the $99 Apple account is bought.
- **AI conversation partner:** later. The design reserves a "Talk" tab that shows a "coming soon" state.
- **Vibe:** Street / edgy, Berlin graffiti and sticker style.
- **Course:** as planned below, no changes.

## 1. Getting it on your iPhone from a Windows PC

You can't build iPhone apps on Windows directly (Apple's build tool, Xcode, is Mac-only). So the build happens on a rented Mac in the cloud and the finished app gets installed on your phone. Here are the routes:

| Route | Cost | How it gets on the phone | Catch |
|---|---|---|---|
| **A. Real app via TestFlight** (recommended) | Apple Developer Program **$99/yr** (~£79). Cloud Mac build: free (Codemagic free tier / GitHub Actions) | Cloud Mac builds it → uploads to Apple → you tap Install in the **TestFlight** app | Each build lasts 90 days, then you tap "rebuild" once. That's the only upkeep |
| B. Free sideload | £0 (free Apple ID) | Cloud builds the .ipa → **Sideloadly** on Windows installs it over USB | App **dies every 7 days** until you plug in and re-sign. Bad for a procrastinator |
| C. Web app on home screen (PWA) | £0 | Safari → Share → "Add to Home Screen". Opens full screen like an app | Needs a one-time free static host (GitHub Pages, no backend). **No scheduled reminders**, speaking practice is flaky |

**The plan:** one codebase that does both. Week 1 you use it as a home-screen web app (C) for free, straight away. Once you've proven to yourself you're sticking with it, pay the $99 and ship the same code as a real app through TestFlight (A). Nothing gets rewritten.

**Stack:** React + TypeScript (Vite) for the UI, wrapped as a native iOS app with **Capacitor**. Why: Claude Design outputs web code (HTML/CSS/React), so the design drops straight in. A React Native app would mean re-translating every screen.

**No server, at all.** The course content ships inside the app. Your progress lives on your phone. German audio uses iPhone's built-in German voices (download "Anna (Enhanced)" in iOS Settings, free), and speaking practice uses iPhone's on-device speech recognition. It works in airplane mode.

## 2. Teaching method (why it'll be faster than Duolingo)

1. **Words and chunks, no alphabet lessons.** You learn `Ich hätte gern…` ("I'd like…") as one block, not letter sounds. You pick up pronunciation from audio on every item.
2. **Cognates first.** German and English share a lot: Haus=house, Wasser=water, trinken=drink, Buch=book. The early lessons are packed with these, so you hit about 300 words in the first weeks for little effort.
3. **Frequency-ordered.** The ~1,500 most common words plus ~500 phrases cover roughly 85–90% of everyday speech. Nothing rare until later.
4. **Spaced repetition (FSRS algorithm).** You get each word right before you'd forget it. That's the "repeat so it sticks" part of Duolingo, without wasting reviews on things you already know.
5. **Active recall, not tapping.** You type and **say** the German. Recognising a word ≠ being able to produce it.
6. **Grammar as patterns, not tables.** `der/die/das` are colour-coded on every noun from day 1 (blue/red/green). Cases come in as chunks (`mit dem`, `in der Stadt`), and the rule shows up only after you've already used it.
7. **Listening in context.** Every unit ends in a short dialogue/story made only from words you know, which you shadow (listen → repeat out loud).
8. **Street German track.** Slang, casual speech, and swear words with a rating of how rude each one is (😏 mild → 🔥 don't say to your boss). Opt-in toggle.

## 3. The course (A0 → B1 "conversational")

6 stages × 5 units × 5 lessons = **150 lessons**, about **12 new words/phrases each → ~1,800 items**.
One lesson a day ≈ 5 months of new material. Then the stories and review keep going. Honest target: **solid A2 by month 5–6, B1 (hold a real conversation) around month 9–12** at 30 min/day. Talking to actual humans speeds this up a lot.

| Stage | Level | Units |
|---|---|---|
| 1. Survival | A1.1 | Hello & who I am · Ordering food & drink · Numbers & prices · Getting around · I want / I have / I need |
| 2. Daily life | A1.2 | Family & friends · Time, days, plans · Shopping · Home & routine · Likes & hobbies |
| 3. Past & future | A2.1 | What I did (Perfekt) · Travel & hotels · Appointments & doctor · Weather & seasons · Plans (werden) |
| 4. Social | A2.2 | Opinions (weil/dass) · Making plans with people · Texting & phone · Feelings · Small talk |
| 5. Real conversations | B1.1 | Telling stories · Comparing things · Complaining & solving problems · Preferences · "If I were…" (würde/hätte) |
| 6. Fluency | B1.2 | Work & study · Culture & Germany · Arguing your point · Idioms · Fast natural speech |
| ➕ Street German | any | Slang · Texting abbreviations · Swearing (graded) · Regional (Berlin/Bavaria/Austria) |

Content is generated with Claude at build time (not at runtime), checked, and bundled as JSON.

## 4. Built for a procrastinator

- **One button.** Open the app → giant **Start** button → the session is already built for you. No choosing.
- **Default 30 min, minimum 5.** "Can't be bothered" mode = a 5-minute review that still keeps your streak. The hard part is starting; most people keep going once they've started.
- **Session = 3 blocks:** ~10 min review → ~12 min new lesson → ~8 min listen/speak. Each block shows a progress bar so you can see the end.
- **Daily reminder** at the time you pick (native app only), with a cheeky message, not a guilt trip.
- **Streak with freezes:** 1 free freeze a week. Missing a day doesn't wipe everything (that's what makes people quit).
- **"Bonus round"** after 30 min if you want more: stories, speed round, Street German.
- **Visible payoff:** "You know 412 words · You can now order food, ask directions, talk about your family."

## 5. Modular (Russian later)

The app engine is language-agnostic. Each language is a **content pack** folder:

```
content/de/  pack.json (name, flag, voice "de-DE", gender colours)
             stages/*.json (lessons, items, dialogues)
             street.json
content/ru/  ...same shape, + optional "script" unit (Cyrillic needs a short intro, unlike German)
```

Adding Russian = drop in `content/ru/`, and the language picker shows it. Progress is tracked separately per language.

## 6. Screens (what Claude Design must produce)

1. **Onboarding** (4 steps): pick language → why you're learning → daily goal (5/15/30/45 min) → reminder time + Street German toggle (18+)
2. **Home / Today:** streak, big Start, today's 3 blocks, words known, "5-min mode" link
3. **Session player** with these exercise types:
   - New word card (German, audio, emoji, English, cognate hint, gender colour)
   - Listen & pick (hear audio → choose meaning)
   - Build the sentence (word tiles)
   - Type it (English → German, forgiving of umlauts: `ae`=`ä`)
   - Say it (mic, sentence turns green word-by-word as recognised)
   - Fill the chunk (`Ich ___ gern Kaffee`)
   - Dialogue (choose your reply in a chat-bubble conversation)
   - Shadowing (listen → repeat, with slow mode)
   - Feedback sheet (correct / wrong + correct answer + "why" tip)
4. **Session complete:** time, words learned, streak, "Bonus round?"
5. **Course map:** stages → units → lessons, locked/current/done
6. **Stories:** library of short dialogues/stories, tap any word for its translation
7. **Word bank:** every learned word, search, strength meter, tap for audio
8. **Street German:** separate section with rudeness ratings
9. **Stats:** minutes/day chart, words known, level estimate (A1/A2/B1)
10. **Settings:** language switch, daily goal, reminder, voice speed, Street toggle, backup/export progress

## 7. Build order (after design comes back)

1. App shell + design dropped in + German pack for Stage 1 → use it as a web app on your phone
2. Spaced repetition, speech, offline
3. Generate stages 2–6 + Street German content
4. Capacitor iOS wrap → cloud build → TestFlight
5. Russian pack (later)
