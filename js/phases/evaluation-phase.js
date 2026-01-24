// 평가 페이즈 로직
import { gameState } from '../core/game-state.js';

// 건축상 종류
const AWARDS = {
    ART_AWARD: {
        id: 'art_award',
        name: '🏆 건축 예술상',
        emoji: '🎨',
        description: '예술적 가치가 뛰어난 건물에 수여',
        bonus: 1.15,
        condition: (project) => {
            // 예술성 건축가 + 아뜰리에 시공사
            return project.architect.trait === 'artistry' &&
                project.constructor.artistryBonus > 1;
        }
    },
    EFFICIENCY_AWARD: {
        id: 'efficiency_award',
        name: '🏆 효율 건축상',
        emoji: '⚙️',
        description: '비용 대비 효과가 뛰어난 건물에 수여',
        bonus: 1.1,
        condition: (project) => {
            // 효율성 건축가 + 시공비 절감
            return project.architect.trait === 'efficiency' &&
                project.architect.constructionMultiplier < 1;
        }
    },
    LANDMARK_AWARD: {
        id: 'landmark_award',
        name: '🏆 랜드마크상',
        emoji: '🌟',
        description: '지역의 랜드마크가 될 건물에 수여',
        bonus: 1.2,
        condition: (project) => {
            // 유명 건축가 + 카페/호텔 + 경관 보너스 토지
            return project.architect.trait === 'fame' &&
                ['카페', '호텔', '대형카페'].includes(project.building.name) &&
                project.land.bonuses.some(b => b.includes('경관'));
        }
    },
    FUNCTIONAL_AWARD: {
        id: 'functional_award',
        name: '🏆 기능 우수상',
        emoji: '🔧',
        description: '사용성이 뛰어난 건물에 수여',
        bonus: 1.1,
        condition: (project) => {
            // 기능성 건축가 + 대표작
            return project.architect.trait === 'functionality' &&
                project.architect.masterpieces.includes(project.building.name);
        }
    },
    PERFECT_MATCH_AWARD: {
        id: 'perfect_match_award',
        name: '🏆 최적 조합상',
        emoji: '💎',
        description: '토지-건물-건축가가 완벽하게 조화된 경우',
        bonus: 1.25,
        condition: (project) => {
            // 적합 건물 + 대표작 + 대형/중소 시공사
            return project.land.suitableBuildings.includes(project.building.name) &&
                project.architect.masterpieces.includes(project.building.name) &&
                ['large', 'medium'].includes(project.constructor.size);
        }
    }
};

// 건축상 체크
export function checkAwards(project) {
    const earnedAwards = [];

    Object.values(AWARDS).forEach(award => {
        if (award.condition(project)) {
            earnedAwards.push(award);
        }
    });

    return earnedAwards;
}

// 최종 평가 팩터 계산
export function calculateFinalFactor(project) {
    let factor = project.evaluationFactor;

    // 건축상 보너스
    const awards = checkAwards(project);
    awards.forEach(award => {
        factor *= award.bonus;
    });

    // 입지 보너스 (토지의 보너스 개수에 따라)
    const locationBonusCount = project.land.bonuses.length;
    if (locationBonusCount > 0) {
        factor *= (1 + locationBonusCount * 0.05); // 보너스당 5%
    }

    return {
        baseFactor: project.evaluationFactor,
        awards,
        locationBonus: locationBonusCount * 0.05,
        finalFactor: factor
    };
}

// 매각 금액 계산
export function calculateSalePrice(playerIndex) {
    const player = gameState.players[playerIndex];
    const project = player.currentProject;

    if (!project || !project.building) {
        return { success: false, message: '완성된 프로젝트가 없습니다.' };
    }

    // 기본 투입 비용 계산
    const landCost = project.landPrice + project.developmentCost;
    const designCost = project.designFee;
    const constructionCost = project.constructionCost;
    const totalInvestment = landCost + designCost + constructionCost;

    // 손실 비용
    const lossCost = project.totalLoss + project.interestCost;

    // 최종 평가 팩터
    const factorResult = calculateFinalFactor(project);

    // 매각 금액 = 기본 투입 비용 × 평가 팩터 - 손실 비용
    const salePrice = Math.round(totalInvestment * factorResult.finalFactor - lossCost);

    // 대출 상환
    const loanRepayment = player.loan;
    const netProfit = salePrice - loanRepayment;

    return {
        success: true,
        breakdown: {
            landCost,
            designCost,
            constructionCost,
            totalInvestment,
            lossCost,
            baseFactor: factorResult.baseFactor,
            awards: factorResult.awards,
            locationBonus: factorResult.locationBonus,
            finalFactor: factorResult.finalFactor,
            salePrice,
            loanRepayment,
            netProfit
        }
    };
}

// 와일드카드 종류
const WILDCARDS = {
    LAND_DISCOUNT: {
        id: 'land_discount',
        name: '🎫 토지 할인권',
        description: '다음 토지 구매 시 20% 할인',
        effect: { type: 'land_discount', value: 0.2 }
    },
    DESIGN_FREE: {
        id: 'design_free',
        name: '🎫 설계비 면제권',
        description: '다음 설계비 무료',
        effect: { type: 'design_free', value: 1 }
    },
    RISK_BLOCK: {
        id: 'risk_block',
        name: '🛡️ 리스크 방어권',
        description: '리스크 카드 1장 무효화',
        effect: { type: 'risk_block', value: 1 }
    },
    BONUS_DICE: {
        id: 'bonus_dice',
        name: '🎲 행운 주사위',
        description: '주사위 재굴림 1회',
        effect: { type: 'bonus_dice', value: 1 }
    },
    LOAN_RATE_CUT: {
        id: 'loan_rate_cut',
        name: '💰 금리 인하권',
        description: '대출 이자율 50% 감소',
        effect: { type: 'loan_rate_cut', value: 0.5 }
    }
};

// 평가에 따른 와일드카드 지급
function grantWildcard(playerIndex, awards) {
    const player = gameState.players[playerIndex];

    // 상을 받은 경우 와일드카드 지급
    if (awards.length >= 2) {
        // 2개 이상의 상을 받으면 와일드카드 2개
        const wildcards = Object.values(WILDCARDS);
        const card1 = wildcards[Math.floor(Math.random() * wildcards.length)];
        const card2 = wildcards[Math.floor(Math.random() * wildcards.length)];

        if (!player.wildcards) player.wildcards = [];
        player.wildcards.push({ ...card1 }, { ...card2 });

        gameState.addLog(`🎁 ${player.name}: 와일드카드 2장 획득! (${card1.name}, ${card2.name})`);
        return [card1, card2];
    } else if (awards.length === 1) {
        // 1개의 상을 받으면 와일드카드 1개
        const wildcards = Object.values(WILDCARDS);
        const card = wildcards[Math.floor(Math.random() * wildcards.length)];

        if (!player.wildcards) player.wildcards = [];
        player.wildcards.push({ ...card });

        gameState.addLog(`🎁 ${player.name}: 와일드카드 획득! (${card.name})`);
        return [card];
    }

    return [];
}

// 건물 평가 완료 및 매각
export function completeEvaluation(playerIndex) {
    const result = calculateSalePrice(playerIndex);

    if (!result.success) {
        return result;
    }

    const player = gameState.players[playerIndex];
    const project = player.currentProject;
    const bd = result.breakdown;

    // 인접 보너스 적용
    const adjacencyBonus = gameState.calculateAdjacencyBonus(playerIndex);
    if (adjacencyBonus > 0) {
        bd.finalFactor *= (1 + adjacencyBonus);
        bd.salePrice = Math.round(bd.totalInvestment * bd.finalFactor - bd.lossCost);
        bd.netProfit = bd.salePrice - bd.loanRepayment;
        gameState.addLog(`🏘️ 인접 보너스: +${(adjacencyBonus * 100).toFixed(0)}%`);
    }

    // 프로젝트에 평가 결과 저장 (건물 가치만 저장, 현금은 지급하지 않음)
    project.evaluationFactor = bd.finalFactor;
    project.salePrice = bd.salePrice;  // 대출 상환 전 매각 금액 저장

    // 대출은 유지 (건물 매각 시에만 상환)
    // player.loan = 0; // 자동 상환 제거

    // 지도에 프로젝트 배치
    const mapPosition = gameState.placeProjectOnMap(playerIndex, project);
    if (mapPosition) {
        gameState.addLog(`📍 건물 배치: ${gameState.cityMap[mapPosition.y][mapPosition.x].district} (${mapPosition.x}, ${mapPosition.y})`);
    }

    // 로그 기록
    gameState.addLog(`===== ${player.name} 건물 평가 =====`);
    gameState.addLog(`${project.building.emoji} ${project.building.name} @ ${project.land.name}`);
    gameState.addLog(`투자비용: ${gameState.formatMoney(bd.totalInvestment)}`);
    gameState.addLog(`평가 팩터: x${bd.finalFactor.toFixed(2)}`);

    if (bd.awards.length > 0) {
        bd.awards.forEach(award => {
            gameState.addLog(`${award.name} 수상! (x${award.bonus})`);
        });
    }

    gameState.addLog(`평가 금액: ${gameState.formatMoney(bd.salePrice)}`);
    gameState.addLog(`대출 잔액: ${gameState.formatMoney(bd.loanRepayment)}`);
    gameState.addLog(`예상 순이익: ${gameState.formatMoney(bd.netProfit)}`);

    // 와일드카드 지급
    const grantedWildcards = grantWildcard(playerIndex, bd.awards);

    const profitRate = ((bd.netProfit / bd.totalInvestment) * 100).toFixed(1);
    const profitSign = bd.netProfit >= bd.totalInvestment ? '+' : '';

    return {
        success: true,
        ...result,
        grantedWildcards,
        adjacencyBonus,
        profitRate: `${profitSign}${profitRate}%`,
        message: bd.netProfit >= bd.totalInvestment
            ? `🎉 수익 실현! ${gameState.formatMoney(bd.netProfit)} (${profitSign}${profitRate}%)`
            : `📉 손실 발생... ${gameState.formatMoney(bd.netProfit)} (${profitRate}%)`
    };
}

// 페이즈 완료 체크
export function checkEvaluationPhaseComplete() {
    return gameState.players.every(player => {
        // PM 컨설팅으로 라운드 스킵한 플레이어는 완료로 처리
        if (player.pmSkippedRound === gameState.currentRound) {
            return true;
        }
        // 설계 프로젝트 매각한 플레이어는 완료로 처리
        if (player.designSoldRound === gameState.currentRound) {
            return true;
        }
        // 토지나 건물이 없는 플레이어는 평가 완료로 처리 (스킵)
        if (!player.currentProject || !player.currentProject.land || !player.currentProject.building) {
            return true;
        }
        // 시공사가 없는 플레이어도 평가 완료로 처리 (스킵)
        if (!player.currentProject.constructor) {
            return true;
        }
        // 토지, 건물, 시공사가 있으면 매각가가 설정되어야 함
        return player.currentProject.salePrice > 0;
    });
}

// 라운드 결과 요약
export function getRoundSummary() {
    const rankings = gameState.players
        .map(player => ({
            name: player.name,
            building: player.currentProject?.building?.name || '-',
            salePrice: player.currentProject?.salePrice || 0,
            factor: player.currentProject?.evaluationFactor || 1
        }))
        .sort((a, b) => b.salePrice - a.salePrice);

    // 다음 라운드 선 플레이어 계산 (현재 선 플레이어의 다음 사람)
    const nextStartingPlayer = (gameState.roundStartingPlayer + 1) % gameState.players.length;
    const nextFirstName = gameState.players[nextStartingPlayer]?.name || '알 수 없음';

    return {
        round: gameState.currentRound,
        rankings,
        nextRoundFirst: nextFirstName // 다음 플레이어가 선
    };
}

// 최종 게임 결과
export function getFinalResults() {
    const finalRankings = gameState.players
        .map(player => {
            // 건물 가치 계산
            const buildingValue = player.buildings.reduce((total, b) => total + (b.salePrice || 0), 0);
            // 총 자산 = 보유 현금 + 건물 가치 - 대출
            const totalAssets = player.money + buildingValue - player.loan;
            // 수상 내역
            const awards = player.buildings.reduce((acc, b) => {
                if (b.awards && b.awards.length > 0) {
                    acc.push(...b.awards.map(a => a.name));
                }
                return acc;
            }, []);

            return {
                name: player.name,
                money: player.money,
                buildingValue: buildingValue,
                loan: player.loan,
                totalAssets: totalAssets,
                buildingsCount: player.buildings.length,
                awards: awards,
                buildings: player.buildings.map(p => ({
                    name: p.building?.name || '건물',
                    emoji: p.building?.emoji || '🏠',
                    land: p.land?.name || '토지',
                    salePrice: p.salePrice || 0
                }))
            };
        })
        .sort((a, b) => b.totalAssets - a.totalAssets);

    return {
        winner: finalRankings[0],
        rankings: finalRankings,
        totalRounds: gameState.maxRounds
    };
}
