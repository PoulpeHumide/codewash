import ChallengeGame from './ChallengeGame';
import MemoryGame from './MemoryGame';
import SimonGame from './SimonGame';
import BattleExperience from './BattleExperience';

const BattleGame = ({
    config,
    data,
    difficulty,
    challenge,
    themeData,
    miniGames,
    isListening,
    spokenText,
    onMathSubmit,
    onMicClick,
}) => (
    <div className="flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">
        {config.id === 'memory' ? (
            <MemoryGame
                cards={miniGames.memoryCards}
                cardBack={themeData.assets.cardBack}
                flippedIndices={miniGames.flippedIndices}
                matchedPairs={miniGames.matchedPairs}
                mismatchShake={miniGames.mismatchShake}
                gridCols={miniGames.memoryGridCols}
                onCardClick={miniGames.handleCardClick}
            />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
                {config.id === 'patterns' ? (
                    <SimonGame
                        colors={miniGames.axolotlColors}
                        completedRounds={miniGames.completedRounds}
                        isShowingSequence={miniGames.isShowingSequence}
                        simonGameActive={miniGames.simonGameActive}
                        litAxolotl={miniGames.litAxolotl}
                        onAxolotlClick={miniGames.handleAxolotlClick}
                        onRetry={miniGames.startSimonGame}
                    />
                ) : (
                    <ChallengeGame
                        challenge={challenge}
                        challengeType={config.challengeType}
                        inputRef={miniGames.inputRef}
                        readingWordRef={miniGames.readingWordRef}
                        mathInput={miniGames.mathInput}
                        isWrong={miniGames.isWrong}
                        isReadingWrong={miniGames.isReadingWrong}
                        spokenText={spokenText}
                        isListening={isListening}
                        onMathInput={miniGames.handleMathInput}
                        onWritingInput={miniGames.handleWritingInput}
                        onMicClick={onMicClick}
                        onCleaningComplete={() => miniGames.setShowParentalModal(true)}
                        onManualSuccess={() => onMathSubmit(challenge?.answer)}
                    />
                )}
            </div>
        )}
        <BattleExperience difficulty={difficulty} level={data.level} xp={data.xp} />
    </div>
);

export default BattleGame;
