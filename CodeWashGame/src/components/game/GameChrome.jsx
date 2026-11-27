import { Bug, Maximize, Menu, Minimize, Settings, Sparkles } from 'lucide-react';
import CosmeticsDrawer from '../drawers/CosmeticsDrawer';
import MenuDrawer from '../drawers/MenuDrawer';
import SettingsDrawer from '../drawers/SettingsDrawer';
import ResetModal from '../modals/ResetModal';
import BugReportModal from '../modals/BugReportModal';
import PixelHeart from '../ui/PixelHeart';
import { playClick } from '../../utils/soundManager';

export default function GameChrome({
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
    bugReportContext,
    battlingSkillId,
    endBattle,
}) {
    return (
        <>
            <button
                onClick={() => {
                    setIsMenuOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsSettingsOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: '24px' }}
            >
                <Settings size={48} className="text-slate-400" />
            </button>
            <button
                onClick={() => {
                    setIsMenuOpen(false);
                    setIsSettingsOpen(false);
                    setIsCosmeticsOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }}
            >
                <Sparkles size={48} className="text-purple-400" />
            </button>

            <div
                className="absolute z-40 flex gap-1.5"
                style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}
            >
                {Array(10)
                    .fill(0)
                    .map((_, index) => (
                        <PixelHeart key={index} size={48} filled={index < playerHealth} />
                    ))}
            </div>

            {isCosmeticsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsCosmeticsOpen(false);
                        playClick();
                    }}
                />
            )}
            <CosmeticsDrawer
                isOpen={isCosmeticsOpen}
                activeTheme={activeTheme}
                setActiveTheme={handleThemeChange}
                selectedBorder={selectedBorder}
                setSelectedBorder={handleBorderChange}
                borderColor={borderColor}
                setBorderColor={setBorderColor}
                unlockedBorders={unlockedBorders}
                unlockedAchievements={unlockedAchievements}
            />

            {isSettingsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsSettingsOpen(false);
                        playClick();
                    }}
                />
            )}
            <SettingsDrawer
                isOpen={isSettingsOpen}
                onReset={() => setIsResetOpen(true)}
                bgmVol={bgmVol}
                setBgmVol={setBgmVol}
                sfxVol={sfxVol}
                setSfxVol={setSfxVolState}
                currentProfile={currentProfile}
                onSwitchProfile={handleSwitchProfile}
                profileNames={profileNames}
                onRenameProfile={handleRenameProfile}
                getProfileStats={getProfileStats}
                parentStatus={parentStatus}
                onParentVerified={handleParentVerified}
                currentSkills={skills}
            />
            <ResetModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />
            <BugReportModal
                isOpen={isBugReportOpen}
                onClose={() => setIsBugReportOpen(false)}
                context={bugReportContext}
            />

            <button
                onClick={toggleFullscreen}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
                {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
            </button>
            <button
                onClick={() => {
                    setIsSettingsOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsMenuOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: '24px' }}
            >
                <Menu size={48} />
            </button>

            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsMenuOpen(false);
                        playClick();
                    }}
                />
            )}
            <MenuDrawer isOpen={isMenuOpen} skills={skills} stats={stats} />

            <button
                onClick={() => {
                    setIsMenuOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsSettingsOpen(false);
                    setIsBugReportOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ bottom: '24px', right: '24px' }}
            >
                <Bug size={48} className="text-red-400" />
            </button>

            {battlingSkillId && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        minWidth: '100vw',
                        minHeight: '100vh',
                    }}
                    onClick={endBattle}
                />
            )}
        </>
    );
}
