// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useSkillCardMiniGames from './useSkillCardMiniGames';

const sound = vi.hoisted(() => ({ playClick: vi.fn(), getSfxVolume: vi.fn(() => 0.5) }));

vi.mock('../../utils/soundManager', () => ({
    playClick: sound.playClick,
    getSfxVolume: sound.getSfxVolume,
}));

afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('useSkillCardMiniGames', () => {
    it('falls back to the click sound for an unmapped Simon color', () => {
        vi.useFakeTimers();
        vi.stubGlobal(
            'Audio',
            class {
                play() {
                    return Promise.resolve();
                }
            },
        );
        const { result, unmount } = renderHook(() =>
            useSkillCardMiniGames({
                config: { id: 'patterns', challengeType: 'patterns' },
                challenge: { answer: 'WIN' },
                isBattling: true,
                spokenText: '',
                damageNumbers: [],
                difficulty: 1,
                onMathSubmit: vi.fn(),
            }),
        );

        act(() => vi.advanceTimersByTime(1580));
        act(() => result.current.handleAxolotlClick('Unknown'));

        expect(sound.playClick).toHaveBeenCalledOnce();
        unmount();
    });
});
