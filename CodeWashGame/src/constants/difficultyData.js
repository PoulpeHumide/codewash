export const DIFFICULTY_CONTENT = {
    reading: {
        1: { charLength: 3 },
        2: { charLength: 4 },
        3: { charLength: 5 },
        4: { charLength: 6 },
        5: { charLength: 7 },
        6: { charLength: 8 },
        7: { useFunnyWords: true },
    },
    math: {
        1: { operations: ['+'], range: [0, 9], description: 'Single-digit addition (0-9)' },
        2: { operations: ['+'], range: [0, 20], description: 'Addition (0-20)' },
        3: { operations: ['+', '-'], range: [0, 20], description: 'Addition and subtraction (0-20)' },
        4: {
            operations: ['+', '-', '*'],
            range: [0, 20],
            multiplyRange: [1, 10],
            description: 'Add, subtract, multiply (0-20)',
        },
        5: {
            operations: ['+', '-', '*', '/'],
            range: [0, 20],
            divisionRange: [1, 10],
            description: 'All operations (0-20)',
        },
        6: { pemdas: true, range: [0, 20], description: 'Order of operations (0-20)' },
        7: { nightmare: true, description: 'Nightmare complexity' },
    },
    writing: {
        1: { targetLength: 3 },
        2: { targetLength: 4 },
        3: { targetLength: 5 },
        4: { targetLength: 6 },
        5: { targetLength: 7 },
        6: { targetLength: 8 },
        7: { targetLength: 9 },
    },
    patterns: {
        1: { axolotlCount: 2 },
        2: { axolotlCount: 3 },
        3: { axolotlCount: 4 },
        4: { axolotlCount: 5 },
        5: { axolotlCount: 6 },
        6: { axolotlCount: 7 },
        7: { axolotlCount: 8, resetSequence: true },
    },
    memory: {
        1: { pairs: 3, gridCols: 3 }, // 6 cards: 3x2
        2: { pairs: 4, gridCols: 4 }, // 8 cards: 4x2
        3: { pairs: 5, gridCols: 5 }, // 10 cards: 5x2
        4: { pairs: 6, gridCols: 4 }, // 12 cards: 4x3
        5: { pairs: 7, gridCols: 4 }, // 14 cards: 4x4 (2 empty)
        6: { pairs: 8, gridCols: 4 }, // 16 cards: 4x4
        7: { pairs: 10, gridCols: 5 }, // 20 cards: 5x4
    },
    cleaning: {
        // Cleaning is exempt from difficulty changes
        1: { exempt: true },
        2: { exempt: true },
        3: { exempt: true },
        4: { exempt: true },
        5: { exempt: true },
        6: { exempt: true },
        7: { exempt: true },
    },
};

// Difficulty image assets
export const DIFFICULTY_IMAGES = {
    1: 'assets/difficulty/Difficulty_1.png',
    2: 'assets/difficulty/Difficulty_2.png',
    3: 'assets/difficulty/Difficulty_3.png',
    4: 'assets/difficulty/Difficulty_4.png',
    5: 'assets/difficulty/Difficulty_5.png',
    6: 'assets/difficulty/Difficulty_6.png',
    7: 'assets/difficulty/Difficulty_7.png',
};
