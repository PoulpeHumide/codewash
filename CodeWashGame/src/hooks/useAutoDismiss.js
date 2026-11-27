import { useEffect } from 'react';
import { systemTimers } from '../utils/systemEffects';

export default function useAutoDismiss(condition, callback, delay, timers = systemTimers) {
    useEffect(() => {
        if (!condition) return undefined;
        const timerId = timers.setTimeout(callback, delay);
        return () => timers.clearTimeout(timerId);
    }, [condition, callback, delay, timers]);
}
