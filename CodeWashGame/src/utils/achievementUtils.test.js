// Characterization tests for src/utils/achievementUtils.js (DEBT-01).
// They freeze the behavior of the original code as received (tag v0-original).
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    addUniqueToArray,
    getAchievementDisplayName,
    getCurrentTier,
    getDefaultStats,
    getNewTierAchievements,
    getNewlyUnlockedAchievements,
    getNextTier,
    getTierProgress,
    isAchievementUnlocked,
    recordLoginDate,
} from './achievementUtils';

const skillsAt = (...levels) => Object.fromEntries(levels.map((level, i) => [`skill${i}`, { level }]));

afterEach(() => {
    vi.useRealTimers();
});

describe('default stats', () => {
    it('starts every counter at zero and every list empty', () => {
        expect(getDefaultStats()).toEqual({
            phantomsCaught: 0,
            totalMobsDefeated: 0,
            totalBossesDefeated: 0,
            totalMinibossesDefeated: 0,
            totalDeaths: 0,
            uniqueMobsDefeated: [],
            uniqueBossesDefeated: [],
            uniqueMinibossesDefeated: [],
            themeChanges: 0,
            borderChanges: 0,
            battlesThisSession: 0,
            loginDates: [],
            perfectMemoryGames: 0,
            achievementsUnlocked: [],
        });
    });

    it('returns a fresh object each time', () => {
        expect(getDefaultStats()).not.toBe(getDefaultStats());
    });
});

describe('unlock checks', () => {
    it('unlocks one-time achievements through their own rule', () => {
        expect(isAchievementUnlocked('first_steps', { totalMobsDefeated: 0 }, {})).toBe(false);
        expect(isAchievementUnlocked('first_steps', { totalMobsDefeated: 1 }, {})).toBe(true);
    });

    it('unlocks tiered achievements once the first tier is reached', () => {
        expect(isAchievementUnlocked('phantom_hunter', { phantomsCaught: 4 }, {})).toBe(false);
        expect(isAchievementUnlocked('phantom_hunter', { phantomsCaught: 5 }, {})).toBe(true);
    });

    it('treats unknown achievements as locked', () => {
        expect(isAchievementUnlocked('does_not_exist', {}, {})).toBe(false);
    });
});

describe('tiers', () => {
    it('finds the highest reached tier and the next one', () => {
        const stats = { phantomsCaught: 12 };
        expect(getCurrentTier('phantom_hunter', stats, {})).toBe(1);
        expect(getNextTier('phantom_hunter', stats, {})).toEqual({ level: 15, tierName: 'Gold Ghost Buster' });
    });

    it('reports no tier before the first one and none after the last one', () => {
        expect(getCurrentTier('phantom_hunter', { phantomsCaught: 0 }, {})).toBe(-1);
        expect(getNextTier('phantom_hunter', { phantomsCaught: 100 }, {})).toBeNull();
        expect(getCurrentTier('first_steps', {}, {})).toBe(-1);
        expect(getNextTier('first_steps', {}, {})).toBeNull();
    });

    it('computes progress inside the current tier', () => {
        expect(getTierProgress('phantom_hunter', { phantomsCaught: 0 }, {})).toBe(0);
        expect(getTierProgress('phantom_hunter', { phantomsCaught: 2 }, {})).toBe(40);
        expect(getTierProgress('phantom_hunter', { phantomsCaught: 12 }, {})).toBe(40);
        expect(getTierProgress('phantom_hunter', { phantomsCaught: 100 }, {})).toBe(100);
        expect(getTierProgress('first_steps', {}, {})).toBe(0);
    });

    it('uses the lowest skill level for skill mastery and the sum for combined levels', () => {
        const skills = skillsAt(45, 20, 60);
        expect(getCurrentTier('skill_mastery', {}, skills)).toBe(0);
        expect(getCurrentTier('combined_levels', {}, skills)).toBe(0);
    });
});

describe('change detection for toasts', () => {
    it('lists achievements that switched from locked to unlocked', () => {
        const unlocked = getNewlyUnlockedAchievements(
            getDefaultStats(),
            { ...getDefaultStats(), totalMobsDefeated: 1 },
            skillsAt(1, 1),
            skillsAt(1, 1),
        );
        expect(unlocked).toContain('first_steps');
        expect(unlocked).not.toContain('level_up');
    });

    it('lists tiered achievements that reached a new tier', () => {
        const newTiers = getNewTierAchievements(
            { ...getDefaultStats(), phantomsCaught: 9 },
            { ...getDefaultStats(), phantomsCaught: 15 },
            skillsAt(1),
            skillsAt(1),
        );
        expect(newTiers).toEqual([{ achievementId: 'phantom_hunter', tierIndex: 2 }]);
    });
});

describe('helpers', () => {
    it('adds a value only once and keeps the same array when already present', () => {
        const arr = ['Zombie'];
        expect(addUniqueToArray(arr, 'Zombie')).toBe(arr);
        expect(addUniqueToArray(arr, 'Husk')).toEqual(['Zombie', 'Husk']);
        expect(arr).toEqual(['Zombie']);
    });

    it('records the UTC date of the login once per day', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-24T10:00:00Z'));
        const once = recordLoginDate([]);
        expect(once).toEqual(['2026-11-24']);
        expect(recordLoginDate(once)).toBe(once);
    });

    it('shows the tier name once a tier is reached, otherwise the base name', () => {
        expect(getAchievementDisplayName('phantom_hunter', { phantomsCaught: 0 }, {})).toBe('Ghost Buster');
        expect(getAchievementDisplayName('phantom_hunter', { phantomsCaught: 5 }, {})).toBe('Bronze Ghost Buster');
        expect(getAchievementDisplayName('first_steps', {}, {})).toBe('First Steps');
        expect(getAchievementDisplayName('does_not_exist', {}, {})).toBe('');
    });
});
