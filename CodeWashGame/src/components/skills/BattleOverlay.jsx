import ReactDOM from 'react-dom';
import BattleInfoPanel from './minigames/BattleInfoPanel';

const BattleOverlay = ({ config, displayMobName, skillName, levelTextColor, data, children, onEndBattle }) =>
    ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onEndBattle}>
            <div className="flex items-center justify-center relative" onClick={(event) => event.stopPropagation()}>
                <div
                    style={{
                        transform: 'scale(1.5)',
                        transformOrigin: 'center center',
                    }}
                >
                    {children}
                </div>
                {!['memory', 'cleaning'].includes(config.id) && (
                    <BattleInfoPanel
                        displayMobName={displayMobName}
                        skillName={skillName}
                        levelTextColor={levelTextColor}
                        level={data.level}
                        taskDescription={config.taskDescription}
                        fantasyName={config.fantasyName}
                    />
                )}
            </div>
        </div>,
        document.body,
    );

export default BattleOverlay;
