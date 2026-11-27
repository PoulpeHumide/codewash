export const systemClock = {
    now: () => Date.now(),
};

export const systemRandom = () => Math.random();

export const systemTimers = {
    setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
    clearTimeout: (timerId) => globalThis.clearTimeout(timerId),
    setInterval: (callback, delay) => globalThis.setInterval(callback, delay),
    clearInterval: (timerId) => globalThis.clearInterval(timerId),
};
