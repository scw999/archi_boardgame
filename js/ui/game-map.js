// 아이소메트릭 개발 지도 UI
import { gameState } from '../core/game-state.js';
import { REGIONS } from '../data/lands.js';

let is3DView = false;
let selectedPlotIndex = null;

// 아이소메트릭 맵 위의 플롯(대지) 위치 정의
// 이미지 기준 상대 좌표 (%)
const MAP_PLOTS = [
    // === 해변가 (SEASIDE) - 우측 하단 ===
    { id: 'beach_1', x: 88, y: 78, zone: 'seaside', tier: 3, label: '해변 리조트', emoji: '🏖️' },
    { id: 'beach_2', x: 80, y: 85, zone: 'seaside', tier: 3, label: '해안가', emoji: '🌊' },
    { id: 'beach_3', x: 72, y: 90, zone: 'seaside', tier: 2, label: '팜비치', emoji: '🌴' },

    // === 리버프론트 (RIVERSIDE) - 중앙 우측 ===
    { id: 'river_1', x: 65, y: 55, zone: 'riverside', tier: 4, label: '한강뷰', emoji: '🌉' },
    { id: 'river_2', x: 58, y: 65, zone: 'riverside', tier: 4, label: '강변', emoji: '🏞️' },
    { id: 'river_3', x: 50, y: 75, zone: 'riverside', tier: 3, label: '수변공원', emoji: '🛶' },

    // === 서울 핵심 (SEOUL_CORE) - 중앙 타워 지역 ===
    { id: 'core_1', x: 48, y: 25, zone: 'seoul_core', tier: 5, label: '랜드마크타워', emoji: '🗼' },
    { id: 'core_2', x: 55, y: 35, zone: 'seoul_core', tier: 5, label: '금융센터', emoji: '🏦' },
    { id: 'core_3', x: 42, y: 38, zone: 'seoul_core', tier: 5, label: 'CBD', emoji: '✨' },

    // === 서울 (SEOUL) - 도심 주변 ===
    { id: 'seoul_1', x: 35, y: 45, zone: 'seoul', tier: 4, label: '강남', emoji: '🌆' },
    { id: 'seoul_2', x: 28, y: 55, zone: 'seoul', tier: 4, label: '서초', emoji: '🏙️' },
    { id: 'seoul_3', x: 62, y: 45, zone: 'seoul', tier: 4, label: '잠실', emoji: '🎡' },
    { id: 'seoul_4', x: 70, y: 35, zone: 'seoul', tier: 4, label: '송파', emoji: '🏢' },

    // === 경기 주요 (GYEONGGI_MAIN) - 중간 지역 ===
    { id: 'gyeonggi_main_1', x: 22, y: 42, zone: 'gyeonggi_main', tier: 3, label: '분당', emoji: '🏘️' },
    { id: 'gyeonggi_main_2', x: 15, y: 50, zone: 'gyeonggi_main', tier: 3, label: '판교', emoji: '💼' },
    { id: 'gyeonggi_main_3', x: 75, y: 50, zone: 'gyeonggi_main', tier: 3, label: '위례', emoji: '🏗️' },

    // === 경기 외곽 (GYEONGGI_OUTER) - 외곽 지역 ===
    { id: 'gyeonggi_outer_1', x: 8, y: 35, zone: 'gyeonggi_outer', tier: 2, label: '용인', emoji: '🏡' },
    { id: 'gyeonggi_outer_2', x: 12, y: 60, zone: 'gyeonggi_outer', tier: 2, label: '수원', emoji: '🏯' },
    { id: 'gyeonggi_outer_3', x: 85, y: 45, zone: 'gyeonggi_outer', tier: 2, label: '하남', emoji: '🌳' },

    // === 지방/시골 (RURAL) - 산악/숲 지역 ===
    { id: 'rural_1', x: 5, y: 20, zone: 'rural', tier: 1, label: '산촌', emoji: '🏔️' },
    { id: 'rural_2', x: 18, y: 15, zone: 'rural', tier: 1, label: '임야', emoji: '🌲' },
    { id: 'rural_3', x: 30, y: 12, zone: 'rural', tier: 1, label: '전원', emoji: '🌾' },

    // === 명소/특구 (LANDMARK) ===
    { id: 'landmark_1', x: 40, y: 55, zone: 'landmark', tier: 4, label: 'COEX', emoji: '🎪' },
    { id: 'landmark_2', x: 25, y: 30, zone: 'landmark', tier: 4, label: '테마파크', emoji: '🎢' },

    // === 테크밸리 (TECH_HUB) ===
    { id: 'tech_1', x: 10, y: 45, zone: 'tech_hub', tier: 4, label: '판교테크노', emoji: '💻' },
    { id: 'tech_2', x: 78, y: 25, zone: 'tech_hub', tier: 4, label: 'R&D센터', emoji: '🔬' }
];

// 플레이어별 색상
const PLAYER_COLORS = [
    { bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444', glow: '#fca5a5' },   // 빨강
    { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6', glow: '#93c5fd' },  // 파랑
    { bg: 'rgba(34, 197, 94, 0.8)', border: '#22c55e', glow: '#86efac' },   // 초록
    { bg: 'rgba(168, 85, 247, 0.8)', border: '#a855f7', glow: '#d8b4fe' }   // 보라
];

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

// 기존 맵 렌더링 (프로젝트 현황용)
export function renderProjectMap() {
    const mapSection = document.getElementById('project-map');
    const mapGrid = document.getElementById('map-grid');

    if (!mapSection || !mapGrid) return;

    if (gameState.phase === 'setup' || gameState.players.length === 0) {
        mapSection.classList.add('hidden');
        return;
    }

    mapSection.classList.remove('hidden');

    const tiles = gameState.players.map((player, index) => {
        return renderProjectTile(player, index);
    }).join('');

    const completedTiles = renderCompletedBuildings();
    mapGrid.innerHTML = tiles + completedTiles;

    if (is3DView) {
        mapGrid.classList.add('view-3d');
    }
}

// 아이소메트릭 도시 지도 렌더링
export function renderCityGrid() {
    const cityGridSection = document.getElementById('city-grid');
    if (!cityGridSection) return;

    // 플레이어별 소유 대지 정보 수집
    const ownedPlots = collectOwnedPlots();

    // 사용된 플롯 인덱스 추적
    const usedPlotIndices = new Set();
    ownedPlots.forEach(plot => {
        if (plot.plotIndex !== undefined) {
            usedPlotIndices.add(plot.plotIndex);
        }
    });

    let html = `
        <div class="iso-city-container">
            <div class="iso-city-header">
                <h3>🗺️ 개발 지도</h3>
                <div class="iso-city-legend">
                    ${gameState.players.map((p, i) => `
                        <span class="legend-player" style="--player-color: ${PLAYER_COLORS[i].border}">
                            <span class="legend-dot"></span>${p.name}
                        </span>
                    `).join('')}
                </div>
            </div>

            <div class="iso-city-map-wrapper">
                <div class="iso-city-map" id="iso-city-map">
                    <img src="assets/images/city-map.png" alt="개발 지도" class="iso-map-bg"
                         onerror="this.style.display='none'; this.parentElement.classList.add('no-image');">

                    <!-- 플롯 마커들 -->
                    <div class="plot-markers">
                        ${MAP_PLOTS.map((plot, index) => {
                            const owned = ownedPlots.find(o => o.plotIndex === index);
                            return renderPlotMarker(plot, index, owned);
                        }).join('')}
                    </div>

                    <!-- 소유 대지/건물 표시 (맵 이미지 없을 때 폴백) -->
                    <div class="owned-plots-overlay">
                        ${ownedPlots.map(plot => renderOwnedPlotMarker(plot)).join('')}
                    </div>
                </div>
            </div>

            <!-- 소유 현황 패널 -->
            <div class="iso-city-sidebar">
                <div class="sidebar-section">
                    <h4>📍 내 자산</h4>
                    ${renderOwnedAssetsList(ownedPlots)}
                </div>

                <div class="sidebar-section zone-legend">
                    <h4>🏷️ 지역 구분</h4>
                    <div class="zone-items">
                        <span class="zone-item tier-5">✨ 서울 핵심</span>
                        <span class="zone-item tier-4">🌆 서울</span>
                        <span class="zone-item tier-3">🏙️ 경기 주요</span>
                        <span class="zone-item tier-2">🏘️ 경기 외곽</span>
                        <span class="zone-item tier-1">🌾 지방</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    cityGridSection.innerHTML = html;
    cityGridSection.classList.remove('hidden');

    // 플롯 클릭 이벤트 바인딩
    bindPlotEvents();
}

// 소유 대지 정보 수집
function collectOwnedPlots() {
    const ownedPlots = [];
    let plotCounter = 0;

    gameState.players.forEach((player, playerIndex) => {
        // 현재 진행 중인 프로젝트
        if (player.currentProject && player.currentProject.land) {
            const project = player.currentProject;
            const assignedPlot = assignPlotByRegion(project.land.region, plotCounter++);

            ownedPlots.push({
                type: 'project',
                playerIndex,
                playerName: player.name,
                land: project.land,
                building: project.building,
                constructor: project.constructor,
                plotIndex: assignedPlot,
                status: getProjectStatus(project)
            });
        }

        // 완성된 건물
        if (player.buildings) {
            player.buildings.forEach(building => {
                const assignedPlot = assignPlotByRegion(building.land.region, plotCounter++);
                ownedPlots.push({
                    type: 'completed',
                    playerIndex,
                    playerName: player.name,
                    land: building.land,
                    building: building.building,
                    salePrice: building.salePrice,
                    plotIndex: assignedPlot,
                    status: 'completed'
                });
            });
        }

        // 매각 이력
        if (player.soldHistory) {
            player.soldHistory.forEach(sold => {
                const assignedPlot = assignPlotByRegion(sold.land.region, plotCounter++);
                ownedPlots.push({
                    type: 'sold',
                    playerIndex,
                    playerName: player.name,
                    land: sold.land,
                    building: sold.building,
                    sellPrice: sold.sellPrice,
                    plotIndex: assignedPlot,
                    status: 'sold'
                });
            });
        }
    });

    return ownedPlots;
}

// 지역에 맞는 플롯 할당
function assignPlotByRegion(region, counter) {
    if (!region) return counter % MAP_PLOTS.length;

    const regionId = region.id;
    const matchingPlots = MAP_PLOTS.map((plot, index) => ({ ...plot, index }))
        .filter(plot => plot.zone === regionId || getTierFromZone(plot.zone) === region.tier);

    if (matchingPlots.length > 0) {
        return matchingPlots[counter % matchingPlots.length].index;
    }

    return counter % MAP_PLOTS.length;
}

// 존에서 티어 가져오기
function getTierFromZone(zone) {
    const zoneTiers = {
        'rural': 1,
        'gyeonggi_outer': 2,
        'gyeonggi_main': 3,
        'seaside': 3,
        'riverside': 4,
        'seoul': 4,
        'landmark': 4,
        'tech_hub': 4,
        'seoul_core': 5
    };
    return zoneTiers[zone] || 1;
}

// 프로젝트 상태 판단
function getProjectStatus(project) {
    if (!project) return 'empty';
    if (project.salePrice > 0) return 'completed';
    if (project.constructor) return 'construction';
    if (project.building) return 'design';
    if (project.land) return 'land';
    return 'empty';
}

// 플롯 마커 렌더링
function renderPlotMarker(plot, index, owned) {
    const tierClass = `tier-${plot.tier}`;
    const isOwned = owned !== undefined;
    const ownerClass = isOwned ? `owned owner-${owned.playerIndex}` : 'available';
    const playerColor = isOwned ? PLAYER_COLORS[owned.playerIndex] : null;

    let content = '';
    let statusIcon = '';

    if (isOwned) {
        if (owned.building) {
            content = `<span class="plot-building">${owned.building.emoji}</span>`;
        } else {
            content = `<span class="plot-land">🏞️</span>`;
        }

        // 상태 아이콘
        switch (owned.status) {
            case 'land': statusIcon = '📍'; break;
            case 'design': statusIcon = '📐'; break;
            case 'construction': statusIcon = '🏗️'; break;
            case 'completed': statusIcon = '✅'; break;
            case 'sold': statusIcon = '💰'; break;
        }
    } else {
        content = `<span class="plot-empty">${plot.emoji}</span>`;
    }

    const style = isOwned ? `
        --owner-bg: ${playerColor.bg};
        --owner-border: ${playerColor.border};
        --owner-glow: ${playerColor.glow};
    ` : '';

    return `
        <div class="plot-marker ${tierClass} ${ownerClass}"
             data-plot-index="${index}"
             data-zone="${plot.zone}"
             style="left: ${plot.x}%; top: ${plot.y}%; ${style}">
            <div class="plot-marker-inner">
                ${content}
                ${statusIcon ? `<span class="plot-status">${statusIcon}</span>` : ''}
            </div>
            <div class="plot-tooltip">
                <div class="tooltip-title">${plot.label}</div>
                ${isOwned ? `
                    <div class="tooltip-owner">${owned.playerName}</div>
                    <div class="tooltip-land">${owned.land.name}</div>
                    ${owned.building ? `<div class="tooltip-building">${owned.building.emoji} ${owned.building.name}</div>` : ''}
                ` : `
                    <div class="tooltip-zone">${getZoneName(plot.zone)}</div>
                `}
            </div>
        </div>
    `;
}

// 소유 대지 마커 렌더링 (폴백용)
function renderOwnedPlotMarker(owned) {
    const plotInfo = MAP_PLOTS[owned.plotIndex] || MAP_PLOTS[0];
    const playerColor = PLAYER_COLORS[owned.playerIndex];

    return `
        <div class="owned-marker owner-${owned.playerIndex}"
             style="left: ${plotInfo.x}%; top: ${plotInfo.y}%;
                    --owner-color: ${playerColor.border};">
            <div class="owned-marker-content">
                ${owned.building ? owned.building.emoji : '🏞️'}
            </div>
            <div class="owned-marker-label">${owned.playerName}</div>
        </div>
    `;
}

// 소유 자산 목록 렌더링
function renderOwnedAssetsList(ownedPlots) {
    if (ownedPlots.length === 0) {
        return '<div class="no-assets">아직 구매한 대지가 없습니다</div>';
    }

    // 플레이어별로 그룹화
    const byPlayer = {};
    ownedPlots.forEach(plot => {
        if (!byPlayer[plot.playerIndex]) {
            byPlayer[plot.playerIndex] = [];
        }
        byPlayer[plot.playerIndex].push(plot);
    });

    let html = '';
    Object.entries(byPlayer).forEach(([playerIndex, plots]) => {
        const idx = parseInt(playerIndex);
        const playerName = gameState.players[idx]?.name || `플레이어 ${idx + 1}`;
        const playerColor = PLAYER_COLORS[idx];

        html += `
            <div class="asset-player-group" style="--player-color: ${playerColor.border}">
                <div class="asset-player-name">${playerName}</div>
                <div class="asset-list">
                    ${plots.map(plot => `
                        <div class="asset-item ${plot.status}">
                            <span class="asset-icon">${plot.building ? plot.building.emoji : '🏞️'}</span>
                            <span class="asset-name">${plot.land.name}</span>
                            <span class="asset-status">${getStatusLabel(plot.status)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    return html;
}

// 상태 라벨
function getStatusLabel(status) {
    const labels = {
        'land': '대지 확보',
        'design': '설계 중',
        'construction': '시공 중',
        'completed': '완료',
        'sold': '매각됨'
    };
    return labels[status] || status;
}

// 존 이름
function getZoneName(zone) {
    const names = {
        'rural': '지방/시골',
        'gyeonggi_outer': '경기 외곽',
        'gyeonggi_main': '경기 주요',
        'seaside': '해안가',
        'riverside': '한강변',
        'seoul': '서울',
        'seoul_core': '서울 핵심',
        'landmark': '명소/특구',
        'tech_hub': '테크밸리'
    };
    return names[zone] || zone;
}

// 플롯 클릭 이벤트 바인딩
function bindPlotEvents() {
    const plotMarkers = document.querySelectorAll('.plot-marker');

    plotMarkers.forEach(marker => {
        marker.addEventListener('click', (e) => {
            const plotIndex = parseInt(marker.dataset.plotIndex);
            handlePlotClick(plotIndex);
        });

        // 호버 효과
        marker.addEventListener('mouseenter', () => {
            marker.classList.add('hovered');
        });

        marker.addEventListener('mouseleave', () => {
            marker.classList.remove('hovered');
        });
    });
}

// 플롯 클릭 처리
function handlePlotClick(plotIndex) {
    const plot = MAP_PLOTS[plotIndex];
    console.log('Plot clicked:', plot);

    // 선택 상태 토글
    const markers = document.querySelectorAll('.plot-marker');
    markers.forEach(m => m.classList.remove('selected'));

    const selectedMarker = document.querySelector(`[data-plot-index="${plotIndex}"]`);
    if (selectedMarker) {
        selectedMarker.classList.add('selected');
        selectedPlotIndex = plotIndex;
    }
}

// 개별 프로젝트 타일 렌더링
function renderProjectTile(player, playerIndex) {
    const project = player.currentProject;

    if (!project) {
        return `
            <div class="project-tile empty player-${playerIndex}">
                <div class="tile-player">${player.name}</div>
                <div>대기 중...</div>
            </div>
        `;
    }

    const phase = getProjectStatus(project);
    const phaseLabel = getStatusLabel(phase);

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
        buildingHtml = `<span style="font-size: 1.5rem;">🌿</span>`;
    }

    const blueprintHtml = phase === 'design' && !project.building ? '<div class="blueprint"></div>' : '';

    return `
        <div class="land-visual ${hasBuilding ? 'has-building' : ''}">
            ${blueprintHtml}
            ${buildingHtml}
        </div>
    `;
}

// 건물 크기 클래스 반환
function getBuildingSizeClass(building) {
    if (!building) return 'medium';

    const area = building.requiredArea || 100;

    if (area >= 200) return 'large';
    if (area >= 100) return 'medium';
    return 'small';
}

// 완성된 건물 목록 렌더링
export function renderCompletedBuildings() {
    const tiles = [];

    gameState.players.forEach((player, playerIndex) => {
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
