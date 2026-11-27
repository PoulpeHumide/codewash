import { calculateMobHealth } from '../utils/gameUtils';
import { getStorageKey } from '../utils/profileStorage';
import { playClick } from '../utils/soundManager';

const PARENT_PRIVILEGE_LEVEL = 200;
const PARENT_PRIVILEGE_DIFFICULTY = 7;
const PARENT_PRIVILEGE_BADGES = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_PROFILE_NAMES = { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
const DEFAULT_PARENT_STATUS = { 1: false, 2: false, 3: false };

export default function createProfileActions({
    currentProfile,
    setCurrentProfile,
    setSkills,
    setActiveTheme,
    setProfileNames,
    setParentStatus,
    loadSkills,
    loadTheme,
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
        localStorage.removeItem(getStorageKey(currentProfile));
        if (currentProfile === 1) localStorage.removeItem('heroSkills_v23');

        const currentParentStatus = localStorage.getItem('heroParentStatus_v1');
        const parentStatus = currentParentStatus ? JSON.parse(currentParentStatus) : DEFAULT_PARENT_STATUS;
        parentStatus[currentProfile] = false;
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatus));

        const currentProfileNames = localStorage.getItem('heroProfileNames_v1');
        const profileNames = currentProfileNames ? JSON.parse(currentProfileNames) : DEFAULT_PROFILE_NAMES;
        profileNames[currentProfile] = `Player ${currentProfile}`;
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNames));

        reload();
    };

    return { handleSwitchProfile, handleRenameProfile, handleParentVerified, handleReset };
}
