// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BugReportModal from './BugReportModal';

afterEach(cleanup);

const renderBugReportModal = (submit, configuration) =>
    render(<BugReportModal isOpen onClose={vi.fn()} reportService={{ submit }} configuration={configuration} />);

const describeAndSubmit = (buttonName) => {
    fireEvent.change(screen.getByLabelText('Describe the problem'), { target: { value: 'A problem occurred.' } });
    fireEvent.click(screen.getByRole('button', { name: buttonName }));
};

describe('bug report modal', () => {
    it('previews and submits the description, recipient, attachments, opt-in save, and diagnostics', async () => {
        const submit = vi.fn().mockResolvedValue({
            delivery: 'server',
            id: 'server-42',
            receivedAt: '2026-02-03T04:05:06.000Z',
        });
        const diagnosticsProvider = vi.fn(() => [
            {
                occurredAt: '2026-02-03T04:04:00.000Z',
                category: 'audio',
                message: 'Audio playback failed',
                details: { source: 'click.wav' },
            },
        ]);
        render(
            <BugReportModal
                isOpen
                onClose={vi.fn()}
                reportService={{ submit }}
                diagnosticsProvider={diagnosticsProvider}
                configuration={{
                    contact: 'bugs@example.test',
                    endpoint: 'https://reports.example.test',
                    appVersion: '1.2.3',
                }}
                context={{
                    theme: 'minecraft',
                    platform: 'electron',
                    gameState: {
                        skills: { reading: { level: 4, xp: 20 } },
                        stats: { totalMobsDefeated: 5, loginDates: ['private'] },
                    },
                }}
            />,
        );

        fireEvent.change(screen.getByLabelText('Describe the problem'), {
            target: { value: 'The menu stopped responding.' },
        });
        fireEvent.change(screen.getByLabelText('Screenshots'), {
            target: { files: [new File(['pixels'], 'screen.png', { type: 'image/png' })] },
        });
        fireEvent.change(screen.getByLabelText('Additional files'), {
            target: { files: [new File(['steps'], 'steps.txt', { type: 'text/plain' })] },
        });
        fireEvent.click(screen.getByLabelText(/Include skill progress/));
        fireEvent.click(screen.getByLabelText(/Include recent application/));

        expect(screen.getByLabelText('Report preview').textContent).toContain('The menu stopped responding.');
        expect(screen.getByLabelText('Report preview').textContent).toContain('screen.png, steps.txt');

        fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
        await waitFor(() => expect(submit).toHaveBeenCalledOnce());
        expect(submit).toHaveBeenCalledWith(
            expect.objectContaining({
                recipient: 'bugs@example.test',
                description: 'The menu stopped responding.',
                metadata: { appVersion: '1.2.3', theme: 'minecraft', platform: 'electron' },
                gameState: {
                    skills: { reading: { level: 4, xp: 20 } },
                    stats: { totalMobsDefeated: 5 },
                },
                logs: [expect.objectContaining({ category: 'audio', message: 'Audio playback failed' })],
                attachments: [
                    expect.objectContaining({ name: 'screen.png', type: 'image/png' }),
                    expect.objectContaining({ name: 'steps.txt', type: 'text/plain' }),
                ],
            }),
        );
        expect(screen.getByRole('status').textContent).toContain('server-42');
    });

    it('shows missing-recipient, attachment validation, and actionable transport failure states', async () => {
        const submit = vi.fn().mockRejectedValue(new Error('Could not export the report bundle locally: blocked'));
        const onClose = vi.fn();
        render(
            <BugReportModal
                isOpen
                onClose={onClose}
                reportService={{ submit }}
                configuration={{ contact: '', endpoint: '', appVersion: '' }}
            />,
        );

        expect(screen.getByText(/Not configured\. Reports can still be exported locally/)).not.toBeNull();
        fireEvent.change(screen.getByLabelText('Describe the problem'), { target: { value: 'A problem occurred.' } });
        fireEvent.change(screen.getByLabelText('Additional files'), {
            target: { files: [new File(['binary'], 'unsafe.exe', { type: 'application/octet-stream' })] },
        });
        expect(screen.getByRole('alert').textContent).toContain('this file type is not supported');

        fireEvent.click(screen.getByRole('button', { name: 'Create report bundle' }));
        await waitFor(() => expect(submit).toHaveBeenCalledOnce());
        expect(screen.getByText('Could not export the report bundle locally: blocked')).not.toBeNull();

        fireEvent.keyDown(window, { key: 'Enter' });
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('validates the description and allows selected attachments to be removed', () => {
        const submit = vi.fn();
        render(
            <BugReportModal
                isOpen
                onClose={vi.fn()}
                reportService={{ submit }}
                configuration={{ contact: '', endpoint: '', appVersion: '0.0.0' }}
            />,
        );

        const description = screen.getByLabelText('Describe the problem');
        fireEvent.change(description, { target: { value: ' ' } });
        expect(screen.getByText('Describe the problem before creating a report.')).not.toBeNull();
        fireEvent.submit(description.closest('form'));
        expect(screen.getByRole('alert').textContent).toContain('Describe the problem');
        expect(submit).not.toHaveBeenCalled();

        fireEvent.change(description, { target: { value: 'A problem occurred.' } });
        const screenshots = screen.getByLabelText('Screenshots');
        Object.defineProperty(screenshots, 'files', { configurable: true, value: null });
        fireEvent.change(screenshots);
        fireEvent.change(screen.getByLabelText('Screenshots'), {
            target: { files: [new File(['pixels'], 'remove.png', { type: 'image/png' })] },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Remove remove.png' }));
        expect(screen.getByText('None')).not.toBeNull();
    });

    it('explains that a failed server submission produced a local bundle', async () => {
        const submit = vi.fn().mockResolvedValue({
            delivery: 'download',
            id: 'report-1',
            message: 'The report bundle was downloaded locally.',
            warning: 'The server could not receive the report: offline',
        });
        renderBugReportModal(submit, {
            contact: '',
            endpoint: 'https://reports.example.test',
            appVersion: '1.0.0',
        });
        describeAndSubmit('Send report');
        await waitFor(() => expect(screen.getByRole('status').textContent).toContain('downloaded locally'));
        expect(screen.getByRole('status').textContent).toContain('offline');
    });

    it('shows a safe fallback message when a transport rejects with a non-Error value', async () => {
        const submit = vi.fn().mockRejectedValue('network unavailable');
        renderBugReportModal(submit, { contact: '', endpoint: '', appVersion: '1.0.0' });
        describeAndSubmit('Create report bundle');
        await waitFor(() => expect(submit).toHaveBeenCalledOnce());
        expect(screen.getByText('The report could not be created. Try again.')).not.toBeNull();
    });

    it('preserves the modal open/close contract when closed through its backdrop', () => {
        const onClose = vi.fn();
        const { rerender } = render(<BugReportModal isOpen={false} onClose={onClose} />);
        expect(screen.queryByRole('dialog')).toBeNull();

        rerender(<BugReportModal isOpen onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Close bug report' }));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
