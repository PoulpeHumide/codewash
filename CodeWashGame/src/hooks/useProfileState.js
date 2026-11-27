import { useEffect, useMemo, useState } from 'react';
import { isAchievementUnlocked } from '../utils/achievementUtils';
import { getProfileStats, getStorageKey, loadSkills, loadStats, loadTheme } from '../utils/profileStorage';

const DEFAULT_PROFILE_NAMES = { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
const DEFAULT_PARENT_STATUS = { 1: false, 2: false, 3: false };
const ACHIEVEMENT_IDS = ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'];

export default function useProfileState() {
    const [currentProfile, setCurrentProfile] = useState(() =>
        localStorage.getItem('currentProfile_v1') ? parseInt(localStorage.getItem('currentProfile_v1')) : 1,
    );
    const [profileNames, setProfileNames] = useState(() =>
        localStorage.getItem('heroProfileNames_v1')
            ? JSON.parse(localStorage.getItem('heroProfileNames_v1'))
            : DEFAULT_PROFILE_NAMES,
    );
    const [parentStatus, setParentStatus] = useState(() =>
        localStorage.getItem('heroParentStatus_v1')
            ? JSON.parse(localStorage.getItem('heroParentStatus_v1'))
            : DEFAULT_PARENT_STATUS,
    );
    const [skills, setSkills] = useState(() => loadSkills(currentProfile));
    const [activeTheme, setActiveTheme] = useState(() => loadTheme(currentProfile));
    const [stats, setStats] = useState(() => loadStats(currentProfile));
    const [selectedBorder, setSelectedBorder] = useState(() => {
        const saved = localStorage.getItem(`borderEffect_p${currentProfile}`);
        return saved || 'solid';
    });
    const [borderColor, setBorderColor] = useState(() => {
        const saved = localStorage.getItem(`borderColor_p${currentProfile}`);
        return saved || '#FFD700';
    });

    useEffect(() => {
        const dataToSave = { skills: skills, theme: activeTheme, stats: stats };
        localStorage.setItem(getStorageKey(currentProfile), JSON.stringify(dataToSave));
        localStorage.setItem('currentProfile_v1', currentProfile);
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNames));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatus));
    }, [skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);

    useEffect(() => {
        localStorage.setItem(`borderEffect_p${currentProfile}`, selectedBorder);
        localStorage.setItem(`borderColor_p${currentProfile}`, borderColor);
    }, [selectedBorder, borderColor, currentProfile]);

    const unlockedBorders = useMemo(() => {
        const unlockedBadges = new Set();
        const tierToBadge = ['Wood', 'Stone', 'Gold', 'Iron', 'Emerald', 'Diamond', 'Netherite', 'Obsidian'];

        Object.values(skills).forEach((skill) => {
            if (skill.earnedBadges && Array.isArray(skill.earnedBadges)) {
                skill.earnedBadges.forEach((tier) => {
                    if (tier >= 1 && tier <= 8) {
                        unlockedBadges.add(tierToBadge[tier - 1]);
                    }
                });
            }
            if (skill.level >= 180) {
                unlockedBadges.add('Star');
            }
        });
        return Array.from(unlockedBadges);
    }, [skills]);

    const unlockedAchievements = useMemo(() => {
        const unlocked = [];
        ACHIEVEMENT_IDS.forEach((id) => {
            if (isAchievementUnlocked(id, stats, skills)) {
                unlocked.push(id);
            }
        });
        return unlocked;
    }, [stats, skills]);

    return {
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
        getProfileStats: (profileId, liveSkills = null) => getProfileStats(profileId, liveSkills, activeTheme),
    };
}
