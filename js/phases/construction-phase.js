// 시공 페이즈 로직
import { gameState } from '../core/game-state.js';
import { drawCards } from '../core/card-deck.js';
import { calculateConstructionCost, canConstructorBuild, calculatePaymentSchedule } from '../data/constructors.js';
import { applyRiskEffect } from '../data/risks.js';

// 시공사 선택 가능 여부 확인
export function canSelectConstructor(playerIndex, constructorIndex) {
    const player = gameState.players[playerIndex];
    const project = player.currentProject;
    const constructor = gameState.availableConstructors[constructorIndex];

    if (!constructor) {
        return { success: false, message: '해당 시공사가 없습니다.' };
    }

    if (!project.building) {
        return { success: false, message: '먼저 설계를 완료해야 합니다.' };
    }

    // 선점 확인 (다른 플레이어가 이미 선택했는지)
    if (!gameState.isConstructorAvailable(constructor.id)) {
        return {
            success: false,
            message: `${constructor.name}은(는) 이미 다른 플레이어가 선택했습니다.`,
            isClaimed: true
        };
    }

    // 시공사가 해당 건물을 지을 수 있는지 확인
    if (!canConstructorBuild(constructor, project.building.name)) {
        return {
            success: false,
            message: `${constructor.name}은(는) ${project.building.name}을(를) 시공할 수 없습니다.`
        };
    }

    // 시공비 계산
    const constructionCost = calculateConstructionCost(constructor, project.building, project.architect);

    // 예상 이자 비용 계산 (시공 기간 동안의 이자)
    const constructionPeriod = project.building.constructionPeriod;
    const currentLoan = player.loan;
    const estimatedInterest = Math.floor(currentLoan * player.interestRate * constructionPeriod);

    // 시공비 + 예상 이자 총비용
    const totalNeeded = constructionCost + estimatedInterest;

    // 대출 가능 금액 계산 (현재 보유 자금 기준 최대 대출)
    const maxLoanAvailable = gameState.getMaxLoan(player) - currentLoan;
    const maxAvailable = player.money + maxLoanAvailable;

    // 대출이 필요한 금액
    const loanNeeded = Math.max(0, totalNeeded - player.money);

    return {
        success: true,
        constructor,
        constructionCost,
        estimatedInterest,
        totalNeeded,
        loanNeeded,
        paymentSchedule: calculatePaymentSchedule(constructor, constructionCost),
        canAfford: totalNeeded <= maxAvailable,
        maxAvailable,
        constructionPeriod,
        riskBlocks: constructor.riskBlocks,
        artistryBonus: constructor.artistryBonus
    };
}

// 시공사 선택 완료
export function selectConstructor(playerIndex, constructorIndex) {
    const check = canSelectConstructor(playerIndex, constructorIndex);

    if (!check.success) {
        return check;
    }

    if (!check.canAfford) {
        return {
            success: false,
            message: `자금이 부족합니다. (필요: ${gameState.formatMoney(check.totalNeeded)}, 가용: ${gameState.formatMoney(check.maxAvailable)})`
        };
    }

    const player = gameState.players[playerIndex];
    const project = player.currentProject;

    // 시공비 대출 필요 시 미리 대출 실행
    if (check.loanNeeded > 0) {
        const loanSuccess = gameState.takeLoan(playerIndex, check.loanNeeded);
        if (!loanSuccess) {
            return {
                success: false,
                message: `대출 한도 초과로 시공이 불가합니다. (필요 대출: ${gameState.formatMoney(check.loanNeeded)})`
            };
        }
        gameState.addLog(`${player.name}: 시공비 대출 ${gameState.formatMoney(check.loanNeeded)} (이자 포함)`);
    }

    // 프로젝트에 시공사 정보 저장
    project.constructor = check.constructor;
    project.constructionCost = check.constructionCost;
    project.constructionProgress = 0;

    // 리스크 카드 뽑기 (시공 기간만큼)
    const riskCount = project.building.constructionPeriod;
    project.risks = drawCards(gameState.riskDeck, riskCount);

    // 시공사 선점 등록 (다른 플레이어가 사용 못하게)
    gameState.claimConstructor(check.constructor.id, playerIndex);

    // 사용된 시공사 목록에서 제거
    gameState.availableConstructors.splice(constructorIndex, 1);

    const loanInfo = check.loanNeeded > 0 ? ` (대출: ${gameState.formatMoney(check.loanNeeded)})` : '';
    const message = `🏗️ ${check.constructor.name}와 시공 계약 완료!${loanInfo} (리스크 카드 ${riskCount}장)`;
    gameState.addLog(`${player.name}: ${message}`);

    return {
        success: true,
        ...check,
        riskCount,
        message
    };
}

// 리스크 카드 처리
export function processRisks(playerIndex) {
    const player = gameState.players[playerIndex];
    const project = player.currentProject;
    const constructor = project.constructor;

    if (!constructor || project.risks.length === 0) {
        return { success: false, message: '처리할 리스크가 없습니다.' };
    }

    const results = [];
    let totalCostIncrease = 0;
    let totalDelayMonths = 0;
    let interestMultiplier = 1;
    let isTotalLoss = false;
    let blockedCount = 0;

    // 리스크 블록 카운터
    let remainingBlocks = constructor.riskBlocks;

    project.risks.forEach((risk, index) => {
        const effect = applyRiskEffect(risk, gameState, {
            ...constructor,
            riskBlocks: remainingBlocks
        });

        if (effect.isBlocked && remainingBlocks > 0) {
            remainingBlocks--;
            blockedCount++;
            effect.message = `🛡️ ${constructor.name}이(가) "${risk.name}"을(를) 방어!`;
        } else {
            totalCostIncrease += effect.costIncrease;
            totalDelayMonths += effect.delayMonths;
            if (effect.interestMultiplier > 1) {
                interestMultiplier *= effect.interestMultiplier;
            }
            if (effect.isTotalLoss) {
                isTotalLoss = true;
            }
        }

        results.push({
            risk,
            effect,
            month: index + 1
        });

        gameState.addLog(`[${index + 1}개월] ${effect.message}`);
    });

    // 비용 증가분 반영
    if (totalCostIncrease > 0) {
        const additionalCost = Math.floor(project.constructionCost * totalCostIncrease);
        project.totalLoss += additionalCost;
        project.constructionCost += additionalCost;
    }

    // 이자 비용 계산
    const constructionMonths = project.building.constructionPeriod + totalDelayMonths;
    const monthlyInterest = gameState.calculateInterest(player, 1);
    project.interestCost = Math.floor(monthlyInterest * constructionMonths * interestMultiplier);

    // 시공비 지불 (단계별)
    const paymentSchedule = calculatePaymentSchedule(constructor, project.constructionCost);
    paymentSchedule.forEach((payment, stage) => {
        let loanNeeded = payment - player.money;
        if (loanNeeded > 0) {
            gameState.takeLoan(playerIndex, loanNeeded);
        }
        gameState.payMoney(playerIndex, payment);
    });

    // 이자 비용 지불
    if (project.interestCost > 0) {
        let loanNeeded = project.interestCost - player.money;
        if (loanNeeded > 0) {
            gameState.takeLoan(playerIndex, loanNeeded);
        }
        gameState.payMoney(playerIndex, project.interestCost);
    }

    // 아뜰리에 시공사 보너스
    if (constructor.artistryBonus > 1) {
        project.evaluationFactor *= constructor.artistryBonus;
        gameState.addLog(`✨ ${constructor.name} 예술성 보너스! (x${constructor.artistryBonus})`);
    }

    project.riskBlocksUsed = blockedCount;

    return {
        success: true,
        results,
        summary: {
            totalRisks: project.risks.length,
            blocked: blockedCount,
            costIncrease: `+${(totalCostIncrease * 100).toFixed(0)}%`,
            delayMonths: totalDelayMonths,
            interestCost: project.interestCost,
            isTotalLoss
        },
        message: isTotalLoss
            ? '💥 건물 붕괴! 모든 투자가 손실되었습니다.'
            : `🏗️ 시공 완료! (리스크 ${blockedCount}개 방어, 추가비용 ${gameState.formatMoney(project.totalLoss)})`
    };
}

// 페이즈 완료 체크
export function checkConstructionPhaseComplete() {
    return gameState.players.every(player =>
        player.currentProject &&
        player.currentProject.constructor !== null
    );
}

// 시공사 정보 표시용 데이터
export function getConstructorDisplayInfo(constructor, building = null, architect = null) {
    const sizeNames = {
        large: '🏢 대형',
        medium: '🏠 중소',
        small: '🔧 영세',
        atelier: '🎨 아뜰리에',
        direct: '👷 직영공사'
    };

    let costText = constructor.costMultiplier > 1
        ? `시공비 ${Math.round((constructor.costMultiplier - 1) * 100)}% 추가`
        : constructor.costMultiplier < 1
            ? `시공비 ${Math.round((1 - constructor.costMultiplier) * 100)}% 절감`
            : '시공비 표준';

    let estimatedCost = null;
    if (building && architect) {
        estimatedCost = calculateConstructionCost(constructor, building, architect);
    }

    return {
        name: constructor.name,
        emoji: constructor.emoji,
        size: sizeNames[constructor.size],
        costText,
        estimatedCost: estimatedCost ? gameState.formatMoney(estimatedCost) : '-',
        riskBlocks: constructor.riskBlocks > 0
            ? `🛡️ 리스크 ${constructor.riskBlocks}개 방어`
            : '⚠️ 리스크 방어 불가',
        paymentStages: `${constructor.paymentStages}단계 분할`,
        artistryBonus: constructor.artistryBonus > 1
            ? `✨ 예술성 x${constructor.artistryBonus}`
            : null,
        canBuild: constructor.canBuild.join(', '),
        description: constructor.description
    };
}
