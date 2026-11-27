import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { buildBugReport, detectPlatform, sanitizeGameState } from '../../utils/bugReport/bugReportCollector';
import { bugReportConfiguration, bugReportService } from '../../utils/bugReport/bugReportService';
import { validateAttachments, validateDescription } from '../../utils/bugReport/bugReportValidation';
import { getRecentDiagnostics } from '../../utils/diagnostics/diagnosticLog';

const AttachmentFields = ({ attachments, attachmentError, onFiles, onRemove }) => (
    <fieldset className="space-y-3 rounded-lg border border-stone-700 p-3">
        <legend className="px-1 font-semibold">Attachments</legend>
        <label className="block text-sm" htmlFor="bug-report-screenshots">
            Screenshots (PNG, JPEG, GIF, or WebP)
        </label>
        <input
            id="bug-report-screenshots"
            aria-label="Screenshots"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            onChange={onFiles}
            className="block w-full text-sm text-stone-300"
        />
        <label className="block text-sm" htmlFor="bug-report-files">
            Additional files (PDF, JSON, CSV, or plain text)
        </label>
        <input
            id="bug-report-files"
            aria-label="Additional files"
            type="file"
            accept="application/pdf,application/json,text/csv,text/plain"
            multiple
            onChange={onFiles}
            className="block w-full text-sm text-stone-300"
        />
        {attachments.length > 0 && (
            <ul aria-label="Selected attachments" className="space-y-1 text-sm text-stone-300">
                {attachments.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                        <span>
                            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                        <button type="button" className="text-amber-300 underline" onClick={() => onRemove(index)}>
                            Remove {file.name}
                        </button>
                    </li>
                ))}
            </ul>
        )}
        {attachmentError && (
            <p role="alert" className="text-sm text-amber-300">
                {attachmentError}
            </p>
        )}
        <p className="text-xs text-stone-400">Up to 10 files, 5 MB each and 15 MB total.</p>
    </fieldset>
);

const GameStatePreview = ({ gameState }) =>
    gameState ? (
        <details>
            <summary>Inspect the exact game data</summary>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(gameState, null, 2)}
            </pre>
        </details>
    ) : null;

const ErrorLogPreview = ({ logs }) =>
    logs.length > 0 ? (
        <details>
            <summary>Inspect recent error details</summary>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(logs, null, 2)}</pre>
        </details>
    ) : null;

const ReportPreview = ({ description, configuration, context, includeGameState, gameState, includeLogs, logs }) => (
    <section
        aria-label="Report preview"
        className="space-y-1 rounded-lg border border-sky-800 bg-sky-950/40 p-3 text-sm"
    >
        <h3 className="font-bold text-sky-200">Preview — this is what will be included</h3>
        <p>
            <strong>Description:</strong> {description.trim() || 'Not entered yet'}
        </p>
        <p>
            <strong>Recipient:</strong> {configuration.contact || 'Not configured (local export only)'}
        </p>
        <p>
            <strong>App:</strong> {configuration.appVersion || 'unknown'} · {context.theme || 'unknown'} ·{' '}
            {context.platform || detectPlatform()}
        </p>
        <p>
            <strong>Save data:</strong>{' '}
            {includeGameState ? 'Included: skill progress and selected counters' : 'Not included'}
        </p>
        <GameStatePreview gameState={gameState} />
        <p>
            <strong>Error logs:</strong> {includeLogs ? `${logs.length} recent entries` : 'Not included'}
        </p>
        {includeLogs && <ErrorLogPreview logs={logs} />}
        <p>
            <strong>Attachments:</strong>{' '}
            {context.attachments.length ? context.attachments.map(({ name }) => name).join(', ') : 'None'}
        </p>
    </section>
);

const SubmissionFeedback = ({ submission }) => {
    if (!submission) return null;
    const isError = submission.delivery === 'error';
    return (
        <div
            role={isError ? 'alert' : 'status'}
            className={`rounded-lg p-3 text-sm ${
                isError
                    ? 'border border-red-700 bg-red-950 text-red-200'
                    : 'border border-green-700 bg-green-950 text-green-200'
            }`}
        >
            <p>{submission.message || `Report received. Reference: ${submission.id} (${submission.receivedAt}).`}</p>
            {submission.warning && <p className="mt-1">{submission.warning}</p>}
            {submission.delivery === 'server' && (
                <p className="mt-1">
                    Reference: {submission.id} · {submission.receivedAt}
                </p>
            )}
        </div>
    );
};

const ConfigurationSummary = ({ configuration }) => (
    <div className="mb-4 rounded-lg border border-stone-700 bg-stone-800 p-3 text-sm">
        <p>
            <strong>Contact:</strong>{' '}
            {configuration.contact || 'Not configured. Reports can still be exported locally.'}
        </p>
        <p>
            <strong>Delivery:</strong> {configuration.endpoint ? 'Configured report server' : 'Local diagnostic bundle'}
        </p>
    </div>
);

const DescriptionField = ({ description, onChange, error }) => (
    <>
        <label className="block font-semibold" htmlFor="bug-report-description">
            Describe the problem
        </label>
        <textarea
            id="bug-report-description"
            value={description}
            onChange={onChange}
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border border-stone-600 bg-stone-950 p-3 text-white"
            placeholder="What happened, and what did you expect?"
            required
        />
        {error && description.length > 0 && <p className="text-sm text-amber-300">{error}</p>}
    </>
);

const DiagnosticsFields = ({ includeGameState, setIncludeGameState, includeLogs, setIncludeLogs }) => (
    <fieldset className="space-y-2 rounded-lg border border-stone-700 p-3">
        <legend className="px-1 font-semibold">Optional diagnostics</legend>
        <label className="flex items-start gap-2 text-sm">
            <input
                type="checkbox"
                checked={includeGameState}
                onChange={(event) => setIncludeGameState(event.target.checked)}
            />
            <span>Include skill progress and selected game counters (no profile name).</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={includeLogs} onChange={(event) => setIncludeLogs(event.target.checked)} />
            <span>Include recent application, audio, and storage error logs.</span>
        </label>
    </fieldset>
);

const ReportActions = ({ isSubmitting, canSubmit, hasEndpoint, onClose }) => (
    <div className="flex justify-end gap-3">
        <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-500 bg-stone-700 px-4 py-2 font-semibold hover:bg-stone-600"
        >
            Cancel
        </button>
        <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="rounded-lg border border-sky-400 bg-sky-700 px-4 py-2 font-bold hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isSubmitting ? 'Preparing report…' : hasEndpoint ? 'Send report' : 'Create report bundle'}
        </button>
    </div>
);

const ReportForm = ({
    onSubmit,
    description,
    setDescription,
    descriptionError,
    attachments,
    attachmentError,
    onFiles,
    onRemove,
    includeGameState,
    setIncludeGameState,
    includeLogs,
    setIncludeLogs,
    preview,
    configuration,
    context,
    submission,
    isSubmitting,
    onClose,
}) => (
    <form onSubmit={onSubmit} className="space-y-4">
        <DescriptionField
            description={description}
            onChange={(event) => setDescription(event.target.value)}
            error={descriptionError}
        />
        <AttachmentFields
            attachments={attachments}
            attachmentError={attachmentError}
            onFiles={onFiles}
            onRemove={onRemove}
        />
        <DiagnosticsFields
            includeGameState={includeGameState}
            setIncludeGameState={setIncludeGameState}
            includeLogs={includeLogs}
            setIncludeLogs={setIncludeLogs}
        />
        <ReportPreview
            description={description}
            configuration={configuration}
            context={{ ...context, attachments }}
            includeGameState={includeGameState}
            gameState={preview.gameState}
            includeLogs={includeLogs}
            logs={preview.logs}
        />
        <SubmissionFeedback submission={submission} />
        <ReportActions
            isSubmitting={isSubmitting}
            canSubmit={Boolean(description.trim()) && !descriptionError}
            hasEndpoint={Boolean(configuration.endpoint)}
            onClose={onClose}
        />
    </form>
);

const resolveModalProps = (props) => ({
    isOpen: props.isOpen,
    onClose: props.onClose,
    context: props.context || {},
    configuration: props.configuration || bugReportConfiguration,
    reportService: props.reportService || bugReportService,
    diagnosticsProvider: props.diagnosticsProvider || getRecentDiagnostics,
});

const getPreviewData = ({ includeLogs, diagnosticsProvider, includeGameState, context }) => ({
    logs: includeLogs ? diagnosticsProvider(50) : [],
    gameState: includeGameState ? sanitizeGameState(context.gameState) : null,
});

const BugReportModal = (props) => {
    const { isOpen, onClose, context, configuration, reportService, diagnosticsProvider } = resolveModalProps(props);
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [attachmentError, setAttachmentError] = useState('');
    const [includeGameState, setIncludeGameState] = useState(false);
    const [includeLogs, setIncludeLogs] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submission, setSubmission] = useState(null);
    const descriptionValidation = validateDescription(description);
    const preview = getPreviewData({ includeLogs, diagnosticsProvider, includeGameState, context });

    useEffect(() => {
        if (isOpen) return undefined;
        setDescription('');
        setAttachments([]);
        setAttachmentError('');
        setIncludeGameState(false);
        setIncludeLogs(false);
        setIsSubmitting(false);
        setSubmission(null);
        return undefined;
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleFiles = (event) => {
        const result = validateAttachments([...attachments, ...Array.from(event.currentTarget.files || [])]);
        setAttachments(result.files);
        setAttachmentError(result.errors.join(' '));
        event.currentTarget.value = '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (descriptionValidation.error) {
            setSubmission({ delivery: 'error', message: descriptionValidation.error });
            return;
        }

        setIsSubmitting(true);
        setSubmission(null);
        try {
            const report = buildBugReport({
                description: descriptionValidation.value,
                recipient: configuration.contact,
                theme: context.theme,
                platform: context.platform || detectPlatform(),
                appVersion: configuration.appVersion,
                gameState: context.gameState,
                logs: includeLogs ? diagnosticsProvider(50) : [],
                includeGameState,
                includeLogs,
                attachments,
            });
            setSubmission(await reportService.submit(report));
        } catch (error) {
            setSubmission({
                delivery: 'error',
                message: error instanceof Error ? error.message : 'The report could not be created. Try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
                type="button"
                aria-label="Close bug report backdrop"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="bug-report-title"
                className="relative z-10 mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-4 border-stone-600 bg-stone-900 p-6 text-stone-100 shadow-2xl"
            >
                <button
                    type="button"
                    aria-label="Close bug report"
                    className="absolute right-4 top-4 rounded p-1 text-stone-300 hover:bg-stone-700 hover:text-white"
                    onClick={onClose}
                >
                    <X size={24} />
                </button>
                <h2
                    id="bug-report-title"
                    className="mb-2 pr-10 text-2xl font-bold uppercase tracking-wider text-slate-300"
                >
                    Discovered a bug?
                </h2>
                <p className="mb-5 text-stone-300">Describe what happened and choose exactly what to include.</p>

                <ConfigurationSummary configuration={configuration} />
                <ReportForm
                    onSubmit={handleSubmit}
                    description={description}
                    setDescription={setDescription}
                    descriptionError={descriptionValidation.error}
                    attachments={attachments}
                    attachmentError={attachmentError}
                    onFiles={handleFiles}
                    onRemove={(index) => setAttachments(attachments.filter((_, itemIndex) => itemIndex !== index))}
                    includeGameState={includeGameState}
                    setIncludeGameState={setIncludeGameState}
                    includeLogs={includeLogs}
                    setIncludeLogs={setIncludeLogs}
                    preview={preview}
                    configuration={configuration}
                    context={context}
                    submission={submission}
                    isSubmitting={isSubmitting}
                    onClose={onClose}
                />
            </section>
        </div>
    );
};

export default BugReportModal;
