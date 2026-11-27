// @vitest-environment jsdom
// Characterization tests for the save/load behavior of src/App.jsx (DEBT-01, DEBT-04).
// They mount the real <App /> and observe what it reads from and writes to
// localStorage. They freeze the behavior of the original code as received,
// including its quirks: a failing test here means behavior changed, not that
// the original behavior was "right". Quirks are flagged with "QUIRK" comments.
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { SKILL_DATA } from './constants/gameData';
import { getDefaultStats } from './utils/achievementUtils';
import { calculateMobHealth } from './utils/gameUtils';

const TODAY = '2026-11-26';
const SKILL_IDS = SKILL_DATA.map((s) => s.id);
const COMBAT_SKILLS = SKILL_IDS.filter((id) => id !== 'cleaning' && id !== 'memory');
const PER_SKILL_MOB = {
    reading: ['readingMob', 'readingMobAura'],
    math: ['mathMob', 'mathMobAura'],
    writing: ['writingMob', 'writingMobAura'],
    patterns: ['patternMob', 'patternMobAura'],
    memory: ['memoryMob'],
};

const seed = (entries) => {
    Object.entries(entries).forEach(([key, value]) => {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
};
const readJSON = (key) => JSON.parse(localStorage.getItem(key));
const readSave = (profileId) => readJSON(`heroSkills_v23_p${profileId}`);
const mount = () => render(<App />);

let warn;

beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T10:00:00Z`));
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
});

describe('first launch (empty storage)', () => {
    it('writes exactly these keys, with default profile data', () => {
        mount();

        expect(Object.keys(localStorage).sort()).toEqual(
            [
                'borderColor_p1',
                'borderEffect_p1',
                'currentProfile_v1',
                'heroParentStatus_v1',
                'heroProfileNames_v1',
                'heroSkills_v23_p1',
            ].sort(),
        );
        expect(localStorage.getItem('currentProfile_v1')).toBe('1');
        expect(readJSON('heroProfileNames_v1')).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
        expect(readJSON('heroParentStatus_v1')).toEqual({ 1: false, 2: false, 3: false });
        expect(localStorage.getItem('borderEffect_p1')).toBe('solid');
        expect(localStorage.getItem('borderColor_p1')).toBe('#FFD700');
    });

    it('saves { skills, theme, stats } with a fresh entry for every skill', () => {
        mount();
        const save = readSave(1);

        expect(Object.keys(save).sort()).toEqual(['skills', 'stats', 'theme']);
        expect(save.theme).toBe('minecraft');
        expect(save.stats).toEqual({ ...getDefaultStats(), loginDates: [TODAY] });
        expect(Object.keys(save.skills).sort()).toEqual([...SKILL_IDS].sort());

        SKILL_IDS.forEach((id) => {
            const skill = save.skills[id];
            expect(skill).toMatchObject({
                level: 1,
                xp: 0,
                difficulty: 1,
                earnedBadges: [],
                mobHealth: calculateMobHealth(1),
                mobMaxHealth: calculateMobHealth(1),
                lostLevel: false,
                recoveryDifficulty: null,
            });
            expect(typeof skill.currentMob).toBe('string');
            // QUIRK: a fresh save gives a miniboss and a boss to every skill,
            // including cleaning and memory, which never fight them.
            expect(skill.currentMiniboss).toBeTruthy();
            expect(skill.currentBoss).toBeTruthy();
            expect(skill.currentMinibossAura).toBeTruthy();
            expect(skill.currentBossAura).toBeTruthy();
        });

        // Each card's "stable" display mob only exists on its own skill.
        Object.entries(PER_SKILL_MOB).forEach(([owner, fields]) => {
            SKILL_IDS.forEach((id) => {
                fields.forEach((field) => {
                    if (id === owner) expect(save.skills[id][field]).toBeTruthy();
                    else expect(save.skills[id][field]).toBeNull();
                });
            });
        });
    });

    it('QUIRK: logs two parse warnings on a normal first launch', () => {
        // loadTheme and loadStats call JSON.parse(null) and rely on the catch.
        mount();
        const messages = warn.mock.calls.map((call) => call[0]);
        expect(messages).toEqual(['Failed to parse theme:', 'Failed to parse stats:']);
    });
});

describe('reloading an existing save', () => {
    const fullSkill = (overrides = {}) => ({
        level: 42,
        xp: 17,
        currentMob: 'Zombie',
        difficulty: 3,
        earnedBadges: [1, 2],
        mobHealth: 12,
        mobMaxHealth: 99,
        lostLevel: true,
        recoveryDifficulty: 2,
        memoryMob: 'Cow',
        patternMob: 'Creeper',
        currentMiniboss: 'Evoker',
        currentBoss: 'Wither',
        readingMob: 'Skeleton',
        mathMob: 'Spider',
        writingMob: 'Witch',
        readingMobAura: 'red',
        mathMobAura: 'blue',
        writingMobAura: 'green',
        patternMobAura: 'purple',
        currentMinibossAura: 'gold',
        currentBossAura: 'black',
        ...overrides,
    });

    it('keeps every saved skill field, the theme and the stats as they were', () => {
        const skills = Object.fromEntries(SKILL_IDS.map((id) => [id, fullSkill()]));
        const stats = { ...getDefaultStats(), totalMobsDefeated: 7, loginDates: [TODAY] };
        seed({ heroSkills_v23_p1: { skills, theme: 'pokemon', stats } });

        mount();

        expect(readSave(1)).toEqual({ skills, theme: 'pokemon', stats });
    });

    it('adds stat fields that are missing from an older save', () => {
        seed({ heroSkills_v23_p1: { skills: {}, theme: 'spy', stats: { totalMobsDefeated: 3 } } });

        mount();

        expect(readSave(1).stats).toEqual({ ...getDefaultStats(), totalMobsDefeated: 3, loginDates: [TODAY] });
    });

    it('records today in loginDates once, without duplicating it', () => {
        seed({
            heroSkills_v23_p1: { skills: {}, stats: { loginDates: ['2026-11-01'] } },
            heroSkills_v23_p2: { skills: {}, stats: { loginDates: ['2026-11-01', TODAY] } },
        });

        mount();
        expect(readSave(1).stats.loginDates).toEqual(['2026-11-01', TODAY]);

        cleanup();
        localStorage.setItem('currentProfile_v1', '2');
        mount();
        expect(readSave(2).stats.loginDates).toEqual(['2026-11-01', TODAY]);
    });

    it('creates fresh entries for skills absent from the save', () => {
        seed({ heroSkills_v23_p1: { skills: { reading: fullSkill() } } });

        mount();
        const { skills } = readSave(1);

        expect(skills.reading).toEqual(fullSkill());
        expect(skills.math).toMatchObject({ level: 1, xp: 0, difficulty: 1 });
    });

    it('fills in fields added since an old per-skill entry was written', () => {
        seed({ heroSkills_v23_p1: { skills: Object.fromEntries(SKILL_IDS.map((id) => [id, { level: 9, xp: 4 }])) } });

        mount();
        const { skills } = readSave(1);

        SKILL_IDS.forEach((id) => {
            expect(skills[id]).toMatchObject({
                level: 9,
                xp: 4,
                difficulty: 1,
                earnedBadges: [],
                mobHealth: calculateMobHealth(1),
                mobMaxHealth: calculateMobHealth(1),
                lostLevel: false,
                recoveryDifficulty: null,
            });
        });
        Object.entries(PER_SKILL_MOB).forEach(([owner, fields]) => {
            fields.forEach((field) => expect(skills[owner][field]).toBeTruthy());
        });
        COMBAT_SKILLS.forEach((id) => {
            expect(skills[id].currentMiniboss).toBeTruthy();
            expect(skills[id].currentBoss).toBeTruthy();
        });
    });

    it('QUIRK: a missing mobHealth gets the difficulty 1 value, whatever the saved difficulty', () => {
        // loadSkills merges the defaults (difficulty 1) before its "mobHealth is
        // missing" check, so the branch that recomputes it from the saved
        // difficulty is never reached.
        seed({ heroSkills_v23_p1: { skills: { math: { level: 50, difficulty: 4 } } } });

        mount();

        expect(calculateMobHealth(4)).not.toBe(calculateMobHealth(1));
        expect(readSave(1).skills.math).toMatchObject({
            difficulty: 4,
            mobHealth: calculateMobHealth(1),
            mobMaxHealth: calculateMobHealth(1),
        });
    });

    it('QUIRK: keeps unknown skill ids found in the save', () => {
        seed({ heroSkills_v23_p1: { skills: { ghost: { level: 3 } } } });

        mount();

        expect(readSave(1).skills.ghost).toMatchObject({ level: 3, difficulty: 1, earnedBadges: [] });
    });
});

describe('legacy save formats', () => {
    it('reads a flat save (skills at the root) and rewrites it in the { skills, theme, stats } format', () => {
        seed({ heroSkills_v23_p1: { reading: { level: 12, xp: 5 } } });

        mount();
        const save = readSave(1);

        expect(save.skills.reading).toMatchObject({ level: 12, xp: 5 });
        expect(save.theme).toBe('minecraft');
        expect(save.stats).toEqual({ ...getDefaultStats(), loginDates: [TODAY] });
    });

    it('migrates the unsuffixed heroSkills_v23 key to profile 1, leaving the old key in place', () => {
        const legacy = { skills: { reading: { level: 30 } }, theme: 'kpop' };
        seed({ heroSkills_v23: legacy });

        mount();

        expect(readSave(1).skills.reading.level).toBe(30);
        expect(readSave(1).theme).toBe('kpop');
        expect(readJSON('heroSkills_v23')).toEqual(legacy);
    });

    it('prefers heroSkills_v23_p1 over the legacy key', () => {
        seed({
            heroSkills_v23: { skills: { reading: { level: 30 } }, theme: 'kpop' },
            heroSkills_v23_p1: { skills: { reading: { level: 5 } }, theme: 'spy' },
        });

        mount();

        expect(readSave(1).skills.reading.level).toBe(5);
        expect(readSave(1).theme).toBe('spy');
    });

    it('never uses the legacy key for profiles 2 and 3', () => {
        seed({ currentProfile_v1: '2', heroSkills_v23: { skills: { reading: { level: 30 } }, theme: 'kpop' } });

        mount();

        expect(readSave(2).skills.reading.level).toBe(1);
        expect(readSave(2).theme).toBe('minecraft');
    });
});

describe('profiles', () => {
    it('loads and saves the profile stored in currentProfile_v1 only', () => {
        const p1 = { skills: { reading: { level: 7 } }, theme: 'spy' };
        seed({
            currentProfile_v1: '3',
            heroSkills_v23_p1: p1,
            heroSkills_v23_p3: { skills: { reading: { level: 70 } }, theme: 'pokemon' },
        });

        mount();

        expect(localStorage.getItem('currentProfile_v1')).toBe('3');
        expect(readSave(3).skills.reading.level).toBe(70);
        expect(readSave(3).theme).toBe('pokemon');
        expect(readJSON('heroSkills_v23_p1')).toEqual(p1);
        expect(localStorage.getItem('heroSkills_v23_p2')).toBeNull();
        expect(localStorage.getItem('borderEffect_p3')).toBe('solid');
        expect(localStorage.getItem('borderEffect_p1')).toBeNull();
    });

    it('keeps profile names, parent status and border cosmetics as saved', () => {
        const names = { 1: 'Alice', 2: 'Bob', 3: 'Player 3' };
        const parents = { 1: true, 2: false, 3: false };
        seed({
            heroProfileNames_v1: names,
            heroParentStatus_v1: parents,
            borderEffect_p1: 'rainbow',
            borderColor_p1: '#00FF00',
        });

        mount();

        expect(readJSON('heroProfileNames_v1')).toEqual(names);
        expect(readJSON('heroParentStatus_v1')).toEqual(parents);
        expect(localStorage.getItem('borderEffect_p1')).toBe('rainbow');
        expect(localStorage.getItem('borderColor_p1')).toBe('#00FF00');
    });

    it('QUIRK: a non-numeric currentProfile_v1 saves under heroSkills_v23_pNaN', () => {
        seed({ currentProfile_v1: 'abc' });

        mount();

        expect(localStorage.getItem('heroSkills_v23_pNaN')).not.toBeNull();
        expect(localStorage.getItem('currentProfile_v1')).toBe('NaN');
    });
});

describe('invalid stored data', () => {
    it('QUIRK: a corrupted skills save is replaced by a fresh one, silently losing the old data', () => {
        seed({ heroSkills_v23_p1: '{not json' });

        mount();

        expect(readSave(1).skills.reading).toMatchObject({ level: 1, xp: 0 });
        expect(warn.mock.calls.map((call) => call[0])).toEqual([
            'Failed to parse saved skills:',
            'Failed to parse theme:',
            'Failed to parse stats:',
        ]);
    });

    it('treats a save containing JSON null as empty', () => {
        seed({ heroSkills_v23_p1: 'null' });

        mount();

        expect(readSave(1).theme).toBe('minecraft');
        expect(readSave(1).skills.reading).toMatchObject({ level: 1 });
    });

    it.each(['heroProfileNames_v1', 'heroParentStatus_v1'])(
        'QUIRK (DEBT-04): a corrupted %s prevents the app from starting',
        (key) => {
            seed({ [key]: '{not json' });
            // React reports the render error to the console before rethrowing it.
            vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(mount).toThrow(SyntaxError);
        },
    );
});
