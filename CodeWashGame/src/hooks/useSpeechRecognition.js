import { useEffect, useRef, useState } from 'react';
import { HOMOPHONES } from '../constants/gameData';
import useManagedTimers from './minigames/useManagedTimers';
import { createSpeechRecognition, getSpeechRecognitionConstructor } from '../utils/speechRecognition';
import { systemTimers } from '../utils/systemEffects';

const MIN_SPOKEN_TEXT_LENGTH = 2;
const MIC_OFF_TEXT = 'Mic Off';

const getSpeechResult = (text, challenge) => {
    if (!challenge || challenge.type !== 'reading') return null;
    if (text === challenge.answer || HOMOPHONES[challenge.answer]?.includes(text)) return 'correct';
    return text && text.length >= MIN_SPOKEN_TEXT_LENGTH ? 'wrong' : null;
};

export default function useSpeechRecognition({
    battlingSkillId,
    challengeData,
    handleSuccessHit,
    speechRecognitionFactory,
    timers = systemTimers,
}) {
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const recognitionRef = useRef(null);
    const challengeDataRef = useRef(null);
    const isMountedRef = useRef(true);
    const { scheduleTimeout } = useManagedTimers(true, timers);
    const getRecognitionFactory = () =>
        speechRecognitionFactory || getSpeechRecognitionConstructor(globalThis.window || globalThis);

    useEffect(() => {
        challengeDataRef.current = challengeData;
    }, [challengeData]);

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                console.log('[Speech Recognition] Stopped');
            } catch (error) {
                console.warn('[Speech Recognition] Error stopping:', error);
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
        setSpokenText(MIC_OFF_TEXT);
    };

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (!recognitionRef.current) return;
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.warn('[Speech Recognition] Error stopping:', error);
            }
            recognitionRef.current = null;
        };
    }, []);

    const startVoiceListener = (targetId) => {
        const Recognition = getRecognitionFactory();
        if (!Recognition) {
            console.warn('[Speech Recognition] Web Speech API not available');
            return;
        }

        if (recognitionRef.current) {
            console.log('[Speech Recognition] Already initialized, skipping');
            return;
        }

        console.log('[Speech Recognition] Initializing for skill:', targetId);
        recognitionRef.current = createSpeechRecognition(Recognition);
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;

        recognitionRef.current.onstart = () => {
            if (!isMountedRef.current) return;
            console.log('[Speech Recognition] Started listening');
            setIsListening(true);
            setSpokenText('Listening...');
        };

        recognitionRef.current.onend = () => {
            if (!isMountedRef.current) return;
            console.log('[Speech Recognition] Ended');
            setIsListening(false);
            if (battlingSkillId === 'reading' || targetId === 'reading') {
                scheduleTimeout(() => {
                    if (battlingSkillId === 'reading') {
                        console.log('[Speech Recognition] Auto-restarting');
                        recognitionRef.current = null;
                        startVoiceListener(targetId);
                    }
                }, 100);
            } else {
                setSpokenText(MIC_OFF_TEXT);
            }
        };

        recognitionRef.current.onerror = (event) => {
            if (!isMountedRef.current) return;
            console.error('[Speech Recognition] Error:', event.error);
            if (event.error === 'no-speech') {
                console.log('[Speech Recognition] No speech detected, continuing...');
            } else if (event.error === 'not-allowed') {
                console.error('[Speech Recognition] Microphone permission denied');
                setSpokenText('Mic permission denied');
                setIsListening(false);
            } else {
                console.error('[Speech Recognition] Error type:', event.error);
            }
        };

        recognitionRef.current.onresult = (event) => {
            if (!isMountedRef.current) return;
            const text = event.results[event.results.length - 1][0].transcript
                .toUpperCase()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
            console.log('[Speech Recognition] Recognized text:', text);
            setSpokenText(text);
            const result = getSpeechResult(text, challengeDataRef.current);
            if (result === 'correct') {
                console.log('[Speech Recognition] Correct answer!');
                handleSuccessHit(targetId || battlingSkillId);
            } else if (result === 'wrong') {
                console.log('[Speech Recognition] Wrong answer');
                handleSuccessHit(targetId || battlingSkillId, 'WRONG');
            }
        };

        try {
            recognitionRef.current.start();
            console.log('[Speech Recognition] Start command issued');
        } catch (error) {
            console.error('[Speech Recognition] Failed to start:', error);
        }
    };

    const toggleMicListener = (targetId) => {
        console.log('[Mic Toggle] isListening:', isListening);

        if (!getRecognitionFactory()) {
            console.warn('[Mic Toggle] Web Speech API not available');
            setSpokenText('Mic not available');
            return;
        }

        if (recognitionRef.current && isListening) {
            console.log('[Mic Toggle] Stopping recognition');
            stopVoiceRecognition();
        } else {
            console.log('[Mic Toggle] Starting recognition');
            startVoiceListener(targetId);
        }
    };

    return {
        isListening,
        spokenText,
        setSpokenText,
        startVoiceListener,
        stopVoiceRecognition,
        toggleMicListener,
    };
}
