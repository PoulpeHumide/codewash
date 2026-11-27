# ADR-004: Isolate system side effects

- **Status:** Accepted
- **Date:** 2026-11-27
- **Debt item:** DEBT-05

## Context

Game rules and UI code used global clocks, randomness, and timers directly. Audio objects and playback were spread between the sound manager and mini-game hook, with rejected `Audio.play()` promises silently ignored. Speech recognition was coupled to the WebKit-prefixed browser API, and its restart timer could outlive the hook.

The change must preserve random event probabilities, mini-game delays, audio volume and shuffle behavior, speech fallback behavior, and the Electron/browser startup flow.

## Decision

- Add `systemEffects.js` as the default boundary for the clock, random source, and timer APIs. Rules and components accept optional injected dependencies while retaining the same system defaults.
- Keep `useManagedTimers` as the hook for tracked timeouts and use it in lifecycle-bound components and hooks. Add `useAutoDismiss` for state-driven toast timers.
- Centralize audio creation and playback in `soundManager.js`. Its factory accepts `createAudio`, `random`, and `onAudioError` dependencies. Rejected or synchronous playback errors are reported with their source; an optional callback can handle a specific playback failure. Logger and callback failures are also reported without escaping into UI event handlers. Existing sound functions, volumes, BGM singleton behavior, and track selection remain unchanged.
- Add a speech-recognition adapter that prefers the standard `SpeechRecognition` constructor and falls back to `webkitSpeechRecognition`. The hook preserves existing permission/unsupported behavior, tracks restart timeouts, ignores events after unmount, and stops its active recognizer during cleanup.
- Keep timeout durations and callbacks unchanged; only the dependency boundary and cleanup ownership change.

## Consequences

- Production code has no scattered calls to `Date.now()`, `Math.random()`, `new Audio()`, or global `setTimeout()`. One default implementation remains inside each appropriate system boundary.
- `Audio.play()` failures are observable through the default structured warning or an injected handler, while playback failures remain non-blocking.
- The new system-effects, speech-recognition, and auto-dismiss modules each have 100% line, statement, function, and branch coverage. The complete suite passes with 182 tests and the existing coverage thresholds unchanged.
- Standard and WebKit speech APIs remain supported; environments without either API retain the existing graceful fallback.

## Alternatives considered

- **Mock global browser APIs in every test:** rejected because it couples tests to implementation details and leaves production dependencies hidden.
- **Introduce a general dependency-injection framework or global service container:** rejected as unnecessary indirection for a small, explicit set of system effects.
- **Keep audio creation in each mini-game and only report errors at call sites:** rejected because it preserves duplicate I/O logic and makes consistent error observability difficult.
- **Use only the WebKit-prefixed speech API:** rejected because the standard API should be preferred where available while retaining legacy support.
- **Change playback failures into user-facing dialogs or block the action:** rejected because autoplay/device failures must not interrupt game interaction.
