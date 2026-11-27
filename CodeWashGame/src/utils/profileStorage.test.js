// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultStats } from './achievementUtils';
import { getProfileStats, getStorageKey, loadSkills, loadStats, loadTheme } from './profileStorage';

beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('profile storage compatibility', () => {
    it('uses the existing profile key and creates default skills without a save', () => {
        expect(getStorageKey(2)).toBe('heroSkills_v23_p2');
        const skills = loadSkills(1);

        expect(Object.keys(skills)).toEqual(expect.arrayContaining(['reading', 'math', 'memory', 'patterns']));
        expect(skills.reading).toMatchObject({
            level: 1,
            xp: 0,
            difficulty: 1,
            mobHealth: 60,
            mobMaxHealth: 60,
            earnedBadges: [],
        });
        expect(skills.memory.memoryMob).toBeTruthy();
        expect(skills.patterns.patternMob).toBeTruthy();
    });

    it('migrates incomplete and legacy saves while preserving valid values', () => {
        localStorage.setItem(
            'heroSkills_v23',
            JSON.stringify({
                skills: {
                    memory: { level: 4, difficulty: 'invalid', earnedBadges: null, mobHealth: null, lostLevel: 1 },
                    patterns: {
                        patternMob: null,
                        patternMobAura: null,
                        currentMiniboss: null,
                        currentBoss: null,
                        currentMinibossAura: null,
                        currentBossAura: null,
                    },
                    reading: { readingMob: null, readingMobAura: null },
                    math: { mathMob: null, mathMobAura: null },
                    writing: { writingMob: null, writingMobAura: null },
                    cleaning: { difficulty: 3, lostLevel: false, recoveryDifficulty: null, currentBoss: null },
                    legacySkill: {},
                },
            }),
        );

        const skills = loadSkills(1);
        expect(skills.memory).toMatchObject({
            difficulty: 1,
            earnedBadges: [],
            lostLevel: false,
            recoveryDifficulty: null,
        });
        expect(skills.patterns).toMatchObject({
            patternMob: expect.any(String),
            patternMobAura: expect.any(String),
            currentMiniboss: expect.any(String),
            currentBoss: expect.any(String),
            currentMinibossAura: expect.any(String),
            currentBossAura: expect.any(String),
        });
        expect(skills.reading.readingMob).toBeTruthy();
        expect(skills.math.mathMobAura).toBeTruthy();
        expect(skills.writing.writingMob).toBeTruthy();
        expect(skills.cleaning.currentBoss).toBeNull();
        expect(skills.legacySkill.recoveryDifficulty).toBeNull();
    });

    it('prefers profile-specific saves and recovers from malformed skill JSON', () => {
        localStorage.setItem('heroSkills_v23', JSON.stringify({ math: { level: 3 } }));
        localStorage.setItem('heroSkills_v23_p1', JSON.stringify({ skills: { math: { level: 5 } } }));
        expect(loadSkills(1).math.level).toBe(5);

        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('heroSkills_v23_p2', '{broken');
        expect(loadSkills(2).math.level).toBe(1);
        expect(warning).toHaveBeenCalledWith('Failed to parse saved skills:', expect.any(SyntaxError));
    });

    it('loads legacy themes and default or merged statistics without changing formats', () => {
        localStorage.setItem('heroSkills_v23', JSON.stringify({ theme: 'pokemon', stats: { totalMobsDefeated: 4 } }));
        expect(loadTheme(1)).toBe('pokemon');
        expect(loadStats(1)).toEqual({ ...getDefaultStats(), totalMobsDefeated: 4 });

        localStorage.setItem('heroSkills_v23_p2', JSON.stringify({ skills: {} }));
        expect(loadTheme(2)).toBe('minecraft');
        expect(loadStats(2)).toEqual(getDefaultStats());

        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('heroSkills_v23_p3', '{broken');
        expect(loadTheme(3)).toBe('minecraft');
        expect(loadStats(3)).toEqual(getDefaultStats());
        expect(warning).toHaveBeenCalledWith('Failed to parse theme:', expect.any(SyntaxError));
        expect(warning).toHaveBeenCalledWith('Failed to parse stats:', expect.any(SyntaxError));
    });

    it('summarizes live, saved, missing and malformed profile data', () => {
        const liveSkills = { reading: { level: 5 }, math: { level: 2 }, missing: null };
        expect(getProfileStats(2, liveSkills, 'pokemon')).toEqual({
            totalLevel: 7,
            highestLevel: 5,
            skills: liveSkills,
            theme: 'pokemon',
        });

        expect(getProfileStats(2)).toBeNull();
        localStorage.setItem(
            'heroSkills_v23',
            JSON.stringify({ skills: { reading: { level: 5 }, math: { level: 2 }, missing: null }, theme: 'pokemon' }),
        );
        expect(getProfileStats(1)).toMatchObject({ totalLevel: 7, highestLevel: 5, theme: 'pokemon' });

        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('heroSkills_v23_p2', '{broken');
        expect(getProfileStats(2)).toBeNull();
        expect(warning).toHaveBeenCalledWith('Failed to parse profile stats:', expect.any(SyntaxError));
    });
});
