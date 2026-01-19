// 설계 페이즈 로직
import { gameState } from '../core/game-state.js';
import { buildings, getBuilding } from '../data/buildings.js';
import { calculateDesignFee, calculateArchitectBonus, getConstructionMultiplier } from '../data/architects.js';

// 건축 가능한 건물 목록 가져오기 (토지 적합성 기준)
export function getAvailableBuildings(land) {
    if (!land) return [];

    const suitable = land.suitableBuildings;
    const allBuildings = Object.values(buildings);

    // 적합 건물은 앞에, 나머지는 뒤에 (건축은 가능하나 보너스 없음)
    const suitableBuildings = allBuildings.filter(b => suitable.includes(b.name));
    const otherBuildings = allBuildings.filter(b => !suitable.includes(b.name));

    return [
        ...suitableBuildings.map(b => ({ ...b, isSuitable: true })),
        ...otherBuildings.map(b => ({ ...b, isSuitable: false }))
    ];
}

// 건축가 선택
export function selectArchitect(playerIndex, architectIndex) {
    const player = gameState.players[playerIndex];
    const architect = gameState.availableArchitects[architectIndex];

    if (!architect) {
        return { success: false, message: '해당 건축가가 없습니다.' };
    }

    if (!player.currentProject.land) {
        return { success: false, message: '먼저 토지를 구매해야 합니다.' };
    }

    // 선점 확인 (다른 플레이어가 이미 선택했는지)
    if (!gameState.isArchitectAvailable(architect.id)) {
        return {
            success: false,
            message: `${architect.name} 건축가는 이미 다른 플레이어가 선택했습니다.`,
            isClaimed: true
        };
    }

    return {
        success: true,
        architect,
        message: `${architect.name} 건축가 선택 가능`
    };
}

// 건물 선택 및 설계비 계산
export function selectBuilding(playerIndex, buildingName, architectIndex) {
    const player = gameState.players[playerIndex];
    const project = player.currentProject;
    const land = project.land;
    const architect = gameState.availableArchitects[architectIndex];

    if (!land || !architect) {
        return { success: false, message: '토지와 건축가를 먼저 선택해야 합니다.' };
    }

    const building = getBuilding(buildingName);
    if (!building) {
        return { success: false, message: '존재하지 않는 건물 유형입니다.' };
    }

    // 설계비 계산
    const designFee = calculateDesignFee(architect, building);

    // 시공비 미리보기 (건축가 팩터 적용)
    const baseConstructionCost = building.constructionCost;
    const constructionMultiplier = getConstructionMultiplier(architect);
    const estimatedConstructionCost = Math.round(baseConstructionCost * constructionMultiplier);

    // 토지 적합성 보너스
    const isSuitable = land.suitableBuildings.includes(buildingName);
    const landBonus = isSuitable ? land.suitabilityBonus : 1.0;

    // 건축가 특성 보너스
    const architectBonus = calculateArchitectBonus(architect, building);

    // 대표작 여부
    const isMasterpiece = architect.masterpieces.includes(buildingName);

    // 총 필요 자금
    const totalNeeded = designFee + estimatedConstructionCost;
    const maxAvailable = player.money + gameState.getMaxLoan(player) - player.loan;

    return {
        success: true,
        architect,
        building,
        designFee,
        estimatedConstructionCost,
        constructionMultiplier,
        totalNeeded,
        canAfford: totalNeeded <= maxAvailable,
        isSuitable,
        landBonus,
        architectBonus,
        isMasterpiece,
        message: isMasterpiece
            ? `✨ ${architect.name}의 대표작! 보너스 최대 적용`
            : `${architect.name}의 경험 부족... 보너스 반감`
    };
}

// 설계 완료 (건축가 + 건물 확정)
export function completeDesign(playerIndex, architectIndex, buildingName) {
    const preview = selectBuilding(playerIndex, buildingName, architectIndex);

    if (!preview.success) {
        return preview;
    }

    if (!preview.canAfford) {
        return {
            success: false,
            message: `자금이 부족합니다. (필요: ${gameState.formatMoney(preview.totalNeeded)})`
        };
    }

    const player = gameState.players[playerIndex];
    const project = player.currentProject;

    // 대출 필요 여부 확인
    let loanNeeded = preview.designFee - player.money;
    if (loanNeeded > 0) {
        gameState.takeLoan(playerIndex, loanNeeded);
    }

    // 설계비 지불
    gameState.payMoney(playerIndex, preview.designFee);

    // 프로젝트에 설계 정보 저장
    project.architect = preview.architect;
    project.designFee = preview.designFee;
    project.building = preview.building;

    // 평가 팩터 초기 계산 (토지 + 건축가 보너스)
    project.evaluationFactor = preview.landBonus * preview.architectBonus;

    // 건축가 선점 등록 (다른 플레이어가 사용 못하게)
    gameState.claimArchitect(preview.architect.id, playerIndex);

    // 사용된 건축가 목록에서 제거
    gameState.availableArchitects.splice(architectIndex, 1);

    const message = `📐 ${preview.architect.name} 건축가와 ${preview.building.emoji} ${preview.building.name} 설계 계약 완료!`;
    gameState.addLog(`${player.name}: ${message}`);

    return {
        success: true,
        ...preview,
        message
    };
}

// 페이즈 완료 체크
export function checkDesignPhaseComplete() {
    return gameState.players.every(player => {
        // 토지가 없는 플레이어는 설계 완료로 처리 (스킵)
        if (!player.currentProject || !player.currentProject.land) {
            return true;
        }
        // 토지가 있으면 설계가 완료되어야 함
        return player.currentProject.architect !== null &&
               player.currentProject.building !== null;
    });
}

// 건축가 정보 표시용 데이터
export function getArchitectDisplayInfo(architect, building = null) {
    const traitNames = {
        artistry: '🎨 예술성',
        efficiency: '⚙️ 효율성',
        functionality: '🔧 기능성',
        fame: '⭐ 유명도'
    };

    let bonus = architect.traitBonus;
    let feeText = `설계비 ${architect.feeMultiplier}배`;
    let costText = architect.constructionMultiplier > 1
        ? `시공비 ${Math.round((architect.constructionMultiplier - 1) * 100)}% 추가`
        : architect.constructionMultiplier < 1
            ? `시공비 ${Math.round((1 - architect.constructionMultiplier) * 100)}% 절감`
            : '시공비 표준';

    // 건물이 선택된 경우 대표작 체크
    let masterpieceNote = '';
    if (building) {
        if (!architect.masterpieces.includes(building.name)) {
            bonus = 1 + (bonus - 1) * 0.5;
            feeText += ' (대표작 아님: 30% 할인)';
            masterpieceNote = '⚠️ 대표작 아님 - 보너스 반감';
        } else {
            masterpieceNote = '✨ 대표작!';
        }
    }

    return {
        name: architect.name,
        portrait: architect.portrait,
        trait: traitNames[architect.trait],
        traitBonus: `+${((bonus - 1) * 100).toFixed(0)}%`,
        feeText,
        costText,
        masterpieces: architect.masterpieces.join(', '),
        masterpieceNote,
        description: architect.description
    };
}
