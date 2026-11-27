import { calculateMobHealth } from '../utils/gameUtils';
import { getStorageKey } from '../utils/profileStorage';
import { playClick } from '../utils/soundManager';
import { browserStorage } from '../utils/storage/storageAdapter';
import {
    loadParentStatus,
    loadProfileNames,
    saveParentStatus,
    saveProfileNames,
} from '../utils/storage/profileRepository';

const PARENT_PRIVILEGE_LEVEL = 200;
const PARENT_PRIVILEGE_DIFFICULTY = 7;
const PARENT_PRIVILEGE_BADGES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function createProfileActions({
    currentProfile,
    setCurrentProfile,
    setSkills,
    setActiveTheme,
    setProfileNames,
    setParentStatus,
    loadSkills,
    loadTheme,
    storage = browserStorage,
    reload = () => window.location.reload(),
}) {
    const handleSwitchProfile = (newId) => {
        if (newId === currentProfile) return;
        playClick();
        const newSkills = loadSkills(newId);
        const newTheme = loadTheme(newId);
        setSkills(newSkills);
        setActiveTheme(newTheme);
        setCurrentProfile(newId);
    };

    const handleRenameProfile = (id, newName) => {
        setProfileNames((previous) => ({ ...previous, [id]: newName }));
    };

    const handleParentVerified = (profileId, verified) => {
        setParentStatus((previous) => ({ ...previous, [profileId]: verified }));

        if (verified && profileId === currentProfile) {
            setSkills((previous) => {
                const updated = {};
                Object.keys(previous).forEach((skillId) => {
                    const current = previous[skillId];
                    updated[skillId] = {
                        ...current,
                        level: PARENT_PRIVILEGE_LEVEL,
                        difficulty: PARENT_PRIVILEGE_DIFFICULTY,
                        earnedBadges: [...PARENT_PRIVILEGE_BADGES],
                        mobHealth: calculateMobHealth(PARENT_PRIVILEGE_DIFFICULTY, PARENT_PRIVILEGE_LEVEL),
                        mobMaxHealth: calculateMobHealth(PARENT_PRIVILEGE_DIFFICULTY, PARENT_PRIVILEGE_LEVEL),
                    };
                });
                return updated;
            });

            setTimeout(() => {
                setSkills((current) => ({ ...current }));
            }, 0);
        }
    };

    const handleReset = () => {
        storage.removeItem(getStorageKey(currentProfile));
        if (currentProfile === 1) storage.removeItem('heroSkills_v23');

        const parentStatus = loadParentStatus(storage);
        parentStatus[currentProfile] = false;
        saveParentStatus(parentStatus, storage);

        const profileNames = loadProfileNames(storage);
        profileNames[currentProfile] = `Player ${currentProfile}`;
        saveProfileNames(profileNames, storage);

        reload();
    };

    return { handleSwitchProfile, handleRenameProfile, handleParentVerified, handleReset };
}
