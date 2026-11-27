export const BASE_ASSETS = {
    skillIcons: {
        Reading: 'assets/skills/reading_icon.gif',
        Math: 'assets/skills/math_icon.png',
        Writing: 'assets/skills/writing_icon.png',
        Cleaning: 'assets/skills/cleaning_icon.gif',
        Memory: 'assets/skills/farm_icon.png',
        Patterns: 'assets/skills/pattern_icon.png',
    },
    badges: {
        Wood: 'assets/badges/wood_badge.png',
        Stone: 'assets/badges/stone_badge.png',
        Gold: 'assets/badges/gold_badge.png',
        Iron: 'assets/badges/iron_badge.png',
        Emerald: 'assets/badges/emerald_badge.png',
        Diamond: 'assets/badges/diamond_badge.png',
        Netherite: 'assets/badges/netherite_badge.png',
        Obsidian: 'assets/badges/obsidian_badge.png',
        Legendary: 'assets/badges/star_badge.png',
    },
    audio: {
        bgm: ['assets/sounds/bgm_1.wav'],
        click: 'assets/sounds/click.wav',
        hit: ['assets/sounds/hit_1.wav'],
        levelup: 'assets/sounds/levelup.wav',
        success: 'assets/sounds/success.wav',
        fail: 'assets/sounds/fail.wav',
        match: 'assets/sounds/match_success.wav',
        mismatch: 'assets/sounds/mismatch.wav',
        damage: 'assets/sounds/damage.wav',
        faint: 'assets/sounds/faint.wav',
    },
    axolotls: {
        Pink: 'assets/mobs/axolotl/axolotl_pink.gif',
        Cyan: 'assets/mobs/axolotl/axolotl_cyan.gif',
        Gold: 'assets/mobs/axolotl/axolotl_gold.gif',
        Brown: 'assets/mobs/axolotl/axolotl_brown.gif',
        Blue: 'assets/mobs/axolotl/axolotl_blue.gif',
        Red: 'assets/mobs/axolotl/axolotl_red.gif',
        Green: 'assets/mobs/axolotl/axolotl_green.gif',
        Black: 'assets/mobs/axolotl/axolotl_black.gif',
    },
    items: {
        TNT: 'assets/items/tnt.png',
        BED: 'assets/items/bed.png',
        BOW: 'assets/items/bow.png',
        MAP: 'assets/items/map.png',
        EGG: 'assets/items/egg.png',
        ICE: 'assets/items/ice.png',
        AXE: 'assets/items/axe.gif',
        HOE: 'assets/items/hoe.gif',
        BOOK: 'assets/items/book.gif',
        CAKE: 'assets/items/cake.png',
        BOAT: 'assets/items/boat.png',
        DOOR: 'assets/items/door.png',
        WOOL: 'assets/items/wool.png',
        SAND: 'assets/items/sand.png',
        DIRT: 'assets/items/dirt.png',
        MILK: 'assets/items/milk.png',
    },
};

export const FRIENDLY_MOBS = {
    Allay: 'assets/mobs/friendly/allay.gif',
    Armadillo: 'assets/mobs/friendly/armadillo.png',
    Bunny: 'assets/mobs/friendly/bunny.png',
    Camel: 'assets/mobs/friendly/camel.gif',
    Cat: 'assets/mobs/friendly/cat.png',
    Chicken: 'assets/mobs/friendly/chicken.png',
    'Copper Golem': 'assets/mobs/friendly/coppergolem.png',
    Cow: 'assets/mobs/friendly/cow.png',
    Fish: 'assets/mobs/friendly/fish.png',
    Frog: 'assets/mobs/friendly/frog.gif',
    'Glow Squid': 'assets/mobs/friendly/glowsquid.gif',
    Goat: 'assets/mobs/friendly/goat.png',
    Horse: 'assets/mobs/friendly/horse.png',
    'Iron Golem': 'assets/mobs/friendly/irongolem.png',
    Mooshroom: 'assets/mobs/friendly/mooshroom.png',
    Nautilus: 'assets/mobs/friendly/nautilus.gif',
    Panda: 'assets/mobs/friendly/panda.png',
    Pig: 'assets/mobs/friendly/pig.png',
    'Polar Bear': 'assets/mobs/friendly/polarbear.png',
    Sheep: 'assets/mobs/friendly/sheep.png',
    Sniffer: 'assets/mobs/friendly/sniffer.gif',
    'Snow Golem': 'assets/mobs/friendly/snowgolem.png',
    Squid: 'assets/mobs/friendly/squid.gif',
    Strider: 'assets/mobs/friendly/strider.gif',
    Turtle: 'assets/mobs/friendly/turtle.png',
    Wolf: 'assets/mobs/friendly/wolf.png',
};

export const HOSTILE_MOBS = {
    Blaze: 'assets/mobs/hostile/blaze.gif',
    Bogged: 'assets/mobs/hostile/bogged.png',
    Breeze: 'assets/mobs/hostile/breeze.webp',
    Creeper: 'assets/mobs/hostile/creeper.png',
    Drowned: 'assets/mobs/hostile/drowned.png',
    Enderman: 'assets/mobs/hostile/enderman.png',
    Evoker: 'assets/mobs/hostile/evoker.png',
    Ghast: 'assets/mobs/hostile/ghast.gif',
    Guardian: 'assets/mobs/hostile/guardian.gif',
    Hoglin: 'assets/mobs/hostile/hoglin.png',
    'Magma Cube': 'assets/mobs/hostile/magmacube.png',
    Parched: 'assets/mobs/hostile/parched.png',
    Phantom: 'assets/mobs/hostile/phantom.gif',
    Piglin: 'assets/mobs/hostile/piglin.png',
    Pillager: 'assets/mobs/hostile/pillager.png',
    Skeleton: 'assets/mobs/hostile/skeleton.png',
    Slime: 'assets/mobs/hostile/slime.png',
    Spider: 'assets/mobs/hostile/spider.png',
    Witch: 'assets/mobs/hostile/witch.png',
    Zombie: 'assets/mobs/hostile/zombie.png',
};

export const CHEST_BLOCKS = {
    Chest: 'assets/items/chests/chest.gif',
    'Trapped Chest': 'assets/items/chests/trapped_chest.gif',
    Barrel: 'assets/items/chests/barrel.png',
    Bundle: 'assets/items/bundle.png',
    'Shulker Box': 'assets/items/chests/shulker_box.png',
    'Ender Chest': 'assets/items/chests/ender_chest.gif',
};

// Special chests that appear at milestone levels (used for cleaning skill)
export const SPECIAL_CHESTS = ['Ender Chest', 'Shulker Box'];

export const BOSS_MOBS = {
    'Ender Dragon': 'assets/mobs/boss/enderdragon.gif',
    Herobrine: 'assets/mobs/boss/Herobrine.png',
    Warden: 'assets/mobs/boss/warden.gif',
    Wither: 'assets/mobs/boss/wither.png',
};

export const MINIBOSS_MOBS = {
    Creaking: 'assets/mobs/miniboss/creaking.png',
    'Elder Guardian': 'assets/mobs/miniboss/elderguardian.gif',
    Ravager: 'assets/mobs/miniboss/ravager.png',
    'Wither Skeleton': 'assets/mobs/miniboss/witherskeleton.png',
};

// Difficulty content framework - 7 tiers of content per skill
// This structure holds different configurations for each difficulty level
