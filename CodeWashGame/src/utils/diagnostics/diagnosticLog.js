const DEFAULT_LIMIT = 50;
const SAFE_DETAIL_FIELDS = ['source', 'operation', 'key', 'errorName', 'status'];

export const sanitizeDiagnosticMessage = (message) =>
    message
        .replace(
            /\b(password|passphrase|token|secret|authorization|api[_-]?key)\b\s*[:=]\s*[^\s,;]+/gi,
            '$1=[redacted]',
        )
        .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
        .replace(/https?:\/\/[^\s?#]+[?#][^\s]*/gi, '[URL query redacted]');

const normalizeMessage = (message) => {
    if (message instanceof Error) return sanitizeDiagnosticMessage(`${message.name}: ${message.message}`).slice(0, 500);
    if (typeof message !== 'string' || !message.trim()) throw new TypeError('A diagnostic message is required');
    return sanitizeDiagnosticMessage(message.trim()).slice(0, 500);
};

const sanitizeDetails = (details = {}) =>
    Object.fromEntries(
        SAFE_DETAIL_FIELDS.filter((field) => ['string', 'number'].includes(typeof details?.[field])).map((field) => [
            field,
            String(details[field]).slice(0, 120),
        ]),
    );

export const createDiagnosticBuffer = ({ limit = DEFAULT_LIMIT, now = Date.now } = {}) => {
    if (!Number.isInteger(limit) || limit < 1)
        throw new RangeError('Diagnostic buffer limit must be a positive integer');

    const entries = [];
    return {
        record({ category = 'application', level = 'error', message, details } = {}) {
            const entry = {
                occurredAt: new Date(now()).toISOString(),
                level: ['error', 'warning', 'info'].includes(level) ? level : 'error',
                category: String(category).slice(0, 40),
                message: normalizeMessage(message),
                details: sanitizeDetails(details),
            };
            entries.push(entry);
            if (entries.length > limit) entries.shift();
            return { ...entry, details: { ...entry.details } };
        },
        getRecent(count = entries.length) {
            const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : entries.length;
            if (safeCount === 0) return [];
            return entries.slice(-safeCount).map((entry) => ({ ...entry, details: { ...entry.details } }));
        },
        clear() {
            entries.length = 0;
        },
    };
};

export const diagnosticBuffer = createDiagnosticBuffer();
export const recordDiagnostic = (entry) => diagnosticBuffer.record(entry);
export const getRecentDiagnostics = (count) => diagnosticBuffer.getRecent(count);

const errorSource = (filename) => {
    if (typeof filename !== 'string' || !filename) return undefined;
    return filename.split(/[?#]/, 1)[0].split('/').at(-1)?.slice(0, 120);
};

export const attachRuntimeErrorCapture = (target = globalThis.window, buffer = diagnosticBuffer) => {
    if (!target?.addEventListener || !target?.removeEventListener) return () => {};

    const onError = (event) => {
        buffer.record({
            category: 'runtime',
            message: event.message || event.error || 'Uncaught runtime error',
            details: { source: errorSource(event.filename) },
        });
    };
    const onUnhandledRejection = (event) => {
        buffer.record({ category: 'runtime', message: event.reason || 'Unhandled promise rejection' });
    };

    target.addEventListener('error', onError);
    target.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
        target.removeEventListener('error', onError);
        target.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
};
