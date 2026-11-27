// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SkillCard from './SkillCard';
import { SKILL_DATA, THEME_CONFIG } from '../../constants/gameData';

const sound = vi.hoisted(() => ({ playClick: vi.fn(), getSfxVolume: vi.fn(() => 0.5) }));

vi.mock('../ui/SafeImage', () => ({ default: (props) => <img {...props} /> }));
vi.mock('../ui/MobWithAura', () => ({
    default: ({ displayName }) => <span>{displayName}</span>,
}));
vi.mock('../ui/ParentalVerificationModal', () => ({
    default: ({ isOpen, onClose, onVerified }) =>
        isOpen ? (
            <div>
                <button onClick={onVerified}>Verify parent</button>
                <button onClick={onClose}>Cancel parent</button>
            </div>
        ) : null,
}));
vi.mock('../../utils/soundManager', () => ({
    playClick: sound.playClick,
    getSfxVolume: sound.getSfxVolume,
}));

const challengeFor = (skillId) => {
    const challenges = {
        reading: { type: 'reading', question: 'CAT', answer: 'CAT' },
        math: { type: 'math', question: '2 + 2', answer: 4 },
        writing: { type: 'writing', question: 'Spell it!', answer: 'CAT', images: ['/cat.png'] },
        cleaning: { type: 'manual', question: 'Task Complete?', answer: 'yes' },
        memory: { type: 'memory', question: 'Find Pairs!', answer: 'WIN' },
        patterns: { type: 'patterns', question: 'Simon Says!', answer: 'WIN' },
    };
    return challenges[skillId];
};

const createProps = (skillId, overrides = {}) => ({
    config: SKILL_DATA.find((skill) => skill.id === skillId),
    data: {
        level: 1,
        xp: 0,
        difficulty: 1,
        mobHealth: 60,
        mobMaxHealth: 60,
        earnedBadges: [],
    },
    themeData: THEME_CONFIG.minecraft,
    isCenter: true,
    isBattling: true,
    mobName: 'Zombie',
    mobAura: null,
    challenge: challengeFor(skillId),
    isListening: false,
    spokenText: '',
    damageNumbers: [],
    onStartBattle: vi.fn(),
    onEndBattle: vi.fn(),
    onMathSubmit: vi.fn(),
    onMicClick: vi.fn(),
    difficulty: 1,
    setDifficulty: vi.fn(),
    unlockedDifficulty: 1,
    selectedBorder: 'default',
    borderColor: '#ffffff',
    bossHealing: false,
    ...overrides,
});

const renderCard = (skillId, overrides) => {
    const props = createProps(skillId, overrides);
    const result = render(<SkillCard {...props} />);
    return { ...result, props };
};

const getMemoryCards = () => [...document.body.querySelectorAll('div.cursor-pointer')];
const getMemoryFace = (card) => card.querySelectorAll('img')[1].getAttribute('src');

beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal(
        'Audio',
        class {
            volume = 1;
            play() {
                return Promise.resolve();
            }
        },
    );
});

afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('SkillCard mini-game characterization', () => {
    it('accepts math input, reports a wrong answer, and resets the error after its existing delay', () => {
        vi.useFakeTimers();
        const { props } = renderCard('math');
        const input = screen.getByRole('textbox');

        fireEvent.keyDown(input, { key: '9' });
        fireEvent.change(input, { target: { value: '9' } });
        expect(props.onMathSubmit).toHaveBeenCalledWith('WRONG');
        expect(input.disabled).toBe(true);

        act(() => vi.advanceTimersByTime(510));
        expect(input.disabled).toBe(false);
        expect(input.value).toBe('');

        fireEvent.keyDown(input, { key: '4' });
        fireEvent.change(input, { target: { value: '4' } });
        expect(props.onMathSubmit).toHaveBeenLastCalledWith('4');
    });

    it('normalizes writing input and clears its timed wrong-answer state', () => {
        vi.useFakeTimers();
        const { props } = renderCard('writing');
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'd o g' } });
        expect(input.disabled).toBe(true);
        act(() => vi.advanceTimersByTime(510));
        expect(input.disabled).toBe(false);
        expect(input.value).toBe('');

        fireEvent.change(input, { target: { value: 'c a t' } });
        expect(props.onMathSubmit).toHaveBeenCalledWith('CAT');
        expect(input.value).toBe('');
    });

    it('preserves spaces in multi-word writing prompts while normalizing the answer', () => {
        const { props } = renderCard('writing', {
            challenge: {
                type: 'writing',
                question: 'Spell it!',
                answer: 'RED STONE',
                images: ['/red.png', '/stone.png'],
            },
        });
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'red stone' } });

        expect(props.onMathSubmit).toHaveBeenCalledWith('REDSTONE');
        expect(document.body.textContent).toContain('+');
        expect(document.body.querySelector('.w-7')).not.toBeNull();
    });

    it('keeps reading feedback and microphone interaction in the current battle flow', () => {
        vi.useFakeTimers();
        const props = createProps('reading');
        const { rerender } = render(<SkillCard {...props} />);
        fireEvent.click(screen.getByRole('button', { name: 'Tap to Speak' }));
        expect(props.onMicClick).toHaveBeenCalledOnce();

        rerender(<SkillCard {...props} spokenText="WRONG" />);
        expect(document.body.querySelector('.border-red-500')).not.toBeNull();
        act(() => vi.advanceTimersByTime(500));
        expect(document.body.querySelector('.border-red-500')).toBeNull();

        rerender(<SkillCard {...props} spokenText="CAT" />);
        expect(document.body.querySelector('.border-red-500')).toBeNull();
    });

    it('requires parental verification before completing the cleaning challenge', () => {
        const { props } = renderCard('cleaning');
        fireEvent.click(screen.getByRole('button', { name: 'Complete!' }));
        expect(screen.getByRole('button', { name: 'Verify parent' })).not.toBeNull();
        expect(props.onMathSubmit).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Verify parent' }));
        expect(props.onMathSubmit).toHaveBeenCalledWith('yes');
    });

    it('keeps difficulty controls bounded by the current and unlocked levels', () => {
        const { props, container } = renderCard('reading', {
            isBattling: false,
            isCenter: false,
            difficulty: 1,
            unlockedDifficulty: 3,
        });
        const controls = container.querySelectorAll('.absolute.-top-10 button');

        fireEvent.click(controls[0]);
        fireEvent.click(controls[1]);
        expect(props.setDifficulty).toHaveBeenNthCalledWith(1, 1);
        expect(props.setDifficulty).toHaveBeenNthCalledWith(2, 2);
    });

    it('preserves the hit and healing animations on mob images', () => {
        vi.useFakeTimers();
        const props = createProps('reading', {
            isBattling: false,
            isCenter: false,
            bossHealing: true,
        });
        const { rerender, container } = render(<SkillCard {...props} />);
        expect(container.querySelector('img[alt="Zombie"]').className).toContain('animate-shake');
        expect(container.querySelector('img[alt="Zombie"]').className).toContain('brightness-150');

        rerender(<SkillCard {...props} bossHealing={false} damageNumbers={[{ id: 'hit', val: 2, x: 0, y: 0 }]} />);
        expect(container.querySelector('img[alt="Zombie"]').className).toContain('animate-knockback');

        act(() => vi.advanceTimersByTime(400));
        rerender(<SkillCard {...props} bossHealing={false} />);
        expect(container.querySelector('img[alt="Zombie"]').className).toContain('animate-bob');
    });

    it('matches memory pairs after the reveal delay and awards the win after the final pair', () => {
        vi.useFakeTimers();
        const { props } = renderCard('memory');

        for (const [face, count] of Object.entries(
            getMemoryCards().reduce((pairs, card) => {
                const src = getMemoryFace(card);
                pairs[src] = (pairs[src] || 0) + 1;
                return pairs;
            }, {}),
        )) {
            expect(count).toBe(2);
            const matchingCards = getMemoryCards().filter((card) => getMemoryFace(card) === face);
            fireEvent.click(matchingCards[0]);
            fireEvent.click(matchingCards[1]);
            act(() => vi.advanceTimersByTime(300));
        }

        expect(props.onMathSubmit).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(500));
        expect(props.onMathSubmit).toHaveBeenCalledWith('WIN');
    });

    it('shakes mismatched memory cards and resets the board after its existing delay', () => {
        vi.useFakeTimers();
        renderCard('memory');
        const cards = getMemoryCards();
        const firstCard = cards[0];
        const secondCard = cards.find((card) => getMemoryFace(card) !== getMemoryFace(firstCard));

        fireEvent.click(firstCard);
        fireEvent.click(secondCard);
        act(() => vi.advanceTimersByTime(300));
        expect(getMemoryCards().some((card) => card.className.includes('animate-shake-flipped'))).toBe(true);

        act(() => vi.advanceTimersByTime(500));
        expect(getMemoryCards().some((card) => card.className.includes('animate-shake-flipped'))).toBe(false);
    });

    it('plays Simon Says rounds, awards progressive damage, and ends on a wrong color', () => {
        vi.useFakeTimers();
        const { props } = renderCard('patterns');
        expect(screen.getByText('Watch!')).not.toBeNull();

        act(() => vi.advanceTimersByTime(1580));
        expect(screen.getByText('Your turn!')).not.toBeNull();
        fireEvent.click(screen.getByAltText('Pink'));
        expect(screen.getByText('Round: 1')).not.toBeNull();
        act(() => vi.advanceTimersByTime(300));
        expect(props.onMathSubmit).toHaveBeenCalledWith('WIN', 2);

        act(() => vi.advanceTimersByTime(3460));
        fireEvent.click(screen.getByAltText('Pink'));
        fireEvent.click(screen.getByAltText('Cyan'));
        expect(screen.getByText('Game Over! Rounds: 1')).not.toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(screen.getByText('Watch!')).not.toBeNull();
    });

    it('clears pending mini-game transitions when a battle ends', () => {
        vi.useFakeTimers();
        const memoryProps = createProps('memory');
        const { rerender, unmount } = render(<SkillCard {...memoryProps} />);
        const memoryCards = getMemoryCards();
        fireEvent.click(memoryCards[0]);
        fireEvent.click(memoryCards.find((card) => getMemoryFace(card) !== getMemoryFace(memoryCards[0])));
        expect(vi.getTimerCount()).toBeGreaterThan(0);

        rerender(<SkillCard {...memoryProps} isBattling={false} />);
        expect(vi.getTimerCount()).toBe(0);
        act(() => vi.advanceTimersByTime(1000));
        expect(memoryProps.onMathSubmit).not.toHaveBeenCalled();

        const simonProps = createProps('patterns');
        const simon = render(<SkillCard {...simonProps} />);
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        simon.unmount();
        expect(vi.getTimerCount()).toBe(0);
        unmount();
    });
});
