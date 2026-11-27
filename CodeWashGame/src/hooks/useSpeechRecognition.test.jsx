// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useSpeechRecognition from './useSpeechRecognition';

const createRecognition = () => {
    class SpeechRecognitionMock {
        static instances = [];

        constructor() {
            this.start = vi.fn(() => {
                if (SpeechRecognitionMock.startError) {
                    throw new Error('start failed');
                }
            });
            this.stop = vi.fn();
            SpeechRecognitionMock.instances.push(this);
        }
    }

    SpeechRecognitionMock.instances = [];
    SpeechRecognitionMock.startError = false;
    vi.stubGlobal('webkitSpeechRecognition', SpeechRecognitionMock);
    return SpeechRecognitionMock;
};

const createHook = (overrides = {}) =>
    renderHook((props) => useSpeechRecognition({ handleSuccessHit: vi.fn(), ...props }), {
        initialProps: {
            battlingSkillId: null,
            challengeData: { type: 'reading', answer: 'SEE' },
            ...overrides,
        },
    });

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('useSpeechRecognition', () => {
    it('reports unsupported speech APIs and resets text when stopped without a recognition instance', () => {
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { result } = createHook();

        act(() => result.current.startVoiceListener('reading'));
        act(() => result.current.toggleMicListener('reading'));
        expect(result.current.spokenText).toBe('Mic not available');

        act(() => result.current.stopVoiceRecognition());
        expect(result.current.spokenText).toBe('Mic Off');
        expect(warning).toHaveBeenCalled();
    });

    it('starts once, accepts normalized answers and recognizes homophones', () => {
        const SpeechRecognitionMock = createRecognition();
        const handleSuccessHit = vi.fn();
        const { result, rerender } = renderHook((props) => useSpeechRecognition(props), {
            initialProps: {
                battlingSkillId: 'reading',
                challengeData: { type: 'reading', answer: 'SEE' },
                handleSuccessHit,
            },
        });

        act(() => result.current.startVoiceListener('reading'));
        act(() => result.current.startVoiceListener('reading'));
        const recognition = SpeechRecognitionMock.instances[0];
        expect(SpeechRecognitionMock.instances).toHaveLength(1);
        expect(recognition.start).toHaveBeenCalledOnce();
        expect(recognition.lang).toBe('en-US');
        expect(recognition.continuous).toBe(true);

        act(() => recognition.onstart());
        expect(result.current.isListening).toBe(true);
        expect(result.current.spokenText).toBe('Listening...');

        act(() =>
            recognition.onresult({
                results: [[{ transcript: 'see.' }]],
            }),
        );
        expect(handleSuccessHit).toHaveBeenLastCalledWith('reading');

        rerender({
            battlingSkillId: 'reading',
            challengeData: { type: 'reading', answer: 'SEE' },
            handleSuccessHit,
        });
        act(() =>
            recognition.onresult({
                results: [[{ transcript: 'sea' }]],
            }),
        );
        expect(handleSuccessHit).toHaveBeenLastCalledWith('reading');
    });

    it('supports the standard SpeechRecognition constructor', () => {
        const start = vi.fn();
        class StandardSpeechRecognition {
            constructor() {
                this.start = start;
                this.stop = vi.fn();
            }
        }
        vi.stubGlobal('SpeechRecognition', StandardSpeechRecognition);
        const { result } = createHook({ battlingSkillId: 'reading' });

        act(() => result.current.startVoiceListener('reading'));

        expect(start).toHaveBeenCalledOnce();
    });

    it('uses the latest challenge and reports substantial wrong answers only', () => {
        createRecognition();
        const handleSuccessHit = vi.fn();
        const { result, rerender } = renderHook((props) => useSpeechRecognition(props), {
            initialProps: {
                battlingSkillId: 'reading',
                challengeData: { type: 'math', answer: '12' },
                handleSuccessHit,
            },
        });
        act(() => result.current.startVoiceListener('reading'));
        const recognition = window.webkitSpeechRecognition.instances[0];

        act(() =>
            recognition.onresult({
                results: [[{ transcript: 'x' }]],
            }),
        );
        expect(handleSuccessHit).not.toHaveBeenCalled();

        rerender({
            battlingSkillId: 'reading',
            challengeData: null,
            handleSuccessHit,
        });
        act(() =>
            recognition.onresult({
                results: [[{ transcript: 'cat' }]],
            }),
        );
        expect(handleSuccessHit).not.toHaveBeenCalled();

        rerender({
            battlingSkillId: 'math',
            challengeData: { type: 'reading', answer: 'ONE' },
            handleSuccessHit,
        });
        act(() =>
            recognition.onresult({
                results: [[{ transcript: 'wrong!' }]],
            }),
        );
        expect(handleSuccessHit).toHaveBeenCalledWith('reading', 'WRONG');
        expect(result.current.spokenText).toBe('WRONG');
    });

    it('handles recognition events, restart, permission failures and stopping errors', () => {
        vi.useFakeTimers();
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const SpeechRecognitionMock = createRecognition();
        const { result } = createHook({ battlingSkillId: 'reading' });

        act(() => result.current.startVoiceListener('reading'));
        const recognition = SpeechRecognitionMock.instances[0];
        act(() => recognition.onerror({ error: 'no-speech' }));
        act(() => recognition.onend());
        act(() => vi.advanceTimersByTime(100));
        expect(SpeechRecognitionMock.instances).toHaveLength(2);

        const restarted = SpeechRecognitionMock.instances[1];
        act(() => restarted.onstart());
        act(() => restarted.onerror({ error: 'not-allowed' }));
        expect(result.current.isListening).toBe(false);
        expect(result.current.spokenText).toBe('Mic permission denied');
        act(() => restarted.onerror({ error: 'network' }));

        restarted.stop.mockImplementation(() => {
            throw new Error('stop failed');
        });
        act(() => result.current.stopVoiceRecognition());
        expect(result.current.spokenText).toBe('Mic Off');
        expect(warning).toHaveBeenCalledWith('[Speech Recognition] Error stopping:', expect.any(Error));
        expect(errors).toHaveBeenCalled();
    });

    it('starts from the mic toggle and resets the indicator when non-reading speech ends', () => {
        const SpeechRecognitionMock = createRecognition();
        const { result } = createHook();

        act(() => result.current.toggleMicListener('math'));
        const recognition = SpeechRecognitionMock.instances[0];
        expect(recognition.start).toHaveBeenCalledOnce();

        act(() => recognition.onend());
        expect(result.current.spokenText).toBe('Mic Off');
    });

    it('handles start errors and toggles an active microphone off', () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const SpeechRecognitionMock = createRecognition();
        const { result } = createHook();

        act(() => result.current.startVoiceListener('reading'));
        const recognition = SpeechRecognitionMock.instances[0];
        act(() => recognition.onstart());
        act(() => result.current.toggleMicListener('reading'));
        expect(recognition.stop).toHaveBeenCalledOnce();
        expect(result.current.isListening).toBe(false);
        expect(result.current.spokenText).toBe('Mic Off');

        SpeechRecognitionMock.startError = true;
        act(() => result.current.startVoiceListener('math'));
        expect(errors).toHaveBeenCalledWith('[Speech Recognition] Failed to start:', expect.any(Error));
    });

    it('clears the pending automatic restart and stops recognition on unmount', () => {
        vi.useFakeTimers();
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const SpeechRecognitionMock = createRecognition();
        const { result, unmount } = createHook({ battlingSkillId: 'reading' });

        act(() => result.current.startVoiceListener('reading'));
        const recognition = SpeechRecognitionMock.instances[0];
        act(() => recognition.onend());
        expect(vi.getTimerCount()).toBe(1);
        recognition.stop.mockImplementation(() => {
            recognition.onend();
            throw new Error('stop failed');
        });

        unmount();

        expect(recognition.stop).toHaveBeenCalledOnce();
        expect(warning).toHaveBeenCalledWith('[Speech Recognition] Error stopping:', expect.any(Error));
        expect(vi.getTimerCount()).toBe(0);
    });
});
