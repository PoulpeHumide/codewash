import ParentalVerificationModal from '../ui/ParentalVerificationModal';
import BattleOverlay from './BattleOverlay';
import SkillDifficultyControls from './SkillDifficultyControls';
import SkillCardFrame from './SkillCardFrame';
import {
    getDisplayMobNameWithAura,
    getSelectedBorderStyle,
    getSkillButtonStyle,
    getSkillCardSectionClasses,
    getSkillLevelStyle,
    getSkillMobAppearance,
} from '../../utils/skillCardPresentation';
import useSkillCardMiniGames from '../../hooks/minigames/useSkillCardMiniGames';

const SkillCard = ({
    config,
    data,
    themeData,
    isCenter,
    isBattling,
    mobName,
    mobAura,
    challenge,
    isListening,
    spokenText,
    damageNumbers,
    onStartBattle,
    onEndBattle,
    onMathSubmit,
    onMicClick,
    difficulty,
    setDifficulty,
    unlockedDifficulty,
    selectedBorder,
    borderColor,
    bossHealing,
}) => {
    const miniGames = useSkillCardMiniGames({
        config,
        challenge,
        isBattling,
        spokenText,
        damageNumbers,
        difficulty,
        onMathSubmit,
    });
    const { isHit, showParentalModal, setShowParentalModal, handleParentalVerified } = miniGames;

    // Calculate HP percentage based on mobHealth/mobMaxHealth for HP bar display
    const mobHealth = data.mobHealth || 100;
    const mobMaxHealth = data.mobMaxHealth || 100;
    const hpPercent = Math.round((mobHealth / mobMaxHealth) * 100);

    const { borderClass, levelTextColor } = getSkillLevelStyle(data.level);
    const { appliedBorderEffect, borderStyle } = getSelectedBorderStyle(isCenter, selectedBorder, borderColor);

    const skillThemeConfig = themeData.skills[config.id] || {};
    const skillName = skillThemeConfig.name || config.name;
    const { mobSrc, displayMobName } = getSkillMobAppearance(config.id, mobName, themeData.assets.mobs);
    const displayMobNameWithAura = getDisplayMobNameWithAura(isBattling, mobAura, displayMobName);
    const { topSectionBaseClass, bottomSectionClass } = getSkillCardSectionClasses(config.id, isBattling);
    const buttonStyle = getSkillButtonStyle(config.colorStyle);

    const isBattlingCenter = isBattling && isCenter;

    const cardContent = (
        <SkillCardFrame
            config={config}
            data={data}
            difficulty={difficulty}
            themeData={themeData}
            isCenter={isCenter}
            isBattling={isBattling}
            mobAura={mobAura}
            mobSrc={mobSrc}
            displayMobName={displayMobName}
            displayMobNameWithAura={displayMobNameWithAura}
            damageNumbers={damageNumbers}
            bossHealing={bossHealing}
            isHit={isHit}
            skillName={skillName}
            levelTextColor={levelTextColor}
            topSectionBaseClass={topSectionBaseClass}
            hpPercent={hpPercent}
            borderClass={borderClass}
            appliedBorderEffect={appliedBorderEffect}
            borderStyle={borderStyle}
            isBattlingCenter={isBattlingCenter}
            bottomSectionClass={bottomSectionClass}
            miniGames={miniGames}
            challenge={challenge}
            isListening={isListening}
            spokenText={spokenText}
            onMathSubmit={onMathSubmit}
            onMicClick={onMicClick}
            onStartBattle={onStartBattle}
            buttonStyle={buttonStyle}
        />
    );

    return (
        <>
            {isBattlingCenter ? (
                <BattleOverlay
                    config={config}
                    displayMobName={displayMobNameWithAura}
                    skillName={skillName}
                    levelTextColor={levelTextColor}
                    data={data}
                    onEndBattle={onEndBattle}
                >
                    {cardContent}
                </BattleOverlay>
            ) : (
                <div className="relative">
                    <SkillDifficultyControls
                        visible={
                            (!isBattling || config.id !== 'memory') &&
                            config.id !== 'cleaning' &&
                            unlockedDifficulty > 1
                        }
                        difficulty={difficulty}
                        unlockedDifficulty={unlockedDifficulty}
                        setDifficulty={setDifficulty}
                    />
                    {cardContent}
                </div>
            )}
            <ParentalVerificationModal
                isOpen={showParentalModal}
                onClose={() => setShowParentalModal(false)}
                onVerified={handleParentalVerified}
            />
        </>
    );
};

export default SkillCard;
