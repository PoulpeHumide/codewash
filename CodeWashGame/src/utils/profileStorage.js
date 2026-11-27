import { getRandomAura } from './mobDisplayUtils';
import { calculateMobHealth, getRandomBoss, getRandomFriendlyMob, getRandomMiniboss, getRandomMob } from './gameUtils';
import { SKILL_DATA } from '../constants/gameData';
import { getDefaultStats } from './achievementUtils';

export const getStorageKey = (profileId) => `heroSkills_v23_p${profileId}`;

const readSavedProfile = (profileId, storage) => {
    let saved = storage.getItem(getStorageKey(profileId));
    if (!saved && profileId === 1) saved = storage.getItem('heroSkills_v23');
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

export const loadSkills = (profileId, storage = localStorage) => {
    const initial = {};
    SKILL_DATA.forEach((skill) => {
        initial[skill.id] = createInitialSkill(skill);
    });

    const saved = readSavedProfile(profileId, storage);
    try {
        if (saved) {
            const parsed = JSON.parse(saved);
            const data = parsed.skills || parsed;
            Object.keys(data).forEach((key) => normalizeSavedSkill(initial, key, data[key]));
            return initial;
        }
    } catch (error) {
        console.warn('Failed to parse saved skills:', error);
    }
    return initial;
};

export const loadTheme = (profileId, storage = localStorage) => {
    const saved = readSavedProfile(profileId, storage);
    try {
        return JSON.parse(saved).theme || 'minecraft';
    } catch (error) {
        console.warn('Failed to parse theme:', error);
    }
    return 'minecraft';
};

export const loadStats = (profileId, storage = localStorage) => {
    const saved = readSavedProfile(profileId, storage);
    try {
        const data = JSON.parse(saved);
        if (data.stats) {
            return { ...getDefaultStats(), ...data.stats };
        }
    } catch (error) {
        console.warn('Failed to parse stats:', error);
    }
    return getDefaultStats();
};

export const getProfileStats = (id, liveSkills = null, activeTheme = 'minecraft', storage = localStorage) => {
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

    const saved = readSavedProfile(id, storage);
    if (!saved) return null;
    try {
        const data = JSON.parse(saved);
        const skills = data.skills || data;
        const theme = data.theme || 'minecraft';
        let totalLevel = 0;
        let highestLevel = 0;
        Object.values(skills).forEach((skill) => {
            if (skill && typeof skill.level === 'number') {
                totalLevel += skill.level;
                if (skill.level > highestLevel) highestLevel = skill.level;
            }
        });
        return { totalLevel, highestLevel, skills, theme };
    } catch (error) {
        console.warn('Failed to parse profile stats:', error);
        return null;
    }
};
