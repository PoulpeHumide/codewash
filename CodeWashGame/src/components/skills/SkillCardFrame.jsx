import BattleGame from './minigames/BattleGame';
import SkillCardHeader from './SkillCardHeader';
import SkillCardHealthBar from './SkillCardHealthBar';
import StartBattlePrompt from './StartBattlePrompt';

const SkillCardFrame = ({
    config,
    data,
    difficulty,
    themeData,
    isCenter,
    isBattling,
    mobAura,
    mobSrc,
    displayMobName,
    displayMobNameWithAura,
    damageNumbers,
    bossHealing,
    isHit,
    skillName,
    levelTextColor,
    topSectionBaseClass,
    hpPercent,
    borderClass,
    appliedBorderEffect,
    borderStyle,
    isBattlingCenter,
    bottomSectionClass,
    miniGames,
    challenge,
    isListening,
    spokenText,
    onMathSubmit,
    onMicClick,
    onStartBattle,
    buttonStyle,
}) => (
    <div
        className={`bg-[#2b2b2b] border-4 rounded-lg overflow-visible flex flex-col transition-all duration-500 ${isCenter ? `${appliedBorderEffect} ${!appliedBorderEffect ? borderClass : ''}` : 'border-stone-700'} w-[300px] h-[600px] ${!isBattlingCenter ? 'relative' : ''}`}
        style={isCenter ? borderStyle : {}}
    >
        {isCenter && data.level >= 20 && (
            <div className="gem-socket">
                <div className="gem-stone" style={{}}></div>
            </div>
        )}
        <SkillCardHeader
            config={config}
            data={data}
            isBattling={isBattling}
            mobAura={mobAura}
            mobSrc={mobSrc}
            displayMobName={displayMobName}
            displayMobNameWithAura={displayMobNameWithAura}
            damageNumbers={damageNumbers}
            isHit={isHit}
            bossHealing={bossHealing}
            skillName={skillName}
            levelTextColor={levelTextColor}
            topSectionBaseClass={topSectionBaseClass}
        />
        {(!isBattling || config.id !== 'memory') && <SkillCardHealthBar hpPercent={hpPercent} />}
        <div className={bottomSectionClass}>
            {isBattling ? (
                <BattleGame
                    config={config}
                    data={data}
                    difficulty={difficulty}
                    challenge={challenge}
                    themeData={themeData}
                    miniGames={miniGames}
                    isListening={isListening}
                    spokenText={spokenText}
                    onMathSubmit={onMathSubmit}
                    onMicClick={onMicClick}
                />
            ) : (
                <StartBattlePrompt config={config} buttonStyle={buttonStyle} onStartBattle={onStartBattle} />
            )}
        </div>
    </div>
);

export default SkillCardFrame;
