# ADR-003: Centralize storage and save validation

- **Status:** Accepted
- **Date:** 2026-11-27
- **Debt item:** DEBT-04

## Context

Profile persistence was spread across the profile hook, profile actions, `profileStorage.js`, and `PhantomEvent.jsx`. JSON parsing for profile names and parental status could throw during initialization, and `currentProfile_v1` was not constrained to a supported profile ID. The refactor must preserve existing localStorage keys, valid serialized data, default values, legacy profile loading, and partial-stat merging.

## Decision

- Add an injectable storage adapter for reads, writes, removals, JSON parsing, and JSON serialization. Storage access and quota failures are logged and reported through boolean write results instead of being silently treated as successful.
- Centralize profile metadata keys, profile-data keys, and metadata read/write operations in `utils/storage/profileRepository.js`.
- Validate `currentProfile_v1` against profile IDs 1–3; validate profile-name and parental-status records before using them.
- Put save-shape validation in `utils/storage/profileSchemas.js`. Accept the existing theme IDs, merge valid partial statistics with defaults, preserve unknown statistics fields, and retain the existing nested and legacy flattened skill formats.
- Keep the existing profile save envelope and versioned keys. Continue falling back from `heroSkills_v23_p1` to `heroSkills_v23`; do not rewrite or migrate valid legacy saves merely because they were loaded.
- Route the phantom cooldown through the same adapter and treat malformed timestamps as zero.

## Consequences

- Production code has no direct `localStorage` calls outside the adapter and only one centralized `JSON.parse` site.
- Corrupt or schema-invalid values use existing defaults; invalid current profile IDs return to profile 1.
- Valid keys and serialized formats remain unchanged. Partial profile metadata stays partial, partial statistics are merged, and unknown statistics remain preserved.
- The new adapter, repository, and schema modules each have 100% line, statement, function, and branch coverage. Global coverage increased from 96.69% to 96.77% lines with the existing thresholds unchanged.
- Failed storage writes are explicit in the console and return `false`; callers do not present a failed write as a successful result.

## Alternatives considered

- **Replace localStorage with a new persistence dependency or a different key/version format:** rejected because it risks compatibility with existing player saves and adds unnecessary dependencies.
- **Keep parsing at each call site and add local `try/catch` blocks:** rejected because it leaves validation inconsistent and allows future call sites to repeat unsafe parsing.
- **Silently swallow storage errors and continue:** rejected because quota or browser storage failures need an observable diagnostic.
