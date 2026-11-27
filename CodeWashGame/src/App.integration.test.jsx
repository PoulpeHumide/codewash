// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const sound = vi.hoisted(() => {
    const play = vi.fn();
    return {
        bgm: { isPlaying: false, play, setVolume: vi.fn() },
        play,
        setSfxVolume: vi.fn(),
        getSfxVolume: vi.fn(() => 0.5),
    };
});

vi.mock('./utils/soundManager', () => ({
    getBGMManager: () => sound.bgm,
    setSfxVolume: sound.setSfxVolume,
    getSfxVolume: sound.getSfxVolume,
    playActionCardLeft: sound.play,
    playActionCardRight: sound.play,
    playClick: sound.play,
    playDeath: sound.play,
    playFail: sound.play,
    playLevelUp: sound.play,
    playNotification: sound.play,
    playSuccessfulHit: sound.play,
    playMobHurt: sound.play,
    playMobDeath: sound.play,
    playAchievement: sound.play,
}));

const readProfile = (profileId) => JSON.parse(localStorage.getItem(`heroSkills_v23_p${profileId}`));

const getAppRoot = (container) => container.firstElementChild;
const getRootButtons = (container) => getAppRoot(container).querySelectorAll(':scope > button');
const getProfileCard = (name) => screen.getByText(`${name},`).closest('div[class*="h-[100px]"]');

beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
        'Audio',
        class {
            volume = 1;
            play() {
                return Promise.resolve();
            }
            pause() {}
        },
    );
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('save loading and persistence', () => {
    it('loads legacy, partial profile data and saves the completed state in the current format', () => {
        localStorage.setItem(
            'heroSkills_v23',
            JSON.stringify({
                skills: { math: { level: 4, xp: 25, difficulty: 2 } },
                theme: 'pokemon',
                stats: { totalMobsDefeated: 3 },
            }),
        );

        render(<App />);

        const saved = readProfile(1);
        expect(saved.theme).toBe('pokemon');
        expect(saved.skills.math).toMatchObject({ level: 4, xp: 25, difficulty: 2 });
        expect(saved.skills.reading).toMatchObject({ level: 1, xp: 0, earnedBadges: [] });
        expect(saved.stats).toMatchObject({
            totalMobsDefeated: 3,
            totalBossesDefeated: 0,
            loginDates: [expect.any(String)],
        });
        expect(localStorage.getItem('currentProfile_v1')).toBe('1');
        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))[1]).toBe('Player 1');
    });

    it('recovers from a corrupt skill save with the existing default state', () => {
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('heroSkills_v23_p1', '{invalid json');

        render(<App />);

        expect(warning).toHaveBeenCalledWith('Failed to parse saved skills:', expect.any(SyntaxError));
        expect(readProfile(1).skills.math.level).toBe(1);
        expect(readProfile(1).theme).toBe('minecraft');
    });
});

describe('profile selection and editing', () => {
    it('switches among the existing profiles and persists a renamed profile', () => {
        const { container } = render(<App />);
        fireEvent.click(getRootButtons(container)[0]);

        expect(screen.getByText('Settings')).not.toBeNull();
        fireEvent.click(getProfileCard('Player 2'));
        expect(localStorage.getItem('currentProfile_v1')).toBe('2');
        expect(readProfile(2).skills).toHaveProperty('reading');

        const currentCard = getProfileCard('Player 2');
        fireEvent.click(currentCard.querySelectorAll('svg').item(1));
        const nameInput = within(currentCard).getByRole('textbox');
        fireEvent.change(nameInput, { target: { value: 'Ranger' } });
        fireEvent.click(within(currentCard).getByRole('button'));

        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))[2]).toBe('Ranger');
        expect(screen.getByText('Ranger,')).not.toBeNull();
    });
});

describe('combat characterization', () => {
    it('awards the existing five-hit victory, XP and level-up state deterministically', () => {
        const { container } = render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Enchant!' }));

        const manualSuccess = screen.getByRole('button', { name: 'Skip / Manual Success' });
        for (let hit = 0; hit < 5; hit += 1) {
            fireEvent.click(manualSuccess);
        }

        expect(readProfile(1).skills.reading).toMatchObject({
            level: 2,
            xp: 0,
            mobHealth: 60,
            mobMaxHealth: 60,
        });
        expect(readProfile(1).stats).toMatchObject({
            totalMobsDefeated: 1,
            battlesThisSession: 1,
        });
        expect(container.querySelectorAll('svg[viewBox="0 0 48 48"]')).toHaveLength(10);
    });

    it('applies wrong-answer damage and the defeat recovery after ten math errors', () => {
        vi.useFakeTimers();
        const { container } = render(<App />);
        fireEvent.click(container.querySelectorAll('main > button')[1]);
        fireEvent.click(screen.getByRole('button', { name: 'Calculate!' }));
        const answerInput = screen.getByRole('textbox');

        for (let mistake = 0; mistake < 10; mistake += 1) {
            fireEvent.change(answerInput, { target: { value: '9' } });
            act(() => vi.advanceTimersByTime(510));
        }

        expect(screen.getByText('YOU DIED')).not.toBeNull();
        expect(readProfile(1).stats.totalDeaths).toBe(1);
        expect(readProfile(1).skills.math).toMatchObject({
            level: 1,
            lostLevel: false,
            recoveryDifficulty: 1,
        });
        vi.useRealTimers();
    });
});

describe('application controls', () => {
    it('opens the cosmetics panel, selects a theme, and reports a stable save', () => {
        const { container } = render(<App />);
        fireEvent.click(getRootButtons(container)[1]);

        expect(screen.getByText('Themes & Cosmetics')).not.toBeNull();
        fireEvent.click(screen.getByText('Pokemon').closest('button'));

        expect(readProfile(1).theme).toBe('pokemon');
        expect(readProfile(1).stats.themeChanges).toBe(1);
    });

    it('shows the existing speech fallback and opens the bug-report modal', () => {
        const { container } = render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Enchant!' }));
        fireEvent.click(screen.getByRole('button', { name: 'Tap to Speak' }));
        expect(screen.getByText('Mic not available')).not.toBeNull();

        fireEvent.click(getRootButtons(container)[4]);
        expect(screen.getByText('Discovered a bug?')).not.toBeNull();
    });
});
