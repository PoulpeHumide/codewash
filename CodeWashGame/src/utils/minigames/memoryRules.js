export const createMemoryDeck = (friendlyMobs, pairCount, random = Math.random) => {
    const allMobKeys = Object.keys(friendlyMobs);
    const shuffledMobs = [...allMobKeys].sort(() => random() - 0.5);
    const selectedMobs = shuffledMobs.slice(0, pairCount);
    const deck = [...selectedMobs, ...selectedMobs].sort(() => random() - 0.5);

    return deck.map((mobKey, id) => ({ id, color: mobKey, img: friendlyMobs[mobKey] }));
};

export const canFlipMemoryCard = (isProcessing, flippedIndices, matchedPairs, cards, index) =>
    !isProcessing && !flippedIndices.includes(index) && !matchedPairs.includes(cards[index].color);

export const isMatchingMemoryPair = (cards, firstIndex, secondIndex) =>
    cards[firstIndex].color === cards[secondIndex].color;

export const hasMemoryGameWon = (matchedPairs, pairCount) => matchedPairs.length === pairCount;
