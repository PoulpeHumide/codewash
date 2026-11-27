import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BASE_ASSETS, DIFFICULTY_CONTENT, FRIENDLY_MOBS, HOMOPHONES } from '../../constants/gameData';
import { getSfxVolume, playClick } from '../../utils/soundManager';
import {
    canFlipMemoryCard,
    createMemoryDeck,
    hasMemoryGameWon,
    isMatchingMemoryPair,
} from '../../utils/minigames/memoryRules';
import {
    isCorrectMathAnswer,
    isCorrectWritingAnswer,
    isWrongSpokenAnswer,
    normalizeMathInput,
    normalizeWritingInput,
} from '../../utils/minigames/minigameRules';
import {
    createNextSimonSequence,
    getSimonInputResult,
    getSimonRoundDamage,
    getSimonTempoDelays,
} from '../../utils/minigames/simonRules';
import useManagedTimers from './useManagedTimers';

const AXOLOTL_NOTE_MAP = {
    Pink: 'c4',
    Cyan: 'd4',
    Gold: 'e4',
    Brown: 'f4',
    Blue: 'g4',
    Red: 'a4',
    Green: 'b4',
    Black: 'g5',
};

const useSkillCardMiniGames = ({
    config,
    challenge,
    isBattling,
    spokenText,
    damageNumbers,
    difficulty,
    onMathSubmit,
}) => {
    const { scheduleTimeout } = useManagedTimers(isBattling);
    const [mathInput, setMathInput] = useState('');
    const [isHit, setIsHit] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [isReadingWrong, setIsReadingWrong] = useState(false);
    const [memoryCards, setMemoryCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [isProcessingMatch, setIsProcessingMatch] = useState(false);
    const [mismatchShake, setMismatchShake] = useState(false);
    const [simonSequence, setSimonSequence] = useState([]);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [isShowingSequence, setIsShowingSequence] = useState(false);
    const [showParentalModal, setShowParentalModal] = useState(false);
    const [completedRounds, setCompletedRounds] = useState(0);
    const [litAxolotl, setLitAxolotl] = useState(null);
    const [simonGameActive, setSimonGameActive] = useState(false);
    const prevDamageCount = useRef(0);
    const inputRef = useRef(null);
    const readingWordRef = useRef(null);
    const prevSpokenTextRef = useRef('');
    const memorySessionStartedRef = useRef(false);
    const simonSessionStartedRef = useRef(false);

    const playAxolotlNote = useCallback((color) => {
        const noteName = AXOLOTL_NOTE_MAP[color];
        if (!noteName) {
            playClick();
            return;
        }
        const audio = new Audio(`assets/sounds/axolotl/${noteName}.wav`);
        audio.volume = getSfxVolume();
        audio.play().catch(() => playClick());
    }, []);

    const playMismatch = useCallback(() => {
        const audio = new Audio(BASE_ASSETS.audio.mismatch);
        audio.volume = getSfxVolume();
        audio.play().catch(() => {});
    }, []);

    useEffect(() => {
        setMathInput('');
    }, [challenge]);

    const memoryConfig = DIFFICULTY_CONTENT.memory[difficulty] || DIFFICULTY_CONTENT.memory[1];
    const memoryPairs = memoryConfig.pairs || 3;
    const memoryGridCols = memoryConfig.gridCols || 4;

    useEffect(() => {
        if (isBattling && config.id === 'memory' && !memorySessionStartedRef.current) {
            memorySessionStartedRef.current = true;
            setMemoryCards(createMemoryDeck(FRIENDLY_MOBS, memoryPairs));
            setFlippedIndices([]);
            setMatchedPairs([]);
            setIsProcessingMatch(false);
            setMismatchShake(false);
        } else if (!isBattling && config.id === 'memory') {
            memorySessionStartedRef.current = false;
            setMemoryCards([]);
            setFlippedIndices([]);
            setMatchedPairs([]);
            setIsProcessingMatch(false);
            setMismatchShake(false);
        }
    }, [isBattling, config.id, memoryPairs]);

    useEffect(() => {
        if (damageNumbers.length > prevDamageCount.current) {
            setIsHit(true);
            scheduleTimeout(() => setIsHit(false), 400);
        }
        prevDamageCount.current = damageNumbers.length;
    }, [damageNumbers, scheduleTimeout]);

    useEffect(() => {
        if (
            config.challengeType === 'reading' &&
            isBattling &&
            spokenText &&
            spokenText !== 'Listening...' &&
            spokenText !== 'Mic Off'
        ) {
            if (spokenText !== prevSpokenTextRef.current) {
                if (challenge?.answer) {
                    const homophones = HOMOPHONES[challenge.answer];
                    if (isWrongSpokenAnswer(spokenText, challenge.answer, homophones)) {
                        setIsReadingWrong(true);
                        scheduleTimeout(() => setIsReadingWrong(false), 500);
                    }
                }
                prevSpokenTextRef.current = spokenText;
            }
        }
    }, [spokenText, config.challengeType, isBattling, challenge?.answer, scheduleTimeout]);

    const patternConfig = DIFFICULTY_CONTENT.patterns[difficulty] || DIFFICULTY_CONTENT.patterns[1];
    const axolotlCount = patternConfig.axolotlCount || 2;
    const shouldResetSequence = patternConfig.resetSequence || false;
    const axolotlColors = useMemo(() => {
        const allAxolotlColors = Object.keys(BASE_ASSETS.axolotls);
        return allAxolotlColors.slice(0, Math.min(axolotlCount, allAxolotlColors.length));
    }, [axolotlCount]);

    const playSequence = useCallback(
        (sequence) => {
            setIsShowingSequence(true);
            setPlayerIndex(0);
            let i = 0;
            const { onDelay, offDelay } = getSimonTempoDelays(completedRounds, difficulty);
            const playNext = () => {
                if (i < sequence.length) {
                    setLitAxolotl(sequence[i]);
                    playAxolotlNote(sequence[i]);
                    scheduleTimeout(() => {
                        setLitAxolotl(null);
                        i++;
                        scheduleTimeout(playNext, offDelay);
                    }, onDelay);
                } else {
                    setIsShowingSequence(false);
                }
            };
            scheduleTimeout(playNext, 500);
        },
        [completedRounds, difficulty, playAxolotlNote, scheduleTimeout],
    );

    const startSimonGame = useCallback(() => {
        const firstColor = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
        const newSequence = [firstColor];
        setSimonSequence(newSequence);
        setPlayerIndex(0);
        setCompletedRounds(0);
        setSimonGameActive(true);
        playSequence(newSequence);
    }, [axolotlColors, playSequence]);

    const handleAxolotlClick = (color) => {
        if (isShowingSequence || !simonGameActive) return;
        playAxolotlNote(color);
        const inputResult = getSimonInputResult(simonSequence, playerIndex, color);
        if (inputResult === 'wrong') {
            const mismatchAudio = new Audio(BASE_ASSETS.audio.mismatch);
            mismatchAudio.volume = getSfxVolume();
            mismatchAudio.play().catch(() => {});
            setSimonGameActive(false);
            return;
        }
        if (inputResult === 'continue') {
            setPlayerIndex(playerIndex + 1);
            return;
        }

        const matchAudio = new Audio(BASE_ASSETS.audio.match);
        matchAudio.volume = getSfxVolume();
        matchAudio.play().catch(() => {});
        const newRounds = completedRounds + 1;
        setCompletedRounds(newRounds);
        scheduleTimeout(() => onMathSubmit('WIN', getSimonRoundDamage(newRounds)), 300);
        const newSequence = createNextSimonSequence(simonSequence, axolotlColors, shouldResetSequence);
        setSimonSequence(newSequence);
        setPlayerIndex(0);
        scheduleTimeout(() => playSequence(newSequence), 800);
    };

    useEffect(() => {
        if (isBattling && config.id === 'patterns' && !simonSessionStartedRef.current) {
            simonSessionStartedRef.current = true;
            startSimonGame();
        } else if (!isBattling && config.id === 'patterns') {
            simonSessionStartedRef.current = false;
            setSimonSequence([]);
            setPlayerIndex(0);
            setIsShowingSequence(false);
            setCompletedRounds(0);
            setLitAxolotl(null);
            setSimonGameActive(false);
        }
    }, [isBattling, config.id, startSimonGame]);

    const handleCardClick = (index) => {
        if (!canFlipMemoryCard(isProcessingMatch, flippedIndices, matchedPairs, memoryCards, index)) return;
        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);
        playClick();
        if (newFlipped.length !== 2) return;

        setIsProcessingMatch(true);
        scheduleTimeout(() => {
            if (isMatchingMemoryPair(memoryCards, newFlipped[0], newFlipped[1])) {
                const matchAudio = new Audio(BASE_ASSETS.audio.match);
                matchAudio.volume = getSfxVolume();
                matchAudio.play().catch(() => {});
                const newMatched = [...matchedPairs, memoryCards[newFlipped[0]].color];
                setMatchedPairs(newMatched);
                setFlippedIndices([]);
                setIsProcessingMatch(false);
                if (hasMemoryGameWon(newMatched, memoryPairs)) scheduleTimeout(() => onMathSubmit('WIN'), 500);
                return;
            }

            const mismatchAudio = new Audio(BASE_ASSETS.audio.mismatch);
            mismatchAudio.volume = getSfxVolume();
            mismatchAudio.play().catch(() => {});
            setMismatchShake(true);
            scheduleTimeout(() => {
                setMismatchShake(false);
                setFlippedIndices([]);
                setIsProcessingMatch(false);
            }, 500);
        }, 300);
    };

    const handleParentalVerified = useCallback(() => {
        setShowParentalModal(false);
        onMathSubmit(challenge?.answer);
    }, [onMathSubmit, challenge]);

    const handleMathInput = (input) => {
        const value = normalizeMathInput(input);
        setMathInput(value);
        if (isCorrectMathAnswer(value, challenge?.answer)) {
            onMathSubmit(value);
            setMathInput('');
        } else if (value.length === String(challenge?.answer).length) {
            setIsWrong(true);
            playMismatch();
            onMathSubmit('WRONG');
            scheduleTimeout(() => {
                setIsWrong(false);
                setMathInput('');
                scheduleTimeout(() => inputRef.current?.focus(), 10);
            }, 500);
        }
    };

    const handleWritingInput = (input) => {
        const value = normalizeWritingInput(input);
        setMathInput(value);
        const answerNoSpaces = challenge?.answer.replace(/\s/g, '');
        if (isCorrectWritingAnswer(value, challenge?.answer)) {
            onMathSubmit(value);
            setMathInput('');
        } else if (value.length === answerNoSpaces.length) {
            setIsWrong(true);
            playMismatch();
            scheduleTimeout(() => {
                setIsWrong(false);
                setMathInput('');
                scheduleTimeout(() => inputRef.current?.focus(), 10);
            }, 500);
        }
    };

    return {
        mathInput,
        isHit,
        isWrong,
        isReadingWrong,
        inputRef,
        readingWordRef,
        memoryCards,
        flippedIndices,
        matchedPairs,
        mismatchShake,
        memoryPairs,
        memoryGridCols,
        simonSequence,
        playerIndex,
        isShowingSequence,
        showParentalModal,
        setShowParentalModal,
        completedRounds,
        litAxolotl,
        simonGameActive,
        axolotlColors,
        startSimonGame,
        handleAxolotlClick,
        handleCardClick,
        handleParentalVerified,
        handleMathInput,
        handleWritingInput,
    };
};

export default useSkillCardMiniGames;
