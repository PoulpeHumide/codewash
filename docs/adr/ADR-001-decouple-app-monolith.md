# ADR-001: Decouple the App monolith

- **Status:** Accepted
- **Date:** 2026-11-27
- **Debt item:** DEBT-02

## Context

`CodeWashGame/src/App.jsx` combined persisted profile state, combat and progression actions, speech recognition, UI orchestration, and large presentation blocks in a 1,681-line component. This made changes difficult to isolate and left important flows under-tested. The refactor must preserve game behavior, localStorage keys and formats, mouse/keyboard interactions, speech fallback behavior, and browser/Electron startup.

## Decision

Keep `App.jsx` as the composition root and separate responsibilities by role:

- Put profile persistence and compatibility handling in `utils/profileStorage.js`.
- Isolate profile state, profile actions, combat actions, speech recognition, and game actions in focused hooks.
- Move the HUD/chrome, skill carousel, and conditional overlays into presentation components under `components/game/`.
- Preserve existing game utility functions and persisted contracts; add characterization and focused unit tests around extracted responsibilities.

## Consequences

- `App.jsx` is reduced to 472 lines and has no function above cyclomatic complexity 10.
- The new hooks, storage module, and game presentation components have 100% line coverage.
- Overall coverage rises from 72.19% to 90.12% lines with the existing thresholds unchanged.
- Some complexity warnings and duplication remain in unrelated existing components; these stay tracked separately rather than broadening DEBT-02.

## Alternatives considered

- **Rewrite the full application in one pass:** rejected because it increases regression risk and makes behavior changes difficult to bisect.
- **Introduce a state-management framework:** rejected because focused hooks and existing state setters address the coupling without a new dependency or public API change.
- **Move all rules into a new domain package immediately:** rejected for this debt item because the current utilities and focused action hooks provide a smaller reversible boundary; further pure-domain extraction can be considered separately.
