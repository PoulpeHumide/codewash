import { afterEach, describe, expect, it, vi } from 'vitest';
import { systemClock, systemRandom, systemTimers } from './systemEffects';

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('system effects', () => {
    it('exposes controllable defaults for the clock and random source', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'));
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.25);

        expect(systemClock.now()).toBe(Date.parse('2026-01-02T03:04:05.000Z'));
        expect(systemRandom()).toBe(0.25);
        expect(randomSpy).toHaveBeenCalledOnce();
    });

    it('wraps timeout and interval APIs', () => {
        vi.useFakeTimers();
        const timeout = vi.fn();
        const interval = vi.fn();
        const timeoutId = systemTimers.setTimeout(timeout, 10);
        const intervalId = systemTimers.setInterval(interval, 5);

        vi.advanceTimersByTime(10);
        expect(timeout).toHaveBeenCalledOnce();
        expect(interval).toHaveBeenCalledTimes(2);
        systemTimers.clearTimeout(timeoutId);
        systemTimers.clearInterval(intervalId);
    });
});
