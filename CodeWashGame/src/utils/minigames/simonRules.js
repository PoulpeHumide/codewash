const MAX_TEMPO_DELAY = 800;
const MIN_TEMPO_DELAY = 200;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const lerp = (start, end, amount) => start + (end - start) * clamp(amount, 0, 1);

export const getSimonTempoDelays = (completedRounds, currentDifficulty) => {
    const round = completedRounds + 1;
    const startingDelay = lerp(MAX_TEMPO_DELAY, MIN_TEMPO_DELAY, (currentDifficulty - 1) / 6);
    const maxRunwayRounds = lerp(10, 1, (currentDifficulty - 1) / 6);
    const runwayProgress = maxRunwayRounds > 1 ? (round - 1) / (maxRunwayRounds - 1) : 1;
    const rawOnDelay = lerp(startingDelay, MIN_TEMPO_DELAY, runwayProgress);
    const onDelay = clamp(rawOnDelay, MIN_TEMPO_DELAY, MAX_TEMPO_DELAY);

    return { onDelay, offDelay: Math.max(100, Math.round(onDelay * 0.35)) };
};

export const getSimonInputResult = (sequence, playerIndex, color) => {
    if (color !== sequence[playerIndex]) return 'wrong';
    return playerIndex === sequence.length - 1 ? 'complete' : 'continue';
};

export const createNextSimonSequence = (sequence, colors, shouldReset, random = Math.random) => {
    if (shouldReset) {
        return Array.from({ length: sequence.length + 1 }, () => colors[Math.floor(random() * colors.length)]);
    }

    return [...sequence, colors[Math.floor(random() * colors.length)]];
};

export const getSimonRoundDamage = (round) => Math.round(round * 1.5);
