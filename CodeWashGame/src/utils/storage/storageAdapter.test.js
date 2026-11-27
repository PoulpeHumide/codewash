// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage, createStorageAdapter } from './storageAdapter';
import { diagnosticBuffer } from '../diagnostics/diagnosticLog';

const createMemoryStorage = () => {
    const values = new Map();
    return {
        getItem: vi.fn((key) => values.get(key) ?? null),
        setItem: vi.fn((key, value) => values.set(key, String(value))),
        removeItem: vi.fn((key) => values.delete(key)),
    };
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('storage adapter', () => {
    it('reads, writes, removes, and serializes values through an injected storage', () => {
        const storage = createMemoryStorage();
        const adapter = createStorageAdapter(storage);

        expect(adapter.setItem('profile', 2)).toBe(true);
        expect(adapter.getItem('profile')).toBe('2');
        expect(adapter.writeJSON('save', { level: 4 })).toBe(true);
        expect(storage.getItem('save')).toBe('{"level":4}');
        expect(adapter.readJSON('save', null)).toEqual({ level: 4 });
        expect(adapter.readJSON('missing', { level: 1 })).toEqual({ level: 1 });
        expect(adapter.removeItem('profile')).toBe(true);
        expect(adapter.getItem('profile')).toBeNull();
    });

    it('reports corrupt JSON and failed serialization without returning successful writes', () => {
        const storage = createMemoryStorage();
        const adapter = createStorageAdapter(storage);
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const circular = {};
        circular.self = circular;

        expect(adapter.parseJSON('{truncated', null, 'Failed to parse profile:')).toBeNull();
        expect(adapter.writeJSON('undefined', undefined)).toBe(false);
        expect(adapter.writeJSON('circular', circular)).toBe(false);
        expect(warning).toHaveBeenCalledWith('Failed to parse profile:', expect.any(SyntaxError));
        expect(warning).toHaveBeenCalledWith(
            'Failed to serialize localStorage key "undefined":',
            expect.any(TypeError),
        );
        expect(warning).toHaveBeenCalledWith('Failed to serialize localStorage key "circular":', expect.any(TypeError));
    });

    it('handles storage access and quota errors explicitly', () => {
        diagnosticBuffer.clear();
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const quotaError = new DOMException('Storage quota exceeded', 'QuotaExceededError');
        const blockedStorage = {
            getItem: () => {
                throw new DOMException('Storage access denied', 'SecurityError');
            },
            setItem: () => {
                throw quotaError;
            },
            removeItem: () => {
                throw new DOMException('Storage access denied', 'SecurityError');
            },
        };
        const adapter = createStorageAdapter(blockedStorage);

        expect(adapter.getItem('profile')).toBeNull();
        expect(adapter.setItem('profile', '2')).toBe(false);
        expect(adapter.writeJSON('save', { level: 4 })).toBe(false);
        expect(adapter.removeItem('profile')).toBe(false);
        expect(warning).toHaveBeenCalledWith('Failed to write localStorage key "save":', quotaError);
        expect(warning).toHaveBeenCalledTimes(4);
        expect(
            diagnosticBuffer.getRecent().find((entry) => entry.details.errorName === 'QuotaExceededError'),
        ).toMatchObject({
            category: 'storage',
            message: 'A local save operation failed',
            details: { operation: 'write', key: 'profile', errorName: 'QuotaExceededError' },
        });
        diagnosticBuffer.clear();
    });

    it('resolves a storage provider lazily and uses the browser storage default', () => {
        const storage = createMemoryStorage();
        const provider = vi.fn(() => storage);
        const injectedAdapter = createStorageAdapter(provider);

        expect(injectedAdapter.getItem('missing')).toBeNull();
        expect(provider).toHaveBeenCalledOnce();
        expect(browserStorage.getItem('__storage_adapter_missing__')).toBeNull();
    });
});
