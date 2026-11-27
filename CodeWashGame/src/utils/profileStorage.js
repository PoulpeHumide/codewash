import { getRandomAura } from './mobDisplayUtils';
import { calculateMobHealth, getRandomBoss, getRandomFriendlyMob, getRandomMiniboss, getRandomMob } from './gameUtils';
import { SKILL_DATA } from '../constants/gameData';
import { getDefaultStats } from './achievementUtils';
import { browserStorage, createStorageAdapter } from './storage/storageAdapter';
import { getProfileDataKey, LEGACY_PROFILE_DATA_KEY } from './storage/profileRepository';
import { getSavedSkillsData, isRecord, isValidTheme, normalizeSavedStats } from './storage/profileSchemas';

const INVALID_SAVED_PROFILE = Symbol('invalid-saved-profile');
const getStorageAdapter = (storage) =>
    typeof storage.readJSON === 'function' ? storage : createStorageAdapter(storage);

export const getStorageKey = getProfileDataKey;

const readSavedProfile = (profileId, storage) => {
    let saved = storage.getItem(getStorageKey(profileId));
    if (!saved && profileId === 1) saved = storage.getItem(LEGACY_PROFILE_DATA_KEY);
    return saved;
};

const createSpecialSkillMobs = (skill) => ({
    memoryMob: skill.id === 'memory' ? getRandomFriendlyMob() : null,
    patternMob: skill.id === 'patterns' ? getRandomMob(null) : null,
});

const createCombatSkillMobs = (skill) => ({
    readingMob: skill.id === 'reading' ? getRandomMob(null) : null,
    mathMob: skill.id === 'math' ? getRandomMob(null) : null,
    writingMob: skill.id === 'writing' ? getRandomMob(null) : null,
});

const createSkillAuras = (skill) => ({
    readingMobAura: skill.id === 'reading' ? getRandomAura() : null,
    mathMobAura: skill.id === 'math' ? getRandomAura() : null,
    writingMobAura: skill.id === 'writing' ? getRandomAura() : null,
    patternMobAura: skill.id === 'patterns' ? getRandomAura() : null,
});

const createInitialSkill = (skill) => {
    const initialDifficulty = 1;
    return {
        level: 1,
        xp: 0,
        currentMob: getRandomMob(null),
        difficulty: initialDifficulty,
        earnedBadges: [],
        mobHealth: calculateMobHealth(initialDifficulty),
        mobMaxHealth: calculateMobHealth(initialDifficulty),
        lostLevel: false,
        recoveryDifficulty: null,
        ...createSpecialSkillMobs(skill),
        currentMiniboss: getRandomMiniboss(),
        currentBoss: getRandomBoss(),
        ...createCombatSkillMobs(skill),
        ...createSkillAuras(skill),
        currentMinibossAura: getRandomAura(),
        currentBossAura: getRandomAura(),
    };
};

const ensureCoreSkillFields = (skill) => {
    if (typeof skill.difficulty !== 'number') skill.difficulty = 1;
    if (!Array.isArray(skill.earnedBadges)) skill.earnedBadges = [];
    if (typeof skill.mobHealth !== 'number') {
        const difficulty = skill.difficulty || 1;
        skill.mobHealth = calculateMobHealth(difficulty);
        skill.mobMaxHealth = calculateMobHealth(difficulty);
    }
    if (typeof skill.lostLevel !== 'boolean') skill.lostLevel = false;
    if (skill.recoveryDifficulty === undefined) skill.recoveryDifficulty = null;
};

const ensureSpecialSkillMobs = (skill, key) => {
    if (key === 'memory' && !skill.memoryMob) skill.memoryMob = getRandomFriendlyMob();
    if (key === 'patterns' && !skill.patternMob) skill.patternMob = getRandomMob(null);
};

const ensureCombatSkillMobs = (skill, key) => {
    if (key === 'reading' && !skill.readingMob) skill.readingMob = getRandomMob(null);
    if (key === 'math' && !skill.mathMob) skill.mathMob = getRandomMob(null);
    if (key === 'writing' && !skill.writingMob) skill.writingMob = getRandomMob(null);
};

const ensureSkillMobs = (skill, key) => {
    ensureSpecialSkillMobs(skill, key);
    ensureCombatSkillMobs(skill, key);
};

const ensureSkillAuras = (skill, key) => {
    if (key === 'reading' && !skill.readingMobAura) skill.readingMobAura = getRandomAura();
    if (key === 'math' && !skill.mathMobAura) skill.mathMobAura = getRandomAura();
    if (key === 'writing' && !skill.writingMobAura) skill.writingMobAura = getRandomAura();
    if (key === 'patterns' && !skill.patternMobAura) skill.patternMobAura = getRandomAura();
};

const ensureEncounterData = (skill, key) => {
    if (key === 'cleaning' || key === 'memory') return;
    if (!skill.currentMiniboss) skill.currentMiniboss = getRandomMiniboss();
    if (!skill.currentBoss) skill.currentBoss = getRandomBoss();
    if (!skill.currentMinibossAura) skill.currentMinibossAura = getRandomAura();
    if (!skill.currentBossAura) skill.currentBossAura = getRandomAura();
};

const normalizeSavedSkill = (initial, key, savedSkill) => {
    initial[key] = { ...initial[key], ...savedSkill };
    const skill = initial[key];
    ensureCoreSkillFields(skill);
    ensureSkillMobs(skill, key);
    ensureSkillAuras(skill, key);
    ensureEncounterData(skill, key);
};

export const loadSkills = (profileId, storage = browserStorage) => {
    const adapter = getStorageAdapter(storage);
    const initial = {};
    SKILL_DATA.forEach((skill) => {
        initial[skill.id] = createInitialSkill(skill);
    });

    const saved = readSavedProfile(profileId, adapter);
    if (saved) {
        const parsed = adapter.parseJSON(saved, INVALID_SAVED_PROFILE, 'Failed to parse saved skills:');
        if (parsed === INVALID_SAVED_PROFILE) return initial;
        const data = getSavedSkillsData(parsed);
        if (!data) {
            console.warn('Invalid saved skills; using defaults.');
            return initial;
        }
        Object.keys(data).forEach((key) => {
            if (!isRecord(data[key])) {
                console.warn(`Invalid saved skill "${key}"; using defaults.`);
                return;
            }
            normalizeSavedSkill(initial, key, data[key]);
        });
    }
    return initial;
};

export const loadTheme = (profileId, storage = browserStorage) => {
    const adapter = getStorageAdapter(storage);
    const saved = readSavedProfile(profileId, adapter);
    if (!saved) return 'minecraft';

    const data = adapter.parseJSON(saved, INVALID_SAVED_PROFILE, 'Failed to parse theme:');
    if (data === INVALID_SAVED_PROFILE) return 'minecraft';
    if (isRecord(data) && isValidTheme(data.theme)) return data.theme;
    if (isRecord(data) && data.theme === undefined) return 'minecraft';

    console.warn('Invalid saved theme; using minecraft.');
    return 'minecraft';
};

export const loadStats = (profileId, storage = browserStorage) => {
    const adapter = getStorageAdapter(storage);
    const saved = readSavedProfile(profileId, adapter);
    if (!saved) return getDefaultStats();

    const data = adapter.parseJSON(saved, INVALID_SAVED_PROFILE, 'Failed to parse stats:');
    if (data === INVALID_SAVED_PROFILE) return getDefaultStats();
    if (!isRecord(data) || data.stats === undefined) return getDefaultStats();

    const stats = normalizeSavedStats(data.stats);
    if (stats) return stats;

    console.warn('Invalid saved statistics; using defaults.');
    return getDefaultStats();
};

export const getProfileStats = (id, liveSkills = null, activeTheme = 'minecraft', storage = browserStorage) => {
    if (liveSkills) {
        let totalLevel = 0;
        let highestLevel = 0;
        Object.values(liveSkills).forEach((skill) => {
            if (skill && typeof skill.level === 'number') {
                totalLevel += skill.level;
                if (skill.level > highestLevel) highestLevel = skill.level;
            }
        });
        return { totalLevel, highestLevel, skills: liveSkills, theme: activeTheme };
    }

    const adapter = getStorageAdapter(storage);
    const saved = readSavedProfile(id, adapter);
    if (!saved) return null;
    const data = adapter.parseJSON(saved, INVALID_SAVED_PROFILE, 'Failed to parse profile stats:');
    if (data === INVALID_SAVED_PROFILE) return null;

    const skills = getSavedSkillsData(data);
    if (!skills) {
        console.warn('Invalid saved profile stats; no skill data was found.');
        return null;
    }

    const theme = isRecord(data) && isValidTheme(data.theme) ? data.theme : 'minecraft';
    let totalLevel = 0;
    let highestLevel = 0;
    Object.values(skills).forEach((skill) => {
        if (skill && typeof skill.level === 'number') {
            totalLevel += skill.level;
            if (skill.level > highestLevel) highestLevel = skill.level;
        }
    });
    return { totalLevel, highestLevel, skills, theme };
};
