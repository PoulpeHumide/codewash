import React, { useState, useEffect, useRef, useCallback } from 'react';

// Modules
import GlobalStyles from './components/ui/GlobalStyles';
import GameChrome from './components/game/GameChrome';
import SkillCarousel from './components/game/SkillCarousel';
import GameOverlays from './components/game/GameOverlays';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useProfileState from './hooks/useProfileState';
import useCombatActions from './hooks/useCombatActions';
import createProfileActions from './hooks/useProfileActions';
import createGameActions from './hooks/gameActions';

// Utils & Constants
import {
    getEncounterType,
    generateMathProblem,
    getReadingWord,
    getWordForDifficulty,
    calculateMobHealth,
} from './utils/gameUtils';
import { BASE_ASSETS, THEME_CONFIG, SKILL_DATA, DIFFICULTY_CONTENT } from './constants/gameData';
import {
    getBGMManager,
    setSfxVolume,
    playActionCardLeft,
    playActionCardRight,
    playClick,
    playAchievement,
} from './utils/soundManager';
import { getNewlyUnlockedAchievements, getNewTierAchievements } from './utils/achievementUtils';

const App = () => {
    const {
        currentProfile,
        setCurrentProfile,
        profileNames,
        setProfileNames,
        parentStatus,
        setParentStatus,
        skills,
        setSkills,
        activeTheme,
        setActiveTheme,
        stats,
        setStats,
        selectedBorder,
        setSelectedBorder,
        borderColor,
        setBorderColor,
        unlockedBorders,
        unlockedAchievements,
        loadSkills,
        loadTheme,
        getProfileStats,
    } = useProfileState();
    const { handleSwitchProfile, handleRenameProfile, handleParentVerified, handleReset } = createProfileActions({
        currentProfile,
        setCurrentProfile,
        setSkills,
        setActiveTheme,
        setProfileNames,
        setParentStatus,
        loadSkills,
        loadTheme,
    });
    const [playerHealth, setPlayerHealth] = useState(10);
    const [achievementToast, setAchievementToast] = useState(null);
    const [battlingSkillId, setBattlingSkillId] = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null); // Track battle's starting difficulty for consistent challenge generation
    const [challengeData, setChallengeData] = useState(null);
    const [lootBox, setLootBox] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isBugReportOpen, setIsBugReportOpen] = useState(false);
    const [damageNumbers, setDamageNumbers] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [showDeathOverlay, setShowDeathOverlay] = useState(false);
    const [showLevelRestored, setShowLevelRestored] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bossHealing, setBossHealing] = useState(null); // skillId of boss being healed
    const damageIdRef = useRef(0); // Counter for generating unique damage number IDs
    const loginTrackedRef = useRef(false); // Track if we've already recorded today's login
    const [bgmVol, setBgmVol] = useState(0.3);
    const [sfxVol, setSfxVolState] = useState(0.5);
    const bgmManager = useRef(getBGMManager());

    // Update BGM volume
    useEffect(() => {
        bgmManager.current.setVolume(bgmVol);
    }, [bgmVol]);

    // Update SFX volume in sound manager
    useEffect(() => {
        setSfxVolume(sfxVol);
    }, [sfxVol]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Start BGM on first user interaction
    const startBGM = useCallback(() => {
        if (!bgmManager.current.isPlaying) {
            bgmManager.current.play();
        }
    }, []);

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.warn('Failed to exit fullscreen:', err);
            });
        }
        playClick();
    };

    const generateChallenge = (type, diff) => {
        // Math: Use difficulty-based problem generation
        if (type === 'math') {
            return generateMathProblem(diff);
        }
        // Patterns: Simon Says - no challenge data needed, handled in SkillCard
        if (type === 'patterns') {
            return { type: 'patterns', question: 'Simon Says!', answer: 'WIN' };
        }
        // Reading: Use difficulty-based word selection
        if (type === 'reading') {
            const word = getReadingWord(diff);
            return { type, question: word, answer: word };
        }
        // Writing: Use difficulty-based word selection from comprehensive index
        if (type === 'writing') {
            const wordData = getWordForDifficulty(diff);
            // Use displayName in uppercase for the answer (handles multi-word items with spaces)
            const answer = wordData.displayName.toUpperCase();
            return {
                type,
                question: 'Spell it!',
                answer,
                images: [wordData.image],
                displayName: wordData.displayName,
            };
        }
        // Memory: No specific challenge data, handled in SkillCard
        if (type === 'memory') return { type: 'memory', question: 'Find Pairs!', answer: 'WIN' };
        // Cleaning: Manual task
        return { type: 'manual', question: 'Task Complete?', answer: 'yes' };
    };

    // Regenerate challenge when difficulty or level changes during active battle
    // This fixes the issue where challenges use stale difficulty after leveling up
    // Removed problematic useEffect that was causing infinite loop
    // The startBattle function already sets battleDifficulty correctly

    // Check for achievement unlocks
    const checkAchievements = useCallback((oldStats, newStats, oldSkills, newSkills) => {
        // Check for newly unlocked one-time achievements
        const newlyUnlocked = getNewlyUnlockedAchievements(oldStats, newStats, oldSkills, newSkills);

        // Check for tiered achievement progress
        const newTiers = getNewTierAchievements(oldStats, newStats, oldSkills, newSkills);

        // Show toast for the first achievement/tier unlocked
        if (newlyUnlocked.length > 0) {
            // Show first newly unlocked achievement
            setAchievementToast({ achievementId: newlyUnlocked[0], tierIndex: null });
            playAchievement();
        } else if (newTiers.length > 0) {
            // Show first new tier
            setAchievementToast({
                achievementId: newTiers[0].achievementId,
                tierIndex: newTiers[0].tierIndex,
            });
            playAchievement();
        }
    }, []);

    const handleSuccessHitRef = useRef();
    const setSpokenTextRef = useRef(() => {});
    const speech = useSpeechRecognition({
        battlingSkillId,
        challengeData,
        handleSuccessHit: (...args) => handleSuccessHitRef.current(...args),
    });
    const { handleSuccessHit } = useCombatActions({
        skills,
        setSkills,
        setStats,
        battlingSkillId,
        setBattlingSkillId,
        battleDifficulty,
        setBattleDifficulty,
        setChallengeData,
        setPlayerHealth,
        setDamageNumbers,
        damageIdRef,
        setBossHealing,
        setShowDeathOverlay,
        setShowLevelRestored,
        setLootBox,
        setSpokenText: (...args) => setSpokenTextRef.current(...args),
        checkAchievements,
        generateChallenge,
    });
    handleSuccessHitRef.current = handleSuccessHit;
    setSpokenTextRef.current = speech.setSpokenText;
    const { isListening, spokenText, startVoiceListener, stopVoiceRecognition, toggleMicListener } = speech;

    // Helper function to set difficulty for a specific skill
    const setSkillDifficulty = (skillId, newDiff) => {
        setSkills((prev) => {
            const current = prev[skillId];
            const newMobMaxHealth = calculateMobHealth(newDiff);
            return {
                ...prev,
                [skillId]: {
                    ...current,
                    difficulty: newDiff,
                    mobHealth: newMobMaxHealth,
                    mobMaxHealth: newMobMaxHealth,
                },
            };
        });
    };

    // Wrapper for setActiveTheme to track theme changes
    const { handleThemeChange, handleBorderChange, handlePhantomLevelAward } = createGameActions({
        activeTheme,
        setActiveTheme,
        selectedBorder,
        setSelectedBorder,
        skills,
        setSkills,
        setStats,
        checkAchievements,
        setLootBox,
    });

    const startBattle = (id) => {
        const skill = SKILL_DATA.find((s) => s.id === id);
        setBattlingSkillId(id);
        // Use the skill's current difficulty setting
        const currentDiff = skills[id].difficulty || 1;
        const playerLevel = skills[id].level;

        // For miniboss encounters, use difficulty+1 for content (capped at 7)
        const encounterType = getEncounterType(playerLevel);
        const challengeDiff = encounterType === 'miniboss' ? Math.min(7, currentDiff + 1) : currentDiff;

        // Store the battle's challenge difficulty so it remains consistent throughout the battle
        setBattleDifficulty(challengeDiff);

        setChallengeData(generateChallenge(skill.challengeType, challengeDiff));
        playClick();
        startBGM(); // Start BGM on first battle (user interaction)
        if (skill.challengeType === 'reading' && window.webkitSpeechRecognition) startVoiceListener(id);
    };

    const endBattle = () => {
        console.log('[Battle] Ending battle, cleaning up speech recognition');
        setBattlingSkillId(null);
        setBattleDifficulty(null);
        setChallengeData(null);
        stopVoiceRecognition();
        playClick();
    };

    useEffect(() => {
        if (lootBox) setTimeout(() => setLootBox(null), 4000);
    }, [lootBox]);

    // Achievement toast auto-dismiss
    useEffect(() => {
        if (achievementToast) {
            setTimeout(() => setAchievementToast(null), 6000);
        }
    }, [achievementToast]);

    // Track login date (once per day)
    useEffect(() => {
        if (loginTrackedRef.current) return; // Skip if already tracked
        loginTrackedRef.current = true;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const currentDates = stats.loginDates || [];
        // Only set if today's date is not already recorded
        if (!currentDates.includes(today)) {
            setStats((prev) => ({
                ...prev,
                loginDates: [...(prev.loginDates || []), today],
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount, guarded by loginTrackedRef

    const getVisibleItems = () => {
        const items = [];
        // Generate 7 items: 5 visible cards (offsets -2 to +2) + 2 hidden positions (±3) for smooth entry/exit animation
        for (let i = -3; i <= 3; i++) {
            let idx = selectedIndex + i;
            let dataIndex = idx % SKILL_DATA.length;
            if (dataIndex < 0) dataIndex += SKILL_DATA.length;
            items.push({ ...SKILL_DATA[dataIndex], offset: i, key: idx });
        }
        return items;
    };
    const currentThemeData = THEME_CONFIG[activeTheme] || THEME_CONFIG.minecraft;
    const containerStyle = { ...currentThemeData.style, fontFamily: '"VT323", monospace' };

    // Drag handlers for carousel navigation
    const handleDragStart = (clientX) => {
        if (battlingSkillId) return;
        setIsDragging(true);
        setDragStartX(clientX);
    };
    const handleDragMove = (clientX) => {
        if (!isDragging || battlingSkillId) return;
        const diff = dragStartX - clientX;
        if (Math.abs(diff) >= 100) {
            if (diff > 0) {
                setSelectedIndex((p) => p + 1);
                playActionCardRight();
            } else {
                setSelectedIndex((p) => p - 1);
                playActionCardLeft();
            }
            setIsDragging(false);
        }
    };
    const handleDragEnd = () => {
        setIsDragging(false);
    };
    // Helper to get the aura for the current mob encounter
    const getAuraForSkill = (skillConfig, userSkill) => {
        // Memory and Cleaning don't use auras
        if (skillConfig.id === 'memory' || skillConfig.id === 'cleaning') {
            return null;
        }

        const encounterType = getEncounterType(userSkill.level);

        if (encounterType === 'boss') {
            return userSkill.currentBossAura;
        }

        if (encounterType === 'miniboss') {
            return userSkill.currentMinibossAura;
        }

        // Combat skills have their own auras
        const combatSkillAuras = {
            reading: userSkill.readingMobAura,
            math: userSkill.mathMobAura,
            writing: userSkill.writingMobAura,
            patterns: userSkill.patternMobAura,
        };

        return combatSkillAuras[skillConfig.id] || null;
    };

    return (
        <div
            className="min-h-screen overflow-hidden relative flex flex-col bg-cover bg-center bg-no-repeat font-sans text-stone-100"
            style={containerStyle}
        >
            <GlobalStyles />
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-0"></div>
            <GameChrome
                {...{
                    playerHealth,
                    isMenuOpen,
                    setIsMenuOpen,
                    isSettingsOpen,
                    setIsSettingsOpen,
                    isCosmeticsOpen,
                    setIsCosmeticsOpen,
                    isResetOpen,
                    setIsResetOpen,
                    isBugReportOpen,
                    setIsBugReportOpen,
                    isFullscreen,
                    toggleFullscreen,
                    activeTheme,
                    handleThemeChange,
                    selectedBorder,
                    handleBorderChange,
                    borderColor,
                    setBorderColor,
                    unlockedBorders,
                    unlockedAchievements,
                    handleReset,
                    bgmVol,
                    setBgmVol,
                    sfxVol,
                    setSfxVolState,
                    currentProfile,
                    handleSwitchProfile,
                    profileNames,
                    handleRenameProfile,
                    getProfileStats,
                    parentStatus,
                    handleParentVerified,
                    skills,
                    stats,
                    battlingSkillId,
                    endBattle,
                }}
            />
            <SkillCarousel
                {...{
                    currentThemeData,
                    selectedIndex,
                    setSelectedIndex,
                    isDragging,
                    battlingSkillId,
                    handleDragStart,
                    handleDragMove,
                    handleDragEnd,
                    getVisibleItems,
                    skills,
                    getAuraForSkill,
                    challengeData,
                    isListening,
                    spokenText,
                    damageNumbers,
                    startBattle,
                    endBattle,
                    handleSuccessHit,
                    toggleMicListener,
                    setSkillDifficulty,
                    selectedBorder,
                    borderColor,
                    bossHealing,
                }}
            />
            <GameOverlays
                {...{
                    lootBox,
                    achievementToast,
                    showDeathOverlay,
                    showLevelRestored,
                    battlingSkillId,
                    handlePhantomLevelAward,
                    setStats,
                    checkAchievements,
                    skills,
                }}
            />
        </div>
    );
};

export default App;
