const serializeReportMetadata = (report) => ({
    ...report,
    attachments: report.attachments.map(({ name, type, size }) => ({ name, type, size })),
});

const parseReceipt = async (response) => {
    if (!response.ok) throw new Error(`Report server returned HTTP ${response.status}`);
    if (response.status === 204) return { id: '' };

    let receipt;
    try {
        receipt = await response.json();
    } catch (error) {
        throw new Error('The report server returned an invalid receipt.', { cause: error });
    }
    if (receipt === null || typeof receipt !== 'object' || Array.isArray(receipt)) {
        throw new Error('The report server returned an invalid receipt.');
    }
    return { id: typeof receipt.id === 'string' ? receipt.id : '' };
};

export const createHttpBugReportTransport = ({ endpoint, fetchImpl = globalThis.fetch } = {}) => ({
    async send(report) {
        if (!endpoint) throw new Error('Bug report endpoint is not configured');
        if (typeof fetchImpl !== 'function')
            throw new Error('This environment cannot connect to the bug report server');

        const body = new FormData();
        body.append('report', JSON.stringify(serializeReportMetadata(report)));
        report.attachments.forEach((file) => body.append('attachments', file, file.name));
        const response = await fetchImpl(endpoint, { method: 'POST', body, credentials: 'omit' });
        return parseReceipt(response);
    },
});

const bytesToBase64 = (bytes) => {
    if (typeof globalThis.btoa !== 'function') throw new Error('This browser cannot encode report attachments');
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return globalThis.btoa(binary);
};

export const serializeBugReportBundle = async (report) => {
    const attachments = await Promise.all(
        report.attachments.map(async (file) => {
            const bytes = new Uint8Array(await file.arrayBuffer());
            return {
                name: file.name,
                type: file.type,
                size: file.size,
                data: `data:${file.type};base64,${bytesToBase64(bytes)}`,
            };
        }),
    );
    return JSON.stringify({ ...report, attachments }, null, 2);
};

export const downloadBugReportBundle = async (
    report,
    { documentRef = globalThis.document, urlApi = globalThis.URL, serialize = serializeBugReportBundle } = {},
) => {
    assertBrowserDownloadAvailable(documentRef, urlApi);
    const content = await serialize(report);
    const objectUrl = urlApi.createObjectURL(new Blob([content], { type: 'application/json' }));
    const anchor = documentRef.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `bug-report-${report.id}.json`;
    documentRef.body.appendChild(anchor);
    try {
        anchor.click();
    } finally {
        anchor.remove();
        urlApi.revokeObjectURL(objectUrl);
    }
};

const assertBrowserDownloadAvailable = (documentRef, urlApi) => {
    const hasDocument = documentRef?.createElement && documentRef?.body;
    const hasUrlApi = urlApi?.createObjectURL && urlApi?.revokeObjectURL;
    if (!hasDocument || !hasUrlApi) throw new Error('Local report export is not available in this environment');
};
