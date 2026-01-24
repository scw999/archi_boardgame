// 플레이어 정보 패널 UI
import { gameState } from '../core/game-state.js';
import { buildings, BUILDING_IMAGES } from '../data/buildings.js';

// 플레이어 색상 (3D 뷰어와 동일)
const PLAYER_COLORS = [
    '#ef4444', // 빨강
    '#3b82f6', // 파랑
    '#22c55e', // 초록
    '#a855f7'  // 보라
];

// 건물 이미지 HTML 생성 헬퍼 함수
function getBuildingImage(buildingName, size = '32px') {
    const imagePath = BUILDING_IMAGES[buildingName];
    if (imagePath) {
        return `<img src="${imagePath}" alt="${buildingName}" class="building-img" style="width: ${size}; height: ${size}; object-fit: contain;">`;
    }
    const building = buildings[buildingName];
    return building ? building.emoji : '🏢';
}

// 모든 플레이어 패널 렌더링
export function renderPlayerPanels() {
    const container = document.getElementById('player-panels');
    if (!container) return;

    container.innerHTML = gameState.players.map((player, index) =>
        renderPlayerPanel(player, index === gameState.currentPlayerIndex)
    ).join('');
}

// 개별 플레이어 패널
function renderPlayerPanel(player, isActive) {
    const project = player.currentProject;
    const playerIndex = gameState.players.indexOf(player);
    const playerColor = PLAYER_COLORS[playerIndex] || PLAYER_COLORS[0];

    // 돈 상태 클래스 결정
    const moneyClass = player.money >= 200000000 ? 'high' :
        player.money >= 50000000 ? '' :
            player.money >= 10000000 ? 'low' : 'critical';

    // 와일드카드 개수
    const wildcardCount = player.wildcards?.length || 0;

    return `
    <div class="player-panel ${isActive ? 'active' : ''}" data-player-id="${player.id}" style="--player-color: ${playerColor}; border-left: 4px solid ${playerColor};">
      <div class="panel-header">
        <span class="player-color-indicator" style="background-color: ${playerColor};"></span>
        <span class="player-name">${player.name}</span>
        ${isActive ? '<span class="turn-indicator">🎯 내 턴</span>' : ''}
      </div>

      <div class="panel-body">
        <div class="money-display ${moneyClass}">
          <span class="money-icon">💰</span>
          <span class="money-value">${gameState.formatMoney(player.money)}</span>
        </div>

        <div class="money-info">
          <div class="money-row ${player.loan > 0 ? 'warning' : ''}">
            <span class="label">🏦 대출</span>
            <span class="value">${player.loan > 0 ? gameState.formatMoney(player.loan) : '-'}</span>
          </div>
          <div class="money-row">
            <span class="label">📊 한도</span>
            <span class="value">${gameState.formatMoney(gameState.getMaxLoan(player))}</span>
          </div>
          ${player.loan > 0 ? `
          <div class="money-row interest">
            <span class="label">💹 이자율</span>
            <span class="value">${(player.interestRate * 100).toFixed(1)}%</span>
          </div>
          ` : ''}
        </div>

        ${project ? renderProjectStatus(project) : ''}

        <div class="stats-row">
          ${player.buildings.length > 0 ? `
          <div class="stat-item building clickable-building" data-action="show-buildings" data-player-index="${player.id}" title="클릭하여 건물 보기">
            <span class="stat-icon">🏢</span>
            <span class="stat-value">${player.buildings.length}</span>
            <span class="stat-label">건물</span>
          </div>
          ` : `
          <div class="stat-item">
            <span class="stat-icon">🏢</span>
            <span class="stat-value">${player.buildings.length}</span>
            <span class="stat-label">건물</span>
          </div>
          `}
          ${wildcardCount > 0 ? `
          <div class="stat-item wildcard clickable-wildcard" data-action="toggle-wildcard" data-player-index="${player.id}" title="클릭하여 와일드카드 보기">
            <span class="stat-icon">🃏</span>
            <span class="stat-value">${wildcardCount}</span>
            <span class="stat-label">카드</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// 현재 프로젝트 상태
function renderProjectStatus(project) {
    const items = [];

    if (project.land) {
        items.push(`
      <div class="project-item land">
        <span class="icon">🗺️</span>
        <span class="name">${project.land.name}</span>
        <span class="detail">${project.land.area}평</span>
      </div>
    `);
    }

    if (project.building) {
        items.push(`
      <div class="project-item building">
        <span class="icon">${getBuildingImage(project.building.name, '28px')}</span>
        <span class="name">${project.building.name}</span>
      </div>
    `);
    }

    if (project.architect) {
        items.push(`
      <div class="project-item architect">
        <span class="icon">${project.architect.portrait}</span>
        <span class="name">${project.architect.name}</span>
      </div>
    `);
    }

    if (project.constructor) {
        items.push(`
      <div class="project-item constructor">
        <span class="icon">${project.constructor.emoji}</span>
        <span class="name">${project.constructor.name}</span>
      </div>
    `);
    }

    if (items.length === 0) return '';

    return `
    <div class="project-status">
      <div class="project-header">📋 진행중인 프로젝트</div>
      ${items.join('')}
    </div>
  `;
}

// 플레이어 순위 표시
export function renderPlayerRankings() {
    const rankings = [...gameState.players]
        .sort((a, b) => b.money - a.money);

    return `
    <div class="rankings">
      <div class="rankings-header">🏆 현재 순위</div>
      ${rankings.map((player, index) => `
        <div class="ranking-row">
          <span class="rank">${index + 1}</span>
          <span class="name">${player.name}</span>
          <span class="money">${gameState.formatMoney(player.money)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// 플레이어 상세 정보 모달
export function showPlayerDetail(playerIndex) {
    const player = gameState.players[playerIndex];
    if (!player) return;

    const content = `
    <div class="player-detail">
      <div class="detail-section">
        <h3>💰 자산 현황</h3>
        <div class="detail-row">
          <span>보유 자금</span>
          <span>${gameState.formatMoney(player.money)}</span>
        </div>
        <div class="detail-row">
          <span>대출금</span>
          <span>${gameState.formatMoney(player.loan)}</span>
        </div>
        <div class="detail-row">
          <span>순자산</span>
          <span>${gameState.formatMoney(player.money - player.loan)}</span>
        </div>
        <div class="detail-row">
          <span>월 이자</span>
          <span>${gameState.formatMoney(gameState.calculateInterest(player, 1))}</span>
        </div>
      </div>
      
      <div class="detail-section">
        <h3>🏢 완성된 건물 (${player.buildings.length}개)</h3>
        ${player.buildings.length > 0 ? player.buildings.map(project => `
          <div class="building-item">
            <span>${getBuildingImage(project.building.name, '24px')} ${project.building.name}</span>
            <span>@ ${project.land.name}</span>
            <span>매각: ${gameState.formatMoney(project.salePrice)}</span>
          </div>
        `).join('') : '<div class="empty">아직 완성된 건물이 없습니다.</div>'}
      </div>
    </div>
  `;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
    <div class="detail-modal">
      <div class="modal-header">
        <h2>${player.name} 상세 정보</h2>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-content">${content}</div>
    </div>
  `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}
