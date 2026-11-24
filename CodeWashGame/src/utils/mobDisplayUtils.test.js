// Characterization tests for src/utils/mobDisplayUtils.js (DEBT-01).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AURA_ADJECTIVES, generateMobWithAura, getRandomAura } from './mobDisplayUtils';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('mob auras', () => {
    it('only draws auras that have a display adjective', () => {
        for (let i = 0; i < 100; i++) {
            expect(Object.keys(AURA_ADJECTIVES)).toContain(getRandomAura());
        }
    });

    it('prefixes the mob name with the aura adjective', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0); // first aura: rainbow
        expect(generateMobWithAura('Zombie', 'assets/zombie.png')).toEqual({
            mobName: 'Zombie',
            mobSrc: 'assets/zombie.png',
            aura: 'rainbow',
            displayName: 'Prismatic Zombie',
        });
    });
});
