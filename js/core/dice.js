// 주사위 시스템

// 주사위 굴리기 (1~6)
export function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

// 여러 주사위 굴리기
export function rollMultipleDice(count) {
    const results = [];
    for (let i = 0; i < count; i++) {
        results.push(rollDice());
    }
    return results;
}

// 주사위 합계
export function getDiceSum(results) {
    return results.reduce((sum, val) => sum + val, 0);
}

// 시작 자금용 주사위 (3개)
export function rollStartingDice() {
    const results = rollMultipleDice(3);
    return {
        dice: results,
        total: getDiceSum(results)
    };
}

// 토지 구매 주사위 체크
export function checkLandPurchase(diceResult, requiredDice) {
    return requiredDice.includes(diceResult);
}

// 주사위 결과 문자열
export function getDiceEmoji(value) {
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return diceEmojis[value - 1] || '🎲';
}

// 주사위 HTML (피드용)
export function getDiceDisplay(results) {
    return results.map(r => getDiceEmoji(r)).join(' ');
}

// 애니메이션용 랜덤 시퀀스 생성
export function generateRollSequence(finalValue, steps = 10) {
    const sequence = [];
    for (let i = 0; i < steps - 1; i++) {
        sequence.push(rollDice());
    }
    sequence.push(finalValue);
    return sequence;
}

// 주사위 확률 계산 (성공 확률)
export function calculateSuccessProbability(requiredDice) {
    if (!requiredDice || requiredDice.length === 0) return 0;
    return (requiredDice.length / 6) * 100;
}

// 주사위 필요 조건 표시
export function formatDiceRequirement(requiredDice) {
    if (!requiredDice || requiredDice.length === 0) return '불가';
    if (requiredDice.length === 6) return '항상 성공';
    return requiredDice.join(', ') + ' 필요';
}
