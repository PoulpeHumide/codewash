// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDefaultStats } from '../utils/achievementUtils';
import { calculateXPToLevel } from '../utils/gameUtils';
import useCombatActions from './useCombatActions';

const sound = vi.hoisted(() => ({
    play: vi.fn(),
    playDeath: vi.fn(),
    playFail: vi.fn(),
    playLevelUp: vi.fn(),
    playMobDeath: vi.fn(),
    playMobHurt: vi.fn(),
    playNotification: vi.fn(),
    playSuccessfulHit: vi.fn(),
}));

vi.mock('../utils/soundManager', () => ({
    playDeath: sound.playDeath,
    playFail: sound.playFail,
    playLevelUp: sound.playLevelUp,
    playMobDeath: sound.playMobDeath,
    playMobHurt: sound.playMobHurt,
    playNotification: sound.playNotification,
    playSuccessfulHit: sound.playSuccessfulHit,
}));

const createSkill = (overrides = {}) => ({
    level: 1,
    xp: 0,
    difficulty: 1,
    currentMob: 'Zombie',
    mobHealth: 60,
    mobMaxHealth: 60,
    earnedBadges: [],
    lostLevel: false,
    recoveryDifficulty: null,
    memoryMob: 'Axolotl',
    patternMob: 'Creeper',
    currentMiniboss: 'Elder Guardian',
    currentBoss: 'Wither',
    readingMob: 'Zombie',
    mathMob: 'Skeleton',
    writingMob: 'Creeper',
    readingMobAura: 'Fire',
    mathMobAura: 'Ice',
    writingMobAura: 'Poison',
    patternMobAura: 'Magic',
    currentMinibossAura: 'Light',
    currentBossAura: 'Dark',
    ...overrides,
});

const useCombatHarness = ({ initialSkills, initialBattle = null, initialHealth = 10 }) => {
    const [skills, setSkills] = React.useState(initialSkills);
    const [stats, setStats] = React.useState(getDefaultStats);
    const [battlingSkillId, setBattlingSkillId] = React.useState(initialBattle);
    const [battleDifficulty, setBattleDifficulty] = React.useState(1);
    const [, setChallengeData] = React.useState(null);
    const [playerHealth, setPlayerHealth] = React.useState(initialHealth);
    const [damageNumbers, setDamageNumbers] = React.useState([]);
    const [bossHealing, setBossHealing] = React.useState(null);
    const [showDeathOverlay, setShowDeathOverlay] = React.useState(false);
    const [showLevelRestored, setShowLevelRestored] = React.useState(false);
    const [lootBox, setLootBox] = React.useState(null);
    const [spokenText, setSpokenText] = React.useState('');
    const damageIdRef = React.useRef(0);
    const checkAchievements = React.useMemo(() => vi.fn(), []);
    const generateChallenge = React.useMemo(() => vi.fn((type, difficulty) => ({ type, difficulty })), []);
    const { handleSuccessHit } = useCombatActions({
        skills,
        setSkills,
        setStats,
        battlingSkillId,
        setBattlingSkillId,
        battleDifficulty,
        setBattleDifficulty,
        setChallengeData,
        setPlayerHealth,
        setDamageNumbers,
        damageIdRef,
        setBossHealing,
        setShowDeathOverlay,
        setShowLevelRestored,
        setLootBox,
        setSpokenText,
        checkAchievements,
        generateChallenge,
    });

    return {
        state: {
            skills,
            stats,
            battlingSkillId,
            battleDifficulty,
            playerHealth,
            damageNumbers,
            bossHealing,
            showDeathOverlay,
            showLevelRestored,
            lootBox,
            spokenText,
        },
        handleSuccessHit,
        checkAchievements,
        generateChallenge,
    };
};

const setupCombat = (options = {}) =>
    renderHook((props) => useCombatHarness(props), {
        initialProps: {
            initialSkills: { reading: createSkill(), math: createSkill() },
            ...options,
        },
    });

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe('useCombatActions', () => {
    it('heals the boss after a wrong answer without damaging the player', () => {
        vi.useFakeTimers();
        const { result } = setupCombat({
            initialBattle: 'reading',
            initialSkills: {
                reading: createSkill({ level: 20, mobHealth: 12, mobMaxHealth: 60 }),
            },
        });

        act(() => result.current.handleSuccessHit(null, 'WRONG'));
        expect(result.current.state.skills.reading.mobHealth).toBe(60);
        expect(result.current.state.bossHealing).toBe('reading');
        expect(result.current.state.playerHealth).toBe(10);
        expect(sound.playFail).toHaveBeenCalledOnce();

        act(() => vi.advanceTimersByTime(600));
        expect(result.current.state.bossHealing).toBeNull();
    });

    it('applies non-boss damage and the existing death recovery sequence', () => {
        vi.useFakeTimers();
        const { result } = setupCombat({ initialBattle: 'math', initialHealth: 2 });

        act(() => result.current.handleSuccessHit(null, 'WRONG'));
        expect(result.current.state.playerHealth).toBe(1);
        expect(sound.playFail).toHaveBeenCalledOnce();

        act(() => result.current.handleSuccessHit(null, 'WRONG'));
        expect(result.current.state.playerHealth).toBe(10);
        expect(result.current.state.showDeathOverlay).toBe(true);
        expect(result.current.state.stats.totalDeaths).toBe(1);
        expect(result.current.state.skills.math).toMatchObject({
            level: 1,
            lostLevel: false,
            recoveryDifficulty: 1,
        });

        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.state.battlingSkillId).toBeNull();
        expect(result.current.state.showDeathOverlay).toBe(false);
        expect(result.current.checkAchievements).toHaveBeenCalled();
    });

    it('ignores empty skill ids and applies partial damage with the current challenge difficulty', () => {
        const { result } = setupCombat({
            initialBattle: 'reading',
            initialSkills: { reading: createSkill({ mobHealth: 60, mobMaxHealth: 60 }) },
        });

        act(() => result.current.handleSuccessHit(null));
        expect(result.current.state.damageNumbers).toHaveLength(0);

        act(() => result.current.handleSuccessHit('reading'));
        expect(result.current.state.skills.reading.mobHealth).toBe(48);
        expect(result.current.state.damageNumbers).toHaveLength(1);
        expect(result.current.state.spokenText).toBe('');
        expect(result.current.generateChallenge).toHaveBeenCalledWith('reading', 1);
        expect(sound.playMobHurt).toHaveBeenCalledWith('Zombie');
        expect(sound.playSuccessfulHit).toHaveBeenCalledOnce();
    });

    it('completes memory, pattern, miniboss and boss encounters with their existing rewards', () => {
        const memory = createSkill({ mobHealth: 30, mobMaxHealth: 30 });
        const patterns = createSkill({ mobHealth: 1, mobMaxHealth: 1 });
        const writing = createSkill({ mobHealth: 1, mobMaxHealth: 1 });
        const miniboss = createSkill({ level: 10, mobHealth: 1, mobMaxHealth: 1 });
        const boss = createSkill({ level: 20, mobHealth: 1, mobMaxHealth: 1 });
        const { result } = setupCombat({
            initialSkills: { memory, patterns, writing, reading: miniboss, math: boss },
        });

        act(() => result.current.handleSuccessHit('memory'));
        act(() => result.current.handleSuccessHit('patterns'));
        act(() => result.current.handleSuccessHit('writing'));
        act(() => result.current.handleSuccessHit('reading'));
        act(() => result.current.handleSuccessHit('math'));

        expect(result.current.state.skills.memory.memoryMob).toBeTruthy();
        expect(result.current.state.skills.patterns.patternMobAura).toBeTruthy();
        expect(result.current.state.stats.totalMinibossesDefeated).toBe(1);
        expect(result.current.state.stats.totalBossesDefeated).toBe(1);
        expect(result.current.state.stats.totalMobsDefeated).toBe(3);
        expect(result.current.state.damageNumbers).toHaveLength(4);
    });

    it('restores lost levels and awards boss badges and difficulty progression', () => {
        vi.useFakeTimers();
        const { result } = setupCombat({
            initialSkills: {
                reading: createSkill({
                    level: 20,
                    xp: calculateXPToLevel(1, 20),
                    mobHealth: 12,
                    mobMaxHealth: 12,
                }),
            },
        });

        act(() => result.current.handleSuccessHit('reading'));
        expect(result.current.state.skills.reading.level).toBeGreaterThan(20);
        expect(result.current.state.skills.reading.difficulty).toBe(2);
        expect(result.current.state.skills.reading.earnedBadges).toContain(1);
        expect(result.current.state.lootBox).toMatchObject({ item: 'New Rank!', level: 20 });

        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.state.showLevelRestored).toBe(false);
        expect(sound.playLevelUp).toHaveBeenCalled();
        expect(sound.playNotification).toHaveBeenCalled();
    });

    it('restores a lost level after the next completed mob', () => {
        const { result } = setupCombat({
            initialSkills: {
                reading: createSkill({ mobHealth: 12, mobMaxHealth: 12, lostLevel: true }),
            },
        });

        act(() => result.current.handleSuccessHit('reading'));
        expect(result.current.state.skills.reading.level).toBeGreaterThan(1);
        expect(result.current.state.skills.reading.lostLevel).toBe(false);
        expect(result.current.state.showLevelRestored).toBe(true);
    });
});
