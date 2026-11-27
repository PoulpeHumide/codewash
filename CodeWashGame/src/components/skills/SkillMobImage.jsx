import SafeImage from '../ui/SafeImage';
import MobWithAura from '../ui/MobWithAura';

const SkillMobImage = ({ mobAura, mobSrc, displayName, isHit, bossHealing }) =>
    mobAura ? (
        <MobWithAura
            mobSrc={mobSrc}
            aura={mobAura}
            displayName={displayName}
            size="100%"
            isHit={isHit}
            bossHealing={bossHealing}
        />
    ) : (
        <SafeImage
            key={displayName}
            src={mobSrc}
            alt={displayName}
            className={`
                relative z-10
                max-w-full max-h-full
                object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-transform duration-100 
                ${isHit ? 'animate-knockback' : bossHealing ? 'animate-shake' : 'animate-bob'} 
                ${bossHealing ? 'brightness-150 hue-rotate-90' : ''}
            `}
        />
    );

export default SkillMobImage;
