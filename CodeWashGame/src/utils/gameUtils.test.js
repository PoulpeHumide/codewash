// Characterization tests for src/utils/gameUtils.js (DEBT-01).
// They freeze the behavior of the original code as received (tag v0-original),
// including its quirks: a failing test here means behavior changed, not that
// the original behavior was "right". Quirks are flagged with "QUIRK" comments.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    calculateDamage,
    calculateMobHealth,
    calculateXPReward,
    calculateXPToLevel,
    generateMathProblem,
    getDifficultyMultiplier,
    getEncounterType,
    getExpectedDifficulty,
    getItemsForLength,
    getMobForSkill,
    getRandomBoss,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomMob,
    getReadingWord,
    getWordForDifficulty,
} from './gameUtils';
import {
    BOSS_MOBS,
    FRIENDLY_MOBS,
    FUNNY_LONG_WORDS,
    HOSTILE_MOBS,
    MINIBOSS_MOBS,
    READING_WORDS,
    WRITING_DIFFICULTY_POOLS,
} from '../constants/gameData';

/** Makes Math.random return the given values in order, then the last one forever. */
const mockRandom = (...values) => {
    const spy = vi.spyOn(Math, 'random');
    values.forEach((v) => spy.mockReturnValueOnce(v));
    spy.mockReturnValue(values[values.length - 1]);
    return spy;
};

/** Evaluates a generated question such as "3 + 4 × 2 = ?" with JS precedence. */
const evaluateQuestion = (question) => {
    const expr = question.replace('= ?', '').replace(/×/g, '*').replace(/÷/g, '/');
    // Expressions come from the game's own hardcoded tables, never from user input.
    return String(Function(`"use strict"; return (${expr});`)());
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('progression formulas', () => {
    it('multiplies by 3 per difficulty step', () => {
        expect([1, 2, 3, 4, 7].map(getDifficultyMultiplier)).toEqual([1, 3, 9, 27, 729]);
    });

    it('computes damage from difficulty only (player level is ignored)', () => {
        expect(calculateDamage(1, 1)).toBe(12);
        expect(calculateDamage(150, 1)).toBe(12);
        expect(calculateDamage(50, 2)).toBe(36);
    });

    it('gives mobs 5 hits of health at every difficulty', () => {
        for (let d = 1; d <= 7; d++) {
            expect(calculateMobHealth(d)).toBe(5 * calculateDamage(1, d));
        }
    });

    it('unlocks one expected difficulty every 20 levels, capped at 7', () => {
        expect([1, 20, 21, 40, 41, 121, 200, 999].map(getExpectedDifficulty)).toEqual([1, 1, 2, 2, 3, 7, 7, 7]);
    });

    it('keeps the legacy XP formulas when player level is omitted', () => {
        expect(calculateXPReward(2)).toBe(300);
        expect(calculateXPToLevel(3)).toBe(900);
    });

    it('scales XP with player level and penalizes playing below expected difficulty', () => {
        expect(calculateXPReward(1, 1)).toBe(100);
        expect(calculateXPReward(2, 21)).toBe(596);
        expect(calculateXPReward(1, 21)).toBe(59); // floor(198 * 0.3)
        expect(calculateXPReward(1, 41)).toBe(35); // floor(395 * 0.3^2): two steps below expected
        expect(calculateXPReward(5, 21)).toBe(16117); // above expected: no bonus cap
        expect(calculateXPToLevel(1, 21)).toBe(596);
    });

    it('preserves "1 kill = 1 level" at the expected difficulty', () => {
        for (let level = 1; level <= 200; level++) {
            const difficulty = getExpectedDifficulty(level);
            expect(calculateXPReward(difficulty, level)).toBe(calculateXPToLevel(difficulty, level));
        }
    });
});

describe('encounter cycle', () => {
    it('places a miniboss on every 10th level and a boss on every 20th', () => {
        const types = Object.fromEntries([1, 9, 10, 11, 19, 20, 21, 30, 40].map((l) => [l, getEncounterType(l)]));
        expect(types).toEqual({
            1: 'hostile',
            9: 'hostile',
            10: 'miniboss',
            11: 'hostile',
            19: 'hostile',
            20: 'boss',
            21: 'hostile',
            30: 'miniboss',
            40: 'boss',
        });
    });
});

describe('random mob pickers', () => {
    it('picks from the matching mob table', () => {
        mockRandom(0);
        expect(getRandomMob(null)).toBe(Object.keys(HOSTILE_MOBS)[0]);
        expect(getRandomFriendlyMob()).toBe(Object.keys(FRIENDLY_MOBS)[0]);
        expect(getRandomMiniboss()).toBe(Object.keys(MINIBOSS_MOBS)[0]);
        expect(getRandomBoss()).toBe(Object.keys(BOSS_MOBS)[0]);
    });

    it('never returns the excluded hostile mob', () => {
        const [first, second] = Object.keys(HOSTILE_MOBS);
        mockRandom(0);
        expect(getRandomMob(first)).toBe(second);
    });
});

describe('getMobForSkill', () => {
    const cleaning = { id: 'cleaning' };

    it('rotates standard chests and uses special chests on milestones for cleaning', () => {
        expect(getMobForSkill(cleaning, { level: 1 })).toBe('Chest');
        expect(getMobForSkill(cleaning, { level: 2 })).toBe('Trapped Chest');
        expect(getMobForSkill(cleaning, { level: 4 })).toBe('Bundle');
        expect(getMobForSkill(cleaning, { level: 6 })).toBe('Trapped Chest');
        expect(getMobForSkill(cleaning, { level: 15 })).toBe('Shulker Box');
        expect(getMobForSkill(cleaning, { level: 40 })).toBe('Ender Chest');
    });

    it('returns the stored mob so the enemy does not change on re-render', () => {
        expect(getMobForSkill({ id: 'memory' }, { level: 3, memoryMob: 'Allay' })).toBe('Allay');
        expect(getMobForSkill({ id: 'reading' }, { level: 3, readingMob: 'Creeper' })).toBe('Creeper');
        expect(getMobForSkill({ id: 'math' }, { level: 3, mathMob: 'Husk' })).toBe('Husk');
        expect(getMobForSkill({ id: 'writing' }, { level: 3, writingMob: 'Witch' })).toBe('Witch');
        expect(getMobForSkill({ id: 'patterns' }, { level: 3, patternMob: 'Slime' })).toBe('Slime');
        expect(getMobForSkill({ id: 'math' }, { level: 10, currentMiniboss: 'Ravager' })).toBe('Ravager');
        expect(getMobForSkill({ id: 'math' }, { level: 20, currentBoss: 'Warden' })).toBe('Warden');
    });

    it('draws a new enemy of the right category when none is stored', () => {
        mockRandom(0);
        expect(getMobForSkill({ id: 'math' }, { level: 3 })).toBe(Object.keys(HOSTILE_MOBS)[0]);
        expect(getMobForSkill({ id: 'math' }, { level: 10 })).toBe(Object.keys(MINIBOSS_MOBS)[0]);
        expect(getMobForSkill({ id: 'math' }, { level: 20 })).toBe(Object.keys(BOSS_MOBS)[0]);
        expect(getMobForSkill({ id: 'memory' }, { level: 3 })).toBe(Object.keys(FRIENDLY_MOBS)[0]);
    });

    it('keeps a valid currentMob for unknown skills and replaces an invalid one', () => {
        const validMob = Object.keys(HOSTILE_MOBS)[1];
        expect(getMobForSkill({ id: 'other' }, { level: 3, currentMob: validMob })).toBe(validMob);
        mockRandom(0);
        expect(getMobForSkill({ id: 'other' }, { level: 3, currentMob: 'Ghost' })).toBe(Object.keys(HOSTILE_MOBS)[0]);
    });
});

describe('reading words', () => {
    it('uses the word length configured for each difficulty', () => {
        mockRandom(0);
        expect(getReadingWord(1)).toBe(READING_WORDS[3][0]);
        expect(getReadingWord(6)).toBe(READING_WORDS[8][0]);
        expect(getReadingWord(7)).toBe(FUNNY_LONG_WORDS[0]);
    });

    it('falls back to difficulty 1 for unknown difficulties', () => {
        mockRandom(0);
        expect(getReadingWord(42)).toBe(READING_WORDS[3][0]);
    });
});

describe('generateMathProblem', () => {
    it('always produces a correct answer for standard difficulties 1-5', () => {
        for (let difficulty = 1; difficulty <= 5; difficulty++) {
            for (let i = 0; i < 300; i++) {
                const problem = generateMathProblem(difficulty);
                expect(problem.type).toBe('math');
                expect(problem.answer).toBe(evaluateQuestion(problem.question));
            }
        }
    });

    it('only uses addition at difficulties 1 and 2', () => {
        for (let i = 0; i < 100; i++) {
            expect(generateMathProblem(1).question).toMatch(/^\d+ \+ \d+ = \?$/);
            expect(generateMathProblem(2).question).toMatch(/^\d+ \+ \d+ = \?$/);
        }
    });

    it('produces exact divisions at difficulty 5', () => {
        // op index 3 => '/', divisor = 1 + floor(0.9 * 10) = 10, quotient = 1 + floor(0.5 * 10) = 6
        mockRandom(0.99, 0.9, 0.5);
        expect(generateMathProblem(5)).toEqual({ type: 'math', question: '60 ÷ 10 = ?', answer: '6' });
    });

    it('never asks a subtraction with a negative answer (DEBT-09)', () => {
        for (let difficulty = 3; difficulty <= 5; difficulty++) {
            for (let i = 0; i < 300; i++) {
                const { question, answer } = generateMathProblem(difficulty);
                if (question.includes(' - ')) expect(Number(answer)).toBeGreaterThanOrEqual(0);
            }
        }
    });

    it('asks 0 - 0 when the first operand of a subtraction is 0 (DEBT-09)', () => {
        // Was "0 - 1 = ?" with answer -1 in the original code.
        mockRandom(0.5, 0, 0);
        expect(generateMathProblem(3)).toEqual({ type: 'math', question: '0 - 0 = ?', answer: '0' });
    });

    it('keeps the second operand of a subtraction in [1, a] when a > 0', () => {
        // a = floor(0.99 * 21) = 20; b = floor(0.99 * 20) + 1 = 20, then b = floor(0 * 20) + 1 = 1
        mockRandom(0.5, 0.99, 0.99);
        expect(generateMathProblem(3)).toEqual({ type: 'math', question: '20 - 20 = ?', answer: '0' });
        vi.restoreAllMocks();
        mockRandom(0.5, 0.99, 0);
        expect(generateMathProblem(3)).toEqual({ type: 'math', question: '20 - 1 = ?', answer: '19' });
    });

    it('has a correct answer for every hardcoded order-of-operations problem (difficulty 6)', () => {
        const count = 12;
        for (let i = 0; i < count; i++) {
            mockRandom((i + 0.5) / count);
            const problem = generateMathProblem(6);
            expect(problem.isPemdas).toBe(true);
            expect(problem.answer).toBe(evaluateQuestion(problem.question));
            vi.restoreAllMocks();
        }
    });

    it('has a correct answer for every hardcoded nightmare problem (difficulty 7)', () => {
        const count = 25;
        for (let i = 0; i < count; i++) {
            mockRandom((i + 0.5) / count);
            const problem = generateMathProblem(7);
            expect(problem.isNightmare).toBe(true);
            expect(problem.answer).toBe(evaluateQuestion(problem.question));
            vi.restoreAllMocks();
        }
    });

    it('falls back to difficulty 1 for unknown difficulties', () => {
        mockRandom(0);
        expect(generateMathProblem(0)).toEqual({ type: 'math', question: '0 + 0 = ?', answer: '0' });
    });
});

describe('writing words', () => {
    it('returns an uppercased word from the difficulty pool, pools 6-7 reuse pool 5', () => {
        mockRandom(0);
        const first = WRITING_DIFFICULTY_POOLS[1][0];
        expect(getWordForDifficulty(1)).toEqual({
            word: first.word.toUpperCase(),
            displayName: first.displayName,
            image: first.imagePath,
        });
        expect(getWordForDifficulty(7)).toEqual(getWordForDifficulty(5));
    });

    it('falls back to pool 1 when the pool is missing', () => {
        mockRandom(0);
        expect(getWordForDifficulty(0)).toEqual(getWordForDifficulty(1));
    });

    it('finds a single word of the requested length when one exists', () => {
        mockRandom(0);
        const result = getItemsForLength(3);
        expect(result.combinedAnswer).toHaveLength(3);
        expect(result.items).toHaveLength(1);
        expect(result.combinedAnswer).toBe(result.combinedAnswer.toUpperCase());
    });

    it('never throws for lengths without a single matching word', () => {
        for (const length of [1, 2, 20, 40]) {
            const result = getItemsForLength(length);
            expect(result.combinedAnswer.length).toBeGreaterThan(0);
            expect(result.images.length).toBe(result.items.length);
        }
    });
});
