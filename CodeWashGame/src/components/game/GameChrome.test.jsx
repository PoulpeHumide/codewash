// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameChrome from './GameChrome';

vi.mock('../drawers/CosmeticsDrawer', () => ({ default: () => null }));
vi.mock('../drawers/MenuDrawer', () => ({ default: () => null }));
vi.mock('../drawers/SettingsDrawer', () => ({
    default: ({ onReset }) => <button onClick={onReset}>Open reset</button>,
}));
vi.mock('../modals/ResetModal', () => ({
    default: ({ isOpen, onClose, onConfirm }) =>
        isOpen ? (
            <>
                <button onClick={onClose}>Close reset</button>
                <button onClick={onConfirm}>Confirm reset</button>
            </>
        ) : null,
}));
vi.mock('../modals/BugReportModal', () => ({
    default: ({ isOpen, onClose, context }) =>
        isOpen ? (
            <>
                <span data-testid="bug-report-theme">{context?.theme}</span>
                <button onClick={onClose}>Close bug report</button>
            </>
        ) : null,
}));
vi.mock('../ui/PixelHeart', () => ({
    default: ({ filled }) => <span data-testid="heart" data-filled={filled} />,
}));
vi.mock('../../utils/soundManager', () => ({ playClick: vi.fn() }));

const createProps = () => ({
    playerHealth: 3,
    isMenuOpen: true,
    setIsMenuOpen: vi.fn(),
    isSettingsOpen: true,
    setIsSettingsOpen: vi.fn(),
    isCosmeticsOpen: true,
    setIsCosmeticsOpen: vi.fn(),
    isResetOpen: true,
    setIsResetOpen: vi.fn(),
    isBugReportOpen: true,
    setIsBugReportOpen: vi.fn(),
    isFullscreen: false,
    toggleFullscreen: vi.fn(),
    activeTheme: 'minecraft',
    handleThemeChange: vi.fn(),
    selectedBorder: 'default',
    handleBorderChange: vi.fn(),
    borderColor: '#ffffff',
    setBorderColor: vi.fn(),
    unlockedBorders: [],
    unlockedAchievements: [],
    handleReset: vi.fn(),
    bgmVol: 0.5,
    setBgmVol: vi.fn(),
    sfxVol: 0.5,
    setSfxVolState: vi.fn(),
    currentProfile: 1,
    handleSwitchProfile: vi.fn(),
    profileNames: {},
    handleRenameProfile: vi.fn(),
    getProfileStats: vi.fn(),
    parentStatus: {},
    handleParentVerified: vi.fn(),
    skills: {},
    stats: {},
    bugReportContext: { theme: 'minecraft', gameState: { skills: {}, stats: {} } },
    battlingSkillId: 'math',
    endBattle: vi.fn(),
});

describe('GameChrome', () => {
    it('renders controls and runs panel, modal, fullscreen, and battle-backdrop actions', () => {
        const props = createProps();
        const { container } = render(<GameChrome {...props} />);

        expect(screen.getAllByTestId('heart')).toHaveLength(10);
        expect(screen.getAllByTestId('heart').filter((heart) => heart.dataset.filled === 'true')).toHaveLength(3);
        expect(screen.getByTestId('bug-report-theme').textContent).toBe('minecraft');

        const getIconButton = (selector) =>
            [...container.querySelectorAll('button')].find((button) => button.querySelector(selector));
        fireEvent.click(getIconButton('svg.lucide-settings'));
        fireEvent.click(getIconButton('svg.lucide-sparkles'));
        fireEvent.click(screen.getByTitle('Enter fullscreen'));
        fireEvent.click(getIconButton('svg.lucide-menu'));
        fireEvent.click(getIconButton('svg.text-red-400'));

        expect(props.setIsSettingsOpen).toHaveBeenCalledWith(true);
        expect(props.setIsCosmeticsOpen).toHaveBeenCalledWith(true);
        expect(props.toggleFullscreen).toHaveBeenCalledOnce();
        expect(props.setIsMenuOpen).toHaveBeenCalledWith(true);
        expect(props.setIsBugReportOpen).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByText('Open reset'));
        fireEvent.click(screen.getByText('Close reset'));
        fireEvent.click(screen.getByText('Confirm reset'));
        fireEvent.click(screen.getByText('Close bug report'));
        expect(props.setIsResetOpen).toHaveBeenCalledWith(true);
        expect(props.handleReset).toHaveBeenCalledOnce();
        expect(props.setIsBugReportOpen).toHaveBeenCalledWith(false);

        const backdrops = [...container.querySelectorAll('div.fixed.inset-0')].filter((element) =>
            element.className.includes('bg-black/50'),
        );
        expect(backdrops).toHaveLength(4);
        backdrops.forEach((backdrop) => fireEvent.click(backdrop));
        expect(props.endBattle).toHaveBeenCalledOnce();
        expect(props.setIsCosmeticsOpen).toHaveBeenCalledWith(false);
        expect(props.setIsSettingsOpen).toHaveBeenCalledWith(false);
        expect(props.setIsMenuOpen).toHaveBeenCalledWith(false);
    });
});
