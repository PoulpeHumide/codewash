import { describe, expect, it } from 'vitest';
import {
    isCorrectMathAnswer,
    isCorrectWritingAnswer,
    isWrongSpokenAnswer,
    normalizeMathInput,
    normalizeWritingAnswer,
    normalizeWritingInput,
} from './minigameRules';

describe('minigame answer rules', () => {
    it('keeps only numeric math characters and compares answers as strings', () => {
        expect(normalizeMathInput('1a-2.')).toBe('1-2');
        expect(isCorrectMathAnswer('4', 4)).toBe(true);
        expect(isCorrectMathAnswer('04', 4)).toBe(false);
    });

    it('normalizes writing answers without changing internal spacing rules', () => {
        expect(normalizeWritingInput('cat ')).toBe('CAT');
        expect(normalizeWritingAnswer('RED STONE')).toBe('REDSTONE');
        expect(isCorrectWritingAnswer('REDSTONE', 'RED STONE')).toBe(true);
        expect(isCorrectWritingAnswer('RED STONES', 'RED STONE')).toBe(false);
    });

    it('accepts exact spoken answers and homophones but flags substantial mismatches', () => {
        expect(isWrongSpokenAnswer('C', 'CAT')).toBe(false);
        expect(isWrongSpokenAnswer('CAT', 'CAT')).toBe(false);
        expect(isWrongSpokenAnswer('KAT', 'CAT', ['KAT'])).toBe(false);
        expect(isWrongSpokenAnswer('DOG', 'CAT', ['KAT'])).toBe(true);
    });
});
