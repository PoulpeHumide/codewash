import { describe, expect, it } from 'vitest';
import {
    MAX_ATTACHMENT_SIZE,
    MAX_ATTACHMENTS,
    MAX_TOTAL_ATTACHMENT_SIZE,
    validateAttachments,
    validateDescription,
} from './bugReportValidation';

const file = (name, type, size) => ({ name, type, size });

describe('bug report validation', () => {
    it('requires a concise description and trims valid text', () => {
        expect(validateDescription('  ')).toEqual({
            value: '',
            error: 'Describe the problem before creating a report.',
        });
        expect(validateDescription(null)).toEqual({
            value: '',
            error: 'Describe the problem before creating a report.',
        });
        expect(validateDescription('a'.repeat(2001)).error).toBe('Keep the description under 2000 characters.');
        expect(validateDescription('  The screen froze.  ')).toEqual({ value: 'The screen froze.', error: '' });
    });

    it('accepts supported attachments and rejects unsafe types and oversized files', () => {
        const result = validateAttachments([
            file('screen.png', 'image/png', 1024),
            file('notes.exe', 'application/octet-stream', 10),
            file('large.pdf', 'application/pdf', MAX_ATTACHMENT_SIZE + 1),
        ]);

        expect(result.files.map(({ name }) => name)).toEqual(['screen.png']);
        expect(result.errors).toEqual([
            'notes.exe: this file type is not supported.',
            'large.pdf: files must be 5 MB or smaller.',
        ]);
    });

    it('enforces aggregate size and attachment count while preserving accepted files', () => {
        const tooMany = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, index) =>
            file(`image-${index}.png`, 'image/png', 1),
        );
        const countResult = validateAttachments(tooMany);
        expect(countResult.files).toHaveLength(MAX_ATTACHMENTS);
        expect(countResult.errors.at(-1)).toContain('maximum of 10 files');

        const totalResult = validateAttachments([
            file('first.png', 'image/png', MAX_ATTACHMENT_SIZE),
            file('second.png', 'image/png', MAX_ATTACHMENT_SIZE),
            file('third.png', 'image/png', MAX_ATTACHMENT_SIZE),
            file('fourth.png', 'image/png', 1),
        ]);
        expect(totalResult.files.map(({ name }) => name)).toEqual(['first.png', 'second.png', 'third.png']);
        expect(totalResult.errors).toEqual(['fourth.png: total attachments must be 15 MB or smaller.']);
        expect(validateAttachments(null)).toEqual({ files: [], errors: [] });
    });
});
