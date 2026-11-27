# ADR-005: Add privacy-conscious bug reporting

- **Status:** Accepted
- **Date:** 2026-11-27
- **Debt item:** DEBT-06

## Context

The original bug-report modal was informational only. The application has no built-in support backend, and the report can contain user-written text, optional game progress, diagnostic events, and user-selected files. The flow must remain usable without a server, work in browsers and Electron, expose delivery failures, and make the outgoing data reviewable before submission.

## Decision

- Keep the existing `isOpen` / `onClose` modal contract and provide the current theme and a minimal game snapshot through `GameChrome`. Do not include profile names or profile identifiers.
- Require a user-entered description. Show the recipient, app version, theme, platform, description, selected attachment names, and the exact sanitized save/log payload in a preview.
- Exclude save data and diagnostics by default. Include only skill progress and an allowlist of numeric game counters after explicit opt-in. Include at most 50 recent diagnostic records after separate opt-in.
- Use a bounded in-memory diagnostic buffer. Capture runtime errors using listeners attached and removed with the `App` lifecycle; storage and audio adapters record structured events directly. Diagnostic details are allowlisted, common credential-like values and URL query strings are redacted, and entries omit stack traces, arbitrary payloads, and browser-identifying data.
- Validate attachments against an explicit image/document/text MIME allowlist: at most 10 files, 5 MiB per file, and 15 MiB in total. The local bundle preserves approved file bytes as data URLs.
- Define the transport contract as an injectable `send(report)` method. The HTTP implementation sends multipart form data to `VITE_BUG_REPORT_ENDPOINT`, with the JSON report in `report` and files in repeated `attachments` fields. It omits credentials and accepts a 2xx response with an optional JSON `id` or `204 No Content`.
- Read the optional recipient from `VITE_BUG_REPORT_CONTACT`; use the package version unless `VITE_APP_VERSION` is set. These are public build-time values, not secret storage.
- If no endpoint is configured or a send fails, download a local JSON bundle. The UI clearly states whether a report was received remotely or only exported locally and names the configured contact as the manual recipient when available. No recipient is hard-coded and no mail client or automatic screenshot capture is assumed.

## Consequences

- Users can submit a report without a backend, then share the self-contained JSON bundle manually. The application does not claim that a local export was received by a maintainer.
- Operators must configure a CORS-enabled endpoint to receive reports automatically; it must parse the multipart schema documented in the README.
- Save state and diagnostic logs are opt-in, attachments are constrained, and the user can inspect the complete sanitized payload before submission.
- The form, collector, validator, transport, local export, diagnostic buffer, lifecycle, and existing menu integration are covered by automated tests.

## Alternatives considered

- **Hard-code a maintainer email:** rejected because destinations differ between installations and must remain configurable.
- **Use `mailto:` as the primary transport:** rejected because mail clients cannot reliably receive arbitrary file attachments through a `mailto:` URL. A local bundle is complete and can be attached manually.
- **Always upload the entire profile and all logs:** rejected because unrelated profile metadata and runtime details are not needed for every report.
- **Automatically capture the screen:** rejected because it can capture unrelated personal content and is not consistently available across browser/Electron environments. Users choose image files explicitly.
- **Require a hosted backend:** rejected because none exists in this repository and local export still provides a useful offline path.
