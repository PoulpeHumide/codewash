# ADR-002: Modularize SkillCard mini-games

- **Status:** Accepted
- **Date:** 2026-11-27
- **Debt item:** DEBT-03

## Context

`SkillCard.jsx` combined six mini-games, input validation, game state, audio, nested timers, card presentation, and combat overlays in a 1,111-line component. Its main function had cyclomatic complexity 107, and timer callbacks were not cleared when a battle ended or the component unmounted. The refactor must preserve the public `SkillCard` props, scoring and progression, keyboard/mouse actions, audio feedback, themes, and the timing experienced by players.

## Decision

- Keep pure answer normalization, memory deck/match rules, Simon sequence/damage/tempo rules, and card presentation styling in `src/utils/`.
- Coordinate mini-game state and effects in `useSkillCardMiniGames`; route delayed work through `useManagedTimers`, which clears pending callbacks when combat becomes inactive or the component unmounts.
- Render memory, Simon, math, writing, reading, and cleaning games through focused views in `components/skills/minigames/`.
- Separate the card shell, mob/health display, difficulty controls, and battle overlay into presentation components. Keep `SkillCard` as the existing public adapter and orchestration entry point.
- Preserve existing delays (300/400/500/800 ms and Simon tempo calculations), class names, props, callbacks, audio calls, and local game rules. Add characterization tests before changing the component and deterministic fake-timer tests for transitions and cleanup.

## Consequences

- `SkillCard.jsx` is reduced from 1,111 to 138 lines; its functions and all extracted modules have cyclomatic complexity at or below 10.
- The new rules, hooks, and presentation modules have 100% line coverage. Global line coverage is 96.69%; the existing coverage thresholds are unchanged.
- Pending mini-game timeouts no longer execute after combat ends or the card unmounts; delays and ordering during active play are unchanged.
- Seven complexity warnings and existing duplicate-code clones remain elsewhere in the repository and are not part of DEBT-03.

## Alternatives considered

- **Keep all six games in one component and only extract helper functions:** rejected because the large conditional JSX and component lifecycle would remain coupled.
- **Rewrite the game flows or replace their timers with a new scheduling model:** rejected because this could alter player-visible timing and sequencing.
- **Adopt a global state library or new dependency:** rejected because a focused hook provides the required lifecycle boundary without expanding the public API or runtime dependencies.
