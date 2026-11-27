import { describe, expect, it, vi } from 'vitest';
import {
    createSpeechRecognition,
    getSpeechRecognitionConstructor,
    isSpeechRecognitionSupported,
} from './speechRecognition';

describe('speech recognition adapter', () => {
    it('prefers the standard API and falls back to the WebKit API', () => {
        const standard = vi.fn();
        const webkit = vi.fn();

        expect(getSpeechRecognitionConstructor({ SpeechRecognition: standard, webkitSpeechRecognition: webkit })).toBe(
            standard,
        );
        expect(getSpeechRecognitionConstructor({ webkitSpeechRecognition: webkit })).toBe(webkit);
        expect(getSpeechRecognitionConstructor({})).toBeNull();
    });

    it('reports support and instantiates an injected recognition factory', () => {
        class Recognition {
            constructor() {
                this.created = true;
            }
        }

        expect(isSpeechRecognitionSupported({ SpeechRecognition: Recognition })).toBe(true);
        expect(isSpeechRecognitionSupported({})).toBe(false);
        expect(createSpeechRecognition(Recognition)).toEqual({ created: true });
        expect(createSpeechRecognition(null)).toBeNull();
        expect(createSpeechRecognition()).toBeNull();
    });
});
