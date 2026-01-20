// 아이소메트릭 개발 지도 UI
import { gameState } from '../core/game-state.js';
import { REGIONS } from '../data/lands.js';
import { BUILDING_IMAGES } from '../data/buildings.js';

let is3DView = false;
let selectedPlotIndex = null;

// 토지별 고정 플롯 인덱스 저장 (토지 ID -> 플롯 인덱스)
const landPlotAssignments = new Map();

// 사용된 플롯 인덱스 추적
const usedPlotIndices = new Set();

// 아이소메트릭 맵 위의 플롯(대지) 위치 정의
// 이미지 기준 상대 좌표 (%) - 실제 빈 플롯 위치에 맞춤
const MAP_PLOTS = [
    // === 1열: 산악/숲 지역 (상단) ===
    { id: 'mountain_1', x: 8, y: 12, zone: 'rural', tier: 1, label: '산촌마을', emoji: '🏔️' },
    { id: 'forest_1', x: 22, y: 8, zone: 'rural', tier: 1, label: '숲속전원', emoji: '🌲' },
    { id: 'forest_2', x: 35, y: 5, zone: 'rural', tier: 1, label: '임야부지', emoji: '🌾' },

    // === 2열: 외곽 주거지역 (상단-중단) ===
    { id: 'suburb_1', x: 6, y: 28, zone: 'gyeonggi_outer', tier: 2, label: '용인', emoji: '🏡' },
    { id: 'suburb_2', x: 18, y: 22, zone: 'gyeonggi_outer', tier: 2, label: '광교', emoji: '🏘️' },
    { id: 'park_1', x: 32, y: 18, zone: 'gyeonggi_main', tier: 3, label: '분당공원', emoji: '🌳' },

    // === 3열: 도심 핵심 (중앙 타워 지역) ===
    { id: 'core_1', x: 45, y: 20, zone: 'seoul_core', tier: 5, label: '잠실타워', emoji: '🗼' },
    { id: 'core_2', x: 58, y: 15, zone: 'seoul_core', tier: 5, label: '코엑스', emoji: '✨' },
    { id: 'core_3', x: 72, y: 12, zone: 'seoul_core', tier: 5, label: 'R&D센터', emoji: '🔬' },

    // === 4열: 도심 주변 (중앙) ===
    { id: 'city_1', x: 8, y: 42, zone: 'gyeonggi_main', tier: 3, label: '판교', emoji: '💼' },
    { id: 'city_2', x: 22, y: 38, zone: 'seoul', tier: 4, label: '강남역', emoji: '🌆' },
    { id: 'city_3', x: 38, y: 32, zone: 'seoul', tier: 4, label: '서초', emoji: '🏙️' },
    { id: 'city_4', x: 52, y: 28, zone: 'seoul', tier: 4, label: '삼성', emoji: '🏢' },
    { id: 'city_5', x: 68, y: 24, zone: 'seoul', tier: 4, label: '송파', emoji: '🏛️' },
    { id: 'city_6', x: 85, y: 18, zone: 'gyeonggi_outer', tier: 2, label: '하남', emoji: '🌳' },

    // === 5열: 상업/주거 혼합 (중앙-하단) ===
    { id: 'mixed_1', x: 12, y: 55, zone: 'gyeonggi_main', tier: 3, label: '위례', emoji: '🏗️' },
    { id: 'mixed_2', x: 28, y: 50, zone: 'seoul', tier: 4, label: '잠실', emoji: '🎡' },
    { id: 'mixed_3', x: 45, y: 45, zone: 'landmark', tier: 4, label: '올림픽공원', emoji: '🎪' },
    { id: 'mixed_4', x: 62, y: 40, zone: 'riverside', tier: 4, label: '한강뷰', emoji: '🌉' },
    { id: 'mixed_5', x: 78, y: 35, zone: 'riverside', tier: 4, label: '강변테라스', emoji: '🏞️' },
    { id: 'mixed_6', x: 92, y: 30, zone: 'gyeonggi_outer', tier: 2, label: '구리', emoji: '🏡' },

    // === 6열: 리버프론트 (하단-중앙) ===
    { id: 'river_1', x: 18, y: 68, zone: 'gyeonggi_main', tier: 3, label: '분당', emoji: '🏘️' },
    { id: 'river_2', x: 35, y: 62, zone: 'riverside', tier: 4, label: '반포', emoji: '🌊' },
    { id: 'river_3', x: 52, y: 58, zone: 'riverside', tier: 4, label: '압구정', emoji: '🛶' },
    { id: 'river_4', x: 68, y: 52, zone: 'riverside', tier: 3, label: '청담', emoji: '💎' },
    { id: 'river_5', x: 85, y: 48, zone: 'seaside', tier: 3, label: '워터프론트', emoji: '⛵' },

    // === 7열: 해변/휴양지 (하단) ===
    { id: 'beach_1', x: 42, y: 75, zone: 'landmark', tier: 4, label: '마리나', emoji: '🚤' },
    { id: 'beach_2', x: 58, y: 70, zone: 'seaside', tier: 3, label: '선착장', emoji: '⚓' },
    { id: 'beach_3', x: 75, y: 65, zone: 'seaside', tier: 3, label: '요트클럽', emoji: '🏖️' },
    { id: 'beach_4', x: 90, y: 60, zone: 'seaside', tier: 2, label: '해변리조트', emoji: '🌴' },

    // === 8열: 최하단 해안가 ===
    { id: 'coast_1', x: 55, y: 85, zone: 'seaside', tier: 2, label: '팜비치', emoji: '🏝️' },
    { id: 'coast_2', x: 72, y: 80, zone: 'seaside', tier: 2, label: '선셋비치', emoji: '🌅' },
    { id: 'coast_3', x: 88, y: 75, zone: 'seaside', tier: 2, label: '해안도로', emoji: '🛣️' }
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

// 플롯 할당 초기화 (새 게임 시작 시 호출)
export function resetPlotAssignments() {
    landPlotAssignments.clear();
    usedPlotIndices.clear();
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

    gameState.players.forEach((player, playerIndex) => {
        // 현재 진행 중인 프로젝트
        if (player.currentProject && player.currentProject.land) {
            const project = player.currentProject;
            const landId = project.land.id;

            // 이미 할당된 플롯이 있으면 사용, 없으면 새로 할당
            const assignedPlot = getOrAssignPlotForLand(landId, project.land.region, project.land.name);

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
                const landId = building.land.id;
                const assignedPlot = getOrAssignPlotForLand(landId, building.land.region, building.land.name);

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

        // 매각 이력 (건물은 지도에 남음)
        if (player.soldHistory) {
            player.soldHistory.forEach(sold => {
                const landId = sold.land.id;
                const assignedPlot = getOrAssignPlotForLand(landId, sold.land.region, sold.land.name);

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

// 토지 ID에 대해 고정 플롯 할당 (한 번 할당되면 변경 안 됨)
function getOrAssignPlotForLand(landId, region, landName) {
    // 이미 할당된 플롯이 있으면 반환
    if (landPlotAssignments.has(landId)) {
        return landPlotAssignments.get(landId);
    }

    // 새로 할당
    const plotIndex = assignPlotByRegionAndName(region, landName);
    landPlotAssignments.set(landId, plotIndex);
    usedPlotIndices.add(plotIndex);

    return plotIndex;
}

// 지역과 이름을 기반으로 적절한 플롯 할당
function assignPlotByRegionAndName(region, landName) {
    if (!region) {
        return findFirstAvailablePlot();
    }

    const regionId = region.id;

    // 특정 토지명과 플롯 매핑 (정확한 위치 지정)
    const landNameMappings = {
        '판교 테크노밸리 필지': 'city_1',   // 판교
        '강남 역세권 필지': 'city_2',       // 강남역
        '청담동 고급 필지': 'river_4',      // 청담
        '해운대 오션뷰 필지': 'beach_1',    // 마리나/해안
        '제주 서귀포 절경 필지': 'coast_1', // 해안가
        '양평 프리미엄 전원 필지': 'suburb_1' // 용인/외곽
    };

    // 토지명으로 정확한 매핑이 있으면 사용
    if (landName && landNameMappings[landName]) {
        const targetId = landNameMappings[landName];
        const plotIndex = MAP_PLOTS.findIndex(plot => plot.id === targetId);
        if (plotIndex !== -1 && !usedPlotIndices.has(plotIndex)) {
            return plotIndex;
        }
    }

    // 지역 ID를 맵 존으로 변환
    const regionToZoneMapping = {
        'rural': ['rural'],
        'gyeonggi_outer': ['gyeonggi_outer', 'rural'],
        'gyeonggi_main': ['gyeonggi_main', 'gyeonggi_outer'],
        'seoul': ['seoul', 'gyeonggi_main'],
        'seoul_core': ['seoul_core', 'seoul'],
        'landmark': ['landmark', 'seoul', 'riverside'],
        'tech_hub': ['gyeonggi_main', 'seoul'],  // 판교는 경기 주요
        'seaside': ['seaside', 'riverside'],
        'riverside': ['riverside', 'seaside']
    };

    const targetZones = regionToZoneMapping[regionId] || [regionId];

    // 해당 존에서 사용 가능한 플롯 찾기
    for (const zone of targetZones) {
        const matchingPlots = MAP_PLOTS
            .map((plot, index) => ({ ...plot, index }))
            .filter(plot => plot.zone === zone && !usedPlotIndices.has(plot.index));

        if (matchingPlots.length > 0) {
            // 랜덤하게 선택하여 다양성 확보
            const randomIndex = Math.floor(Math.random() * matchingPlots.length);
            return matchingPlots[randomIndex].index;
        }
    }

    // 티어로 매칭 시도
    const tierMatchingPlots = MAP_PLOTS
        .map((plot, index) => ({ ...plot, index }))
        .filter(plot => getTierFromZone(plot.zone) === region.tier && !usedPlotIndices.has(plot.index));

    if (tierMatchingPlots.length > 0) {
        const randomIndex = Math.floor(Math.random() * tierMatchingPlots.length);
        return tierMatchingPlots[randomIndex].index;
    }

    // 모두 실패하면 사용 가능한 첫 번째 플롯
    return findFirstAvailablePlot();
}

// 사용 가능한 첫 번째 플롯 찾기
function findFirstAvailablePlot() {
    for (let i = 0; i < MAP_PLOTS.length; i++) {
        if (!usedPlotIndices.has(i)) {
            return i;
        }
    }
    // 모든 플롯이 사용 중이면 첫 번째 반환
    return 0;
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
    const isSold = isOwned && owned.status === 'sold';
    const ownerClass = isOwned ? `owned owner-${owned.playerIndex}${isSold ? ' sold' : ''}` : 'available';
    const playerColor = isOwned ? PLAYER_COLORS[owned.playerIndex] : null;
    const hasBuilding = isOwned && owned.building;

    let content = '';
    let statusIcon = '';

    if (isOwned) {
        if (hasBuilding) {
            // 건물 이미지가 있으면 이미지 사용, 없으면 이모지 폴백
            const buildingImage = BUILDING_IMAGES[owned.building.name];
            if (buildingImage) {
                content = `<img src="${buildingImage}" alt="${owned.building.name}" class="plot-building-img${isSold ? ' sold-building' : ''}"
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                          <span class="plot-building-emoji" style="display:none;">${owned.building.emoji}</span>`;
            } else {
                content = `<span class="plot-building-emoji${isSold ? ' sold-building' : ''}">${owned.building.emoji}</span>`;
            }
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

    // 건물 이미지가 있으면 배경 투명하게 (style 변수에서 owner-bg 제거)
    const style = isOwned ? `
        --owner-border: ${playerColor.border};
        --owner-glow: ${playerColor.glow};
    ` : '';

    // 건물 이미지가 있을 때는 더 큰 마커 사용
    const markerSizeClass = hasBuilding ? 'has-building-img' : '';

    // 매각된 건물은 클릭 가능하다는 표시
    const clickHint = isSold ? '클릭하여 상세정보 보기' : '';

    return `
        <div class="plot-marker ${tierClass} ${ownerClass} ${markerSizeClass}"
             data-plot-index="${index}"
             data-zone="${plot.zone}"
             data-status="${owned?.status || 'empty'}"
             style="left: ${plot.x}%; top: ${plot.y}%; ${style}">
            <div class="plot-marker-inner">
                ${content}
                ${statusIcon ? `<span class="plot-status">${statusIcon}</span>` : ''}
            </div>
            <div class="plot-tooltip">
                <div class="tooltip-title">${plot.label}</div>
                ${isOwned ? `
                    <div class="tooltip-owner">${isSold ? '(매각됨) ' : ''}${owned.playerName}</div>
                    <div class="tooltip-land">${owned.land.name}</div>
                    ${owned.building ? `<div class="tooltip-building">${owned.building.emoji} ${owned.building.name}</div>` : ''}
                    ${clickHint ? `<div class="tooltip-hint">${clickHint}</div>` : ''}
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

    let buildingContent = '🏞️';
    if (owned.building) {
        const buildingImage = BUILDING_IMAGES[owned.building.name];
        if (buildingImage) {
            buildingContent = `<img src="${buildingImage}" alt="${owned.building.name}" class="owned-building-img"
                               onerror="this.outerHTML='${owned.building.emoji}';">`;
        } else {
            buildingContent = owned.building.emoji;
        }
    }

    return `
        <div class="owned-marker owner-${owned.playerIndex}"
             style="left: ${plotInfo.x}%; top: ${plotInfo.y}%;
                    --owner-color: ${playerColor.border};">
            <div class="owned-marker-content">
                ${buildingContent}
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

    // 선택 상태 토글
    const markers = document.querySelectorAll('.plot-marker');
    markers.forEach(m => m.classList.remove('selected'));

    const selectedMarker = document.querySelector(`[data-plot-index="${plotIndex}"]`);
    if (selectedMarker) {
        selectedMarker.classList.add('selected');
        selectedPlotIndex = plotIndex;

        // 소유된 플롯이면 상세 정보 표시
        if (selectedMarker.classList.contains('owned')) {
            showBuildingDetailModal(plotIndex);
        }
    }
}

// 건물 상세 정보 모달 표시
function showBuildingDetailModal(plotIndex) {
    // 해당 플롯의 소유 정보 찾기
    const ownedPlots = collectOwnedPlots();
    const owned = ownedPlots.find(o => o.plotIndex === plotIndex);

    if (!owned) return;

    // 기존 모달 제거
    const existingModal = document.querySelector('.building-detail-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const plot = MAP_PLOTS[plotIndex];
    const playerColor = PLAYER_COLORS[owned.playerIndex];

    // 상태에 따른 라벨
    const statusLabels = {
        'land': { text: '대지 확보', class: 'status-land' },
        'design': { text: '설계 중', class: 'status-design' },
        'construction': { text: '시공 중', class: 'status-construction' },
        'completed': { text: '완공', class: 'status-completed' },
        'sold': { text: '매각됨', class: 'status-sold' }
    };
    const statusInfo = statusLabels[owned.status] || { text: owned.status, class: '' };

    // 건물 정보
    let buildingInfo = '';
    if (owned.building) {
        const buildingImage = BUILDING_IMAGES[owned.building.name];
        buildingInfo = `
            <div class="modal-building-section">
                <div class="modal-building-visual">
                    ${buildingImage ?
                        `<img src="${buildingImage}" alt="${owned.building.name}" class="modal-building-img">` :
                        `<span class="modal-building-emoji">${owned.building.emoji}</span>`
                    }
                </div>
                <div class="modal-building-info">
                    <div class="modal-building-name">${owned.building.emoji} ${owned.building.name}</div>
                    <div class="modal-building-stat">면적: ${owned.building.area || '-'}평</div>
                    <div class="modal-building-stat">설계비: ${gameState.formatMoney(owned.building.designFee || 0)}</div>
                    <div class="modal-building-stat">시공비: ${gameState.formatMoney(owned.building.constructionCost || 0)}</div>
                </div>
            </div>
        `;
    }

    // 가치/가격 정보
    let priceInfo = '';
    if (owned.salePrice) {
        priceInfo = `<div class="modal-price">건물 가치: ${gameState.formatMoney(owned.salePrice)}</div>`;
    }
    if (owned.sellPrice) {
        priceInfo = `<div class="modal-price sold">매각가: ${gameState.formatMoney(owned.sellPrice)}</div>`;
    }

    const modalHtml = `
        <div class="building-detail-modal" data-plot-index="${plotIndex}">
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.building-detail-modal').remove()">✕</button>

                <div class="modal-header" style="--player-color: ${playerColor.border}">
                    <span class="modal-status ${statusInfo.class}">${statusInfo.text}</span>
                    <span class="modal-owner">${owned.playerName}</span>
                </div>

                <div class="modal-land-section">
                    <div class="modal-land-name">${plot.label}</div>
                    <div class="modal-land-actual">${owned.land.name}</div>
                    <div class="modal-land-region">${owned.land.region?.name || ''} ${owned.land.region?.emoji || ''}</div>
                    <div class="modal-land-area">면적: ${owned.land.area}평</div>
                </div>

                ${buildingInfo}
                ${priceInfo}

                ${owned.status === 'sold' ? `
                    <div class="modal-sold-badge">
                        💰 매각 완료
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 모달 외부 클릭시 닫기
    const modal = document.querySelector('.building-detail-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
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
