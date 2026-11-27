// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDefaultStats } from '../utils/achievementUtils';
import useProfileState from './useProfileState';

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe('useProfileState', () => {
    it('loads persisted profile preferences and saves state changes in the existing keys', () => {
        localStorage.setItem('currentProfile_v1', '2');
        localStorage.setItem('heroProfileNames_v1', JSON.stringify({ 2: 'Ranger' }));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify({ 2: true }));
        localStorage.setItem('heroSkills_v23_p2', JSON.stringify({ skills: { reading: { level: 4 } } }));
        localStorage.setItem('borderEffect_p2', 'gold');
        localStorage.setItem('borderColor_p2', '#123456');

        const { result } = renderHook(() => useProfileState());
        expect(result.current.currentProfile).toBe(2);
        expect(result.current.profileNames[2]).toBe('Ranger');
        expect(result.current.parentStatus[2]).toBe(true);
        expect(result.current.skills.reading.level).toBe(4);
        expect(result.current.selectedBorder).toBe('gold');
        expect(result.current.borderColor).toBe('#123456');

        act(() => {
            result.current.setProfileNames({ 2: 'Ranger Two' });
            result.current.setParentStatus({ 2: false });
            result.current.setActiveTheme('pokemon');
            result.current.setStats({ ...getDefaultStats(), totalMobsDefeated: 7 });
            result.current.setSelectedBorder('diamond');
            result.current.setBorderColor('#ABCDEF');
        });

        expect(JSON.parse(localStorage.getItem('heroSkills_v23_p2'))).toMatchObject({
            theme: 'pokemon',
            stats: { totalMobsDefeated: 7 },
        });
        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))[2]).toBe('Ranger Two');
        expect(JSON.parse(localStorage.getItem('heroParentStatus_v1'))[2]).toBe(false);
        expect(localStorage.getItem('currentProfile_v1')).toBe('2');
        expect(localStorage.getItem('heroProfileNames_v1')).toBe('{"2":"Ranger Two"}');
        expect(localStorage.getItem('heroParentStatus_v1')).toBe('{"2":false}');
        expect(localStorage.getItem('borderEffect_p2')).toBe('diamond');
        expect(localStorage.getItem('borderColor_p2')).toBe('#ABCDEF');
        const savedProfile = JSON.parse(localStorage.getItem('heroSkills_v23_p2'));
        expect(Object.keys(savedProfile)).toEqual(['skills', 'theme', 'stats']);
        expect(savedProfile.skills).toEqual(result.current.skills);
        expect(savedProfile.theme).toBe('pokemon');
        expect(savedProfile.stats).toEqual(result.current.stats);
        expect(result.current.getProfileStats(2, { reading: { level: 4 } })).toMatchObject({
            highestLevel: 4,
            theme: 'pokemon',
        });
    });

    it.each(['-1', '0', '4', '999', 'abc', 'null', 'NaN', '2.5'])(
        'falls back to profile 1 when the stored current profile is invalid (%s)',
        (storedProfile) => {
            localStorage.setItem('currentProfile_v1', storedProfile);

            const { result } = renderHook(() => useProfileState());

            expect(result.current.currentProfile).toBe(1);
        },
    );

    it.each([
        ['{truncated', '{"1":"Ranger"}'],
        ['{"1":4}', '{"1":"true"}'],
        ['[]', 'null'],
    ])('falls back to default profile metadata for invalid stored schemas', (names, parents) => {
        localStorage.setItem('heroProfileNames_v1', names);
        localStorage.setItem('heroParentStatus_v1', parents);

        const { result } = renderHook(() => useProfileState());

        expect(result.current.profileNames).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
        expect(result.current.parentStatus).toEqual({ 1: false, 2: false, 3: false });
    });

    it('uses existing defaults and derives earned badges and achievements from current state', () => {
        const { result } = renderHook(() => useProfileState());
        expect(result.current.currentProfile).toBe(1);
        expect(result.current.profileNames).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
        expect(result.current.parentStatus).toEqual({ 1: false, 2: false, 3: false });
        expect(result.current.selectedBorder).toBe('solid');
        expect(result.current.borderColor).toBe('#FFD700');
        expect(result.current.unlockedBorders).toEqual([]);

        act(() => {
            result.current.setSkills((previous) => ({
                ...previous,
                reading: { ...previous.reading, level: 180, earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8] },
                math: { ...previous.math, earnedBadges: null },
            }));
            result.current.setStats({ ...getDefaultStats(), battlesThisSession: 10 });
        });

        expect(result.current.unlockedBorders).toEqual([
            'Wood',
            'Stone',
            'Gold',
            'Iron',
            'Emerald',
            'Diamond',
            'Netherite',
            'Obsidian',
            'Star',
        ]);
        expect(result.current.unlockedAchievements).toEqual(['speed_demon', 'full_set']);
    });
});
