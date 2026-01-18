// 대지 구매 페이즈 로직
import { gameState, GAME_PHASES } from '../core/game-state.js';
import { rollDice, checkLandPurchase, getDiceEmoji } from '../core/dice.js';
import { calculateLandDevelopmentCost } from '../data/lands.js';

// 토지 선택
export function selectLand(playerIndex, landIndex, priceType) {
    const player = gameState.players[playerIndex];
    const land = gameState.availableLands[landIndex];

    if (!land) {
        return { success: false, message: '해당 토지가 없습니다.' };
    }

    // 가격 타입별 가격 가져오기
    const price = land.prices[priceType];
    if (price === null) {
        return { success: false, message: `${priceType === 'urgent' ? '급매' : '경매'} 거래가 불가능한 토지입니다.` };
    }

    // 필요한 주사위 가져오기
    const requiredDice = land.diceRequired[priceType];
    if (!requiredDice || requiredDice.length === 0) {
        return { success: false, message: '이 가격으로는 거래할 수 없습니다.' };
    }

    // 개발 비용 계산
    const developmentCost = calculateLandDevelopmentCost(land);
    const totalCost = price + developmentCost;

    // 자금 체크 (대출 가능 금액 포함)
    const maxAvailable = player.money + gameState.getMaxLoan(player) - player.loan;
    if (totalCost > maxAvailable) {
        return {
            success: false,
            message: `자금이 부족합니다. (필요: ${gameState.formatMoney(totalCost)}, 가용: ${gameState.formatMoney(maxAvailable)})`
        };
    }

    return {
        success: true,
        land,
        priceType,
        price,
        developmentCost,
        totalCost,
        requiredDice,
        probability: (requiredDice.length / 6) * 100
    };
}

// 토지 구매 시도 (주사위 굴리기)
// externalDiceResult: 외부에서 이미 굴린 주사위 결과 (선택적)
export function attemptLandPurchase(playerIndex, landIndex, priceType, externalDiceResult = null) {
    const selection = selectLand(playerIndex, landIndex, priceType);
    if (!selection.success) {
        return selection;
    }

    // 주사위 결과 - 외부에서 전달받았으면 그것을 사용, 아니면 새로 굴림
    const diceResult = externalDiceResult !== null ? externalDiceResult : rollDice();
    const isSuccess = priceType === 'market' ? true : checkLandPurchase(diceResult, selection.requiredDice);

    const result = {
        ...selection,
        diceResult,
        diceEmoji: getDiceEmoji(diceResult),
        isSuccess
    };

    if (isSuccess) {
        // 구매 성공
        completeLandPurchase(playerIndex, landIndex, priceType, selection);
        result.message = `${getDiceEmoji(diceResult)} 낙찰 성공! ${selection.land.name} 구매 완료`;
        gameState.addLog(`${gameState.players[playerIndex].name}: ${result.message}`);
    } else {
        // 구매 실패 - 해당 토지는 다음 플레이어에게 기회
        gameState.pendingLands.push({
            originalIndex: landIndex,
            land: selection.land,
            failedPlayer: playerIndex
        });
        result.message = `${getDiceEmoji(diceResult)} 매매 불발! 다른 토지를 선택하거나 대기하세요.`;
        gameState.addLog(`${gameState.players[playerIndex].name}: ${selection.land.name} 매매 불발`);
    }

    return result;
}

// 토지 구매 시도 - 토지 객체 직접 전달 (인덱스 문제 우회)
export function attemptLandPurchaseByLand(playerIndex, land, priceType, diceResult) {
    const player = gameState.players[playerIndex];

    if (!land) {
        return { success: false, message: '토지 정보가 없습니다.' };
    }

    // 가격 타입별 가격 가져오기
    const price = land.prices[priceType];
    if (price === null || price === undefined) {
        return { success: false, message: `${priceType === 'urgent' ? '급매' : '경매'} 거래가 불가능한 토지입니다.` };
    }

    // 필요한 주사위 가져오기
    const requiredDice = land.diceRequired[priceType];
    if (!requiredDice || requiredDice.length === 0) {
        return { success: false, message: '이 가격으로는 거래할 수 없습니다.' };
    }

    // 개발 비용 계산
    const developmentCost = calculateLandDevelopmentCost(land);
    const totalCost = price + developmentCost;

    // 자금 체크 (대출 가능 금액 포함)
    const maxAvailable = player.money + gameState.getMaxLoan(player) - player.loan;
    if (totalCost > maxAvailable) {
        return {
            success: false,
            message: `자금이 부족합니다. (필요: ${gameState.formatMoney(totalCost)}, 가용: ${gameState.formatMoney(maxAvailable)})`
        };
    }

    // 주사위 성공 여부 확인
    const isSuccess = priceType === 'market' ? true : checkLandPurchase(diceResult, requiredDice);

    const result = {
        land,
        priceType,
        price,
        developmentCost,
        totalCost,
        requiredDice,
        diceResult,
        diceEmoji: getDiceEmoji(diceResult),
        isSuccess
    };

    if (isSuccess) {
        // 대출 필요 여부 확인
        let loanNeeded = totalCost - player.money;
        if (loanNeeded > 0) {
            gameState.takeLoan(playerIndex, loanNeeded);
        }

        // 자금 지불
        gameState.payMoney(playerIndex, totalCost);

        // 프로젝트에 토지 정보 저장
        const project = player.currentProject;
        project.land = land;
        project.landPrice = price;
        project.priceType = priceType;
        project.developmentCost = developmentCost;

        // availableLands에서 해당 토지 제거 (ID로 찾아서)
        const landIndex = gameState.availableLands.findIndex(l => l.id === land.id);
        if (landIndex !== -1) {
            gameState.availableLands.splice(landIndex, 1);
        }

        // 개발 지도에 토지 표시
        gameState.placeProjectOnMap(playerIndex, project);

        result.message = `${getDiceEmoji(diceResult)} 낙찰 성공! ${land.name} 구매 완료`;
        gameState.addLog(`${player.name}: ${result.message}`);
    } else {
        // 구매 실패
        result.message = `${getDiceEmoji(diceResult)} 매매 불발! 다른 토지를 선택하거나 대기하세요.`;
        gameState.addLog(`${player.name}: ${land.name} 매매 불발`);
    }

    return result;
}

// 토지 구매 완료
function completeLandPurchase(playerIndex, landIndex, priceType, selection) {
    const player = gameState.players[playerIndex];
    const project = player.currentProject;

    // 대출 필요 여부 확인
    let loanNeeded = selection.totalCost - player.money;
    if (loanNeeded > 0) {
        gameState.takeLoan(playerIndex, loanNeeded);
    }

    // 자금 지불
    gameState.payMoney(playerIndex, selection.totalCost);

    // 프로젝트에 토지 정보 저장
    project.land = selection.land;
    project.landPrice = selection.price;
    project.priceType = priceType;
    project.developmentCost = selection.developmentCost;

    // 사용된 토지 목록에서 제거
    gameState.availableLands.splice(landIndex, 1);

    // 개발 지도에 토지 표시
    gameState.placeProjectOnMap(playerIndex, project);
}

// 와일드카드 사용 (다른 사람이 낙찰받은 토지 10% 추가 지불로 가로채기)
export function useWildcard(playerIndex, targetPlayerIndex) {
    const player = gameState.players[playerIndex];
    const target = gameState.players[targetPlayerIndex];

    if (player.wildcardUsed) {
        return { success: false, message: '이미 와일드카드를 사용했습니다.' };
    }

    if (!target.currentProject || !target.currentProject.land) {
        return { success: false, message: '상대방이 아직 토지를 구매하지 않았습니다.' };
    }

    const originalPrice = target.currentProject.landPrice;
    const wildcardPrice = Math.floor(originalPrice * 1.1); // 10% 추가
    const developmentCost = target.currentProject.developmentCost;
    const totalCost = wildcardPrice + developmentCost;

    // 자금 체크
    const maxAvailable = player.money + gameState.getMaxLoan(player) - player.loan;
    if (totalCost > maxAvailable) {
        return {
            success: false,
            message: `자금이 부족합니다. (필요: ${gameState.formatMoney(totalCost)})`
        };
    }

    // 와일드카드 실행
    player.wildcardUsed = true;

    // 대출 처리
    let loanNeeded = totalCost - player.money;
    if (loanNeeded > 0) {
        gameState.takeLoan(playerIndex, loanNeeded);
    }
    gameState.payMoney(playerIndex, totalCost);

    // 토지 이전
    const land = target.currentProject.land;
    player.currentProject.land = land;
    player.currentProject.landPrice = wildcardPrice;
    player.currentProject.priceType = 'wildcard';
    player.currentProject.developmentCost = developmentCost;

    // 상대방 환불 (원래 가격)
    target.money += originalPrice + developmentCost;
    target.currentProject.land = null;
    target.currentProject.landPrice = 0;

    const message = `🃏 와일드카드! ${target.name}의 ${land.name}을(를) 가로챘습니다!`;
    gameState.addLog(`${player.name}: ${message}`);

    return { success: true, message, land, totalCost };
}

// 페이즈 완료 체크
export function checkLandPhaseComplete() {
    return gameState.players.every(player =>
        player.currentProject && player.currentProject.land !== null
    );
}

// 토지 정보 표시용 데이터
export function getLandDisplayInfo(land) {
    const bonuses = land.bonuses.join(' ');
    const attributes = [];

    if (land.attributes.slope === 'high') attributes.push('⛰️ 경사지');
    else if (land.attributes.slope === 'medium') attributes.push('📐 완경사');

    if (!land.attributes.infrastructure) attributes.push('🔌 인입필요');
    if (!land.attributes.roadAccess) attributes.push('🚫 맹지');

    return {
        name: land.name,
        description: land.description,
        area: `${land.area}평`,
        marketPrice: land.prices.market ? gameState.formatMoney(land.prices.market) : '-',
        urgentPrice: land.prices.urgent ? gameState.formatMoney(land.prices.urgent) : '-',
        auctionPrice: land.prices.auction ? gameState.formatMoney(land.prices.auction) : '-',
        suitableBuildings: land.suitableBuildings.join(', '),
        bonuses,
        attributes: attributes.join(' '),
        developmentCost: calculateLandDevelopmentCost(land)
    };
}
