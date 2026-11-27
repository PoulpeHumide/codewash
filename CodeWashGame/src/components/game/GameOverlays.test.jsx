// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GameOverlays from './GameOverlays';

vi.mock('../PhantomEvent', () => ({
    default: ({ onAwardLevel, onPhantomCaught }) => (
        <>
            <button onClick={onAwardLevel}>Award phantom level</button>
            <button onClick={onPhantomCaught}>Catch phantom</button>
        </>
    ),
}));
vi.mock('../ui/AchievementToast', () => ({
    default: ({ achievementId, tierIndex }) => (
        <div data-testid="achievement-toast">{`${achievementId}:${tierIndex}`}</div>
    ),
}));
vi.mock('../ui/SafeImage', () => ({ default: (props) => <img {...props} /> }));

afterEach(() => {
    vi.useRealTimers();
});

describe('GameOverlays', () => {
    it('renders reward and state overlays and records phantom catches', () => {
        vi.useFakeTimers();
        const checkAchievements = vi.fn();
        const handlePhantomLevelAward = vi.fn();
        const setStats = vi.fn((update) => update({ phantomsCaught: 2 }));
        render(
            <GameOverlays
                lootBox={{ level: 20, skillName: 'Reading', item: 'New Rank!', img: '/badge.png' }}
                achievementToast={{ achievementId: 'first-win', tierIndex: 1 }}
                showDeathOverlay
                showLevelRestored
                battlingSkillId="reading"
                handlePhantomLevelAward={handlePhantomLevelAward}
                setStats={setStats}
                checkAchievements={checkAchievements}
                skills={{ reading: { level: 20 } }}
            />,
        );

        expect(screen.getByText('LEVEL 20 REACHED!')).not.toBeNull();
        expect(screen.getByText('Reading')).not.toBeNull();
        expect(screen.getByText('New Rank!')).not.toBeNull();
        expect(screen.getByTestId('achievement-toast').textContent).toBe('first-win:1');
        expect(screen.getByText('YOU DIED')).not.toBeNull();
        expect(screen.getByText('LEVEL RESTORED!')).not.toBeNull();

        fireEvent.click(screen.getByText('Award phantom level'));
        fireEvent.click(screen.getByText('Catch phantom'));
        expect(handlePhantomLevelAward).toHaveBeenCalledOnce();
        expect(setStats).toHaveBeenCalledOnce();
        expect(setStats.mock.results[0].value.phantomsCaught).toBe(3);
        act(() => vi.advanceTimersByTime(100));
        expect(checkAchievements).toHaveBeenCalledWith(
            { phantomsCaught: 2 },
            { phantomsCaught: 3 },
            { reading: { level: 20 } },
            { reading: { level: 20 } },
        );
    });
});
