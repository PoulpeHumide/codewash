// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SkillCarousel from './SkillCarousel';
import { playActionCardLeft, playActionCardRight } from '../../utils/soundManager';

vi.mock('../../utils/gameUtils', () => ({ getMobForSkill: () => 'Test Mob' }));
vi.mock('../../utils/soundManager', () => ({
    playActionCardLeft: vi.fn(),
    playActionCardRight: vi.fn(),
}));
vi.mock('../ui/SafeImage', () => ({ default: (props) => <img {...props} /> }));
vi.mock('../skills/SkillCard', () => ({
    default: ({ config, onStartBattle, onEndBattle, onMathSubmit, onMicClick, setDifficulty }) => (
        <div data-testid={`card-${config.id}`}>
            <button onClick={onStartBattle}>Start {config.id}</button>
            <button onClick={onEndBattle}>End {config.id}</button>
            <button onClick={() => onMathSubmit('success')}>Submit {config.id}</button>
            <button onClick={onMicClick}>Mic {config.id}</button>
            <button onClick={() => setDifficulty(3)}>Difficulty {config.id}</button>
        </div>
    ),
}));

const makeItems = () =>
    [-3, -2, -1, 0, 1, 2, 3].map((offset) => ({
        id: `skill${offset}`,
        key: `skill${offset}`,
        offset,
    }));

const createProps = (overrides = {}) => {
    const items = makeItems();
    return {
        currentThemeData: { assets: { logo: '/logo.png' } },
        setSelectedIndex: vi.fn(),
        isDragging: false,
        battlingSkillId: null,
        handleDragStart: vi.fn(),
        handleDragMove: vi.fn(),
        handleDragEnd: vi.fn(),
        getVisibleItems: () => items,
        skills: Object.fromEntries(items.map(({ id }, index) => [id, { level: index * 20 + 1, difficulty: 2 }])),
        getAuraForSkill: vi.fn(() => 'glow'),
        challengeData: {},
        isListening: false,
        spokenText: '',
        damageNumbers: [{ skillId: 'skill0' }, { skillId: 'other' }],
        startBattle: vi.fn(),
        endBattle: vi.fn(),
        handleSuccessHit: vi.fn(),
        toggleMicListener: vi.fn(),
        setSkillDifficulty: vi.fn(),
        selectedBorder: 'default',
        borderColor: '#ffffff',
        bossHealing: null,
        ...overrides,
    };
};

afterEach(cleanup);

describe('SkillCarousel', () => {
    it('renders carousel cards and supports navigation, card actions, and pointer/touch dragging', () => {
        const props = createProps();
        const { container } = render(<SkillCarousel {...props} />);
        expect(screen.getByRole('heading', { name: 'Level Up!' })).not.toBeNull();
        expect(screen.getAllByRole('img')).toHaveLength(1);
        expect(screen.getAllByTestId(/^card-skill/)).toHaveLength(7);

        const navigationButtons = container.querySelectorAll('main > button');
        fireEvent.click(navigationButtons[0]);
        fireEvent.click(navigationButtons[1]);
        expect(props.setSelectedIndex).toHaveBeenNthCalledWith(1, expect.any(Function));
        expect(props.setSelectedIndex).toHaveBeenNthCalledWith(2, expect.any(Function));
        fireEvent.click(screen.getByTestId('card-skill1'));
        fireEvent.click(screen.getByTestId('card-skill-1'));
        expect(props.setSelectedIndex).toHaveBeenCalledTimes(4);
        expect(playActionCardRight).toHaveBeenCalled();
        expect(playActionCardLeft).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Start skill0'));
        fireEvent.click(screen.getByText('End skill0'));
        fireEvent.click(screen.getByText('Submit skill0'));
        fireEvent.click(screen.getByText('Mic skill0'));
        fireEvent.click(screen.getByText('Difficulty skill0'));
        expect(props.startBattle).toHaveBeenCalledWith('skill0');
        expect(props.endBattle).toHaveBeenCalledOnce();
        expect(props.handleSuccessHit).toHaveBeenCalledWith('skill0', 'success');
        expect(props.toggleMicListener).toHaveBeenCalledWith('skill0');
        expect(props.setSkillDifficulty).toHaveBeenCalledWith('skill0', 3);

        const carousel = container.querySelector('.perspective-1000');
        fireEvent.mouseDown(carousel, { clientX: 10 });
        fireEvent.mouseMove(carousel, { clientX: 20 });
        fireEvent.mouseUp(carousel);
        fireEvent.mouseLeave(carousel);
        fireEvent.touchStart(carousel, { touches: [{ clientX: 30 }] });
        fireEvent.touchMove(carousel, { touches: [{ clientX: 40 }] });
        fireEvent.touchEnd(carousel);
        expect(props.handleDragStart).toHaveBeenCalledWith(10);
        expect(props.handleDragStart).toHaveBeenCalledWith(30);
        expect(props.handleDragMove).toHaveBeenCalledWith(20);
        expect(props.handleDragMove).toHaveBeenCalledWith(40);
        expect(props.handleDragEnd).toHaveBeenCalled();
    });

    it('prevents side-card navigation while a battle is active', () => {
        const props = createProps({ battlingSkillId: 'skill0' });
        const { container } = render(<SkillCarousel {...props} />);
        fireEvent.click(screen.getByTestId('card-skill1'));
        expect(props.setSelectedIndex).not.toHaveBeenCalled();
        expect(container.querySelector('.perspective-1000').style.cursor).toBe('default');
    });
});
