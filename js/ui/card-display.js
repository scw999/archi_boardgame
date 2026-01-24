// 카드 표시 및 상호작용 UI
import { gameState } from '../core/game-state.js';
import { getLandDisplayInfo } from '../phases/land-phase.js';
import { getArchitectDisplayInfo } from '../phases/design-phase.js';
import { getConstructorDisplayInfo } from '../phases/construction-phase.js';

// 카드 그리드 렌더링
export function renderCardGrid(cards, type, onSelect) {
    const container = document.getElementById('card-grid');
    if (!container) return;

    // 카드 타입별 라벨
    const typeLabels = {
        land: '대지 카드',
        architect: '건축가 카드',
        constructor: '시공사 카드',
        risk: '리스크 카드'
    };

    container.innerHTML = `
    <div class="card-grid-wrapper">
      <div class="card-grid ${type}-cards">
        ${cards.map((card, index) => renderCard(card, type, index)).join('')}
      </div>
      <div class="scroll-indicator hidden">
        <span class="scroll-indicator-text">↓ 아래에 더 많은 ${typeLabels[type] || '카드'}가 있습니다</span>
      </div>
    </div>
  `;

    // 카드 클릭 이벤트
    container.querySelectorAll('.game-card').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            const index = parseInt(cardEl.dataset.index);
            if (onSelect) onSelect(index, cards[index]);
        });
    });

    // 스크롤 안내 표시 로직
    setupScrollIndicator(container);
}

// 스크롤 안내 표시 설정
function setupScrollIndicator(container) {
    const wrapper = container.querySelector('.card-grid-wrapper');
    const indicator = container.querySelector('.scroll-indicator');
    const cardGrid = container.querySelector('.card-grid');
    if (!wrapper || !indicator || !cardGrid) return;

    const checkScroll = () => {
        const windowHeight = window.innerHeight;
        const wrapperRect = wrapper.getBoundingClientRect();
        const wrapperBottom = wrapperRect.bottom;

        // 카드 그리드의 하단이 뷰포트 아래에 있으면 안내 표시
        const hasMoreBelow = wrapperBottom > windowHeight + 50;

        if (hasMoreBelow) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    };

    // 클릭하면 카드 영역으로 스크롤
    indicator.addEventListener('click', () => {
        const cardGridRect = cardGrid.getBoundingClientRect();
        const scrollTarget = window.scrollY + cardGridRect.top - 20; // 카드 상단으로 스크롤 (20px 여유)

        window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });
    });

    // 초기 체크 및 스크롤 이벤트 등록
    setTimeout(checkScroll, 100);
    window.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    // 컴포넌트가 사라지면 이벤트 제거
    const observer = new MutationObserver((mutations) => {
        if (!container.contains(wrapper)) {
            window.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
            observer.disconnect();
        }
    });
    observer.observe(container, { childList: true, subtree: true });
}

// 개별 카드 렌더링
function renderCard(card, type, index) {
    switch (type) {
        case 'land':
            return renderLandCard(card, index);
        case 'architect':
            return renderArchitectCard(card, index);
        case 'constructor':
            return renderConstructorCard(card, index);
        case 'risk':
            return renderRiskCard(card, index);
        default:
            return '';
    }
}

// 토지 카드
function renderLandCard(land, index) {
    const info = getLandDisplayInfo(land);
    const region = land.region;

    return `
    <div class="game-card land-card" data-index="${index}">
      <div class="card-header land">
        <span class="card-type">🗺️ 토지</span>
        ${region ? `<span class="card-region" style="background-color: ${region.color};">${region.emoji} ${region.name}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-title">${land.name}</div>
        <div class="card-subtitle">${land.description}</div>
        
        <div class="card-stats">
          <div class="stat">
            <span class="stat-label">면적</span>
            <span class="stat-value">${info.area}</span>
          </div>
        </div>
        
        <div class="price-table">
          <div class="price-row market">
            <span class="price-type">시세</span>
            <span class="price-value">${info.marketPrice}</span>
            <span class="dice-req">🎲 항상</span>
          </div>
          ${land.prices.urgent ? `
            <div class="price-row urgent">
              <span class="price-type">급매</span>
              <span class="price-value">${info.urgentPrice}</span>
              <span class="dice-req">🎲 ${land.diceRequired.urgent.join(',')}</span>
            </div>
          ` : ''}
          ${land.prices.auction ? `
            <div class="price-row auction">
              <span class="price-type">경매</span>
              <span class="price-value">${info.auctionPrice}</span>
              <span class="dice-req">🎲 ${land.diceRequired.auction.join(',')}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="card-tags">
          <span class="tag suitable">적합: ${info.suitableBuildings}</span>
          ${info.bonuses ? `<span class="tag bonus">${info.bonuses}</span>` : ''}
          ${info.attributes ? `<span class="tag attribute">${info.attributes}</span>` : ''}
        </div>
        
        ${info.developmentCost > 0 ? `
          <div class="extra-cost">⚠️ 개발비: ${gameState.formatMoney(info.developmentCost)}</div>
        ` : ''}
      </div>
    </div>
  `;
}

// 건축가 카드
function renderArchitectCard(architect, index) {
    const info = getArchitectDisplayInfo(architect);

    return `
    <div class="game-card architect-card" data-index="${index}">
      <div class="card-header architect">
        <span class="card-type">📏 건축가</span>
      </div>
      <div class="card-body">
        <div class="portrait">${info.portrait}</div>
        <div class="card-title">${info.name}</div>
        
        <div class="trait-badge">${info.trait}</div>
        <div class="trait-bonus">보너스 ${info.traitBonus}</div>
        
        <div class="card-stats">
          <div class="stat">
            <span class="stat-label">설계비</span>
            <span class="stat-value">${info.feeText}</span>
          </div>
          <div class="stat">
            <span class="stat-label">시공비</span>
            <span class="stat-value">${info.costText}</span>
          </div>
        </div>
        
        <div class="masterpieces">
          <span class="label">대표작:</span>
          <span class="value">${info.masterpieces}</span>
        </div>
        
        <div class="card-description">${info.description}</div>
      </div>
    </div>
  `;
}

// 시공사 카드
function renderConstructorCard(constructor, index) {
    const info = getConstructorDisplayInfo(constructor);
    const isClaimed = constructor.isClaimed === true;

    return `
    <div class="game-card constructor-card ${isClaimed ? 'claimed' : ''}" data-index="${index}">
      <div class="card-header constructor">
        <span class="card-type">🏗️ 시공사</span>
        ${isClaimed ? '<span class="claimed-badge">선점됨</span>' : ''}
      </div>
      <div class="card-body">
        <div class="portrait">${info.emoji}</div>
        <div class="card-title">${info.name}</div>

        <div class="size-badge">${info.size}</div>

        <div class="card-stats">
          <div class="stat">
            <span class="stat-label">시공비</span>
            <span class="stat-value">${info.costText}</span>
          </div>
          <div class="stat">
            <span class="stat-label">리스크</span>
            <span class="stat-value">${info.riskBlocks}</span>
          </div>
          <div class="stat">
            <span class="stat-label">지불</span>
            <span class="stat-value">${info.paymentStages}</span>
          </div>
        </div>

        ${info.artistryBonus ? `<div class="special-bonus">${info.artistryBonus}</div>` : ''}

        <div class="can-build">
          <span class="label">시공 가능:</span>
          <span class="value">${info.canBuild}</span>
        </div>

        <div class="card-description">${info.description}</div>

        ${isClaimed ? '<div class="claimed-overlay">🚫 다른 플레이어가 선택</div>' : ''}
      </div>
    </div>
  `;
}

// 리스크 카드
function renderRiskCard(risk, index) {
    const severityColors = {
        none: 'green',
        positive: 'blue',
        low: 'yellow',
        medium: 'orange',
        high: 'red',
        critical: 'purple'
    };

    return `
    <div class="game-card risk-card ${risk.severity}" data-index="${index}">
      <div class="card-header risk ${severityColors[risk.severity] || ''}">
        <span class="card-type">⚠️ 리스크</span>
      </div>
      <div class="card-body">
        <div class="risk-emoji">${risk.emoji}</div>
        <div class="card-title">${risk.name}</div>
        <div class="card-description">${risk.description}</div>
      </div>
    </div>
  `;
}

// 카드 상세 보기 모달
export function showCardDetail(card, type) {
    let content = '';

    switch (type) {
        case 'land':
            content = renderLandCard(card, 0);
            break;
        case 'architect':
            content = renderArchitectCard(card, 0);
            break;
        case 'constructor':
            content = renderConstructorCard(card, 0);
            break;
        case 'risk':
            content = renderRiskCard(card, 0);
            break;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay card-detail-modal';
    modal.innerHTML = `
    <div class="card-detail-container">
      ${content}
      <button class="close-detail">닫기</button>
    </div>
  `;

    document.body.appendChild(modal);

    modal.querySelector('.close-detail').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// 선택된 카드 하이라이트
export function highlightCard(index) {
    document.querySelectorAll('.game-card').forEach((card, i) => {
        card.classList.toggle('selected', i === index);
    });
}

// 카드 비활성화
export function disableCard(index) {
    const card = document.querySelector(`.game-card[data-index="${index}"]`);
    if (card) {
        card.classList.add('disabled');
    }
}

// 건물 선택 그리드
export function renderBuildingSelector(buildings, onSelect) {
    const container = document.getElementById('building-selector');
    if (!container) return;

    container.innerHTML = `
    <div class="building-grid">
      ${buildings.map((building, index) => `
        <div class="building-option ${building.isSuitable ? 'suitable' : ''}" data-index="${index}">
          <div class="building-emoji">${building.emoji}</div>
          <div class="building-name">${building.name}</div>
          <div class="building-area">${building.area}평</div>
          <div class="building-costs">
            <span>설계: ${gameState.formatMoney(building.designFee)}</span>
            <span>시공: ${gameState.formatMoney(building.constructionCost)}</span>
          </div>
          ${building.isSuitable ? '<div class="suitable-badge">✓ 적합</div>' : ''}
        </div>
      `).join('')}
    </div>
  `;

    container.querySelectorAll('.building-option').forEach(option => {
        option.addEventListener('click', () => {
            const index = parseInt(option.dataset.index);
            if (onSelect) onSelect(index, buildings[index]);
        });
    });
}
