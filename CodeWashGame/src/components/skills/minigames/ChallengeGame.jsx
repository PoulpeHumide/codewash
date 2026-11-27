import React from 'react';
import { Mic } from 'lucide-react';
import SafeImage from '../../ui/SafeImage';

const WritingPrompt = ({ images }) => (
    <div className="flex items-center justify-center gap-2">
        {images?.map((img, idx) => (
            <React.Fragment key={idx}>
                {idx > 0 && <span className="text-3xl text-yellow-400 font-bold">+</span>}
                <SafeImage src={img} className="w-24 h-24 object-contain animate-bob" />
            </React.Fragment>
        ))}
    </div>
);

const QuestionPrompt = ({ question, readingWordRef }) => (
    <span
        ref={readingWordRef}
        className="text-white font-bold tracking-wider px-2"
        style={{
            fontSize: 'clamp(1rem, 8vw, 2.5rem)',
            maxWidth: '100%',
            wordBreak: 'break-word',
            textAlign: 'center',
            lineHeight: '1.2',
        }}
    >
        {question?.replace('Write: ', '') || ''}
    </span>
);

const ReadingPromptStatus = ({ isReadingWrong, spokenText, isListening }) => (
    <div className={`absolute bottom-1 text-xs ${isReadingWrong ? 'text-red-400' : 'text-gray-400'}`}>
        {spokenText || (isListening ? 'Listening...' : 'Mic Off')}
    </div>
);

const ChallengePrompt = ({ challenge, challengeType, readingWordRef, spokenText, isListening, isReadingWrong }) => (
    <div
        className={`flex-1 bg-black/40 rounded border-2 flex items-center justify-center mb-3 p-2 relative overflow-hidden w-full ${isReadingWrong ? 'border-red-500 bg-red-900/30 animate-shake' : 'border-[#555]'}`}
    >
        {challengeType === 'writing' ? (
            <WritingPrompt images={challenge?.images} />
        ) : (
            <QuestionPrompt question={challenge?.question} readingWordRef={readingWordRef} />
        )}
        {challengeType === 'reading' && (
            <ReadingPromptStatus isReadingWrong={isReadingWrong} spokenText={spokenText} isListening={isListening} />
        )}
    </div>
);

const MathAnswer = ({ answer, inputRef, value, isWrong, onChange }) => (
    <div className="relative w-full flex justify-center">
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            autoFocus
            maxLength={String(answer).length}
            disabled={isWrong}
        />
        <div className={`flex gap-2 ${isWrong ? 'animate-shake' : ''}`}>
            {String(answer)
                .split('')
                .map((char, index) => (
                    <div
                        key={index}
                        className={`w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : index < value.length ? 'border-green-500' : 'border-gray-600'}`}
                    >
                        {value[index] || ''}
                    </div>
                ))}
        </div>
    </div>
);

const WritingAnswer = ({ answer, inputRef, value, isWrong, onChange }) => {
    const answerNoSpaces = answer.replace(/\s/g, '');
    const answerLength = answerNoSpaces.length;

    return (
        <div className="relative w-full flex justify-center">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                autoFocus
                maxLength={answerLength}
                disabled={isWrong}
            />
            <div className={`flex gap-1 flex-wrap justify-center ${isWrong ? 'animate-shake' : ''}`}>
                {answer.split('').map((char, index) => {
                    if (char === ' ') {
                        return <div key={index} className={`${answerLength > 6 ? 'w-7' : 'w-10'}`}></div>;
                    }
                    let inputIndex = 0;
                    for (let charIndex = 0; charIndex < index; charIndex++) {
                        if (answer[charIndex] !== ' ') inputIndex++;
                    }
                    return (
                        <div
                            key={index}
                            className={`${answerLength > 6 ? 'w-7 h-9 text-lg' : 'w-10 h-12 text-2xl'} border-b-4 flex items-center justify-center font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : inputIndex < value.length ? 'border-green-500' : 'border-gray-600'}`}
                        >
                            {value[inputIndex] || ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ChallengeActions = ({ challengeType, isListening, onMicClick, onCleaningComplete, onManualSuccess }) => (
    <>
        {challengeType === 'reading' && (
            <button
                onClick={onMicClick}
                className={`w-full text-center p-2 rounded border-2 transition-colors flex items-center justify-center gap-2 ${isListening ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:bg-white/10'}`}
            >
                {isListening ? (
                    <Mic className="inline animate-pulse text-red-500" />
                ) : (
                    <>
                        <Mic className="inline text-gray-500" />
                        <span className="text-xs uppercase font-bold text-stone-400">Tap to Speak</span>
                    </>
                )}
            </button>
        )}
        {challengeType === 'cleaning' && (
            <button
                onClick={onCleaningComplete}
                className="w-full bg-green-600 hover:bg-green-500 text-white text-3xl font-bold py-4 rounded shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-[4px] transition-all"
            >
                Complete!
            </button>
        )}
        {challengeType !== 'cleaning' && challengeType !== 'writing' && challengeType !== 'math' && (
            <button
                onClick={onManualSuccess}
                className="mt-auto text-xs text-gray-500 underline hover:text-white self-center"
            >
                Skip / Manual Success
            </button>
        )}
    </>
);

const ChallengeGame = ({
    challenge,
    challengeType,
    inputRef,
    readingWordRef,
    mathInput,
    isWrong,
    isReadingWrong,
    spokenText,
    isListening,
    onMathInput,
    onWritingInput,
    onMicClick,
    onCleaningComplete,
    onManualSuccess,
}) => (
    <div className="flex-1 flex flex-col items-center justify-center">
        <ChallengePrompt
            challenge={challenge}
            challengeType={challengeType}
            readingWordRef={readingWordRef}
            spokenText={spokenText}
            isListening={isListening}
            isReadingWrong={isReadingWrong}
        />
        {challengeType === 'math' && (
            <MathAnswer
                answer={challenge?.answer}
                inputRef={inputRef}
                value={mathInput}
                isWrong={isWrong}
                onChange={onMathInput}
            />
        )}
        {challengeType === 'writing' && (
            <WritingAnswer
                answer={challenge?.answer}
                inputRef={inputRef}
                value={mathInput}
                isWrong={isWrong}
                onChange={onWritingInput}
            />
        )}
        <ChallengeActions
            challengeType={challengeType}
            isListening={isListening}
            onMicClick={onMicClick}
            onCleaningComplete={onCleaningComplete}
            onManualSuccess={onManualSuccess}
        />
    </div>
);

export default ChallengeGame;
