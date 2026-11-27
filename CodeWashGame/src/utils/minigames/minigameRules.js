export const normalizeMathInput = (value) => value.replace(/[^0-9-]/g, '');

export const isCorrectMathAnswer = (value, answer) => value === String(answer);

export const normalizeWritingInput = (value) => value.toUpperCase().replace(/\s/g, '');

export const normalizeWritingAnswer = (answer) => answer.replace(/\s/g, '');

export const isCorrectWritingAnswer = (value, answer) => value === normalizeWritingAnswer(answer);

export const isWrongSpokenAnswer = (spokenText, answer, homophones = []) =>
    spokenText.length >= 2 && spokenText !== answer && !homophones.includes(spokenText);
