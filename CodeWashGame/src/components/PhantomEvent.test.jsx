// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PhantomEvent from './PhantomEvent';

vi.mock('../utils/soundManager', () => ({ playSuccessfulHit: vi.fn() }));

const createTimerScheduler = () => {
    const scheduled = [];
    let nextTimerId = 0;
    const timers = {
        setTimeout: vi.fn((callback, delay) => {
            const timer = { id: ++nextTimerId, callback, delay };
            scheduled.push(timer);
            return timer.id;
        }),
        clearTimeout: vi.fn(),
    };
    return { scheduled, timers };
};

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

    it('uses injected clock, randomness, and timers without changing cooldown timing', () => {
        const now = 300_000;
        const clock = { now: vi.fn(() => now) };
        const random = vi.fn(() => 0.25);
        const { scheduled, timers } = createTimerScheduler();
        localStorage.setItem('phantomEvent_lastSpawn_v1', '0');
        const { unmount } = render(<PhantomEvent clock={clock} random={random} timers={timers} />);

        expect(scheduled[0].delay).toBe(75_000);
        act(() => scheduled[0].callback());
        expect(localStorage.getItem('phantomEvent_lastSpawn_v1')).toBe(String(now));
        expect(random).toHaveBeenCalledTimes(2);
        expect(clock.now).toHaveBeenCalledTimes(2);
        unmount();
        expect(timers.clearTimeout).toHaveBeenCalledWith(2);
    });

    it('awards a caught phantom and clears click and flight timers on unmount', () => {
        const { scheduled, timers } = createTimerScheduler();
        const onAwardLevel = vi.fn();
        const onPhantomCaught = vi.fn();
        localStorage.setItem('phantomEvent_lastSpawn_v1', '0');
        const { unmount } = render(
            <PhantomEvent
                battlingSkillId="math"
                onAwardLevel={onAwardLevel}
                onPhantomCaught={onPhantomCaught}
                clock={{ now: () => 300_000 }}
                random={() => 0}
                timers={timers}
            />,
        );

        act(() => scheduled[0].callback());
        fireEvent.click(screen.getByAltText('Phantom'));

        expect(onAwardLevel).toHaveBeenCalledWith('math');
        expect(onPhantomCaught).toHaveBeenCalledOnce();
        expect(scheduled[2].delay).toBe(200);

        unmount();

        expect(timers.clearTimeout).toHaveBeenCalledWith(2);
        expect(timers.clearTimeout).toHaveBeenCalledWith(3);
    });

    it('clears the phantom after the click delay and schedules its next appearance', () => {
        localStorage.setItem('phantomEvent_lastSpawn_v1', '0');
        const { container } = render(<PhantomEvent random={() => 0} />);

        act(() => vi.advanceTimersByTime(0));
        fireEvent.click(screen.getByAltText('Phantom'));
        act(() => vi.advanceTimersByTime(200));

        expect(container.firstChild).toBeNull();
        expect(vi.getTimerCount()).toBe(1);
    });

    it('reschedules after the phantom flight completes', () => {
        localStorage.setItem('phantomEvent_lastSpawn_v1', '0');
        const { container } = render(<PhantomEvent random={() => 0} />);

        act(() => vi.advanceTimersByTime(0));
        expect(screen.getByAltText('Phantom')).not.toBeNull();
        act(() => vi.advanceTimersByTime(8000));

        expect(container.firstChild).toBeNull();
        expect(vi.getTimerCount()).toBe(1);
    });
});
