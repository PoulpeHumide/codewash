// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PhantomEvent from './PhantomEvent';

vi.mock('../utils/soundManager', () => ({ playSuccessfulHit: vi.fn() }));

beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('PhantomEvent storage', () => {
    it.each(['0', 'invalid'])('uses a safe cooldown value for stored timestamp %s', (timestamp) => {
        localStorage.setItem('phantomEvent_lastSpawn_v1', timestamp);
        const { container } = render(<PhantomEvent onAwardLevel={vi.fn()} />);

        if (timestamp === 'invalid') {
            expect(console.warn).toHaveBeenCalledWith('Invalid phantom cooldown; using 0.');
        }

        act(() => vi.advanceTimersByTime(0));
        expect(localStorage.getItem('phantomEvent_lastSpawn_v1')).toBe(Date.now().toString());
        expect(container.firstChild).not.toBeNull();
    });
});
