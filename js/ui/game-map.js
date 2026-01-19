// 프로젝트 맵 시각화 UI
import { gameState } from '../core/game-state.js';
import { REGIONS } from '../data/lands.js';

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

    // 완성된 건물들도 함께 표시
    const completedTiles = renderCompletedBuildings();

    mapGrid.innerHTML = tiles + completedTiles;

    // 3D 보기 상태 유지
    if (is3DView) {
        mapGrid.classList.add('view-3d');
    }
}

// 지역별 프로젝트/건물 수집
function collectProjectsByRegion() {
    const regionData = {};

    // 모든 지역 초기화
    Object.values(REGIONS).forEach(region => {
        regionData[region.id] = {
            region,
            items: []  // { type: 'project'|'building'|'sold', data, ownerIndex }
        };
    });

    // 플레이어별 프로젝트 및 건물 수집
    gameState.players.forEach((player, playerIndex) => {
        // 현재 진행 중인 프로젝트
        if (player.currentProject && player.currentProject.land) {
            const land = player.currentProject.land;
            const regionId = land.region?.id || 'rural';
            if (regionData[regionId]) {
                regionData[regionId].items.push({
                    type: 'project',
                    data: player.currentProject,
                    ownerIndex: playerIndex
                });
            }
        }

        // 완성된 건물
        if (player.buildings) {
            player.buildings.forEach(building => {
                const land = building.land;
                const regionId = land.region?.id || 'rural';
                if (regionData[regionId]) {
                    regionData[regionId].items.push({
                        type: 'building',
                        data: building,
                        ownerIndex: playerIndex
                    });
                }
            });
        }

        // 매각 이력
        if (player.soldHistory) {
            player.soldHistory.forEach(sold => {
                const land = sold.land;
                const regionId = land.region?.id || 'rural';
                if (regionData[regionId]) {
                    regionData[regionId].items.push({
                        type: 'sold',
                        data: sold,
                        ownerIndex: playerIndex
                    });
                }
            });
        }
    });

    return regionData;
}

// 도시 지도 그리드 렌더링 (지역 기반)
// 지방 → 경기 외곽 → 경기 주요 → 서울 → 서울 핵심 순서
export function renderCityGrid() {
    const cityGridSection = document.getElementById('city-grid');
    if (!cityGridSection) return;

    // 지역별 프로젝트 수집
    const regionData = collectProjectsByRegion();

    // 지역 순서 (티어 순)
    const regionOrder = ['rural', 'gyeonggi_outer', 'gyeonggi_main', 'seoul', 'seoul_core'];

    let gridHtml = `
        <div class="city-map-wrapper region-based">
            <div class="city-map-title">🗺️ 개발 지도</div>
            <div class="city-map-legend">
                <span class="legend-item tier-1">🌾 지방</span>
                <span class="legend-arrow">→</span>
                <span class="legend-item tier-2">🏘️ 경기 외곽</span>
                <span class="legend-arrow">→</span>
                <span class="legend-item tier-3">🏙️ 경기 주요</span>
                <span class="legend-arrow">→</span>
                <span class="legend-item tier-4">🌆 서울</span>
                <span class="legend-arrow">→</span>
                <span class="legend-item tier-5">✨ 서울 핵심</span>
            </div>
            <div class="city-grid-container region-grid">
    `;

    regionOrder.forEach((regionId, rowIndex) => {
        const data = regionData[regionId];
        if (!data) return;

        const region = data.region;
        const tierClass = `tier-${region.tier}`;
        const items = data.items;

        // 최소 1칸은 표시 (빈 슬롯)
        const cellCount = Math.max(1, items.length);

        gridHtml += `
            <div class="city-row ${tierClass}" data-region="${regionId}" style="--region-color: ${region.color}">
                <div class="district-label region-label">
                    <span class="district-emoji">${region.emoji}</span>
                    <span class="district-name">${region.name}</span>
                </div>
                <div class="region-cells">
        `;

        if (items.length === 0) {
            // 빈 지역 - 빈 슬롯 하나 표시
            gridHtml += `
                <div class="city-cell ${tierClass} region-cell empty-region"
                     data-region="${regionId}">
                    <div class="cell-terrain"></div>
                    <div class="cell-empty">
                        <span class="empty-icon">${getEmptySlotIcon(region.tier)}</span>
                    </div>
                </div>
            `;
        } else {
            // 아이템들 표시
            items.forEach((item, cellIndex) => {
                const ownerClass = `owner-${item.ownerIndex}`;
                const playerName = gameState.players[item.ownerIndex]?.name || '';

                if (item.type === 'project') {
                    const project = item.data;
                    const hasBuilding = project.building !== null;

                    // 프로젝트 상태에 따른 아이콘 결정
                    let projectIcon = '🏗️';
                    let projectClass = 'constructing';
                    if (!project.building) {
                        projectIcon = '🏞️'; // 토지만 구매
                        projectClass = 'land-only';
                    } else if (!project.constructor) {
                        projectIcon = '📐'; // 설계 중
                        projectClass = 'designing';
                    }

                    gridHtml += `
                        <div class="city-cell ${ownerClass} ${tierClass} ${projectClass} region-cell"
                             data-region="${regionId}" data-owner="${item.ownerIndex}" data-type="project">
                            <div class="cell-terrain"></div>
                            <div class="cell-owner-tag">${playerName}</div>
                            ${hasBuilding ? `
                                <div class="cell-building">
                                    <span class="building-emoji">${project.building.emoji}</span>
                                    <div class="building-glow"></div>
                                </div>
                            ` : `
                                <div class="cell-project">
                                    <span class="project-icon">${projectIcon}</span>
                                </div>
                            `}
                            <div class="cell-land-name">${project.land.name}</div>
                        </div>
                    `;
                } else if (item.type === 'building') {
                    const building = item.data;
                    gridHtml += `
                        <div class="city-cell ${ownerClass} ${tierClass} has-building region-cell"
                             data-region="${regionId}" data-owner="${item.ownerIndex}" data-type="building">
                            <div class="cell-terrain"></div>
                            <div class="cell-owner-tag">${playerName}</div>
                            <div class="cell-building">
                                <span class="building-emoji">${building.building.emoji}</span>
                                <div class="building-glow"></div>
                            </div>
                            <div class="cell-land-name">${building.land.name}</div>
                        </div>
                    `;
                } else if (item.type === 'sold') {
                    const sold = item.data;
                    gridHtml += `
                        <div class="city-cell ${ownerClass} ${tierClass} sold region-cell"
                             data-region="${regionId}" data-owner="${item.ownerIndex}" data-type="sold">
                            <div class="cell-terrain"></div>
                            <div class="cell-owner-tag">${playerName}</div>
                            <div class="cell-sold">
                                <span class="sold-icon">${sold.building ? sold.building.emoji : '🏞️'}💰</span>
                            </div>
                            <div class="cell-land-name">${sold.land.name}</div>
                        </div>
                    `;
                }
            });
        }

        gridHtml += `
                </div>
            </div>
        `;
    });

    gridHtml += `
            </div>
            <div class="city-map-footer">
                <span>📍 토지를 구매하면 해당 지역에 표시됩니다</span>
            </div>
        </div>
    `;

    cityGridSection.innerHTML = gridHtml;
}

// 지역 티어별 배경 패턴
function getTierBackgroundPattern(tier) {
    const patterns = {
        1: 'linear-gradient(135deg, #3d5c3d 0%, #4a7c4e 100%)', // 시골 - 녹색
        2: 'linear-gradient(135deg, #5a7a5a 0%, #6b8e6b 100%)', // 경기 외곽 - 연녹색
        3: 'linear-gradient(135deg, #5a7a9a 0%, #7a9ec2 100%)', // 경기 주요 - 청색
        4: 'linear-gradient(135deg, #7a5a8a 0%, #9b7cb8 100%)', // 서울 - 보라색
        5: 'linear-gradient(135deg, #b8962b 0%, #d4af37 100%)'  // 서울 핵심 - 금색
    };
    return patterns[tier] || patterns[1];
}

// 빈 슬롯 아이콘 (지역별)
function getEmptySlotIcon(tier) {
    const icons = {
        1: '🌿', // 시골 - 풀
        2: '🌳', // 경기 외곽 - 나무
        3: '🏛️', // 경기 주요 - 건물
        4: '🏢', // 서울 - 빌딩
        5: '💎'  // 서울 핵심 - 다이아
    };
    return icons[tier] || '·';
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
        // 보유 중인 완성 건물
        player.buildings.forEach((building, buildingIndex) => {
            tiles.push(`
                <div class="project-tile player-${playerIndex} completed" data-player="${playerIndex}" data-building="${buildingIndex}" data-type="owned">
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
                        <div class="tile-cost">가치: ${gameState.formatMoney(building.salePrice)}</div>
                    </div>

                    <div class="progress-bar">
                        <div class="progress-fill complete"></div>
                    </div>
                </div>
            `);
        });

        // 매각 이력
        if (player.soldHistory) {
            player.soldHistory.forEach((sold, soldIndex) => {
                if (sold.type === 'building') {
                    tiles.push(`
                        <div class="project-tile player-${playerIndex} sold" data-player="${playerIndex}" data-sold="${soldIndex}" data-type="sold">
                            <div class="tile-header">
                                <span class="tile-player">${player.name}</span>
                                <span class="tile-phase sold">매각 완료</span>
                            </div>

                            <div class="tile-land">
                                <div class="land-visual sold">
                                    <div class="building-3d ${getBuildingSizeClass(sold.building)} sold">
                                        <span class="building-icon">${sold.building.emoji}</span>
                                        <div class="sold-overlay">💰</div>
                                    </div>
                                </div>
                            </div>

                            <div class="tile-info">
                                <div class="tile-land-name">${sold.land.name}</div>
                                <div class="tile-building-name">${sold.building.emoji} ${sold.building.name}</div>
                                <div class="tile-cost sold-price">매각가: ${gameState.formatMoney(sold.sellPrice)}</div>
                            </div>

                            <div class="progress-bar">
                                <div class="progress-fill sold"></div>
                            </div>
                        </div>
                    `);
                } else if (sold.type === 'land') {
                    tiles.push(`
                        <div class="project-tile player-${playerIndex} sold land-sold" data-player="${playerIndex}" data-sold="${soldIndex}" data-type="sold-land">
                            <div class="tile-header">
                                <span class="tile-player">${player.name}</span>
                                <span class="tile-phase sold">토지 매각</span>
                            </div>

                            <div class="tile-land">
                                <div class="land-visual sold">
                                    <span style="font-size: 2rem;">🏞️💰</span>
                                </div>
                            </div>

                            <div class="tile-info">
                                <div class="tile-land-name">${sold.land.name}</div>
                                <div class="tile-cost sold-price">매각가: ${gameState.formatMoney(sold.sellPrice)}</div>
                            </div>

                            <div class="progress-bar">
                                <div class="progress-fill sold"></div>
                            </div>
                        </div>
                    `);
                }
            });
        }
    });

    return tiles.join('');
}
