const MULTI_WORD_DISPLAY_NAMES = {
    coppergolem: 'Copper Golem',
    irongolem: 'Iron Golem',
    snowgolem: 'Snow Golem',
    glowsquid: 'Glow Squid',
    polarbear: 'Polar Bear',
    magmacube: 'Magma Cube',
    elderguardian: 'Elder Guardian',
    enderdragon: 'Ender Dragon',
    witherskeleton: 'Wither Skeleton',
    ender_chest: 'Ender Chest',
    shulker_box: 'Shulker Box',
    trapped_chest: 'Trapped Chest',
};

export const formatDisplayName = (word) =>
    MULTI_WORD_DISPLAY_NAMES[word.toLowerCase()] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
