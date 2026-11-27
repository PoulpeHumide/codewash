import { describe, expect, it } from 'vitest';
import { buildBugReport, detectPlatform } from './bugReportCollector';

describe('bug report collector', () => {
    it('builds a report with only explicitly opted-in game state and diagnostics', () => {
        const skills = { reading: { level: 4, xp: 20 } };
        const report = buildBugReport(
            {
                description: '  A menu stopped responding  ',
                recipient: 'bugs@example.test',
                theme: 'minecraft',
                platform: 'electron',
                appVersion: '1.2.3',
                gameState: {
                    skills,
                    stats: {
                        totalMobsDefeated: 5,
                        loginDates: ['private-date'],
                        achievementsUnlocked: ['first_steps'],
                    },
                },
                logs: [
                    {
                        occurredAt: '2026-01-02T03:04:05.000Z',
                        category: 'audio',
                        message: 'play rejected token=private',
                        details: { source: 'click.wav', token: 'private' },
                    },
                ],
                includeGameState: true,
                includeLogs: true,
                attachments: [{ name: 'screen.png', type: 'image/png', size: 12 }],
            },
            { now: () => 1234, idFactory: () => 'report-1' },
        );

        expect(report).toEqual({
            id: 'report-1',
            createdAt: '1970-01-01T00:00:01.234Z',
            recipient: 'bugs@example.test',
            description: 'A menu stopped responding',
            metadata: { appVersion: '1.2.3', theme: 'minecraft', platform: 'electron' },
            gameState: {
                skills: { reading: { level: 4, xp: 20 } },
                stats: { totalMobsDefeated: 5 },
            },
            logs: [
                {
                    occurredAt: '2026-01-02T03:04:05.000Z',
                    category: 'audio',
                    message: 'play rejected token=[redacted]',
                    details: { source: 'click.wav' },
                },
            ],
            attachments: [{ name: 'screen.png', type: 'image/png', size: 12 }],
        });
        expect(skills.reading.level).toBe(4);
    });

    it('omits optional data by default and detects only Electron versus browser', () => {
        const report = buildBugReport(
            { description: 'A short report', gameState: { skills: { reading: {} } }, logs: [{ message: 'private' }] },
            { now: () => 0, idFactory: () => 'report-2' },
        );

        expect(report).not.toHaveProperty('gameState');
        expect(report).not.toHaveProperty('logs');
        expect(report.metadata).toEqual({ appVersion: 'unknown', theme: 'unknown', platform: 'browser' });
        expect(detectPlatform({ navigator: { userAgent: 'Mozilla Electron/45.5' } })).toBe('electron');
        expect(detectPlatform({ navigator: { userAgent: 'Mozilla/5.0' } })).toBe('browser');
        expect(detectPlatform(null)).toBe('browser');
        expect(
            buildBugReport({
                description: 'Valid',
                includeGameState: true,
                gameState: { skills: [], stats: [] },
                includeLogs: true,
                logs: null,
            }).gameState,
        ).toEqual({ skills: {}, stats: {} });
    });

    it('rejects empty descriptions and non-serializable opted-in game state', () => {
        expect(() => buildBugReport({ description: '   ' })).toThrow('A report description is required');
        expect(() => buildBugReport({ description: 42 })).toThrow('A report description is required');
        const cyclic = {};
        cyclic.self = cyclic;
        expect(() =>
            buildBugReport({ description: 'Valid', includeGameState: true, gameState: { skills: cyclic } }),
        ).toThrow('Game state could not be serialized');
        expect(
            buildBugReport({
                description: 'Valid',
                includeLogs: true,
                logs: [{ message: 'No detail object' }],
            }).logs,
        ).toEqual([{ occurredAt: '', category: 'application', message: 'No detail object', details: {} }]);
    });
});
