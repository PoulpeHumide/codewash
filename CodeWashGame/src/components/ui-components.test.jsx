// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BugReportModal from './modals/BugReportModal';
import ResetModal from './modals/ResetModal';
import CosmeticsDrawer from './drawers/CosmeticsDrawer';
import MenuDrawer from './drawers/MenuDrawer';
import ProfileCard from './profile/ProfileCard';
import AchievementToast from './ui/AchievementToast';
import MobWithAura from './ui/MobWithAura';
import ParentalVerificationModal from './ui/ParentalVerificationModal';
import PixelHeart from './ui/PixelHeart';
import SafeImage from './ui/SafeImage';

afterEach(cleanup);

describe('reset confirmation modal', () => {
    it('requires the current confirmation word and resets its input on close', () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        const { rerender } = render(<ResetModal isOpen={false} onClose={onClose} onConfirm={onConfirm} />);
        expect(document.body.textContent).not.toContain('Delete Progress?');

        rerender(<ResetModal isOpen onClose={onClose} onConfirm={onConfirm} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'wrong' } });
        fireEvent.submit(input.closest('form'));
        expect(screen.getByText('Please type DELETE to confirm.')).not.toBeNull();
        expect(onConfirm).not.toHaveBeenCalled();

        fireEvent.change(input, { target: { value: 'delete' } });
        expect(screen.getByRole('button', { name: 'Delete' }).disabled).toBe(false);
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(onConfirm).toHaveBeenCalledOnce();
        expect(input.value).toBe('');

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledOnce();
    });
});

describe('profile card interactions', () => {
    it('switches profiles and persists the edited name without inventing validation rules', () => {
        const onSwitch = vi.fn();
        const onRename = vi.fn();
        const { container } = render(
            <ProfileCard
                id={1}
                name="Player 1"
                stats={{ totalLevel: 12, theme: 'minecraft', skills: { reading: { level: 2 } } }}
                isCurrent
                onSwitch={onSwitch}
                onRename={onRename}
                isParent={false}
            />,
        );

        const card = container.querySelector('div[class*="h-[100px]"]');
        fireEvent.click(card);
        expect(onSwitch).toHaveBeenCalledWith(1);

        fireEvent.click(card.querySelectorAll('svg').item(1));
        const input = within(card).getByRole('textbox');
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.click(within(card).getByRole('button'));
        expect(onRename).toHaveBeenCalledWith(1, '');
    });

    it('uses the parent verification flow before granting parent status', () => {
        const onParentVerified = vi.fn();
        const { container } = render(
            <ProfileCard
                id={2}
                name="Player 2"
                stats={null}
                isCurrent={false}
                onSwitch={vi.fn()}
                onRename={vi.fn()}
                isParent={false}
                onParentVerified={onParentVerified}
            />,
        );

        fireEvent.click(within(container).getByRole('checkbox'));
        const answer = screen.getByRole('textbox');
        fireEvent.change(answer, { target: { value: 'incorrect' } });
        fireEvent.submit(answer.closest('form'));
        expect(screen.getByText('Incorrect answer. Try again!')).not.toBeNull();

        fireEvent.change(answer, { target: { value: 'floppy disk' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(onParentVerified).toHaveBeenCalledWith(2, true);
    });
});

describe('image and decorative components', () => {
    it('switches to the accessible fallback when an image fails or has no source', () => {
        const { rerender } = render(<SafeImage src="/missing.png" alt="Player avatar" />);
        fireEvent.error(screen.getByAltText('Player avatar'));
        expect(screen.getByText('Player avatar')).not.toBeNull();

        rerender(<SafeImage src="" alt="Empty image" />);
        expect(screen.getByText('Empty image')).not.toBeNull();
    });

    it('renders filled and empty heart palettes at the requested size', () => {
        const { container } = render(
            <>
                <PixelHeart size={48} filled />
                <PixelHeart size={32} filled={false} />
            </>,
        );
        const hearts = container.querySelectorAll('svg');
        expect(hearts[0].getAttribute('width')).toBe('48');
        expect(hearts[0].querySelector('rect[fill="#F22830"]')).not.toBeNull();
        expect(hearts[1].getAttribute('width')).toBe('32');
        expect(hearts[1].querySelector('rect[fill="#1f2937"]')).not.toBeNull();
    });

    it('normalizes numeric aura size and follows the current hit/heal animation priority', () => {
        const { rerender, container } = render(
            <MobWithAura mobSrc="/mob.png" aura="frost" displayName="Frozen Mob" size={64} />,
        );
        let wrapper = container.querySelector('[data-aura="frost"]');
        expect(wrapper.style.width).toBe('64px');
        expect(wrapper.querySelector('img').className).toContain('animate-bob');

        rerender(<MobWithAura mobSrc="/mob.png" aura="frost" displayName="Frozen Mob" size="75%" isHit bossHealing />);
        wrapper = container.querySelector('[data-aura="frost"]');
        expect(wrapper.style.width).toBe('100%');
        expect(wrapper.querySelector('img').className).toContain('animate-knockback');
        expect(wrapper.querySelector('img').className).toContain('brightness-150');
    });
});

describe('display modals and achievement toasts', () => {
    it('shows and closes the informational bug-report modal', () => {
        const onClose = vi.fn();
        const { rerender } = render(<BugReportModal isOpen={false} onClose={onClose} />);
        expect(document.body.textContent).not.toContain('Discovered a bug?');
        rerender(<BugReportModal isOpen onClose={onClose} />);
        fireEvent.click(document.body.querySelector('.fixed.inset-0 > .absolute'));
        expect(onClose).toHaveBeenCalledOnce();
        expect(screen.getByText('Discovered a bug?')).not.toBeNull();
        rerender(<BugReportModal isOpen={false} onClose={onClose} />);
        expect(screen.queryByText('Discovered a bug?')).toBeNull();
    });

    it('handles unknown, base, and tiered achievements', () => {
        const { rerender } = render(<AchievementToast achievementId="missing" />);
        expect(document.body.textContent).not.toContain('ACHIEVEMENT UNLOCKED!');

        rerender(<AchievementToast achievementId="first_steps" />);
        expect(screen.getByText('ACHIEVEMENT UNLOCKED!')).not.toBeNull();
        expect(screen.getByText('First Steps')).not.toBeNull();

        rerender(<AchievementToast achievementId="phantom_hunter" tierIndex={0} />);
        expect(screen.getByText('Bronze Ghost Buster')).not.toBeNull();
        expect(screen.getByText('Bronze Tier')).not.toBeNull();
    });

    it('only closes the parental modal after the answer is verified', () => {
        const onClose = vi.fn();
        const { rerender } = render(
            <ParentalVerificationModal isOpen={false} onClose={onClose} onVerified={vi.fn()} />,
        );
        expect(document.body.textContent).not.toContain('What is this?');

        rerender(<ParentalVerificationModal isOpen onClose={onClose} onVerified={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(screen.getByText('Incorrect answer. Try again!')).not.toBeNull();
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(onClose).toHaveBeenCalledOnce();
    });
});

describe('achievement and cosmetics drawers', () => {
    it('renders locked and completed achievement tiers from the supplied progress', () => {
        const skills = Object.fromEntries(
            ['reading', 'math', 'writing', 'cleaning', 'memory', 'patterns'].map((id) => [
                id,
                { level: 1, xp: 0, difficulty: 1, earnedBadges: [] },
            ]),
        );
        const stats = {
            phantomsCaught: 0,
            totalMobsDefeated: 0,
            totalBossesDefeated: 0,
            totalMinibossesDefeated: 0,
            totalDeaths: 0,
            uniqueMobsDefeated: [],
            uniqueBossesDefeated: [],
            uniqueMinibossesDefeated: [],
            themeChanges: 0,
            borderChanges: 0,
            battlesThisSession: 0,
            loginDates: [],
            perfectMemoryGames: 0,
        };
        const { rerender } = render(<MenuDrawer isOpen skills={skills} stats={stats} />);
        expect(screen.getByText('Special Achievements')).not.toBeNull();
        expect(screen.getAllByText('Next: Bronze').length).toBeGreaterThan(0);
        expect(screen.getAllByText('🔒 Locked').length).toBeGreaterThan(0);

        const completedSkills = Object.fromEntries(
            Object.entries(skills).map(([id, skill]) => [
                id,
                { ...skill, level: 200, difficulty: 7, earnedBadges: Array(8).fill('badge') },
            ]),
        );
        const completedStats = {
            ...stats,
            phantomsCaught: 100,
            totalMobsDefeated: 100,
            totalBossesDefeated: 100,
            totalMinibossesDefeated: 100,
            totalDeaths: 100,
            uniqueMobsDefeated: [
                'Blaze',
                'Bogged',
                'Breeze',
                'Creeper',
                'Drowned',
                'Enderman',
                'Evoker',
                'Ghast',
                'Guardian',
                'Hoglin',
                'Magma Cube',
                'Parched',
                'Phantom',
                'Piglin',
                'Pillager',
                'Skeleton',
                'Slime',
                'Spider',
                'Witch',
                'Zombie',
            ],
            uniqueBossesDefeated: ['Ender Dragon', 'Herobrine', 'Warden', 'Wither'],
            uniqueMinibossesDefeated: ['Creaking', 'Elder Guardian', 'Ravager', 'Wither Skeleton'],
            themeChanges: 1,
            borderChanges: 1,
            battlesThisSession: 10,
            loginDates: ['day-1', 'day-2', 'day-3'],
            perfectMemoryGames: 1,
        };
        rerender(<MenuDrawer isOpen skills={completedSkills} stats={completedStats} />);
        expect(screen.getAllByText('MAX TIER REACHED!').length).toBeGreaterThan(0);
        expect(screen.getAllByText('✓ Unlocked').length).toBeGreaterThan(0);
    });

    it('toggles the border color picker and respects badge and achievement unlocks', () => {
        const setActiveTheme = vi.fn();
        const setSelectedBorder = vi.fn();
        const setBorderColor = vi.fn();
        const unlockedBorders = [
            'Wood',
            'Stone',
            'Gold',
            'Iron',
            'Emerald',
            'Diamond',
            'Netherite',
            'Obsidian',
            'Star',
        ];
        const unlockedAchievements = ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'];
        const { container, rerender } = render(
            <CosmeticsDrawer
                isOpen
                activeTheme="minecraft"
                setActiveTheme={setActiveTheme}
                selectedBorder="solid-picker"
                setSelectedBorder={setSelectedBorder}
                borderColor="#123456"
                setBorderColor={setBorderColor}
                unlockedBorders={unlockedBorders}
                unlockedAchievements={unlockedAchievements}
            />,
        );

        fireEvent.click(screen.getByText('Pokemon').closest('button'));
        expect(setActiveTheme).toHaveBeenCalledWith('pokemon');

        const pickerBorder = screen
            .getAllByRole('button')
            .find((button) => button.textContent.includes('Customizable eternal glow'));
        fireEvent.click(pickerBorder);
        const colorInput = container.querySelector('input[type="color"]');
        expect(colorInput).not.toBeNull();
        fireEvent.change(colorInput, { target: { value: '#abcdef' } });
        expect(setBorderColor).toHaveBeenCalledWith('#abcdef');
        fireEvent.click(pickerBorder);
        expect(container.querySelector('input[type="color"]')).toBeNull();

        const liveWire = screen.getByText('Live Wire').closest('button');
        expect(liveWire.disabled).toBe(false);
        fireEvent.click(liveWire);
        expect(setSelectedBorder).toHaveBeenCalledWith('livewire');

        rerender(
            <CosmeticsDrawer
                isOpen
                activeTheme="minecraft"
                setActiveTheme={setActiveTheme}
                selectedBorder="solid"
                setSelectedBorder={setSelectedBorder}
                borderColor="#123456"
                setBorderColor={setBorderColor}
                unlockedBorders={[]}
                unlockedAchievements={[]}
            />,
        );
        expect(screen.getByText('Copper').closest('button').disabled).toBe(true);
        expect(screen.getByText('Live Wire').closest('button').disabled).toBe(true);
    });
});
