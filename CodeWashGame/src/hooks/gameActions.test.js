import { afterEach, describe, expect, it, vi } from 'vitest';
import createGameActions from './gameActions';

const sound = vi.hoisted(() => ({ playLevelUp: vi.fn(), playNotification: vi.fn() }));
vi.mock('../utils/soundManager', () => sound);

afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
});

const setupActions = (overrides = {}) => {
    const dependencies = {
        activeTheme: 'minecraft',
        setActiveTheme: vi.fn(),
        selectedBorder: 'solid',
        setSelectedBorder: vi.fn(),
        skills: { reading: { level: 4 } },
        setSkills: vi.fn(),
        setStats: vi.fn(),
        checkAchievements: vi.fn(),
        setLootBox: vi.fn(),
        ...overrides,
    };
    return { actions: createGameActions(dependencies), dependencies };
};

describe('game presentation actions', () => {
    it('tracks theme and border changes only when the value changes', () => {
        vi.useFakeTimers();
        const { actions, dependencies } = setupActions();

        actions.handleThemeChange('minecraft');
        actions.handleBorderChange('solid');
        expect(dependencies.setActiveTheme).not.toHaveBeenCalled();
        expect(dependencies.setSelectedBorder).not.toHaveBeenCalled();

        actions.handleThemeChange('pokemon');
        actions.handleBorderChange('gold');
        const updateThemeStats = dependencies.setStats.mock.calls[0][0];
        const updateBorderStats = dependencies.setStats.mock.calls[1][0];
        expect(updateThemeStats({ themeChanges: 2 })).toEqual({ themeChanges: 3 });
        expect(updateBorderStats({ borderChanges: 1 })).toEqual({ borderChanges: 2 });
        vi.advanceTimersByTime(100);
        expect(dependencies.checkAchievements).toHaveBeenCalledTimes(2);
    });

    it('awards a level and notification for a known skill, but ignores empty ids', () => {
        const { actions, dependencies } = setupActions();

        actions.handlePhantomLevelAward(null);
        expect(dependencies.setSkills).not.toHaveBeenCalled();

        actions.handlePhantomLevelAward('reading');
        const updateSkills = dependencies.setSkills.mock.calls[0][0];
        expect(updateSkills({ reading: { level: 4 } })).toEqual({ reading: { level: 5 } });
        expect(dependencies.setLootBox).toHaveBeenCalledWith(
            expect.objectContaining({ level: 5, item: 'Phantom Bonus!' }),
        );
        expect(sound.playLevelUp).toHaveBeenCalledOnce();
        expect(sound.playNotification).toHaveBeenCalledOnce();
    });

    it('does not show a loot notification for an unknown skill id', () => {
        const { actions, dependencies } = setupActions();

        actions.handlePhantomLevelAward('unknown');
        expect(dependencies.setSkills).toHaveBeenCalledOnce();
        expect(dependencies.setLootBox).not.toHaveBeenCalled();
        expect(sound.playLevelUp).toHaveBeenCalledOnce();
        expect(sound.playNotification).not.toHaveBeenCalled();
    });
});
