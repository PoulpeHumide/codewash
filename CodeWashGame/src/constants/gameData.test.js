import { describe, expect, it } from 'vitest';
import * as gameData from './gameData';

describe('game data public contract', () => {
    it('retains the complete named export surface', () => {
        expect(Object.keys(gameData).sort()).toEqual(
            [
                'BADGE_TIERS',
                'BASE_ASSETS',
                'BOSS_MOBS',
                'CHEST_BLOCKS',
                'DIFFICULTY_CONTENT',
                'DIFFICULTY_IMAGES',
                'FRIENDLY_MOBS',
                'FUNNY_LONG_WORDS',
                'HOMOPHONES',
                'HOSTILE_MOBS',
                'MINIBOSS_MOBS',
                'MOB_KEYS',
                'READING_WORDS',
                'SKILL_DATA',
                'SPECIAL_CHESTS',
                'SPELLING_ITEMS',
                'THEMES_LIST',
                'THEME_CONFIG',
                'WRITING_DIFFICULTY_POOLS',
                'WRITING_ITEMS_BY_LENGTH',
                'WRITING_WORD_INDEX',
                'formatDisplayName',
            ].sort(),
        );
    });

    it('preserves the schemas and representative game data', () => {
        const {
            BADGE_TIERS,
            BASE_ASSETS,
            BOSS_MOBS,
            CHEST_BLOCKS,
            DIFFICULTY_CONTENT,
            DIFFICULTY_IMAGES,
            FRIENDLY_MOBS,
            FUNNY_LONG_WORDS,
            HOMOPHONES,
            HOSTILE_MOBS,
            MINIBOSS_MOBS,
            MOB_KEYS,
            READING_WORDS,
            SKILL_DATA,
            SPECIAL_CHESTS,
            SPELLING_ITEMS,
            THEMES_LIST,
            THEME_CONFIG,
            WRITING_DIFFICULTY_POOLS,
            WRITING_ITEMS_BY_LENGTH,
            WRITING_WORD_INDEX,
            formatDisplayName,
        } = gameData;

        expect(Object.keys(BASE_ASSETS)).toEqual(['skillIcons', 'badges', 'audio', 'axolotls', 'items']);
        expect(Object.keys(FRIENDLY_MOBS)).toHaveLength(26);
        expect(HOSTILE_MOBS).toHaveProperty('Creeper', 'assets/mobs/hostile/creeper.png');
        expect(Object.keys(BOSS_MOBS)).toEqual(['Ender Dragon', 'Herobrine', 'Warden', 'Wither']);
        expect(Object.keys(MINIBOSS_MOBS)).toEqual(['Creaking', 'Elder Guardian', 'Ravager', 'Wither Skeleton']);
        expect(Object.keys(CHEST_BLOCKS)).toContain('Trapped Chest');
        expect(
            [FRIENDLY_MOBS, HOSTILE_MOBS, BOSS_MOBS, MINIBOSS_MOBS, CHEST_BLOCKS, BASE_ASSETS.items].every((map) =>
                Object.values(map).every((path) => typeof path === 'string' && path.startsWith('assets/')),
            ),
        ).toBe(true);
        expect(SPECIAL_CHESTS).toEqual(['Ender Chest', 'Shulker Box']);
        expect(Object.keys(DIFFICULTY_CONTENT)).toEqual([
            'reading',
            'math',
            'writing',
            'patterns',
            'memory',
            'cleaning',
        ]);
        expect(
            Object.values(DIFFICULTY_CONTENT).every((skillContent) =>
                Object.keys(skillContent).every((tier) => Number(tier) >= 1 && Number(tier) <= 7),
            ),
        ).toBe(true);
        expect(DIFFICULTY_IMAGES[7]).toBe('assets/difficulty/Difficulty_7.png');
        expect(Object.keys(THEME_CONFIG)).toEqual(['minecraft', 'kpop', 'pokemon', 'spy']);
        expect(THEMES_LIST.map(({ id }) => id)).toEqual(['minecraft', 'kpop', 'pokemon', 'spy']);
        expect(THEMES_LIST.every(({ id, name, img }) => id && name && img.startsWith('assets/'))).toBe(true);
        expect(
            Object.entries(THEME_CONFIG).every(
                ([id, theme]) =>
                    THEMES_LIST.some((item) => item.id === id) &&
                    theme.name &&
                    theme.style.backgroundImage &&
                    theme.assets.logo &&
                    theme.assets.cardBack &&
                    Object.keys(theme.skills).length === 6,
            ),
        ).toBe(true);
        expect(BADGE_TIERS.map(({ level }) => level)).toEqual([20, 40, 60, 80, 100, 120, 140, 160]);
        expect(READING_WORDS[3]).toContain('CAT');
        expect(FUNNY_LONG_WORDS).toContain('SUPERCALIFRAGILISTICEXPIALIDOCIOUS');
        expect(SPELLING_ITEMS[0]).toEqual({ word: 'TNT', length: 3 });
        expect(SPELLING_ITEMS.every(({ word, length }) => word && word.length === length)).toBe(true);
        expect(formatDisplayName('coppergolem')).toBe('Copper Golem');
        expect(formatDisplayName('BOB')).toBe('Bob');
        expect(
            WRITING_WORD_INDEX.every(
                ({ word, displayName, length, imagePath }) => word && displayName && length && imagePath,
            ),
        ).toBe(true);
        expect(Object.keys(WRITING_DIFFICULTY_POOLS)).toEqual(['1', '2', '3', '4', '5']);
        expect(Object.keys(WRITING_ITEMS_BY_LENGTH)).toEqual(['3', '4', '5', '6', '7', '8', '9']);
        expect(HOMOPHONES.SEE).toEqual(['SEA', 'C']);
        expect(MOB_KEYS).toEqual(Object.keys(HOSTILE_MOBS));
        expect(SKILL_DATA.map(({ id }) => id)).toEqual([
            'reading',
            'math',
            'writing',
            'cleaning',
            'memory',
            'patterns',
        ]);
        SKILL_DATA.forEach((skill) => {
            expect(skill).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                    class: expect.any(String),
                    fantasyName: expect.any(String),
                    actionName: expect.any(String),
                    taskDescription: expect.any(String),
                    colorStyle: expect.objectContaining({ background: expect.any(String) }),
                    accent: expect.any(String),
                    boss: expect.any(String),
                    hasChallenge: true,
                }),
            );
            expect(skill.img).toMatch(/^assets\//);
            expect(skill.challengeType).toBe(skill.id);
            expect(Number.isInteger(skill.mobOffset)).toBe(true);
        });
    });
});
