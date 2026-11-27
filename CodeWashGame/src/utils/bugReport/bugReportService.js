import { recordDiagnostic } from '../diagnostics/diagnosticLog';
import { createHttpBugReportTransport, downloadBugReportBundle } from './httpBugReportTransport';
import packageMetadata from '../../../package.json';

export const readBugReportConfiguration = (environment = import.meta.env) => {
    const config = environment && typeof environment === 'object' ? environment : {};
    return {
        contact: typeof config.VITE_BUG_REPORT_CONTACT === 'string' ? config.VITE_BUG_REPORT_CONTACT.trim() : '',
        endpoint: typeof config.VITE_BUG_REPORT_ENDPOINT === 'string' ? config.VITE_BUG_REPORT_ENDPOINT.trim() : '',
        appVersion:
            typeof config.VITE_APP_VERSION === 'string' && config.VITE_APP_VERSION.trim()
                ? config.VITE_APP_VERSION.trim()
                : packageMetadata.version,
    };
};

export const bugReportConfiguration = Object.freeze(readBugReportConfiguration());

const errorMessage = (error) => (error instanceof Error ? error.message : String(error));

export const createBugReportService = ({
    endpoint = bugReportConfiguration.endpoint,
    transport,
    downloadBundle = downloadBugReportBundle,
    diagnostics = recordDiagnostic,
    now = Date.now,
} = {}) => {
    const activeTransport = transport || (endpoint ? createHttpBugReportTransport({ endpoint }) : null);

    const exportLocally = async (report, warning = '') => {
        try {
            await downloadBundle(report);
        } catch (error) {
            throw new Error(`Could not export the report bundle locally: ${errorMessage(error)}`, { cause: error });
        }
        const recipientMessage = report.recipient
            ? `Attach the downloaded bundle to an email to ${report.recipient}.`
            : 'No recipient is configured; share the downloaded bundle with the game maintainer.';
        return {
            delivery: 'download',
            id: report.id,
            receivedAt: report.createdAt,
            message: `The report bundle was downloaded locally. ${recipientMessage}`,
            ...(warning ? { warning } : {}),
        };
    };

    return {
        async submit(report) {
            if (!activeTransport) return exportLocally(report);
            try {
                const receipt = await activeTransport.send(report);
                return {
                    delivery: 'server',
                    id: receipt.id || report.id,
                    receivedAt: new Date(now()).toISOString(),
                };
            } catch (error) {
                diagnostics({
                    category: 'bug-report',
                    message: `Remote report delivery failed: ${errorMessage(error)}`,
                    details: { source: 'http-transport' },
                });
                return exportLocally(report, `The server could not receive the report: ${errorMessage(error)}`);
            }
        },
    };
};

export const bugReportService = createBugReportService();
