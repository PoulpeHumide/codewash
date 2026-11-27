import { describe, expect, it } from 'vitest';
import { canFlipMemoryCard, createMemoryDeck, hasMemoryGameWon, isMatchingMemoryPair } from './memoryRules';

describe('memory game rules', () => {
    const mobs = { Allay: '/allay.png', Bunny: '/bunny.png', Cat: '/cat.png' };
    const cards = [
        { id: 0, color: 'Allay' },
        { id: 1, color: 'Bunny' },
        { id: 2, color: 'Allay' },
    ];

    it('creates exactly the configured number of matching pairs', () => {
        const deck = createMemoryDeck(mobs, 2, () => 0);
        expect(deck).toHaveLength(4);
        expect(deck.map(({ id }) => id)).toEqual([0, 1, 2, 3]);
        expect(
            Object.values(
                deck.reduce((counts, card) => ({ ...counts, [card.color]: (counts[card.color] || 0) + 1 }), {}),
            ),
        ).toEqual([2, 2]);
    });

    it('rejects flipping while processing, already flipped, or matched cards', () => {
        expect(canFlipMemoryCard(false, [], [], cards, 0)).toBe(true);
        expect(canFlipMemoryCard(true, [], [], cards, 0)).toBe(false);
        expect(canFlipMemoryCard(false, [0], [], cards, 0)).toBe(false);
        expect(canFlipMemoryCard(false, [], ['Allay'], cards, 2)).toBe(false);
    });

    it('identifies matches and the final matched-pair transition', () => {
        expect(isMatchingMemoryPair(cards, 0, 2)).toBe(true);
        expect(isMatchingMemoryPair(cards, 0, 1)).toBe(false);
        expect(hasMemoryGameWon(['Allay'], 2)).toBe(false);
        expect(hasMemoryGameWon(['Allay', 'Bunny'], 2)).toBe(true);
    });
});
