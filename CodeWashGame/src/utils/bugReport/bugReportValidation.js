export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_SIZE = 15 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;
export const MAX_DESCRIPTION_LENGTH = 2000;

const ALLOWED_ATTACHMENT_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/json',
    'text/plain',
    'text/csv',
]);

export const validateDescription = (description) => {
    const value = typeof description === 'string' ? description.trim() : '';
    if (!value) return { value, error: 'Describe the problem before creating a report.' };
    if (value.length > MAX_DESCRIPTION_LENGTH) {
        return { value, error: `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.` };
    }
    return { value, error: '' };
};

export const validateAttachments = (inputFiles) => {
    const files = [];
    const errors = [];
    let totalSize = 0;
    const candidates = Array.from(inputFiles || []);

    for (const file of candidates) {
        if (files.length >= MAX_ATTACHMENTS) {
            errors.push(`${file.name}: the maximum of ${MAX_ATTACHMENTS} files has been reached.`);
        } else if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
            errors.push(`${file.name}: this file type is not supported.`);
        } else if (file.size > MAX_ATTACHMENT_SIZE) {
            errors.push(`${file.name}: files must be 5 MB or smaller.`);
        } else if (totalSize + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
            errors.push(`${file.name}: total attachments must be 15 MB or smaller.`);
        } else {
            files.push(file);
            totalSize += file.size;
        }
    }

    return { files, errors };
};
