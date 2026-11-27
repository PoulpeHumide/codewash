/**
 * Sound Manager Utility
 * Centralized sound management for the game including BGM shuffle, UI sounds, and mob sounds.
 */
import { systemRandom } from './systemEffects';

// BGM tracks discovered from public/assets/sounds/bgm/
const BGM_TRACKS = [
    'assets/sounds/bgm/calm1.wav',
    'assets/sounds/bgm/calm2.wav',
    'assets/sounds/bgm/calm3.wav',
    'assets/sounds/bgm/piano1.wav',
    'assets/sounds/bgm/piano2.wav',
    'assets/sounds/bgm/piano3.wav',
];

// UI sound paths
const UI_SOUNDS = {
    actioncard_left: 'assets/sounds/ui/actioncard_left.wav',
    actioncard_right: 'assets/sounds/ui/actioncard_right.wav',
    click: 'assets/sounds/ui/click.wav',
    death: 'assets/sounds/ui/death.wav',
    fail: 'assets/sounds/ui/fail.wav',
    levelup: 'assets/sounds/ui/levelup.wav',
    notification: 'assets/sounds/ui/notification.wav',
    successful_hit: 'assets/sounds/ui/successful_hit.wav',
};

// Mob name to folder name mapping (handles differences between display names and folder names)
const MOB_FOLDER_MAP = {
    // Hostile mobs
    Zombie: 'zombie',
    Creeper: 'creeper',
    Skeleton: 'skeleton',
    Spider: 'spider',
    Enderman: 'endermen',
    Blaze: 'blaze',
    Ghast: 'ghast',
    Slime: 'slime',
    Phantom: 'phantom',
    Piglin: 'piglin',
    Hoglin: 'hoglin',
    Drowned: 'drowned',
    Pillager: 'pillager',
    Evoker: 'evoker',
    Guardian: 'guardian',
    'Magma Cube': 'magmacube',
    Witch: 'witch',
    // Boss mobs
    'Ender Dragon': 'enderdragon',
    Wither: 'wither',
    Warden: 'warden',
    // Miniboss mobs
    'Elder Guardian': 'elderguardian',
    Ravager: 'ravager',
    'Wither Skeleton': 'wither_skeleton',
    Creaking: 'creaking',
    // Friendly mobs
    Cat: 'cat',
    Chicken: 'chicken',
    Cow: 'cow',
    Pig: 'pig',
    Sheep: 'sheep',
    Wolf: 'wolf',
    Dolphin: 'dolphin',
    Fox: 'fox',
    Panda: 'panda',
    Parrot: 'parrot',
    Horse: 'horse',
    Turtle: 'turtle',
    Rabbit: 'rabbit',
    Bunny: 'rabbit',
    Mooshroom: 'mooshroom',
    'Polar Bear': 'polarbear',
    Llama: 'llama',
    Bat: 'bat',
    Bee: 'bee',
    Villager: 'villager',
    'Iron Golem': 'irongolem',
    'Wandering Trader': 'wandering_trader',
    Strider: 'strider',
};

// Class for managing BGM playback with shuffle
class BGMManager {
    constructor({ createAudio, random, playAudio }) {
        this.audio = null;
        this.volume = 0.3;
        this.isPlaying = false;
        this.currentTrackIndex = -1;
        this.tracks = [...BGM_TRACKS];
        this.createAudio = createAudio;
        this.random = random;
        this.playAudio = playAudio;
    }

    setVolume(vol) {
        this.volume = vol;
        if (this.audio) {
            this.audio.volume = vol;
        }
    }

    getRandomTrack() {
        // Get a random track that's different from the current one
        const availableIndices = this.tracks.map((_, i) => i).filter((i) => i !== this.currentTrackIndex);

        // If only one track or no other tracks available, return current
        if (availableIndices.length === 0) {
            return this.currentTrackIndex >= 0 ? this.currentTrackIndex : 0;
        }

        const randomIndex = Math.floor(this.random() * availableIndices.length);
        return availableIndices[randomIndex];
    }

    play() {
        if (!this.audio) {
            this.currentTrackIndex = this.getRandomTrack();
            this.audio = this.createAudio(this.tracks[this.currentTrackIndex]);
            this.audio.volume = this.volume;

            // When a track ends, play a new random track
            this.audio.addEventListener('ended', () => {
                this.playNextTrack();
            });
        }

        this.playAudio(this.audio, this.tracks[this.currentTrackIndex]);
        this.isPlaying = true;
    }

    playNextTrack() {
        this.currentTrackIndex = this.getRandomTrack();
        if (this.audio) {
            this.audio.src = this.tracks[this.currentTrackIndex];
            this.audio.volume = this.volume; // Ensure volume is set for new track
            this.playAudio(this.audio, this.tracks[this.currentTrackIndex]);
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
}

/**
 * Get the folder name for a mob
 * @param {string} mobName - Display name of the mob
 * @returns {string|null} - Folder name or null if not found/mapped
 */
const getMobFolder = (mobName) => {
    // Only use explicit mappings to avoid loading non-existent files
    return MOB_FOLDER_MAP[mobName] || null;
};

const defaultAudioErrorHandler = (error, details) => {
    console.warn('[Audio] Playback failed:', { ...details, error });
};

export const createSoundManager = ({
    createAudio = (path) => new Audio(path),
    random = systemRandom,
    onAudioError = defaultAudioErrorHandler,
} = {}) => {
    let sfxVolume = 0.5;

    const reportPlaybackError = (error, source, onPlaybackError) => {
        try {
            onAudioError(error, { source });
        } catch (loggingError) {
            console.error('[Audio] Error handler failed:', loggingError);
        }

        if (onPlaybackError) {
            try {
                onPlaybackError(error);
            } catch (callbackError) {
                console.error('[Audio] Playback callback failed:', callbackError);
            }
        }
    };

    const playAudio = (audio, source, onPlaybackError) => {
        try {
            const playback = audio.play();
            if (playback && typeof playback.catch === 'function') {
                playback.catch((error) => reportPlaybackError(error, source, onPlaybackError));
            }
        } catch (error) {
            reportPlaybackError(error, source, onPlaybackError);
        }
    };

    const playAudioAsset = (path, { onPlaybackError } = {}) => {
        const audio = createAudio(path);
        audio.volume = sfxVolume;
        playAudio(audio, path, onPlaybackError);
        return audio;
    };

    const playUISound = (soundName) => {
        const path = UI_SOUNDS[soundName];
        if (!path) return;
        playAudioAsset(path);
    };

    const playMobSound = (mobName, soundName) => {
        const folder = getMobFolder(mobName);
        if (!folder) return;
        playAudioAsset(`assets/sounds/mob/${folder}/${soundName}.wav`);
    };

    const bgmManager = new BGMManager({
        createAudio,
        random,
        playAudio: (audio, source) => playAudio(audio, source),
    });

    return {
        getBGMManager: () => bgmManager,
        getSfxVolume: () => sfxVolume,
        setSfxVolume: (volume) => {
            sfxVolume = volume;
        },
        playAudioAsset,
        playUISound,
        playActionCardLeft: () => playUISound('actioncard_left'),
        playActionCardRight: () => playUISound('actioncard_right'),
        playClick: () => playUISound('click'),
        playDeath: () => playUISound('death'),
        playFail: () => playUISound('fail'),
        playLevelUp: () => playUISound('levelup'),
        playNotification: () => playUISound('notification'),
        playSuccessfulHit: () => playUISound('successful_hit'),
        playAchievement: () => playUISound('notification'),
        playMobHurt: (mobName) => playMobSound(mobName, 'hurt'),
        playMobDeath: (mobName) => playMobSound(mobName, 'death'),
        playMobSay: (mobName) => playMobSound(mobName, 'say'),
    };
};

const defaultSoundManager = createSoundManager();

export const getBGMManager = () => defaultSoundManager.getBGMManager();
export const getSfxVolume = () => defaultSoundManager.getSfxVolume();
export const setSfxVolume = (volume) => defaultSoundManager.setSfxVolume(volume);
export const playAudioAsset = (...args) => defaultSoundManager.playAudioAsset(...args);
export const playUISound = (...args) => defaultSoundManager.playUISound(...args);
export const playActionCardLeft = () => defaultSoundManager.playActionCardLeft();
export const playActionCardRight = () => defaultSoundManager.playActionCardRight();
export const playClick = () => defaultSoundManager.playClick();
export const playDeath = () => defaultSoundManager.playDeath();
export const playFail = () => defaultSoundManager.playFail();
export const playLevelUp = () => defaultSoundManager.playLevelUp();
export const playNotification = () => defaultSoundManager.playNotification();
export const playSuccessfulHit = () => defaultSoundManager.playSuccessfulHit();
export const playAchievement = () => defaultSoundManager.playAchievement();
export const playMobHurt = (mobName) => defaultSoundManager.playMobHurt(mobName);
export const playMobDeath = (mobName) => defaultSoundManager.playMobDeath(mobName);
export const playMobSay = (mobName) => defaultSoundManager.playMobSay(mobName);

// Export UI sound names for reference
export const UI_SOUND_NAMES = Object.keys(UI_SOUNDS);
