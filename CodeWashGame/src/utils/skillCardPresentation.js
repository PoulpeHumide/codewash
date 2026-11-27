import { BASE_ASSETS, BOSS_MOBS, CHEST_BLOCKS, HOSTILE_MOBS, MINIBOSS_MOBS } from '../constants/gameData';
import { AURA_ADJECTIVES } from './mobDisplayUtils';

export const getSkillLevelStyle = (level) => {
    let borderClass = 'border-stone-500';
    let levelTextColor = 'text-white';
    if (level >= 20) {
        levelTextColor = 'text-amber-700';
        borderClass = 'border-wood';
    }
    if (level >= 40) {
        levelTextColor = 'text-stone-400';
        borderClass = 'border-stone';
    }
    if (level >= 60) {
        levelTextColor = 'text-yellow-400';
        borderClass = 'border-gold';
    }
    if (level >= 80) {
        levelTextColor = 'text-gray-200';
        borderClass = 'border-iron';
    }
    if (level >= 100) {
        levelTextColor = 'text-emerald-400';
        borderClass = 'border-emerald';
    }
    if (level >= 120) {
        levelTextColor = 'text-cyan-300';
        borderClass = 'border-diamond';
    }
    if (level >= 140) {
        levelTextColor = 'text-gray-500';
        borderClass = 'border-netherite';
    }
    if (level >= 160) {
        levelTextColor = 'text-rainbow';
        borderClass = 'border-netherite';
    }
    return { borderClass, levelTextColor };
};

export const getSelectedBorderStyle = (isCenter, selectedBorder, borderColor) => {
    if (!isCenter || !selectedBorder) return { appliedBorderEffect: '', borderStyle: {} };
    if (selectedBorder === 'solid' || selectedBorder === 'solid-picker') {
        const effectiveColor = selectedBorder === 'solid' ? '#FFD700' : borderColor || '#FFD700';
        return {
            appliedBorderEffect: '',
            borderStyle: {
                borderColor: effectiveColor,
                boxShadow: `0 0 20px ${effectiveColor}, 0 0 40px ${effectiveColor}`,
            },
        };
    }
    const borderStyle =
        selectedBorder === 'gradient' || selectedBorder === 'sparkle'
            ? { '--border-color': borderColor || '#FFD700' }
            : {};
    return { appliedBorderEffect: `border-effect-${selectedBorder}`, borderStyle };
};

export const getSkillMobAppearance = (skillId, mobName, themeMobs) => {
    if (skillId === 'memory') return { mobSrc: 'assets/skills/farm_icon.png', displayMobName: mobName };
    if (skillId === 'cleaning') {
        return {
            mobSrc: CHEST_BLOCKS[mobName] || themeMobs[mobName] || BASE_ASSETS.axolotls.Pink,
            displayMobName: mobName,
        };
    }
    const mobSrc = HOSTILE_MOBS[mobName] || BOSS_MOBS[mobName] || MINIBOSS_MOBS[mobName] || themeMobs[mobName];
    if (mobSrc) return { mobSrc, displayMobName: mobName };
    const displayMobName = 'Zombie';
    return {
        mobSrc: HOSTILE_MOBS[displayMobName] || BASE_ASSETS.axolotls.Pink,
        displayMobName,
    };
};

export const getDisplayMobNameWithAura = (isBattling, mobAura, displayMobName) =>
    isBattling && mobAura && AURA_ADJECTIVES[mobAura]
        ? `${AURA_ADJECTIVES[mobAura]} ${displayMobName}`
        : displayMobName;

export const getSkillButtonStyle = (colorStyle) => {
    const gradientMatch = colorStyle?.background?.match(/#([a-fA-F0-9]{6})/g);
    if (!gradientMatch || gradientMatch.length < 2) {
        return {
            background: 'linear-gradient(to bottom, #7e22ce, #581c87)',
            boxShadow: '0 6px 0 #581c87',
            borderColor: '#a855f7',
        };
    }
    const [fromColor, toColor] = gradientMatch;
    const darkenColor = (hex) => {
        const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
        const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
        const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    return {
        background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
        boxShadow: `0 6px 0 ${darkenColor(toColor)}`,
        borderColor: fromColor,
    };
};

export const getSkillCardSectionClasses = (skillId, isBattling) => ({
    topSectionBaseClass:
        skillId === 'memory' && isBattling
            ? 'hidden'
            : 'h-[55%] relative flex items-center justify-center overflow-hidden rounded-t-sm',
    bottomSectionClass:
        skillId === 'memory' && isBattling
            ? 'h-full bg-[#3a3a3a] p-4 flex flex-col relative rounded-lg'
            : 'flex-1 bg-[#3a3a3a] p-4 flex flex-col relative rounded-b-sm',
});
