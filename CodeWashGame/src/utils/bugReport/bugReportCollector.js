import { sanitizeDiagnosticMessage } from '../diagnostics/diagnosticLog';

const REPORTABLE_STATS = [
    'phantomsCaught',
    'totalMobsDefeated',
    'totalBossesDefeated',
    'totalMinibossesDefeated',
    'totalDeaths',
    'themeChanges',
    'borderChanges',
    'battlesThisSession',
    'perfectMemoryGames',
];

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const normalizedText = (value, fallback = 'unknown') =>
    typeof value === 'string' && value.trim() ? value.trim().slice(0, 120) : fallback;

export const detectPlatform = (environment = globalThis.window) =>
    /electron\/\d/i.test(environment?.navigator?.userAgent || '') ? 'electron' : 'browser';

export const sanitizeGameState = (gameState = {}) => {
    try {
        const skills = isRecord(gameState.skills) ? JSON.parse(JSON.stringify(gameState.skills)) : {};
        const stats = isRecord(gameState.stats) ? gameState.stats : {};
        const safeStats = Object.fromEntries(
            REPORTABLE_STATS.filter((key) => Number.isFinite(stats[key]) && stats[key] >= 0).map((key) => [
                key,
                stats[key],
            ]),
        );
        return { skills, stats: safeStats };
    } catch (error) {
        throw new Error('Game state could not be serialized for the report.', { cause: error });
    }
};

const sanitizeLogs = (logs) =>
    logs.slice(-50).map((entry) => ({
        occurredAt: normalizedText(entry.occurredAt, ''),
        category: normalizedText(entry.category, 'application'),
        message: sanitizeDiagnosticMessage(normalizedText(entry.message, 'Unknown diagnostic')),
        details: isRecord(entry.details)
            ? Object.fromEntries(
                  ['source', 'operation', 'key', 'errorName', 'status']
                      .filter((key) => ['string', 'number'].includes(typeof entry.details[key]))
                      .map((key) => [key, String(entry.details[key]).slice(0, 120)]),
              )
            : {},
    }));

const collectOptionalData = ({ includeGameState, gameState, includeLogs, logs }) => {
    const data = {};
    if (includeGameState) data.gameState = sanitizeGameState(gameState);
    if (includeLogs) data.logs = sanitizeLogs(Array.isArray(logs) ? logs : []);
    return data;
};

const normalizeReportInput = (input) => {
    const source = input && typeof input === 'object' ? input : {};
    return {
        description: source.description,
        recipient: source.recipient ?? '',
        theme: source.theme,
        platform: source.platform ?? 'browser',
        appVersion: source.appVersion ?? 'unknown',
        gameState: source.gameState,
        logs: source.logs ?? [],
        includeGameState: source.includeGameState ?? false,
        includeLogs: source.includeLogs ?? false,
        attachments: source.attachments ?? [],
    };
};

const normalizeReportOptions = (options) => {
    const now = typeof options?.now === 'function' ? options.now : Date.now;
    return {
        now,
        idFactory: typeof options?.idFactory === 'function' ? options.idFactory : () => `bug-${now()}`,
    };
};

const buildMetadata = ({ appVersion, theme, platform }) => ({
    appVersion: normalizedText(appVersion),
    theme: normalizedText(theme),
    platform: platform === 'electron' ? 'electron' : 'browser',
});

export const buildBugReport = (input, options) => {
    const data = normalizeReportInput(input);
    const { now, idFactory } = normalizeReportOptions(options);
    const { description, recipient, gameState, logs, includeGameState, includeLogs, attachments } = data;
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    if (!cleanDescription) throw new TypeError('A report description is required');

    const createdAt = new Date(now()).toISOString();
    return {
        id: idFactory(),
        createdAt,
        recipient: normalizedText(recipient, ''),
        description: cleanDescription.slice(0, 2000),
        metadata: buildMetadata(data),
        ...collectOptionalData({ includeGameState, gameState, includeLogs, logs }),
        attachments: Array.from(attachments),
    };
};
