// 프로젝트 맵 시각화 UI
import { gameState } from '../core/game-state.js';

let is3DView = false;

// 맵 초기화
export function initProjectMap() {
    const toggleBtn = document.getElementById('toggle-map-view');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleMapView);
    }
}

// 3D 보기 토글
export function toggleMapView() {
    const mapGrid = document.getElementById('map-grid');
    const toggleBtn = document.getElementById('toggle-map-view');

    if (!mapGrid || !toggleBtn) return;

    is3DView = !is3DView;

    if (is3DView) {
        mapGrid.classList.add('view-3d');
        toggleBtn.textContent = '2D 보기';
    } else {
        mapGrid.classList.remove('view-3d');
        toggleBtn.textContent = '3D 보기';
    }
}

// 맵 렌더링
export function renderProjectMap() {
    const mapSection = document.getElementById('project-map');
    const mapGrid = document.getElementById('map-grid');

    if (!mapSection || !mapGrid) return;

    // 게임이 진행 중일 때만 표시
    if (gameState.phase === 'setup' || gameState.players.length === 0) {
        mapSection.classList.add('hidden');
        return;
    }

    mapSection.classList.remove('hidden');

    // 모든 플레이어의 프로젝트 타일 생성
    const tiles = gameState.players.map((player, index) => {
        return renderProjectTile(player, index);
    }).join('');

    mapGrid.innerHTML = tiles;

    // 3D 보기 상태 유지
    if (is3DView) {
        mapGrid.classList.add('view-3d');
    }
}

// 개별 프로젝트 타일 렌더링
function renderProjectTile(player, playerIndex) {
    const project = player.currentProject;

    // 프로젝트가 없는 경우
    if (!project) {
        return `
            <div class="project-tile empty player-${playerIndex}">
                <div class="tile-player">${player.name}</div>
                <div>대기 중...</div>
            </div>
        `;
    }

    // 진행 단계 결정
    const phase = getProjectPhase(project);
    const phaseLabel = getPhaseLabel(phase);

    return `
        <div class="project-tile player-${playerIndex}" data-player="${playerIndex}">
            <div class="tile-header">
                <span class="tile-player">${player.name}</span>
                <span class="tile-phase ${phase}">${phaseLabel}</span>
            </div>

            <div class="tile-land">
                ${renderLandVisual(project, phase)}
            </div>

            <div class="tile-info">
                ${project.land ? `<div class="tile-land-name">${project.land.name}</div>` : ''}
                ${project.building ? `<div class="tile-building-name">${project.building.emoji} ${project.building.name}</div>` : ''}
                ${project.architect ? `<div class="tile-architect">${project.architect.portrait} ${project.architect.name}</div>` : ''}
                ${project.constructor ? `<div class="tile-cost">시공: ${gameState.formatMoney(project.constructionCost)}</div>` : ''}
            </div>

            <div class="progress-bar">
                <div class="progress-fill ${phase}"></div>
            </div>
        </div>
    `;
}

// 대지 시각화 렌더링
function renderLandVisual(project, phase) {
    const hasBuilding = project.building !== null;
    const isConstructing = phase === 'construction';
    const isComplete = phase === 'complete';

    let buildingHtml = '';

    if (project.building) {
        const sizeClass = getBuildingSizeClass(project.building);
        const constructClass = isConstructing ? 'constructing' : '';

        buildingHtml = `
            <div class="building-3d ${sizeClass} ${constructClass}">
                <span class="building-icon">${project.building.emoji}</span>
                <div class="building-shadow"></div>
            </div>
        `;
    } else if (project.land) {
        // 설계 전: 대지만 표시
        buildingHtml = `<span style="font-size: 1.5rem;">🌿</span>`;
    }

    // 설계 중인 경우 청사진 표시
    const blueprintHtml = phase === 'design' && !project.building ? '<div class="blueprint"></div>' : '';

    return `
        <div class="land-visual ${hasBuilding ? 'has-building' : ''}">
            ${blueprintHtml}
            ${buildingHtml}
        </div>
    `;
}

// 프로젝트 진행 단계 판단
function getProjectPhase(project) {
    if (!project) return 'empty';
    if (project.salePrice > 0) return 'complete';
    if (project.constructor) return 'construction';
    if (project.building) return 'design';
    if (project.land) return 'land';
    return 'empty';
}

// 단계 라벨 반환
function getPhaseLabel(phase) {
    const labels = {
        empty: '대기',
        land: '대지 확보',
        design: '설계 중',
        construction: '시공 중',
        complete: '완료'
    };
    return labels[phase] || '진행 중';
}

// 건물 크기 클래스 반환
function getBuildingSizeClass(building) {
    if (!building) return 'medium';

    const area = building.requiredArea || 100;

    if (area >= 200) return 'large';
    if (area >= 100) return 'medium';
    return 'small';
}

// 완성된 건물 목록 렌더링 (라운드 종료 후)
export function renderCompletedBuildings() {
    const tiles = [];

    gameState.players.forEach((player, playerIndex) => {
        player.buildings.forEach((building, buildingIndex) => {
            tiles.push(`
                <div class="project-tile player-${playerIndex} completed" data-player="${playerIndex}" data-building="${buildingIndex}">
                    <div class="tile-header">
                        <span class="tile-player">${player.name}</span>
                        <span class="tile-phase complete">완료</span>
                    </div>

                    <div class="tile-land">
                        <div class="land-visual has-building">
                            <div class="building-3d ${getBuildingSizeClass(building.building)}">
                                <span class="building-icon">${building.building.emoji}</span>
                                <div class="building-shadow"></div>
                            </div>
                        </div>
                    </div>

                    <div class="tile-info">
                        <div class="tile-land-name">${building.land.name}</div>
                        <div class="tile-building-name">${building.building.emoji} ${building.building.name}</div>
                        <div class="tile-cost">매각: ${gameState.formatMoney(building.salePrice)}</div>
                    </div>

                    <div class="progress-bar">
                        <div class="progress-fill complete"></div>
                    </div>
                </div>
            `);
        });
    });

    return tiles.join('');
}
