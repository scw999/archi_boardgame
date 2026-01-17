// 카드 덱 관리 유틸리티

// 덱 셔플 (Fisher-Yates 알고리즘)
export function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 카드 드로우
export function drawCard(deck) {
    if (deck.length === 0) return null;
    return deck.pop();
}

// 여러 장 드로우
export function drawCards(deck, count) {
    const drawn = [];
    for (let i = 0; i < count && deck.length > 0; i++) {
        drawn.push(deck.pop());
    }
    return drawn;
}

// 카드를 덱 맨 아래에 넣기
export function returnToBottom(deck, card) {
    deck.unshift(card);
}

// 카드를 덱에서 제거
export function removeCard(deck, cardId) {
    const index = deck.findIndex(card => card.id === cardId);
    if (index > -1) {
        return deck.splice(index, 1)[0];
    }
    return null;
}

// 덱에서 특정 카드 찾기
export function findCard(deck, cardId) {
    return deck.find(card => card.id === cardId);
}

// 덱 리필 (버린 카드들을 다시 섞어서 추가)
export function refillDeck(deck, discardPile) {
    const reshuffled = shuffleDeck(discardPile);
    deck.push(...reshuffled);
    discardPile.length = 0;
    return deck;
}

// 카드 교체 (2장 새로 뽑기)
export function replaceCards(deck, availableCards, indicesToReplace) {
    indicesToReplace.forEach(index => {
        if (index >= 0 && index < availableCards.length && deck.length > 0) {
            // 기존 카드는 덱 맨 아래로
            returnToBottom(deck, availableCards[index]);
            // 새 카드 드로우
            availableCards[index] = deck.pop();
        }
    });
    return availableCards;
}

// 덱 상태 정보
export function getDeckInfo(deck, name = 'Deck') {
    return {
        name,
        remaining: deck.length,
        isEmpty: deck.length === 0
    };
}

// 카드 비교 함수 (정렬용)
export function compareCards(a, b, sortBy = 'id') {
    if (typeof a[sortBy] === 'string') {
        return a[sortBy].localeCompare(b[sortBy]);
    }
    return a[sortBy] - b[sortBy];
}
