// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { getReadingWord } from './utils/gameUtils';

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
    playAudioAsset: sound.play,
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
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('save loading and persistence', () => {
    it('uses the injected clock when recording the login date', () => {
        const clock = { now: vi.fn(() => Date.parse('2026-01-02T03:04:05.000Z')) };

        render(<App clock={clock} random={() => 0} />);

        expect(readProfile(1).stats.loginDates).toContain('2026-01-02');
        expect(clock.now).toHaveBeenCalled();
    });

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
        vi.useFakeTimers();
        const { container } = render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Enchant!' }));

        const manualSuccess = screen.getByRole('button', { name: 'Skip / Manual Success' });
        for (let hit = 0; hit < 5; hit += 1) {
            fireEvent.click(manualSuccess);
        }
        act(() => vi.advanceTimersByTime(100));

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
        vi.useRealTimers();
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

    it('starts browser speech recognition and accepts the current reading answer', () => {
        class SpeechRecognitionMock {
            static instances = [];

            constructor() {
                this.start = vi.fn();
                this.stop = vi.fn();
                SpeechRecognitionMock.instances.push(this);
            }
        }

        vi.stubGlobal('webkitSpeechRecognition', SpeechRecognitionMock);
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Enchant!' }));

        const recognition = SpeechRecognitionMock.instances[0];
        expect(recognition.lang).toBe('en-US');
        expect(recognition.continuous).toBe(true);
        expect(recognition.start).toHaveBeenCalledOnce();

        act(() => recognition.onstart());
        expect(screen.getByText('Listening...')).not.toBeNull();

        const answer = getReadingWord(1).toUpperCase();
        act(() =>
            recognition.onresult({
                results: [[{ transcript: `${answer}.` }]],
            }),
        );

        expect(readProfile(1).skills.reading.mobHealth).toBeLessThan(60);
    });

    it('supports fullscreen changes, all challenge types, difficulty updates, and carousel drag', async () => {
        vi.useFakeTimers();
        localStorage.setItem(
            'heroSkills_v23_p1',
            JSON.stringify({
                skills: {
                    reading: { level: 20 },
                    math: { level: 10 },
                },
            }),
        );
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
        document.documentElement.requestFullscreen = vi.fn().mockRejectedValue(new Error('blocked'));
        document.exitFullscreen = vi.fn().mockRejectedValue(new Error('blocked'));
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(<App />);

        await act(async () => {
            fireEvent.click(screen.getByTitle('Enter fullscreen'));
            await Promise.resolve();
        });
        expect(document.documentElement.requestFullscreen).toHaveBeenCalledOnce();
        act(() => document.dispatchEvent(new Event('fullscreenchange')));
        Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            value: document.documentElement,
        });
        act(() => document.dispatchEvent(new Event('fullscreenchange')));
        await act(async () => {
            fireEvent.click(screen.getByTitle('Exit fullscreen'));
            await Promise.resolve();
        });
        expect(document.exitFullscreen).toHaveBeenCalledOnce();

        const difficultyImage = screen.getByAltText('Difficulty 1');
        fireEvent.click(difficultyImage.closest('div.absolute').querySelectorAll('button')[1]);

        const carousel = container.querySelector('.perspective-1000');
        fireEvent.mouseDown(carousel, { clientX: 200 });
        fireEvent.mouseMove(carousel, { clientX: 50 });
        fireEvent.mouseUp(carousel);
        fireEvent.mouseDown(carousel, { clientX: 50 });
        fireEvent.mouseMove(carousel, { clientX: 200 });
        fireEvent.mouseUp(carousel);

        for (const [nextIndex, actionName] of [
            [1, 'Calculate!'],
            [2, 'Craft!'],
            [3, 'Organize!'],
            [4, 'Match!'],
            [5, 'Solve!'],
        ]) {
            if (nextIndex > 1) fireEvent.click(container.querySelectorAll('main > button')[1]);
            fireEvent.click(screen.getByRole('button', { name: actionName }));
            const battleBackdrop = document.querySelector('div.fixed.inset-0.z-50');
            expect(battleBackdrop).not.toBeNull();
            fireEvent.click(battleBackdrop);
        }

        expect(warning).toHaveBeenCalledWith('Failed to enter fullscreen:', expect.any(Error));
        expect(warning).toHaveBeenCalledWith('Failed to exit fullscreen:', expect.any(Error));
        expect(readProfile(1).skills.reading.difficulty).toBe(2);
    });

    it('shows a tiered achievement after a deterministic phantom catch', () => {
        vi.useFakeTimers();
        localStorage.setItem(
            'heroSkills_v23_p1',
            JSON.stringify({
                skills: {},
                stats: { phantomsCaught: 9 },
            }),
        );
        render(<App />);

        act(() => vi.advanceTimersByTime(0));
        fireEvent.click(screen.getByAltText('Phantom'));
        act(() => vi.advanceTimersByTime(100));

        expect(readProfile(1).stats.phantomsCaught).toBe(10);
        expect(screen.getAllByText('Silver Ghost Buster')).toHaveLength(2);
        vi.useRealTimers();
    });
});
