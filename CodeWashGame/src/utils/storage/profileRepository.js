import { browserStorage, createStorageAdapter } from './storageAdapter';
import { isRecord } from './profileSchemas';

export const PROFILE_METADATA_KEYS = {
    currentProfile: 'currentProfile_v1',
    profileNames: 'heroProfileNames_v1',
    parentStatus: 'heroParentStatus_v1',
};

export const LEGACY_PROFILE_DATA_KEY = 'heroSkills_v23';
export const getProfileDataKey = (profileId) => `heroSkills_v23_p${profileId}`;

const PROFILE_IDS = new Set(['1', '2', '3']);
const DEFAULT_PROFILE_NAMES = { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
const DEFAULT_PARENT_STATUS = { 1: false, 2: false, 3: false };
const INVALID_JSON = Symbol('invalid-json');

const getAdapter = (storage) => (typeof storage.readJSON === 'function' ? storage : createStorageAdapter(storage));

const isValidProfileMetadata = (metadata, isValidValue) =>
    isRecord(metadata) &&
    Object.entries(metadata).every(([profileId, value]) => PROFILE_IDS.has(profileId) && isValidValue(value));

const readProfileMetadata = (key, defaults, isValidValue, label, storage) => {
    const adapter = getAdapter(storage);
    const serialized = adapter.getItem(key);
    if (serialized === null) return { ...defaults };

    const metadata = adapter.parseJSON(serialized, INVALID_JSON, `Failed to parse ${label}:`);
    if (metadata !== INVALID_JSON && isValidProfileMetadata(metadata, isValidValue)) return metadata;

    if (metadata !== INVALID_JSON) console.warn(`Invalid ${label}; using defaults.`);
    return { ...defaults };
};

export const loadCurrentProfile = (storage = browserStorage) => {
    const storedProfile = getAdapter(storage).getItem(PROFILE_METADATA_KEYS.currentProfile);
    if (storedProfile === null) return 1;
    if (/^[1-3]$/.test(storedProfile)) return Number(storedProfile);

    console.warn('Invalid current profile; using profile 1.');
    return 1;
};

export const loadProfileNames = (storage = browserStorage) =>
    readProfileMetadata(
        PROFILE_METADATA_KEYS.profileNames,
        DEFAULT_PROFILE_NAMES,
        (name) => typeof name === 'string',
        'profile names',
        storage,
    );

export const loadParentStatus = (storage = browserStorage) =>
    readProfileMetadata(
        PROFILE_METADATA_KEYS.parentStatus,
        DEFAULT_PARENT_STATUS,
        (verified) => typeof verified === 'boolean',
        'parent status',
        storage,
    );

export const saveCurrentProfile = (profileId, storage = browserStorage) =>
    getAdapter(storage).setItem(PROFILE_METADATA_KEYS.currentProfile, profileId);

export const saveProfileNames = (names, storage = browserStorage) =>
    getAdapter(storage).writeJSON(PROFILE_METADATA_KEYS.profileNames, names);

export const saveParentStatus = (status, storage = browserStorage) =>
    getAdapter(storage).writeJSON(PROFILE_METADATA_KEYS.parentStatus, status);
