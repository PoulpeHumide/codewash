import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBugReportService, readBugReportConfiguration } from './bugReportService';
import {
    createHttpBugReportTransport,
    downloadBugReportBundle,
    serializeBugReportBundle,
} from './httpBugReportTransport';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const report = {
    id: 'report-1',
    createdAt: '2026-01-02T03:04:05.000Z',
    recipient: 'bugs@example.test',
    description: 'The menu froze.',
    metadata: { appVersion: '1.2.3', theme: 'minecraft', platform: 'browser' },
    gameState: { skills: { reading: { level: 2 } }, stats: { totalMobsDefeated: 4 } },
    logs: [],
    attachments: [],
};

describe('bug report transport and service', () => {
    it('reads contact, endpoint, and version from build-time configuration', () => {
        expect(
            readBugReportConfiguration({
                VITE_BUG_REPORT_CONTACT: ' bugs@example.test ',
                VITE_BUG_REPORT_ENDPOINT: ' https://reports.example.test ',
                VITE_APP_VERSION: ' 1.2.3 ',
            }),
        ).toEqual({
            contact: 'bugs@example.test',
            endpoint: 'https://reports.example.test',
            appVersion: '1.2.3',
        });
        expect(readBugReportConfiguration({ VITE_APP_VERSION: '  ' })).toMatchObject({
            contact: '',
            endpoint: '',
        });
        expect(
            readBugReportConfiguration({
                VITE_BUG_REPORT_CONTACT: 42,
                VITE_BUG_REPORT_ENDPOINT: 42,
                VITE_APP_VERSION: 42,
            }),
        ).toMatchObject({ contact: '', endpoint: '' });
        expect(readBugReportConfiguration(null)).toMatchObject({ contact: '', endpoint: '' });
    });

    it('posts the structured report and attachments as multipart form data', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ id: 'server-7' }),
        });
        const transport = createHttpBugReportTransport({ endpoint: 'https://reports.example.test', fetchImpl });
        const screenshot = new Blob(['image'], { type: 'image/png' });
        Object.defineProperty(screenshot, 'name', { value: 'screen.png' });

        await expect(transport.send({ ...report, attachments: [screenshot] })).resolves.toEqual({ id: 'server-7' });

        const [endpoint, request] = fetchImpl.mock.calls[0];
        expect(endpoint).toBe('https://reports.example.test');
        expect(request.method).toBe('POST');
        expect(request.credentials).toBe('omit');
        expect(request.body.get('report')).toContain('"description":"The menu froze."');
        expect(request.body.getAll('attachments')).toHaveLength(1);
    });

    it('reports server errors and handles empty successful responses', async () => {
        const failed = createHttpBugReportTransport({
            endpoint: '/reports',
            fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
        });
        await expect(failed.send(report)).rejects.toThrow('Report server returned HTTP 503');

        const emptySuccess = createHttpBugReportTransport({
            endpoint: '/reports',
            fetchImpl: vi.fn().mockResolvedValue({ ok: true, status: 204 }),
        });
        await expect(emptySuccess.send(report)).resolves.toEqual({ id: '' });
        const missingId = createHttpBugReportTransport({
            endpoint: '/reports',
            fetchImpl: vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }),
        });
        await expect(missingId.send(report)).resolves.toEqual({ id: '' });
        const malformedReceipt = createHttpBugReportTransport({
            endpoint: '/reports',
            fetchImpl: vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => null }),
        });
        await expect(malformedReceipt.send(report)).rejects.toThrow('invalid receipt');
        const unreadableReceipt = createHttpBugReportTransport({
            endpoint: '/reports',
            fetchImpl: vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => {
                    throw new SyntaxError('invalid JSON');
                },
            }),
        });
        await expect(unreadableReceipt.send(report)).rejects.toThrow('invalid receipt');
        await expect(createHttpBugReportTransport({ endpoint: '' }).send(report)).rejects.toThrow(
            'Bug report endpoint is not configured',
        );
        await expect(
            createHttpBugReportTransport({ endpoint: '/reports', fetchImpl: null }).send(report),
        ).rejects.toThrow('cannot connect');
    });

    it('creates a local JSON bundle with attachment contents and initiates a browser download', async () => {
        const attachment = {
            name: 'screen.png',
            type: 'image/png',
            size: 3,
            arrayBuffer: async () => Uint8Array.from([65, 66, 67]).buffer,
        };
        const bundle = await serializeBugReportBundle({ ...report, attachments: [attachment] });
        expect(JSON.parse(bundle).attachments[0]).toMatchObject({
            name: 'screen.png',
            type: 'image/png',
            size: 3,
            data: 'data:image/png;base64,QUJD',
        });
        await expect(serializeBugReportBundle({ ...report, attachments: [] })).resolves.toContain('"attachments": []');
        await expect(
            serializeBugReportBundle({
                ...report,
                attachments: [
                    { name: 'empty.txt', type: 'text/plain', size: 0, arrayBuffer: async () => new ArrayBuffer(0) },
                ],
            }),
        ).resolves.toContain('data:text/plain;base64,');
        vi.stubGlobal('btoa', undefined);
        await expect(serializeBugReportBundle({ ...report, attachments: [attachment] })).rejects.toThrow(
            'cannot encode report attachments',
        );

        const anchor = { click: vi.fn(), remove: vi.fn(), href: '', download: '' };
        const documentRef = { createElement: vi.fn(() => anchor), body: { appendChild: vi.fn() } };
        const urlApi = { createObjectURL: vi.fn(() => 'blob:report'), revokeObjectURL: vi.fn() };
        await downloadBugReportBundle(report, { documentRef, urlApi, serialize: async () => '{"id":"report-1"}' });
        expect(anchor.download).toBe('bug-report-report-1.json');
        expect(anchor.click).toHaveBeenCalledOnce();
        expect(anchor.remove).toHaveBeenCalledOnce();
        expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:report');
        await expect(downloadBugReportBundle(report, { documentRef: null })).rejects.toThrow(
            'Local report export is not available',
        );
        const failedAnchor = {
            ...anchor,
            click: vi.fn(() => {
                throw new Error('download blocked');
            }),
            remove: vi.fn(),
        };
        await expect(
            downloadBugReportBundle(report, {
                documentRef: { createElement: () => failedAnchor, body: { appendChild: vi.fn() } },
                urlApi,
                serialize: async () => '{}',
            }),
        ).rejects.toThrow('download blocked');
        expect(failedAnchor.remove).toHaveBeenCalledOnce();
        expect(urlApi.revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    it('returns a server receipt or an explicit local fallback after delivery failure', async () => {
        const downloadBundle = vi.fn().mockResolvedValue(undefined);
        const serverService = createBugReportService({
            endpoint: '/reports',
            transport: { send: vi.fn().mockResolvedValue({ id: 'server-8' }) },
            downloadBundle,
            now: () => 0,
        });
        await expect(serverService.submit(report)).resolves.toMatchObject({
            delivery: 'server',
            id: 'server-8',
            receivedAt: '1970-01-01T00:00:00.000Z',
        });
        expect(downloadBundle).not.toHaveBeenCalled();

        const diagnostics = vi.fn();
        const fallbackService = createBugReportService({
            endpoint: '/reports',
            transport: { send: vi.fn().mockRejectedValue(new Error('offline')) },
            downloadBundle,
            diagnostics,
        });
        await expect(fallbackService.submit(report)).resolves.toMatchObject({
            delivery: 'download',
            id: 'report-1',
            message: expect.stringContaining('downloaded locally'),
            warning: expect.stringContaining('offline'),
        });
        expect(downloadBundle).toHaveBeenCalledWith(report);
        expect(diagnostics).toHaveBeenCalledOnce();

        const localService = createBugReportService({ downloadBundle });
        await expect(localService.submit({ ...report, recipient: '' })).resolves.toMatchObject({
            delivery: 'download',
            message: expect.stringContaining('No recipient is configured'),
        });
        const fallbackIdService = createBugReportService({
            endpoint: '/reports',
            transport: { send: vi.fn().mockResolvedValue({ id: '' }) },
            downloadBundle,
        });
        await expect(fallbackIdService.submit(report)).resolves.toMatchObject({ delivery: 'server', id: 'report-1' });
        const stringFailureService = createBugReportService({
            endpoint: '/reports',
            transport: { send: vi.fn().mockRejectedValue('offline') },
            downloadBundle,
            diagnostics,
        });
        await expect(stringFailureService.submit(report)).resolves.toMatchObject({
            warning: expect.stringContaining('offline'),
        });
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        const defaultTransportService = createBugReportService({ endpoint: '/reports', downloadBundle });
        await expect(defaultTransportService.submit(report)).resolves.toMatchObject({ delivery: 'download' });
    });

    it('surfaces local export failures with actionable errors', async () => {
        const service = createBugReportService({
            downloadBundle: vi.fn().mockRejectedValue(new Error('blocked')),
        });
        await expect(service.submit(report)).rejects.toThrow('Could not export the report bundle locally: blocked');
    });
});
