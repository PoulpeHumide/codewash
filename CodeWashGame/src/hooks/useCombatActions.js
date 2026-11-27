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
import { systemRandom, systemTimers } from '../utils/systemEffects';
import useManagedTimers from './minigames/useManagedTimers';
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

        context.timers.setTimeout(() => {
            checkAchievements(previousStats, newStats, previous, {
                ...previous,
                [skillId]: { ...current, level: newLevel },
            });
        }, 100);
        return newStats;
    });
};

const updateStableEncounterData = (progress, current, skillId, random) => {
    if (skillId === 'memory') progress.newMemoryMob = getRandomFriendlyMob(random);
    if (skillId === 'patterns') {
        progress.newPatternMob = getRandomMob(current.currentMob, random);
        progress.newPatternMobAura = getRandomAura(random);
    }

    const combatSkillMobUpdates = {
        reading: () => {
            progress.newReadingMob = getRandomMob(current.readingMob, random);
            progress.newReadingMobAura = getRandomAura(random);
        },
        math: () => {
            progress.newMathMob = getRandomMob(current.mathMob, random);
            progress.newMathMobAura = getRandomAura(random);
        },
        writing: () => {
            progress.newWritingMob = getRandomMob(current.writingMob, random);
            progress.newWritingMobAura = getRandomAura(random);
        },
    };
    if (combatSkillMobUpdates[skillId]) combatSkillMobUpdates[skillId]();

    if (getEncounterType(current.level) === 'miniboss') {
        progress.newMiniboss = getRandomMiniboss(random);
        progress.newMinibossAura = getRandomAura(random);
    }
    if (getEncounterType(current.level) === 'boss') {
        progress.newBoss = getRandomBoss(random);
        progress.newBossAura = getRandomAura(random);
    }
};

const restoreLostLevel = (progress, setShowLevelRestored, timers) => {
    if (progress.newLostLevel) {
        progress.newLevel += 1;
        progress.newLostLevel = false;
        progress.newRecoveryDifficulty = null;
        setShowLevelRestored(true);
        timers.setTimeout(() => setShowLevelRestored(false), 2000);
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

const processLevelProgress = (progress, current, skillConfig, setLootBox, random) => {
    const xpToLevel = calculateXPToLevel(progress.newDifficulty, progress.newLevel);
    if (progress.newXp >= xpToLevel) {
        const levelsGained = Math.floor(progress.newXp / xpToLevel);
        const oldLevel = progress.newLevel;
        progress.newLevel += levelsGained;
        progress.newXp = progress.newXp % xpToLevel;

        processRankMilestones(progress, oldLevel, skillConfig, setLootBox);

        if (progress.newLevel % 20 !== 0 && (progress.newLevel - 1) % 20 !== 0) {
            progress.newMob = getRandomMob(current.currentMob, random);
        }
        playLevelUp();
    }

    progress.newMobMaxHealth = calculateMobHealth(progress.newDifficulty);
    progress.newMobHealth = progress.newMobMaxHealth;
    if (progress.newLevel % 20 !== 0) progress.newMob = getRandomMob(current.currentMob, random);
};

const processDefeatedSkill = (progress, current, context, previous, skillConfig) => {
    const effectiveDamage = context.isInstantDefeat ? current.mobMaxHealth : context.damage;
    const totalXPReward = calculateXPReward(context.skillDifficulty, context.playerLevel);
    const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDamage);
    const xpPerHit = Math.floor(totalXPReward / hitsToKill);
    const hitsDealt = Math.ceil((current.mobMaxHealth - current.mobHealth) / effectiveDamage);

    progress.newXp += totalXPReward - hitsDealt * xpPerHit;
    recordDefeatStats(context, previous, current, progress.newLevel);
    updateStableEncounterData(progress, current, context.skillId, context.random);
    restoreLostLevel(progress, context.setShowLevelRestored, context.timers);
    processLevelProgress(progress, current, skillConfig, context.setLootBox, context.random);
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

const handleBossWrongAnswer = ({ battlingSkillId, skills, setSkills, setBossHealing, timers }) => {
    if (!battlingSkillId || getEncounterType(skills[battlingSkillId].level) !== 'boss') return false;

    setSkills((previous) => ({
        ...previous,
        [battlingSkillId]: {
            ...previous[battlingSkillId],
            mobHealth: previous[battlingSkillId].mobMaxHealth,
        },
    }));
    setBossHealing(battlingSkillId);
    timers.setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);
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
    timers,
}) => {
    playDeath();
    setShowDeathOverlay(true);
    setStats((previousStats) => {
        const newStats = {
            ...previousStats,
            totalDeaths: (previousStats.totalDeaths || 0) + 1,
        };
        timers.setTimeout(() => checkAchievements(previousStats, newStats, skills, skills), 100);
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

    timers.setTimeout(() => {
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

const playHitEffects = (skillId, details, damageIdRef, setDamageNumbers, random, scheduleTimeout) => {
    if (details.skillConfig.id === 'memory') return;

    const id = ++damageIdRef.current;
    setDamageNumbers((previous) => [
        ...previous,
        {
            id,
            skillId,
            val: details.actualDamage,
            x: random() * 100 - 50,
            y: random() * 50 - 25,
        },
    ]);
    scheduleTimeout(() => setDamageNumbers((previous) => previous.filter((number) => number.id !== id)), 800);

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
    random = systemRandom,
    timers = systemTimers,
}) {
    const { scheduleTimeout } = useManagedTimers(true, timers);
    const managedTimers = { ...timers, setTimeout: scheduleTimeout };

    const handleWrongAnswer = () => {
        if (handleBossWrongAnswer({ battlingSkillId, skills, setSkills, setBossHealing, timers: managedTimers }))
            return;

        setPlayerHealth((health) =>
            updatePlayerHealthAfterWrongAnswer(health, {
                setShowDeathOverlay,
                setStats,
                checkAchievements,
                skills,
                battlingSkillId,
                setSkills,
                setBattlingSkillId,
                timers: managedTimers,
            }),
        );
    };

    const handleSuccessHit = (skillId, isWrong) => {
        if (isWrong === 'WRONG') return handleWrongAnswer();
        if (!skillId) return;
        const details = getHitDetails(skillId, skills);
        playHitEffects(skillId, details, damageIdRef, setDamageNumbers, random, scheduleTimeout);

        setSkills((previous) =>
            updateSkillState(previous, {
                skillId,
                ...details,
                setStats,
                checkAchievements,
                setShowLevelRestored,
                setLootBox,
                random,
                timers: managedTimers,
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
