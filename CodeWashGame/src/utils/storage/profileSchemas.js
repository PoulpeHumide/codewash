import { THEMES_LIST } from '../../constants/gameData';
import { getDefaultStats } from '../achievementUtils';

const VALID_THEMES = new Set(THEMES_LIST.map(({ id }) => id));

export const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export const isValidTheme = (theme) => typeof theme === 'string' && VALID_THEMES.has(theme);

export const normalizeSavedStats = (stats) => {
    if (!isRecord(stats)) return null;

    const defaults = getDefaultStats();
    const valid = Object.entries(stats).every(([key, value]) => {
        if (!(key in defaults)) return true;
        if (Array.isArray(defaults[key])) {
            return Array.isArray(value) && value.every((item) => typeof item === 'string');
        }
        return typeof value === 'number' && Number.isFinite(value) && value >= 0;
    });

    return valid ? { ...defaults, ...stats } : null;
};

export const getSavedSkillsData = (savedProfile) => {
    if (!isRecord(savedProfile)) return null;
    const skills = savedProfile.skills || savedProfile;
    return isRecord(skills) ? skills : null;
};
