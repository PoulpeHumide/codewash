import { describe, expect, it, vi } from 'vitest';
import {
    attachRuntimeErrorCapture,
    createDiagnosticBuffer,
    diagnosticBuffer,
    getRecentDiagnostics,
    recordDiagnostic,
    sanitizeDiagnosticMessage,
} from './diagnosticLog';

describe('diagnostic buffer', () => {
    it('keeps bounded, sanitized copies of recent errors', () => {
        const buffer = createDiagnosticBuffer({ limit: 2, now: () => 0 });
        buffer.record({
            category: 'storage',
            message: new Error('quota exceeded'),
            details: { operation: 'write', key: 'heroSkills_v23', password: 'private' },
        });
        buffer.record({ category: 'audio', message: 'play rejected', details: { source: 'click.wav' } });
        buffer.record({ category: 'runtime', message: 'last error' });

        const entries = buffer.getRecent();
        expect(entries).toHaveLength(2);
        expect(entries[0]).toMatchObject({
            occurredAt: '1970-01-01T00:00:00.000Z',
            category: 'audio',
            message: 'play rejected',
            details: { source: 'click.wav' },
        });
        expect(entries[1].category).toBe('runtime');
        expect(buffer.getRecent(1)).toEqual([entries[1]]);

        entries[0].details.source = 'changed';
        expect(buffer.getRecent(2)[0].details.source).toBe('click.wav');
        expect(buffer.getRecent(0)).toEqual([]);
        expect(buffer.getRecent(Number.NaN)).toHaveLength(2);
        buffer.record({ level: 'debug', message: 'level defaults to error', category: '' });
        expect(buffer.getRecent().at(-1).level).toBe('error');
        buffer.clear();
        expect(buffer.getRecent()).toEqual([]);
    });

    it('rejects invalid limits and ignores no diagnostic content silently', () => {
        expect(() => createDiagnosticBuffer({ limit: 0 })).toThrow(RangeError);
        const buffer = createDiagnosticBuffer();
        expect(() => buffer.record({ message: '' })).toThrow(TypeError);
    });

    it('exposes the shared buffer through the report-facing helpers', () => {
        diagnosticBuffer.clear();
        recordDiagnostic({ category: 'application', message: 'Captured error' });
        expect(getRecentDiagnostics()).toMatchObject([{ message: 'Captured error' }]);
        diagnosticBuffer.clear();
    });

    it('redacts credential-like values and URL query strings from diagnostic text', () => {
        const message = sanitizeDiagnosticMessage(
            'Request failed: password=private token:secret Bearer bearer-secret https://service.test/api?key=private',
        );
        expect(message).not.toContain('private');
        expect(message).not.toContain('bearer-secret');
        expect(message).toContain('password=[redacted]');
        expect(message).toContain('Bearer [redacted]');
        expect(message).toContain('[URL query redacted]');
    });

    it('captures runtime errors and unhandled rejections and removes its listeners', () => {
        const buffer = createDiagnosticBuffer({ now: () => 1000 });
        const listeners = new Map();
        const target = {
            addEventListener: vi.fn((name, listener) => listeners.set(name, listener)),
            removeEventListener: vi.fn((name) => listeners.delete(name)),
        };
        const detach = attachRuntimeErrorCapture(target, buffer);

        listeners.get('error')({ message: 'render failed', filename: '/app/chunk.js?token=hidden' });
        listeners.get('unhandledrejection')({ reason: new Error('request failed') });
        listeners.get('error')({ error: new Error('event error') });
        listeners.get('error')({});
        listeners.get('unhandledrejection')({});

        expect(buffer.getRecent()).toMatchObject([
            { category: 'runtime', message: 'render failed', details: { source: 'chunk.js' } },
            { category: 'runtime', message: 'Error: request failed' },
            { category: 'runtime', message: 'Error: event error' },
            { category: 'runtime', message: 'Uncaught runtime error' },
            { category: 'runtime', message: 'Unhandled promise rejection' },
        ]);
        detach();
        expect(target.removeEventListener).toHaveBeenCalledTimes(2);
        expect(listeners.size).toBe(0);
    });

    it('provides a harmless cleanup when runtime event listeners are unavailable', () => {
        expect(() => attachRuntimeErrorCapture(null)()).not.toThrow();
        expect(() => attachRuntimeErrorCapture({})()).not.toThrow();
        expect(() => attachRuntimeErrorCapture({ addEventListener: vi.fn() })()).not.toThrow();
    });
});
