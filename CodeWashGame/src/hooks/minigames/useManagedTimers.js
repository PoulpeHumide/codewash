import { useCallback, useEffect, useRef } from 'react';

export default function useManagedTimers(active = true) {
    const timerIds = useRef(new Set());

    const clearAll = useCallback(() => {
        timerIds.current.forEach((timerId) => clearTimeout(timerId));
        timerIds.current.clear();
    }, []);

    const scheduleTimeout = useCallback((callback, delay) => {
        let timerId;
        timerId = setTimeout(() => {
            timerIds.current.delete(timerId);
            callback();
        }, delay);
        timerIds.current.add(timerId);
        return timerId;
    }, []);

    const cancelTimeout = useCallback((timerId) => {
        clearTimeout(timerId);
        timerIds.current.delete(timerId);
    }, []);

    useEffect(() => {
        if (!active) clearAll();
    }, [active, clearAll]);

    useEffect(() => clearAll, [clearAll]);

    return { scheduleTimeout, cancelTimeout, clearAll };
}
