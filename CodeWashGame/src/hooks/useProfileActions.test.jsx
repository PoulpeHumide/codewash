// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import createProfileActions from './useProfileActions';

const sound = vi.hoisted(() => ({ playClick: vi.fn() }));
vi.mock('../utils/soundManager', () => ({ playClick: sound.playClick }));

const createActions = (overrides = {}) => {
    const defaults = {
        currentProfile: 1,
        setCurrentProfile: vi.fn(),
        setSkills: vi.fn(),
        setActiveTheme: vi.fn(),
        setProfileNames: vi.fn(),
        setParentStatus: vi.fn(),
        loadSkills: vi.fn(() => ({ reading: { level: 2 } })),
        loadTheme: vi.fn(() => 'pokemon'),
        reload: vi.fn(),
    };
    const dependencies = { ...defaults, ...overrides };
    return { actions: createProfileActions(dependencies), dependencies };
};

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('useProfileActions', () => {
    it('switches profiles and renames a profile while preserving state setter semantics', () => {
        const { actions, dependencies } = createActions();

        actions.handleSwitchProfile(1);
        expect(dependencies.loadSkills).not.toHaveBeenCalled();
        actions.handleSwitchProfile(2);
        expect(dependencies.loadSkills).toHaveBeenCalledWith(2);
        expect(dependencies.loadTheme).toHaveBeenCalledWith(2);
        expect(dependencies.setSkills).toHaveBeenCalledWith({ reading: { level: 2 } });
        expect(dependencies.setActiveTheme).toHaveBeenCalledWith('pokemon');
        expect(dependencies.setCurrentProfile).toHaveBeenCalledWith(2);

        actions.handleRenameProfile(2, 'Ranger');
        const updateNames = dependencies.setProfileNames.mock.calls[0][0];
        expect(updateNames({ 1: 'Player 1', 2: 'Player 2' })).toEqual({ 1: 'Player 1', 2: 'Ranger' });
        expect(sound.playClick).toHaveBeenCalledOnce();
    });

    it('applies parent privileges only to the verified active profile', () => {
        vi.useFakeTimers();
        const { actions, dependencies } = createActions();

        actions.handleParentVerified(2, true);
        expect(dependencies.setParentStatus.mock.calls[0][0]({ 1: false, 2: false })).toEqual({
            1: false,
            2: true,
        });
        expect(dependencies.setSkills).not.toHaveBeenCalled();

        actions.handleParentVerified(1, true);
        const updateSkills = dependencies.setSkills.mock.calls[0][0];
        expect(
            updateSkills({
                reading: { level: 4, earnedBadges: [] },
                math: { level: 2, earnedBadges: [] },
            }),
        ).toMatchObject({
            reading: { level: 200, difficulty: 7, earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8] },
            math: { level: 200, difficulty: 7, earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8] },
        });
        act(() => vi.advanceTimersByTime(0));
        expect(dependencies.setSkills).toHaveBeenCalledTimes(2);

        actions.handleParentVerified(1, false);
        expect(dependencies.setSkills).toHaveBeenCalledTimes(2);
    });

    it('resets the current profile data and keeps the existing profile keys', () => {
        localStorage.setItem('heroSkills_v23_p1', '{}');
        localStorage.setItem('heroSkills_v23', '{}');
        localStorage.setItem('heroParentStatus_v1', JSON.stringify({ 1: true, 2: false }));
        localStorage.setItem('heroProfileNames_v1', JSON.stringify({ 1: 'Ranger', 2: 'Player 2' }));
        const { actions, dependencies } = createActions();

        actions.handleReset();
        expect(localStorage.getItem('heroSkills_v23_p1')).toBeNull();
        expect(localStorage.getItem('heroSkills_v23')).toBeNull();
        expect(JSON.parse(localStorage.getItem('heroParentStatus_v1'))[1]).toBe(false);
        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))[1]).toBe('Player 1');
        expect(dependencies.reload).toHaveBeenCalledOnce();
    });

    it('uses the original default profile metadata when resetting a secondary profile', () => {
        localStorage.setItem('heroSkills_v23_p2', '{}');
        const { actions, dependencies } = createActions({ currentProfile: 2 });

        actions.handleReset();
        expect(localStorage.getItem('heroSkills_v23_p2')).toBeNull();
        expect(localStorage.getItem('heroSkills_v23')).toBeNull();
        expect(JSON.parse(localStorage.getItem('heroParentStatus_v1'))).toEqual({
            1: false,
            2: false,
            3: false,
        });
        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))[2]).toBe('Player 2');
        expect(dependencies.reload).toHaveBeenCalledOnce();
    });

    it('recovers corrupt profile metadata before resetting the active profile', () => {
        localStorage.setItem('heroParentStatus_v1', '{truncated');
        localStorage.setItem('heroProfileNames_v1', '{"1":4}');
        const { actions, dependencies } = createActions();

        actions.handleReset();

        expect(JSON.parse(localStorage.getItem('heroParentStatus_v1'))).toEqual({
            1: false,
            2: false,
            3: false,
        });
        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))).toEqual({
            1: 'Player 1',
            2: 'Player 2',
            3: 'Player 3',
        });
        expect(dependencies.reload).toHaveBeenCalledOnce();
    });

    it('uses the browser reload default when no reload handler is injected', () => {
        const reload = vi.fn();
        vi.stubGlobal('window', { location: { reload } });
        const actions = createProfileActions({
            currentProfile: 1,
            setCurrentProfile: vi.fn(),
            setSkills: vi.fn(),
            setActiveTheme: vi.fn(),
            setProfileNames: vi.fn(),
            setParentStatus: vi.fn(),
            loadSkills: vi.fn(),
            loadTheme: vi.fn(),
        });

        actions.handleReset();
        expect(reload).toHaveBeenCalledOnce();
    });
});
