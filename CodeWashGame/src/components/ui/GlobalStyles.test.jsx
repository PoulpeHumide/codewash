// @vitest-environment jsdom
import React from 'react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GlobalStyles from './GlobalStyles';

vi.mock('./GlobalStyles.css?raw', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    return { default: readFileSync(resolve('src/components/ui/GlobalStyles.css'), 'utf8') };
});

afterEach(cleanup);

describe('GlobalStyles', () => {
    it('mounts the original stylesheet without changing its CSS order or contents', () => {
        const { container } = render(<GlobalStyles />);
        const style = container.querySelector('style');
        const stylesheet = readFileSync(resolve('src/components/ui/GlobalStyles.css'), 'utf8');

        expect(style).not.toBeNull();
        expect(style.textContent).toBe(stylesheet);
        expect(createHash('sha256').update(style.textContent).digest('hex')).toBe(
            'a2947e7c29867fbe491199db2f9f2ee6a6bb19c397acd63da05a56868000925f',
        );
        expect(stylesheet).toContain('@keyframes border-crystal');
        expect(stylesheet).toContain(".mob-with-aura-container[data-aura='rainbow']::before");
        expect(stylesheet).toContain('var(--border-color, #ffd700)');
    });
});
