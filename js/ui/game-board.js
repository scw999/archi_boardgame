// 게임 보드 UI 렌더링
import { gameState, GAME_PHASES } from '../core/game-state.js';

// 보드 렌더링
export function renderGameBoard() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
    <div class="board-header-sticky">
      <div class="header-top-row">
        <div class="round-badge">
          <span class="round-label">라운드</span>
          <span class="round-number">${gameState.currentRound} / ${gameState.maxRounds}</span>
        </div>
        <div class="current-phase-large">
          <span class="current-phase-name">${getPhaseDisplayNameOnly(gameState.phase)}</span>
        </div>
      </div>

      <div class="phase-progress-row">
        <div class="phase-progress">
          ${renderPhaseProgress()}
        </div>
      </div>
    </div>

    <div class="game-board-content">
      <div class="current-player-info">
        ${renderCurrentPlayerInfo()}
      </div>
    </div>
  `;
}

// 페이즈 아이콘 반환
function getPhaseIcon(phase) {
    const icons = {
        [GAME_PHASES.SETUP]: '🎮',
        [GAME_PHASES.LAND_PURCHASE]: '🗺️',
        [GAME_PHASES.DESIGN]: '📏',
        [GAME_PHASES.CONSTRUCTION]: '🏗️',
        [GAME_PHASES.EVALUATION]: '☑️',
        [GAME_PHASES.ROUND_END]: '📊',
        [GAME_PHASES.GAME_END]: '🏆'
    };
    return icons[phase] || '🎮';
}

// 페이즈 이름 반환 (아이콘 포함)
function getPhaseDisplayName(phase) {
    const names = {
        [GAME_PHASES.SETUP]: '🎮 게임 설정',
        [GAME_PHASES.LAND_PURCHASE]: '🗺️ 대지 구매',
        [GAME_PHASES.DESIGN]: '📏 건축가 선정',
        [GAME_PHASES.CONSTRUCTION]: '🏗️ 시공사 선정',
        [GAME_PHASES.EVALUATION]: '☑️ 평가',
        [GAME_PHASES.ROUND_END]: '📊 라운드 종료',
        [GAME_PHASES.GAME_END]: '🏆 게임 종료'
    };
    return names[phase] || phase;
}

// 페이즈 이름만 반환 (이모지 포함)
function getPhaseDisplayNameOnly(phase) {
    const names = {
        [GAME_PHASES.SETUP]: '🎮 게임 설정',
        [GAME_PHASES.LAND_PURCHASE]: '🗺️ 대지 구매',
        [GAME_PHASES.DESIGN]: '📏 건축가 선정',
        [GAME_PHASES.CONSTRUCTION]: '🏗️ 시공사 선정',
        [GAME_PHASES.EVALUATION]: '☑️ 평가',
        [GAME_PHASES.ROUND_END]: '📊 라운드 종료',
        [GAME_PHASES.GAME_END]: '🏆 게임 종료'
    };
    return names[phase] || phase;
}

// 페이즈 진행 표시
function renderPhaseProgress() {
    const phases = [
        { key: GAME_PHASES.LAND_PURCHASE, icon: '🗺️', name: '대지 구매', type: 'land' },
        { key: GAME_PHASES.DESIGN, icon: '📏', name: '건축가 선정', type: 'design' },
        { key: GAME_PHASES.CONSTRUCTION, icon: '🏗️', name: '시공사 선정', type: 'construction' },
        { key: GAME_PHASES.EVALUATION, icon: '☑️', name: '평가', type: 'evaluation' }
    ];

    const currentIndex = phases.findIndex(p => p.key === gameState.phase);

    return phases.map((phase, index) => {
        let status = 'pending';
        if (index < currentIndex) status = 'completed';
        else if (index === currentIndex) status = 'active';

        return `
      <div class="phase-step ${status} phase-${phase.type}">
        <div class="phase-icon">${phase.icon}</div>
        <div class="phase-name">${phase.name}</div>
      </div>
      ${index < phases.length - 1 ? '<div class="phase-arrow">→</div>' : ''}
    `;
    }).join('');
}

// 현재 플레이어 정보
function renderCurrentPlayerInfo() {
    const player = gameState.getCurrentPlayer();
    if (!player) return '';

    return `
    <div class="current-player">
      <span class="player-turn">🎯 ${player.name}의 차례</span>
    </div>
  `;
}

// 게임 로그 렌더링
export function renderGameLog() {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;

    const recentLogs = gameState.log.slice(-20);

    logContainer.innerHTML = `
    <div class="log-header">📜 게임 로그</div>
    <div class="log-entries">
      ${recentLogs.map(entry => `
        <div class="log-entry">
          <span class="log-time">${entry.timestamp}</span>
          <span class="log-message">${entry.message}</span>
        </div>
      `).join('')}
    </div>
  `;

    // 자동 스크롤
    const entries = logContainer.querySelector('.log-entries');
    if (entries) {
        entries.scrollTop = entries.scrollHeight;
    }
}

// 액션 버튼 영역 렌더링
export function renderActionArea(actions) {
    const actionArea = document.getElementById('action-area');
    if (!actionArea) return;

    actionArea.innerHTML = `
    <div class="action-buttons">
      ${actions.map(action => `
        <button 
          class="action-btn ${action.primary ? 'primary' : ''} ${action.disabled ? 'disabled' : ''}"
          data-action="${action.id}"
          ${action.disabled ? 'disabled' : ''}
        >
          ${action.icon || ''} ${action.label}
        </button>
      `).join('')}
    </div>
  `;
}

// 확인 다이얼로그
export function showConfirmDialog(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
    <div class="dialog">
      <div class="dialog-header">${title}</div>
      <div class="dialog-body">${message}</div>
      <div class="dialog-actions">
        <button class="btn-cancel">취소</button>
        <button class="btn-confirm">확인</button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    overlay.querySelector('.btn-confirm').addEventListener('click', () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    });

    overlay.querySelector('.btn-cancel').addEventListener('click', () => {
        overlay.remove();
        if (onCancel) onCancel();
    });
}

// 알림 표시
export function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
    <span class="notification-message">${message}</span>
  `;

    const container = document.getElementById('notifications') || document.body;
    container.appendChild(notification);

    // 애니메이션
    setTimeout(() => notification.classList.add('show'), 10);

    // 자동 제거
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// 결과 모달 표시
export function showResultModal(title, content, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="result-modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-content">${content}</div>
      <div class="modal-footer">
        <button class="btn-close">닫기</button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    const closeModal = () => {
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.remove();
            if (onClose) onClose();
        }, 300);
    };

    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.querySelector('.btn-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}
