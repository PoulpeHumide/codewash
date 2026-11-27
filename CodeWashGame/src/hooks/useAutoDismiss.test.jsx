// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useAutoDismiss from './useAutoDismiss';

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('useAutoDismiss', () => {
    it('schedules active values and clears timers on changes and unmount', () => {
        let nextTimerId = 0;
        const timers = {
            setTimeout: vi.fn(() => ++nextTimerId),
            clearTimeout: vi.fn(),
        };
        const callback = vi.fn();
        const { rerender, unmount } = renderHook(
            ({ active, delay }) => useAutoDismiss(active, callback, delay, timers),
            { initialProps: { active: false, delay: 4000 } },
        );

        expect(timers.setTimeout).not.toHaveBeenCalled();

        rerender({ active: true, delay: 4000 });
        expect(timers.setTimeout).toHaveBeenCalledWith(expect.any(Function), 4000);
        rerender({ active: true, delay: 6000 });
        expect(timers.clearTimeout).toHaveBeenCalledWith(1);
        expect(timers.setTimeout).toHaveBeenCalledTimes(2);
        unmount();
        expect(timers.clearTimeout).toHaveBeenCalledWith(2);
    });

    it('fires the latest callback when the scheduled delay completes', () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const { rerender } = renderHook(({ onDismiss }) => useAutoDismiss(true, onDismiss, 250), {
            initialProps: { onDismiss: callback },
        });
        const updatedCallback = vi.fn();
        rerender({ onDismiss: updatedCallback });

        act(() => vi.advanceTimersByTime(250));

        expect(callback).not.toHaveBeenCalled();
        expect(updatedCallback).toHaveBeenCalledOnce();
    });
});
