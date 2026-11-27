import { getMobForSkill } from '../../utils/gameUtils';
import { playActionCardLeft, playActionCardRight } from '../../utils/soundManager';
import SafeImage from '../ui/SafeImage';
import SkillCard from '../skills/SkillCard';

const getVerticalOffset = (offset) => {
    if (offset === 0) return -55;
    if (Math.abs(offset) === 1) return -30;
    if (Math.abs(offset) === 2) return 20;
    return 75;
};

const getCardRotation = (offset) => {
    if (Math.abs(offset) === 3) return -12;
    if (Math.abs(offset) === 2) return -8;
    if (Math.abs(offset) === 1) return -4;
    return 0;
};

const getCardOpacity = (offset) => {
    if (offset === 0) return 1;
    if (Math.abs(offset) === 3) return 0;
    if (Math.abs(offset) === 2) return 0.3;
    return 0.6;
};

const getCardStyle = (item, translateY, rotateX, isItemBattling, battlingSkillId) => ({
    transform: `translateX(${item.offset * 320}px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${item.offset === 0 ? 1.1 : 0.85})`,
    opacity: getCardOpacity(item.offset),
    zIndex: isItemBattling ? 50 : item.offset === 0 ? 20 : 10 - Math.abs(item.offset),
    filter: item.offset === 0 ? 'none' : 'brightness(0.5) blur(1px)',
    cursor: item.offset !== 0 && !battlingSkillId ? 'pointer' : 'default',
    transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
});

const handleCardClick = (offset, battlingSkillId, setSelectedIndex) => {
    if (battlingSkillId || offset === 0) return;
    setSelectedIndex((previous) => previous + offset);
    if (offset > 0) {
        playActionCardRight();
    } else {
        playActionCardLeft();
    }
};

export default function SkillCarousel({
    currentThemeData,
    setSelectedIndex,
    isDragging,
    battlingSkillId,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    getVisibleItems,
    skills,
    getAuraForSkill,
    challengeData,
    isListening,
    spokenText,
    damageNumbers,
    startBattle,
    endBattle,
    handleSuccessHit,
    toggleMicListener,
    setSkillDifficulty,
    selectedBorder,
    borderColor,
    bossHealing,
}) {
    return (
        <main className="flex-1 relative flex flex-col items-center justify-center w-full">
            <div className="z-10 relative mb-[-30px] md:mb-[-50px] pointer-events-none opacity-90">
                <SafeImage
                    src={currentThemeData.assets.logo}
                    fallbackSrc="https://placehold.co/800x300/333/FFD700?text=LOGO+PLACEHOLDER&font=monsterrat"
                    alt="Game Logo"
                    className="w-[480px] md:w-[720px] lg:w-[960px] object-contain drop-shadow-2xl"
                />
            </div>
            <h1
                className="text-9xl text-yellow-400 tracking-widest uppercase mt-[-20px] mb-[95px] z-20 relative drop-shadow-[4px_4px_0_#000]"
                style={{ textShadow: '6px 6px 0 #000' }}
            >
                Level Up!
            </h1>

            <button
                onClick={() => {
                    setSelectedIndex((previous) => previous - 1);
                    playActionCardLeft();
                }}
                className="flex absolute left-0 z-30 items-center justify-center h-full"
                style={{
                    background: 'linear-gradient(to right, rgba(100, 100, 100, 0.6), transparent)',
                    width: '80px',
                    padding: '0',
                }}
            >
                <svg
                    width="60"
                    height="450"
                    viewBox="0 0 60 450"
                    className="animate-chevron-left"
                    style={{ opacity: 0.8 }}
                >
                    <path
                        d="M 50 25 Q 15 225 50 425"
                        stroke="rgba(150, 150, 150, 0.9)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>
            </button>

            <button
                onClick={() => {
                    setSelectedIndex((previous) => previous + 1);
                    playActionCardRight();
                }}
                className="flex absolute right-0 z-30 items-center justify-center h-full"
                style={{
                    background: 'linear-gradient(to left, rgba(100, 100, 100, 0.6), transparent)',
                    width: '80px',
                    padding: '0',
                }}
            >
                <svg
                    width="60"
                    height="450"
                    viewBox="0 0 60 450"
                    className="animate-chevron-right"
                    style={{ opacity: 0.8 }}
                >
                    <path
                        d="M 10 25 Q 45 225 10 425"
                        stroke="rgba(150, 150, 150, 0.9)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>
            </button>
            <div
                className={`relative w-full flex items-center justify-center perspective-1000 h-[650px] mb-12 ${battlingSkillId ? 'z-50' : ''}`}
                style={{ cursor: battlingSkillId ? 'default' : isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={(event) => handleDragStart(event.clientX)}
                onMouseMove={(event) => handleDragMove(event.clientX)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
                onTouchMove={(event) => {
                    event.preventDefault();
                    handleDragMove(event.touches[0].clientX);
                }}
                onTouchEnd={handleDragEnd}
            >
                {getVisibleItems().map((item) => {
                    const isItemBattling = item.offset === 0 && battlingSkillId === item.id;
                    const translateY = getVerticalOffset(item.offset);
                    const rotateX = getCardRotation(item.offset);

                    return (
                        <div
                            key={item.key}
                            className="absolute transition-all duration-500 ease-out"
                            style={getCardStyle(item, translateY, rotateX, isItemBattling, battlingSkillId)}
                            onClick={() => handleCardClick(item.offset, battlingSkillId, setSelectedIndex)}
                        >
                            <SkillCard
                                config={item}
                                data={skills[item.id]}
                                themeData={currentThemeData}
                                isCenter={item.offset === 0}
                                isBattling={item.offset === 0 && battlingSkillId === item.id}
                                mobName={getMobForSkill(item, skills[item.id])}
                                mobAura={getAuraForSkill(item, skills[item.id])}
                                challenge={challengeData}
                                isListening={isListening}
                                spokenText={spokenText}
                                damageNumbers={damageNumbers.filter((damage) => damage.skillId === item.id)}
                                onStartBattle={() => startBattle(item.id)}
                                onEndBattle={endBattle}
                                onMathSubmit={(value) => handleSuccessHit(item.id, value)}
                                onMicClick={() => toggleMicListener(item.id)}
                                difficulty={skills[item.id].difficulty || 1}
                                setDifficulty={(newDifficulty) => setSkillDifficulty(item.id, newDifficulty)}
                                unlockedDifficulty={Math.min(7, Math.floor(skills[item.id].level / 20) + 1)}
                                selectedBorder={selectedBorder}
                                borderColor={borderColor}
                                bossHealing={bossHealing === item.id}
                            />
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
