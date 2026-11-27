# ADR-006: Split global styles and game data

- **Status:** Accepted
- **Date:** 2026-11-27
- **Debt item:** DEBT-07

## Context

`GlobalStyles.jsx` embedded the application's global CSS in a large JSX template. `gameData.jsx` combined asset maps, themes, difficulty configuration, educational content, skill data, and a display-name formatter. Both files were expensive to navigate and encouraged presentation, behavior, and data to evolve together.

## Decision

- Keep `GlobalStyles` as the component consumed by the application. Move its stylesheet to `GlobalStyles.css` and import it as raw text so the component inserts the same single `<style>` element at the same render position.
- Preserve the CSS rule and declaration order. The extracted stylesheet's PostCSS structure was compared with the original; differences are formatting-only (whitespace, equivalent attribute-selector quotes, and hex-color case). A test locks the stylesheet's content fingerprint and verifies component mounting.
- Keep `constants/gameData.jsx` as the compatibility entry point and preserve all 22 named exports. Split the data into `assetData.js`, `difficultyData.js`, `themeData.js`, `readingData.js`, `writingData.js`, and `skillData.js`.
- Move `formatDisplayName` into `utils/gameDataUtils.js`, separating behavior from the static data modules while re-exporting it under its existing public name.
- Keep the data modules free of JSX. The compatibility barrel uses shallow object/array copies and a function wrapper so its exports remain accepted by the existing React Fast Refresh lint rule; exported names and data values remain unchanged.

## Consequences

- Both original entry points are under 150 lines, and the six domain data modules are each under 200 lines.
- Existing imports continue to resolve through `gameData.jsx`; characterization tests lock the full named export surface and important data schemas.
- New JavaScript modules have 100% line coverage. The CSS test checks the full stylesheet content and protects its cascade ordering against accidental loss or reordering.
- No lint, formatting, build, or coverage configuration was relaxed.

## Alternatives considered

- **Leave the styles inside a JSX template:** rejected because it retains the presentation monolith.
- **Delete or rename `gameData.jsx`:** rejected because existing components and tests import that public path.
- **Use wildcard re-exports or disable the Fast Refresh rule:** rejected because the former fails the repository lint rule and the latter weakens a project quality gate.
- **Split data by arbitrary line ranges:** rejected in favor of modules grouped by assets, difficulty, themes, reading, writing, and skills.
