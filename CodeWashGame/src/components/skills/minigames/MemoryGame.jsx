import SafeImage from '../../ui/SafeImage';

const MemoryGame = ({ cards, cardBack, flippedIndices, matchedPairs, mismatchShake, gridCols, onCardClick }) => (
    <div
        className="flex-1 grid gap-2 bg-black/20 p-2 rounded items-center"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
    >
        {cards.map((card, index) => {
            const isFlipped = flippedIndices.includes(index);
            const isMatched = matchedPairs.includes(card.color);
            if (isMatched) return <div key={card.id} className="w-full aspect-[2/3]"></div>;
            return (
                <div
                    key={card.id}
                    onClick={() => onCardClick(index)}
                    className={`w-full aspect-[2/3] cursor-pointer transition-all duration-300 perspective-1000 relative transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} ${mismatchShake && isFlipped ? 'animate-shake-flipped border-red-500' : ''}`}
                >
                    <div
                        className="absolute inset-0 backface-hidden w-full h-full"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <SafeImage
                            src={cardBack}
                            className="w-full h-full object-cover rounded border border-stone-600"
                        />
                    </div>
                    <div
                        className="absolute inset-0 backface-hidden w-full h-full rotate-y-180 bg-slate-800 rounded border border-white/20 flex items-center justify-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <SafeImage src={card.img} className="w-full h-full object-contain p-1" />
                    </div>
                </div>
            );
        })}
    </div>
);

export default MemoryGame;
