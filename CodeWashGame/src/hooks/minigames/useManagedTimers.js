import { useCallback, useEffect, useRef } from 'react';
import { systemTimers } from '../../utils/systemEffects';

export default function useManagedTimers(active = true, timers = systemTimers) {
    const timerIds = useRef(new Set());

    const clearAll = useCallback(() => {
        timerIds.current.forEach((timerId) => timers.clearTimeout(timerId));
        timerIds.current.clear();
    }, [timers]);

    const scheduleTimeout = useCallback(
        (callback, delay) => {
            let timerId;
            timerId = timers.setTimeout(() => {
                timerIds.current.delete(timerId);
                callback();
            }, delay);
            timerIds.current.add(timerId);
            return timerId;
        },
        [timers],
    );

    const cancelTimeout = useCallback(
        (timerId) => {
            timers.clearTimeout(timerId);
            timerIds.current.delete(timerId);
        },
        [timers],
    );

    useEffect(() => {
        if (!active) clearAll();
    }, [active, clearAll]);

    useEffect(() => clearAll, [clearAll]);

    return { scheduleTimeout, cancelTimeout, clearAll };
}
