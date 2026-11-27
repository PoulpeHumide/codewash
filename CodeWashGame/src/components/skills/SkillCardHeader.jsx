import SkillMobImage from './SkillMobImage';

const SkillCardHeader = ({
    config,
    data,
    isBattling,
    mobAura,
    mobSrc,
    displayMobName,
    displayMobNameWithAura,
    damageNumbers,
    isHit,
    bossHealing,
    skillName,
    levelTextColor,
    topSectionBaseClass,
}) => (
    <div className={topSectionBaseClass} style={config.colorStyle}>
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        {!isBattling && (
            <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white border border-white/20 z-20">
                <div className="text-xs text-gray-400 uppercase">{skillName}</div>
                <div className="text-lg leading-none">{config.fantasyName}</div>
            </div>
        )}
        {!isBattling && (
            <div className="absolute top-2 right-2 z-20">
                <div
                    className={`bg-black/60 px-3 py-1 rounded border border-white/20 text-3xl font-bold ${levelTextColor}`}
                >
                    Lvl {data.level}
                </div>
            </div>
        )}
        {(!isBattling || config.id !== 'memory') && (
            <div className="relative z-10 flex items-center justify-center h-full max-h-[200px] w-full">
                <SkillMobImage
                    mobAura={mobAura}
                    mobSrc={mobSrc}
                    displayName={displayMobNameWithAura}
                    isHit={isHit}
                    bossHealing={bossHealing}
                />
                {damageNumbers.map((dmg) => (
                    <div
                        key={dmg.id}
                        className="absolute text-5xl font-bold text-red-500 animate-bounce pointer-events-none whitespace-nowrap"
                        style={{
                            left: `calc(50% + ${dmg.x}px)`,
                            top: `calc(50% + ${dmg.y}px)`,
                            textShadow: '2px 2px 0 #000',
                        }}
                    >
                        -{dmg.val}
                    </div>
                ))}
            </div>
        )}
        {config.id !== 'memory' && !isBattling && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-2 rounded-full text-white border-2 border-white/30 text-xl font-bold tracking-wide z-10 shadow-lg whitespace-nowrap min-w-max">
                {displayMobName}
            </div>
        )}
    </div>
);

export default SkillCardHeader;
