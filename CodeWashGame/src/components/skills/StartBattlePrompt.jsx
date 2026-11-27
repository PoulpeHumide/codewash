const StartBattlePrompt = ({ config, buttonStyle, onStartBattle }) => (
    <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-400 text-center mb-4 px-2">{config.taskDescription}</p>
        <button
            onClick={onStartBattle}
            style={buttonStyle}
            className="w-full text-white text-3xl font-bold py-6 rounded-lg active:shadow-none active:translate-y-[6px] transition-all border-2 uppercase tracking-wider"
        >
            {config.actionName}
        </button>
    </div>
);

export default StartBattlePrompt;
