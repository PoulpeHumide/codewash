import { useEffect, useMemo, useState } from 'react';
import { isAchievementUnlocked } from '../utils/achievementUtils';
import { getProfileStats, getStorageKey, loadSkills, loadStats, loadTheme } from '../utils/profileStorage';
import { browserStorage } from '../utils/storage/storageAdapter';
import {
    loadCurrentProfile,
    loadParentStatus,
    loadProfileNames,
    saveCurrentProfile,
    saveParentStatus,
    saveProfileNames,
} from '../utils/storage/profileRepository';

const ACHIEVEMENT_IDS = ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'];

export default function useProfileState() {
    const [currentProfile, setCurrentProfile] = useState(() => loadCurrentProfile(browserStorage));
    const [profileNames, setProfileNames] = useState(() => loadProfileNames(browserStorage));
    const [parentStatus, setParentStatus] = useState(() => loadParentStatus(browserStorage));
    const [skills, setSkills] = useState(() => loadSkills(currentProfile, browserStorage));
    const [activeTheme, setActiveTheme] = useState(() => loadTheme(currentProfile, browserStorage));
    const [stats, setStats] = useState(() => loadStats(currentProfile, browserStorage));
    const [selectedBorder, setSelectedBorder] = useState(() => {
        const saved = browserStorage.getItem(`borderEffect_p${currentProfile}`);
        return saved || 'solid';
    });
    const [borderColor, setBorderColor] = useState(() => {
        const saved = browserStorage.getItem(`borderColor_p${currentProfile}`);
        return saved || '#FFD700';
    });

    useEffect(() => {
        const dataToSave = { skills: skills, theme: activeTheme, stats: stats };
        browserStorage.writeJSON(getStorageKey(currentProfile), dataToSave);
        saveCurrentProfile(currentProfile, browserStorage);
        saveProfileNames(profileNames, browserStorage);
        saveParentStatus(parentStatus, browserStorage);
    }, [skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);

    useEffect(() => {
        browserStorage.setItem(`borderEffect_p${currentProfile}`, selectedBorder);
        browserStorage.setItem(`borderColor_p${currentProfile}`, borderColor);
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
