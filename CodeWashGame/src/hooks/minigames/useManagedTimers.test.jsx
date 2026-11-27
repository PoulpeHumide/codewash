// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useManagedTimers from './useManagedTimers';

afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
});

describe('useManagedTimers', () => {
    it('uses the injected timer scheduler for callbacks and cleanup', () => {
        vi.useFakeTimers();
        const timers = {
            setTimeout: vi.fn((callback, delay) => setTimeout(callback, delay)),
            clearTimeout: vi.fn((timerId) => clearTimeout(timerId)),
        };
        const { result, unmount } = renderHook(() => useManagedTimers(true, timers));
        const callback = vi.fn();

        act(() => result.current.scheduleTimeout(callback, 250));
        expect(timers.setTimeout).toHaveBeenCalledWith(expect.any(Function), 250);
        unmount();
        expect(timers.clearTimeout).toHaveBeenCalledOnce();
        act(() => vi.advanceTimersByTime(250));
        expect(callback).not.toHaveBeenCalled();
    });

    it('runs scheduled callbacks at their original delay and removes completed timers', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useManagedTimers());
        const callback = vi.fn();

        act(() => result.current.scheduleTimeout(callback, 300));
        act(() => vi.advanceTimersByTime(299));
        expect(callback).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(1));
        expect(callback).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels a selected timeout and all timeouts when disabled or unmounted', () => {
        vi.useFakeTimers();
        const { result, rerender, unmount } = renderHook(({ active }) => useManagedTimers(active), {
            initialProps: { active: true },
        });
        const callback = vi.fn();

        let cancelledTimer;
        act(() => {
            cancelledTimer = result.current.scheduleTimeout(callback, 100);
            result.current.scheduleTimeout(callback, 200);
        });
        act(() => result.current.cancelTimeout(cancelledTimer));
        expect(vi.getTimerCount()).toBe(1);

        rerender({ active: false });
        expect(vi.getTimerCount()).toBe(0);
        act(() => vi.advanceTimersByTime(500));
        expect(callback).not.toHaveBeenCalled();

        rerender({ active: true });
        act(() => result.current.scheduleTimeout(callback, 100));
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
