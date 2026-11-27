import { useEffect, useRef, useState } from 'react';
import { HOMOPHONES } from '../constants/gameData';

const MIN_SPOKEN_TEXT_LENGTH = 2;
const MIC_OFF_TEXT = 'Mic Off';

export default function useSpeechRecognition({ battlingSkillId, challengeData, handleSuccessHit }) {
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const recognitionRef = useRef(null);
    const challengeDataRef = useRef(null);

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

    const startVoiceListener = (targetId) => {
        if (!window.webkitSpeechRecognition) {
            console.warn('[Speech Recognition] Web Speech API not available');
            return;
        }

        if (recognitionRef.current) {
            console.log('[Speech Recognition] Already initialized, skipping');
            return;
        }

        console.log('[Speech Recognition] Initializing for skill:', targetId);
        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;

        recognitionRef.current.onstart = () => {
            console.log('[Speech Recognition] Started listening');
            setIsListening(true);
            setSpokenText('Listening...');
        };

        recognitionRef.current.onend = () => {
            console.log('[Speech Recognition] Ended');
            setIsListening(false);
            if (battlingSkillId === 'reading' || targetId === 'reading') {
                setTimeout(() => {
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
            const text = event.results[event.results.length - 1][0].transcript
                .toUpperCase()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
            console.log('[Speech Recognition] Recognized text:', text);
            setSpokenText(text);
            const currentChallenge = challengeDataRef.current;
            if (currentChallenge && currentChallenge.type === 'reading') {
                if (text === currentChallenge.answer || HOMOPHONES[currentChallenge.answer]?.includes(text)) {
                    console.log('[Speech Recognition] Correct answer!');
                    handleSuccessHit(targetId || battlingSkillId);
                } else if (text && text.length >= MIN_SPOKEN_TEXT_LENGTH) {
                    console.log('[Speech Recognition] Wrong answer');
                    handleSuccessHit(targetId || battlingSkillId, 'WRONG');
                }
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

        if (!window.webkitSpeechRecognition) {
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
