import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStorageAdapter } from './storageAdapter';
import {
    getProfileDataKey,
    loadCurrentProfile,
    loadParentStatus,
    loadProfileNames,
    PROFILE_METADATA_KEYS,
    saveCurrentProfile,
    saveParentStatus,
    saveProfileNames,
} from './profileRepository';

const createMemoryStorage = (initialEntries = {}) => {
    const values = new Map(Object.entries(initialEntries));
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
    };
};

const DEFAULT_NAMES = { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
const DEFAULT_STATUS = { 1: false, 2: false, 3: false };

afterEach(() => {
    vi.restoreAllMocks();
});

describe('profile storage repository', () => {
    it('preserves profile keys and loads missing metadata defaults', () => {
        const storage = createStorageAdapter(createMemoryStorage());

        expect(getProfileDataKey(2)).toBe('heroSkills_v23_p2');
        expect(PROFILE_METADATA_KEYS).toEqual({
            currentProfile: 'currentProfile_v1',
            profileNames: 'heroProfileNames_v1',
            parentStatus: 'heroParentStatus_v1',
        });
        expect(loadCurrentProfile(storage)).toBe(1);
        expect(loadProfileNames(storage)).toEqual(DEFAULT_NAMES);
        expect(loadParentStatus(storage)).toEqual(DEFAULT_STATUS);
    });

    it.each(['1', '2', '3'])('accepts stored profile ID %s', (profileId) => {
        const storage = createMemoryStorage({ currentProfile_v1: profileId });
        expect(loadCurrentProfile(storage)).toBe(Number(profileId));
    });

    it.each(['0', '-1', '4', '999', 'abc', 'null', 'NaN', '2.5'])(
        'rejects invalid stored profile ID %s',
        (profileId) => {
            const storage = createMemoryStorage({ currentProfile_v1: profileId });
            expect(loadCurrentProfile(storage)).toBe(1);
        },
    );

    it('preserves valid partial metadata while rejecting corrupt or invalid JSON schemas', () => {
        const valid = createStorageAdapter(
            createMemoryStorage({
                heroProfileNames_v1: '{"2":"Ranger"}',
                heroParentStatus_v1: '{"2":true}',
            }),
        );
        expect(loadProfileNames(valid)).toEqual({ 2: 'Ranger' });
        expect(loadParentStatus(valid)).toEqual({ 2: true });

        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const corrupt = createStorageAdapter(
            createMemoryStorage({
                heroProfileNames_v1: '{truncated',
                heroParentStatus_v1: '{"1":true',
            }),
        );
        expect(loadProfileNames(corrupt)).toEqual(DEFAULT_NAMES);
        expect(loadParentStatus(corrupt)).toEqual(DEFAULT_STATUS);
        expect(warning).toHaveBeenCalledWith('Failed to parse profile names:', expect.any(SyntaxError));
        expect(warning).toHaveBeenCalledWith('Failed to parse parent status:', expect.any(SyntaxError));

        const invalid = createStorageAdapter(
            createMemoryStorage({
                heroProfileNames_v1: '{"1":4}',
                heroParentStatus_v1: '[]',
            }),
        );
        expect(loadProfileNames(invalid)).toEqual(DEFAULT_NAMES);
        expect(loadParentStatus(invalid)).toEqual(DEFAULT_STATUS);
        expect(warning).toHaveBeenCalledWith('Invalid profile names; using defaults.');
        expect(warning).toHaveBeenCalledWith('Invalid parent status; using defaults.');
    });

    it('writes existing metadata keys and JSON formats through the repository', () => {
        const rawStorage = createMemoryStorage();
        const storage = createStorageAdapter(rawStorage);

        expect(saveCurrentProfile(2, storage)).toBe(true);
        expect(saveProfileNames({ 2: 'Ranger' }, storage)).toBe(true);
        expect(saveParentStatus({ 2: true }, storage)).toBe(true);
        expect(rawStorage.getItem('currentProfile_v1')).toBe('2');
        expect(rawStorage.getItem('heroProfileNames_v1')).toBe('{"2":"Ranger"}');
        expect(rawStorage.getItem('heroParentStatus_v1')).toBe('{"2":true}');
    });
});
