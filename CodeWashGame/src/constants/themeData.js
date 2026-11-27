export const THEME_CONFIG = {
    minecraft: {
        name: 'Minecraft',
        style: {
            backgroundImage: `url('assets/themes/minecraft.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        assets: {
            logo: 'assets/themes/minecraft_logo.png',
            cardBack: 'assets/themes/memorycard.jpg',
            mobs: {
                Zombie: 'assets/mobs/hostile/zombie.png',
                Creeper: 'assets/mobs/hostile/creeper.png',
                Skeleton: 'assets/mobs/hostile/skeleton.png',
                'Ender Dragon': 'assets/mobs/boss/enderdragon.gif',
                Axolotl: 'assets/mobs/axolotl/axolotl_pink.gif',
                Spider: 'assets/mobs/hostile/spider.png',
                Phantom: 'assets/mobs/hostile/phantom.gif',
                Enderman: 'assets/mobs/hostile/enderman.png',
                Blaze: 'assets/mobs/hostile/blaze.gif',
                Ghast: 'assets/mobs/hostile/ghast.gif',
                Slime: 'assets/mobs/hostile/slime.png',
                Witch: 'assets/mobs/hostile/witch.png',
                Pillager: 'assets/mobs/hostile/pillager.png',
                Wither: 'assets/mobs/boss/wither.png',
                Warden: 'assets/mobs/boss/warden.gif',
            },
        },
        skills: {
            reading: { name: 'Reading', boss: 'Ender Dragon', mobType: 'Standard' },
            math: { name: 'Math', boss: 'Wither', mobType: 'Creeper' },
            writing: { name: 'Writing', boss: 'Warden', mobType: 'Skeleton' },
            cleaning: { name: 'Cleaning', boss: 'Ender Chest', mobType: 'Chest' },
            memory: { name: 'Memory', boss: 'Axolotl', mobType: 'Mascot' },
            patterns: { name: 'Pattern Recognition', boss: 'Iron Golem', mobType: 'Standard' },
        },
    },
    kpop: {
        name: 'K-Pop Demon Hunters',
        style: {
            backgroundImage: `url('assets/themes/kpop.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        assets: {
            logo: 'assets/themes/kpop_logo.png',
            cardBack: 'assets/themes/kpop_memorycard.jpg',
            mobs: {},
        },
        skills: {
            reading: { name: 'Decryption', boss: 'Cyborg King' },
            math: { name: 'Engineering', boss: 'Mecha-Brain' },
            writing: { name: 'Hacking', boss: 'Mainframe' },
            cleaning: { name: 'Waste Mgmt', boss: 'Trash Bot' },
            memory: { name: 'Droid Repair', boss: 'Droid' },
            patterns: { name: 'Navigation', boss: 'Star Map' },
        },
    },
    pokemon: {
        name: 'Pokemon',
        style: {
            backgroundImage: `url('assets/themes/pokemon.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        assets: {
            logo: 'assets/themes/pokemon_logo.png',
            cardBack: 'assets/themes/pokemon_memorycard.jpg',
            mobs: {},
        },
        skills: {
            reading: { name: 'Spellcasting', boss: 'Lich King' },
            math: { name: 'Alchemy', boss: 'Golem' },
            writing: { name: 'Scribing', boss: 'Dragon' },
            cleaning: { name: 'Looting', boss: 'Mimic' },
            memory: { name: 'Runes', boss: 'Wisp' },
            patterns: { name: 'Rituals', boss: 'Cultist' },
        },
    },
    spy: {
        name: 'Spy',
        style: {
            backgroundImage: `url('assets/themes/minecraft.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        assets: {
            logo: 'assets/themes/spy_logo.png',
            cardBack: 'assets/themes/spy_memorycard.jpg',
            mobs: {},
        },
        skills: {
            reading: { name: 'Intel Analysis', boss: 'Double Agent' },
            math: { name: 'Gadgetry', boss: 'Mad Scientist' },
            writing: { name: 'Forgery', boss: 'Bureaucrat' },
            cleaning: { name: 'Evidence', boss: 'Safe' },
            memory: { name: 'Identities', boss: 'Mole' },
            patterns: { name: 'Code Breaking', boss: 'Hacker' },
        },
    },
};

export const THEMES_LIST = [
    { id: 'minecraft', name: 'Minecraft', img: 'assets/themes/minecraft.png' },
    { id: 'kpop', name: 'K-Pop Demon Hunters', img: 'assets/themes/kpop.jpg' },
    { id: 'pokemon', name: 'Pokemon', img: 'assets/themes/pokemon.jpg' },
    { id: 'spy', name: 'Spy', img: 'assets/themes/spy.png' },
];
export const BADGE_TIERS = [
    { level: 20, title: 'Wood' },
    { level: 40, title: 'Stone' },
    { level: 60, title: 'Gold' },
    { level: 80, title: 'Iron' },
    { level: 100, title: 'Emerald' },
    { level: 120, title: 'Diamond' },
    { level: 140, title: 'Netherite' },
    { level: 160, title: 'Obsidian' },
];

// Reading words organized by character length for difficulty scaling
