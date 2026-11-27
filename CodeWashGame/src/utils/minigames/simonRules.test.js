import { describe, expect, it } from 'vitest';
import { createNextSimonSequence, getSimonInputResult, getSimonRoundDamage, getSimonTempoDelays } from './simonRules';

describe('Simon Says rules', () => {
    it('scales tempo by difficulty and round while preserving minimum delays', () => {
        expect(getSimonTempoDelays(0, 1)).toEqual({ onDelay: 800, offDelay: 280 });
        expect(getSimonTempoDelays(9, 1).onDelay).toBe(200);
        expect(getSimonTempoDelays(0, 7)).toEqual({ onDelay: 200, offDelay: 100 });
    });

    it('classifies wrong, continuing, and completed inputs', () => {
        expect(getSimonInputResult(['Pink', 'Cyan'], 0, 'Red')).toBe('wrong');
        expect(getSimonInputResult(['Pink', 'Cyan'], 0, 'Pink')).toBe('continue');
        expect(getSimonInputResult(['Pink', 'Cyan'], 1, 'Cyan')).toBe('complete');
    });

    it('extends the old sequence or creates a fresh sequence when reset mode is enabled', () => {
        expect(createNextSimonSequence(['Pink'], ['Pink', 'Cyan'], false, () => 0)).toEqual(['Pink', 'Pink']);
        expect(createNextSimonSequence(['Pink'], ['Pink', 'Cyan'], true, () => 0.9)).toEqual(['Cyan', 'Cyan']);
        expect(getSimonRoundDamage(1)).toBe(2);
        expect(getSimonRoundDamage(2)).toBe(3);
    });
});
