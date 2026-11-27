import { describe, expect, it } from 'vitest';
import {
    getDisplayMobNameWithAura,
    getSelectedBorderStyle,
    getSkillButtonStyle,
    getSkillCardSectionClasses,
    getSkillLevelStyle,
    getSkillMobAppearance,
} from './skillCardPresentation';

describe('skill card presentation rules', () => {
    it('selects the level border and text style at each progression threshold', () => {
        expect(getSkillLevelStyle(1)).toEqual({ borderClass: 'border-stone-500', levelTextColor: 'text-white' });
        expect(getSkillLevelStyle(20)).toEqual({ borderClass: 'border-wood', levelTextColor: 'text-amber-700' });
        expect(getSkillLevelStyle(40)).toEqual({ borderClass: 'border-stone', levelTextColor: 'text-stone-400' });
        expect(getSkillLevelStyle(60)).toEqual({ borderClass: 'border-gold', levelTextColor: 'text-yellow-400' });
        expect(getSkillLevelStyle(80)).toEqual({ borderClass: 'border-iron', levelTextColor: 'text-gray-200' });
        expect(getSkillLevelStyle(100)).toEqual({
            borderClass: 'border-emerald',
            levelTextColor: 'text-emerald-400',
        });
        expect(getSkillLevelStyle(120)).toEqual({ borderClass: 'border-diamond', levelTextColor: 'text-cyan-300' });
        expect(getSkillLevelStyle(140)).toEqual({
            borderClass: 'border-netherite',
            levelTextColor: 'text-gray-500',
        });
        expect(getSkillLevelStyle(160)).toEqual({
            borderClass: 'border-netherite',
            levelTextColor: 'text-rainbow',
        });
    });

    it('applies each selected border treatment only to the centered card', () => {
        expect(getSelectedBorderStyle(false, 'solid', '#123456').borderStyle).toEqual({});
        expect(getSelectedBorderStyle(true, null, '#123456').borderStyle).toEqual({});
        expect(getSelectedBorderStyle(true, 'solid', '#123456').borderStyle).toEqual({
            borderColor: '#FFD700',
            boxShadow: '0 0 20px #FFD700, 0 0 40px #FFD700',
        });
        expect(getSelectedBorderStyle(true, 'solid-picker', '#123456').borderStyle.borderColor).toBe('#123456');
        expect(getSelectedBorderStyle(true, 'gradient', '#123456').borderStyle).toEqual({
            '--border-color': '#123456',
        });
        expect(getSelectedBorderStyle(true, 'sparkle', null).borderStyle).toEqual({ '--border-color': '#FFD700' });
        expect(getSelectedBorderStyle(true, 'fire', null)).toEqual({
            appliedBorderEffect: 'border-effect-fire',
            borderStyle: {},
        });
    });

    it('resolves skill mob sources with the same fallback names', () => {
        expect(getSkillMobAppearance('memory', 'Zombie', {})).toEqual({
            mobSrc: 'assets/skills/farm_icon.png',
            displayMobName: 'Zombie',
        });
        expect(getSkillMobAppearance('cleaning', 'Custom', { Custom: '/theme-chest.png' }).mobSrc).toBe(
            '/theme-chest.png',
        );
        expect(getSkillMobAppearance('cleaning', 'missing', {}).displayMobName).toBe('missing');
        expect(getSkillMobAppearance('reading', 'Zombie', {}).displayMobName).toBe('Zombie');
        expect(getSkillMobAppearance('patterns', 'missing', {}).displayMobName).toBe('Zombie');
    });

    it('formats aura labels, button styles, and memory-specific card sections', () => {
        expect(getDisplayMobNameWithAura(true, 'lava', 'Zombie')).toBe('Flaming Zombie');
        expect(getDisplayMobNameWithAura(false, 'lava', 'Zombie')).toBe('Zombie');
        expect(getDisplayMobNameWithAura(true, 'unknown', 'Zombie')).toBe('Zombie');
        expect(getSkillButtonStyle({}).background).toContain('#7e22ce');
        expect(getSkillButtonStyle({ background: 'linear-gradient(#123456, #ABCDEF)' })).toEqual({
            background: 'linear-gradient(to bottom, #123456, #ABCDEF)',
            boxShadow: '0 6px 0 #83a5c7',
            borderColor: '#123456',
        });
        expect(getSkillCardSectionClasses('memory', true).topSectionBaseClass).toBe('hidden');
        expect(getSkillCardSectionClasses('memory', false).bottomSectionClass).toContain('rounded-b-sm');
        expect(getSkillCardSectionClasses('reading', true).topSectionBaseClass).toContain('h-[55%]');
    });
});
