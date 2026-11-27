import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getBGMManager,
    getSfxVolume,
    playAchievement,
    playActionCardLeft,
    playActionCardRight,
    playClick,
    playDeath,
    playFail,
    playLevelUp,
    playMobDeath,
    playMobHurt,
    playMobSay,
    playNotification,
    playSuccessfulHit,
    playUISound,
    setSfxVolume,
    UI_SOUND_NAMES,
} from './soundManager';

const audioInstances = [];

class MockAudio {
    constructor(src) {
        this.src = src;
        this.volume = 1;
        this.listeners = {};
        this.play = vi.fn(() => Promise.resolve());
        this.pause = vi.fn();
        audioInstances.push(this);
    }

    addEventListener(event, callback) {
        this.listeners[event] = callback;
    }
}

describe('sound manager', () => {
    beforeEach(() => {
        audioInstances.length = 0;
        vi.stubGlobal('Audio', MockAudio);
        const manager = getBGMManager();
        manager.audio = null;
        manager.volume = 0.3;
        manager.isPlaying = false;
        manager.currentTrackIndex = -1;
        manager.tracks = ['assets/sounds/bgm/calm1.wav', 'assets/sounds/bgm/calm2.wav', 'assets/sounds/bgm/calm3.wav'];
        setSfxVolume(0.5);
    });

    it('reuses the BGM singleton and selects tracks other than the current one', () => {
        const manager = getBGMManager();
        expect(getBGMManager()).toBe(manager);

        vi.spyOn(Math, 'random').mockReturnValue(0);
        expect(manager.getRandomTrack()).toBe(0);
        manager.currentTrackIndex = 0;
        expect(manager.getRandomTrack()).not.toBe(0);

        manager.tracks = ['only-track.wav'];
        expect(manager.getRandomTrack()).toBe(0);
        manager.currentTrackIndex = -1;
        expect(manager.getRandomTrack()).toBe(0);
    });

    it('plays, advances, pauses, and toggles background music', () => {
        const manager = getBGMManager();
        manager.setVolume(0.7);
        expect(manager.volume).toBe(0.7);

        manager.play();
        const audio = manager.audio;
        expect(audio).toBeInstanceOf(MockAudio);
        expect(audio.volume).toBe(0.7);
        expect(audio.play).toHaveBeenCalledOnce();
        expect(manager.isPlaying).toBe(true);

        audio.listeners.ended();
        expect(audio.play).toHaveBeenCalledTimes(2);
        expect(audio.src).toBe(manager.tracks[manager.currentTrackIndex]);
        expect(audio.volume).toBe(0.7);

        manager.setVolume(0.2);
        expect(audio.volume).toBe(0.2);
        manager.toggle();
        expect(audio.pause).toHaveBeenCalledOnce();
        expect(manager.isPlaying).toBe(false);
        manager.toggle();
        expect(manager.isPlaying).toBe(true);

        manager.audio = null;
        manager.pause();
        expect(manager.isPlaying).toBe(true);
        manager.playNextTrack();
    });

    it('plays known UI sounds and ignores unknown names', () => {
        setSfxVolume(0.8);
        expect(getSfxVolume()).toBe(0.8);
        playUISound('unknown');
        expect(audioInstances).toHaveLength(0);

        playActionCardLeft();
        playActionCardRight();
        playClick();
        playDeath();
        playFail();
        playLevelUp();
        playNotification();
        playSuccessfulHit();
        playAchievement();

        expect(UI_SOUND_NAMES).toContain('click');
        expect(audioInstances).toHaveLength(UI_SOUND_NAMES.length + 1);
        expect(audioInstances.every((audio) => audio.volume === 0.8)).toBe(true);
        expect(audioInstances[0].src).toBe('assets/sounds/ui/actioncard_left.wav');
        expect(audioInstances.at(-1).src).toBe('assets/sounds/ui/notification.wav');
    });

    it('plays sounds for mapped mobs and ignores unknown mobs', () => {
        playMobHurt('Bunny');
        playMobDeath('Ender Dragon');
        playMobSay('Villager');
        playMobHurt('Not a mob');
        playMobDeath('Not a mob');
        playMobSay('Not a mob');

        expect(audioInstances.map((audio) => audio.src)).toEqual([
            'assets/sounds/mob/rabbit/hurt.wav',
            'assets/sounds/mob/enderdragon/death.wav',
            'assets/sounds/mob/villager/say.wav',
        ]);
        expect(audioInstances.every((audio) => audio.play.mock.calls.length === 1)).toBe(true);
    });
});
