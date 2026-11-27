import { SKILL_DATA, HOSTILE_MOBS } from '../constants/gameData';
import { playLevelUp, playNotification } from '../utils/soundManager';

export default function createGameActions({
    activeTheme,
    setActiveTheme,
    selectedBorder,
    setSelectedBorder,
    skills,
    setSkills,
    setStats,
    checkAchievements,
    setLootBox,
}) {
    const handleThemeChange = (newTheme) => {
        if (newTheme !== activeTheme) {
            setActiveTheme(newTheme);
            setStats((previousStats) => {
                const newStats = {
                    ...previousStats,
                    themeChanges: (previousStats.themeChanges || 0) + 1,
                };
                setTimeout(() => {
                    checkAchievements(previousStats, newStats, skills, skills);
                }, 100);
                return newStats;
            });
        }
    };

    const handleBorderChange = (newBorder) => {
        if (newBorder !== selectedBorder) {
            setSelectedBorder(newBorder);
            setStats((previousStats) => {
                const newStats = {
                    ...previousStats,
                    borderChanges: (previousStats.borderChanges || 0) + 1,
                };
                setTimeout(() => {
                    checkAchievements(previousStats, newStats, skills, skills);
                }, 100);
                return newStats;
            });
        }
    };

    const handlePhantomLevelAward = (skillId) => {
        if (!skillId) return;

        playLevelUp();
        setSkills((previous) => ({
            ...previous,
            [skillId]: {
                ...previous[skillId],
                level: previous[skillId].level + 1,
            },
        }));

        const skillConfig = SKILL_DATA.find((skill) => skill.id === skillId);
        if (skillConfig) {
            setLootBox({
                level: skills[skillId].level + 1,
                skillName: skillConfig.fantasyName,
                item: 'Phantom Bonus!',
                img: HOSTILE_MOBS['Phantom'],
            });
            playNotification();
        }
    };

    return { handleThemeChange, handleBorderChange, handlePhantomLevelAward };
}
