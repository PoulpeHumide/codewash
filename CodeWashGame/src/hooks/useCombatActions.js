import {
    calculateDamage,
    calculateMobHealth,
    calculateXPReward,
    calculateXPToLevel,
    getEncounterType,
    getRandomBoss,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomMob,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import { BASE_ASSETS, SKILL_DATA } from '../constants/gameData';
import { addUniqueToArray } from '../utils/achievementUtils';
import {
    playDeath,
    playFail,
    playLevelUp,
    playMobDeath,
    playMobHurt,
    playNotification,
    playSuccessfulHit,
} from '../utils/soundManager';

const BOSS_HEALING_ANIMATION_DURATION = 600;

const createSkillProgress = (current, actualDamage) => ({
    newMobHealth: current.mobHealth - actualDamage,
    newLevel: current.level,
    newXp: current.xp,
    newMob: current.currentMob,
    newDifficulty: current.difficulty || 1,
    newBadges: [...(current.earnedBadges || [])],
    newMobMaxHealth: current.mobMaxHealth,
    newLostLevel: current.lostLevel,
    newRecoveryDifficulty: current.recoveryDifficulty,
    newMemoryMob: current.memoryMob,
    newPatternMob: current.patternMob,
    newMiniboss: current.currentMiniboss,
    newBoss: current.currentBoss,
    newReadingMob: current.readingMob,
    newMathMob: current.mathMob,
    newWritingMob: current.writingMob,
    newReadingMobAura: current.readingMobAura,
    newMathMobAura: current.mathMobAura,
    newWritingMobAura: current.writingMobAura,
    newPatternMobAura: current.patternMobAura,
    newMinibossAura: current.currentMinibossAura,
    newBossAura: current.currentBossAura,
});

const recordDefeatStats = (context, previous, current, newLevel) => {
    const { skillId, setStats, checkAchievements } = context;
    const encounterType = getEncounterType(current.level);
    setStats((previousStats) => {
        const newStats = { ...previousStats };
        newStats.battlesThisSession = (newStats.battlesThisSession || 0) + 1;

        if (encounterType === 'boss') {
            newStats.totalBossesDefeated = (newStats.totalBossesDefeated || 0) + 1;
            newStats.uniqueBossesDefeated = addUniqueToArray(newStats.uniqueBossesDefeated || [], current.currentBoss);
        } else if (encounterType === 'miniboss') {
            newStats.totalMinibossesDefeated = (newStats.totalMinibossesDefeated || 0) + 1;
            newStats.uniqueMinibossesDefeated = addUniqueToArray(
                newStats.uniqueMinibossesDefeated || [],
                current.currentMiniboss,
            );
        } else {
            newStats.totalMobsDefeated = (newStats.totalMobsDefeated || 0) + 1;
            newStats.uniqueMobsDefeated = addUniqueToArray(newStats.uniqueMobsDefeated || [], current.currentMob);
        }

        setTimeout(() => {
            checkAchievements(previousStats, newStats, previous, {
                ...previous,
                [skillId]: { ...current, level: newLevel },
            });
        }, 100);
        return newStats;
    });
};

const updateStableEncounterData = (progress, current, skillId) => {
    if (skillId === 'memory') progress.newMemoryMob = getRandomFriendlyMob();
    if (skillId === 'patterns') {
        progress.newPatternMob = getRandomMob(current.currentMob);
        progress.newPatternMobAura = getRandomAura();
    }

    const combatSkillMobUpdates = {
        reading: () => {
            progress.newReadingMob = getRandomMob(current.readingMob);
            progress.newReadingMobAura = getRandomAura();
        },
        math: () => {
            progress.newMathMob = getRandomMob(current.mathMob);
            progress.newMathMobAura = getRandomAura();
        },
        writing: () => {
            progress.newWritingMob = getRandomMob(current.writingMob);
            progress.newWritingMobAura = getRandomAura();
        },
    };
    if (combatSkillMobUpdates[skillId]) combatSkillMobUpdates[skillId]();

    if (getEncounterType(current.level) === 'miniboss') {
        progress.newMiniboss = getRandomMiniboss();
        progress.newMinibossAura = getRandomAura();
    }
    if (getEncounterType(current.level) === 'boss') {
        progress.newBoss = getRandomBoss();
        progress.newBossAura = getRandomAura();
    }
};

const restoreLostLevel = (progress, setShowLevelRestored) => {
    if (progress.newLostLevel) {
        progress.newLevel += 1;
        progress.newLostLevel = false;
        progress.newRecoveryDifficulty = null;
        setShowLevelRestored(true);
        setTimeout(() => setShowLevelRestored(false), 2000);
        playNotification();
    }
};

const awardRankMilestone = (progress, level, skillConfig, setLootBox) => {
    if (level % 20 !== 0 || level <= 0) return;

    const newTier = Math.floor(level / 20);
    if (progress.newDifficulty < 7) progress.newDifficulty++;
    if (progress.newBadges.includes(newTier) || newTier > 7) return;

    progress.newBadges.push(newTier);
    setLootBox({
        level,
        skillName: skillConfig.fantasyName,
        item: 'New Rank!',
        img: BASE_ASSETS.badges.Wood,
    });
    playNotification();
};

const processRankMilestones = (progress, oldLevel, skillConfig, setLootBox) => {
    if (skillConfig.id === 'cleaning') return;

    for (let level = oldLevel; level < progress.newLevel; level++) {
        awardRankMilestone(progress, level, skillConfig, setLootBox);
    }
};

const processLevelProgress = (progress, current, skillConfig, setLootBox) => {
    const xpToLevel = calculateXPToLevel(progress.newDifficulty, progress.newLevel);
    if (progress.newXp >= xpToLevel) {
        const levelsGained = Math.floor(progress.newXp / xpToLevel);
        const oldLevel = progress.newLevel;
        progress.newLevel += levelsGained;
        progress.newXp = progress.newXp % xpToLevel;

        processRankMilestones(progress, oldLevel, skillConfig, setLootBox);

        if (progress.newLevel % 20 !== 0 && (progress.newLevel - 1) % 20 !== 0) {
            progress.newMob = getRandomMob(current.currentMob);
        }
        playLevelUp();
    }

    progress.newMobMaxHealth = calculateMobHealth(progress.newDifficulty);
    progress.newMobHealth = progress.newMobMaxHealth;
    if (progress.newLevel % 20 !== 0) progress.newMob = getRandomMob(current.currentMob);
};

const processDefeatedSkill = (progress, current, context, previous, skillConfig) => {
    const effectiveDamage = context.isInstantDefeat ? current.mobMaxHealth : context.damage;
    const totalXPReward = calculateXPReward(context.skillDifficulty, context.playerLevel);
    const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDamage);
    const xpPerHit = Math.floor(totalXPReward / hitsToKill);
    const hitsDealt = Math.ceil((current.mobMaxHealth - current.mobHealth) / effectiveDamage);

    progress.newXp += totalXPReward - hitsDealt * xpPerHit;
    recordDefeatStats(context, previous, current, progress.newLevel);
    updateStableEncounterData(progress, current, context.skillId);
    restoreLostLevel(progress, context.setShowLevelRestored);
    processLevelProgress(progress, current, skillConfig, context.setLootBox);
};

const updateSkillState = (previous, context) => {
    const { skillId, skillConfig, actualDamage, isInstantDefeat, damage, skillDifficulty, playerLevel } = context;
    const current = previous[skillId];
    const progress = createSkillProgress(current, actualDamage);

    if (progress.newMobHealth <= 0) {
        processDefeatedSkill(progress, current, context, previous, skillConfig);
    } else {
        const totalXPReward = calculateXPReward(skillDifficulty, playerLevel);
        const effectiveDamage = isInstantDefeat ? current.mobMaxHealth : damage;
        const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDamage);
        const xpPerHit = Math.floor(totalXPReward / hitsToKill);
        progress.newXp += xpPerHit;
    }

    return {
        ...previous,
        [skillId]: {
            ...current,
            level: progress.newLevel,
            xp: progress.newXp,
            currentMob: progress.newMob,
            difficulty: progress.newDifficulty,
            earnedBadges: progress.newBadges,
            mobHealth: progress.newMobHealth,
            mobMaxHealth: progress.newMobMaxHealth,
            lostLevel: progress.newLostLevel,
            recoveryDifficulty: progress.newRecoveryDifficulty,
            memoryMob: progress.newMemoryMob,
            patternMob: progress.newPatternMob,
            currentMiniboss: progress.newMiniboss,
            currentBoss: progress.newBoss,
            readingMob: progress.newReadingMob,
            mathMob: progress.newMathMob,
            writingMob: progress.newWritingMob,
            readingMobAura: progress.newReadingMobAura,
            mathMobAura: progress.newMathMobAura,
            writingMobAura: progress.newWritingMobAura,
            patternMobAura: progress.newPatternMobAura,
            currentMinibossAura: progress.newMinibossAura,
            currentBossAura: progress.newBossAura,
        },
    };
};

const handleBossWrongAnswer = ({ battlingSkillId, skills, setSkills, setBossHealing }) => {
    if (!battlingSkillId || getEncounterType(skills[battlingSkillId].level) !== 'boss') return false;

    setSkills((previous) => ({
        ...previous,
        [battlingSkillId]: {
            ...previous[battlingSkillId],
            mobHealth: previous[battlingSkillId].mobMaxHealth,
        },
    }));
    setBossHealing(battlingSkillId);
    setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);
    playFail();
    return true;
};

const handleFatalWrongAnswer = ({
    setShowDeathOverlay,
    setStats,
    checkAchievements,
    skills,
    battlingSkillId,
    setSkills,
    setBattlingSkillId,
}) => {
    playDeath();
    setShowDeathOverlay(true);
    setStats((previousStats) => {
        const newStats = {
            ...previousStats,
            totalDeaths: (previousStats.totalDeaths || 0) + 1,
        };
        setTimeout(() => checkAchievements(previousStats, newStats, skills, skills), 100);
        return newStats;
    });

    if (battlingSkillId) {
        setSkills((previous) => {
            const current = previous[battlingSkillId];
            const newLevel = Math.max(1, current.level - 1);
            const currentDifficulty = current.difficulty || 1;
            return {
                ...previous,
                [battlingSkillId]: {
                    ...current,
                    level: newLevel,
                    lostLevel: current.level > 1,
                    recoveryDifficulty: Math.max(1, currentDifficulty - 1),
                },
            };
        });
    }

    setTimeout(() => {
        setBattlingSkillId(null);
        setShowDeathOverlay(false);
    }, 2000);
    return 10;
};

const updatePlayerHealthAfterWrongAnswer = (health, context) => {
    const newHealth = health - 1;
    if (newHealth <= 0) return handleFatalWrongAnswer(context);

    playFail();
    return newHealth;
};

const getHitDetails = (skillId, skills) => {
    const skillConfig = SKILL_DATA.find((skill) => skill.id === skillId);
    const currentSkillState = skills[skillId];
    const skillDifficulty = currentSkillState.difficulty || 1;
    const playerLevel = currentSkillState.level;
    const damage = calculateDamage(playerLevel, skillDifficulty);
    const encounterType = getEncounterType(playerLevel);
    const isMiniboss = encounterType === 'miniboss' && skillConfig.id !== 'cleaning';
    const isInstantDefeat = skillConfig.id === 'cleaning' || skillConfig.id === 'memory' || isMiniboss;
    const actualDamage = isInstantDefeat ? currentSkillState.mobHealth : damage;

    return {
        skillConfig,
        currentSkillState,
        skillDifficulty,
        playerLevel,
        damage,
        isInstantDefeat,
        actualDamage,
        willDefeatMob: currentSkillState.mobHealth - actualDamage <= 0,
    };
};

const playHitEffects = (skillId, details, damageIdRef, setDamageNumbers) => {
    if (details.skillConfig.id === 'memory') return;

    const id = ++damageIdRef.current;
    setDamageNumbers((previous) => [
        ...previous,
        {
            id,
            skillId,
            val: details.actualDamage,
            x: Math.random() * 100 - 50,
            y: Math.random() * 50 - 25,
        },
    ]);
    setTimeout(() => setDamageNumbers((previous) => previous.filter((number) => number.id !== id)), 800);

    if (details.willDefeatMob) {
        playMobDeath(details.currentSkillState.currentMob);
    } else {
        playMobHurt(details.currentSkillState.currentMob);
    }
    playSuccessfulHit();
};

const handleChallengeAfterHit = (details, context) => {
    const { skillConfig, skillDifficulty } = details;
    const {
        battleDifficulty,
        setChallengeData,
        generateChallenge,
        setSpokenText,
        setBattlingSkillId,
        setBattleDifficulty,
    } = context;

    if (skillConfig.hasChallenge && skillConfig.id !== 'memory') {
        const challengeDiff = battleDifficulty || skillDifficulty;
        setChallengeData(generateChallenge(skillConfig.challengeType, challengeDiff));
        if (skillConfig.challengeType === 'reading') setSpokenText('');
    } else if (skillConfig.id === 'memory') {
        setBattlingSkillId(null);
        setBattleDifficulty(null);
    }
};

export default function useCombatActions({
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
    setSpokenText,
    checkAchievements,
    generateChallenge,
}) {
    const handleWrongAnswer = () => {
        if (handleBossWrongAnswer({ battlingSkillId, skills, setSkills, setBossHealing })) return;

        setPlayerHealth((health) =>
            updatePlayerHealthAfterWrongAnswer(health, {
                setShowDeathOverlay,
                setStats,
                checkAchievements,
                skills,
                battlingSkillId,
                setSkills,
                setBattlingSkillId,
            }),
        );
    };

    const handleSuccessHit = (skillId, isWrong) => {
        if (isWrong === 'WRONG') return handleWrongAnswer();
        if (!skillId) return;
        const details = getHitDetails(skillId, skills);
        playHitEffects(skillId, details, damageIdRef, setDamageNumbers);

        setSkills((previous) =>
            updateSkillState(previous, {
                skillId,
                ...details,
                setStats,
                checkAchievements,
                setShowLevelRestored,
                setLootBox,
            }),
        );

        handleChallengeAfterHit(details, {
            battleDifficulty,
            setChallengeData,
            generateChallenge,
            setSpokenText,
            setBattlingSkillId,
            setBattleDifficulty,
        });
    };

    return { handleSuccessHit };
}
