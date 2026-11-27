const resolveStorage = (storageProvider) =>
    typeof storageProvider === 'function' ? storageProvider() : storageProvider;

const warnStorageError = (operation, key, error) => {
    console.warn(`Failed to ${operation} localStorage key "${key}":`, error);
};

export const createStorageAdapter = (storageProvider = () => globalThis.localStorage) => {
    const getItem = (key) => {
        try {
            return resolveStorage(storageProvider).getItem(key);
        } catch (error) {
            warnStorageError('read', key, error);
            return null;
        }
    };

    const setItem = (key, value) => {
        try {
            resolveStorage(storageProvider).setItem(key, String(value));
            return true;
        } catch (error) {
            warnStorageError('write', key, error);
            return false;
        }
    };

    const removeItem = (key) => {
        try {
            resolveStorage(storageProvider).removeItem(key);
            return true;
        } catch (error) {
            warnStorageError('remove', key, error);
            return false;
        }
    };

    const parseJSON = (serialized, fallback, warningMessage = 'Failed to parse stored JSON:') => {
        try {
            return JSON.parse(serialized);
        } catch (error) {
            console.warn(warningMessage, error);
            return fallback;
        }
    };

    const readJSON = (key, fallback, warningMessage) => {
        const serialized = getItem(key);
        return serialized === null ? fallback : parseJSON(serialized, fallback, warningMessage);
    };

    const writeJSON = (key, value) => {
        try {
            const serialized = JSON.stringify(value);
            if (serialized === undefined) throw new TypeError('Value cannot be serialized as JSON');
            return setItem(key, serialized);
        } catch (error) {
            warnStorageError('serialize', key, error);
            return false;
        }
    };

    return { getItem, setItem, removeItem, parseJSON, readJSON, writeJSON };
};

export const browserStorage = createStorageAdapter();
