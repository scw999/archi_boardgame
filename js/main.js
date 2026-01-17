// 앱 진입점 - 초기화 및 이벤트 바인딩
import { gameState, GAME_PHASES } from './core/game-state.js';
import { renderGameBoard, renderGameLog, renderActionArea, showNotification, showResultModal } from './ui/game-board.js';
import { renderPlayerPanels } from './ui/player-panel.js';
import { renderCardGrid, highlightCard, renderBuildingSelector } from './ui/card-display.js';
import { showDiceRoll, showStartingDiceRoll, showLandPurchaseDice, showRiskCardDraw } from './ui/dice-roller.js';
import { selectLand, attemptLandPurchase, checkLandPhaseComplete, getLandDisplayInfo } from './phases/land-phase.js';
import { getAvailableBuildings, selectArchitect, selectBuilding, completeDesign, checkDesignPhaseComplete } from './phases/design-phase.js';
import { canSelectConstructor, selectConstructor, processRisks, checkConstructionPhaseComplete } from './phases/construction-phase.js';
import { calculateSalePrice, completeEvaluation, checkEvaluationPhaseComplete, getRoundSummary, getFinalResults } from './phases/evaluation-phase.js';

// 게임 앱 클래스
class GameApp {
    constructor() {
        this.selectedCardIndex = null;
        this.selectedPriceType = 'market';
        this.selectedArchitectIndex = null;
        this.selectedBuildingName = null;
    }

    // 초기화
    init() {
        this.bindEvents();
        this.showMainMenu();
    }

    // 이벤트 바인딩
    bindEvents() {
        // 메인 메뉴 버튼들
        document.getElementById('btn-new-game')?.addEventListener('click', () => this.showPlayerSetup());
        document.getElementById('btn-load-game')?.addEventListener('click', () => this.loadGame());
        document.getElementById('btn-rules')?.addEventListener('click', () => this.showRules());

        // 플레이어 설정
        document.getElementById('btn-start-game')?.addEventListener('click', () => this.startGame());
        document.getElementById('btn-back')?.addEventListener('click', () => this.showMainMenu());
    }

    // 메인 메뉴 표시
    showMainMenu() {
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('player-setup').classList.add('hidden');
        document.getElementById('game-container').classList.add('hidden');
    }

    // 플레이어 설정 화면
    showPlayerSetup() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('player-setup').classList.remove('hidden');
    }

    // 게임 시작
    async startGame() {
        const playerInputs = document.querySelectorAll('.player-name-input');
        const playerNames = [];

        playerInputs.forEach(input => {
            if (input.value.trim()) {
                playerNames.push(input.value.trim());
            }
        });

        if (playerNames.length < 1) {
            showNotification('최소 1명의 플레이어가 필요합니다.', 'error');
            return;
        }

        const easyStart = document.getElementById('easy-start')?.checked || false;

        // 게임 초기화
        gameState.initGame(playerNames, easyStart);

        // UI 전환
        document.getElementById('player-setup').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');

        // 시작 자금 결정
        await this.determineStartingMoney();

        // 첫 라운드 시작
        this.startRound();
    }

    // 시작 자금 결정
    async determineStartingMoney() {
        if (gameState.settings.easyStart) {
            gameState.players.forEach((player, index) => {
                gameState.setStartingMoney(index, 14); // 3억
            });
            return;
        }

        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            const result = await showStartingDiceRoll(player.name);
            gameState.setStartingMoney(i, result.total);
        }
    }

    // 라운드 시작
    startRound() {
        gameState.startRound();
        this.updateUI();
        this.runPhase();
    }

    // 현재 페이즈 실행
    runPhase() {
        switch (gameState.phase) {
            case GAME_PHASES.LAND_PURCHASE:
                this.runLandPhase();
                break;
            case GAME_PHASES.DESIGN:
                this.runDesignPhase();
                break;
            case GAME_PHASES.CONSTRUCTION:
                this.runConstructionPhase();
                break;
            case GAME_PHASES.EVALUATION:
                this.runEvaluationPhase();
                break;
            case GAME_PHASES.ROUND_END:
                this.endRound();
                break;
            case GAME_PHASES.GAME_END:
                this.showFinalResults();
                break;
        }
    }

    // 대지 구매 페이즈
    runLandPhase() {
        const player = gameState.getCurrentPlayer();

        renderCardGrid(gameState.availableLands, 'land', (index, land) => {
            this.selectedCardIndex = index;
            highlightCard(index);
            this.showLandPurchaseOptions(land);
        });

        renderActionArea([
            { id: 'skip-land', label: '이번 턴 패스', icon: '⏭️' }
        ]);

        document.querySelector('[data-action="skip-land"]')?.addEventListener('click', () => {
            showNotification(`${player.name} 토지 구매 패스`, 'info');
            this.nextPlayerOrPhase('land');
        });
    }

    // 토지 구매 옵션 표시
    showLandPurchaseOptions(land) {
        const optionsContainer = document.getElementById('purchase-options');
        if (!optionsContainer) return;

        const info = getLandDisplayInfo(land);

        optionsContainer.innerHTML = `
      <div class="purchase-panel">
        <h3>${land.name} 구매</h3>
        <div class="price-options">
          <button class="price-btn market" data-type="market">
            시세: ${info.marketPrice}
            <span class="prob">100%</span>
          </button>
          ${land.prices.urgent ? `
            <button class="price-btn urgent" data-type="urgent">
              급매: ${info.urgentPrice}
              <span class="prob">${((land.diceRequired.urgent.length / 6) * 100).toFixed(0)}%</span>
            </button>
          ` : ''}
          ${land.prices.auction ? `
            <button class="price-btn auction" data-type="auction">
              경매: ${info.auctionPrice}
              <span class="prob">${((land.diceRequired.auction.length / 6) * 100).toFixed(0)}%</span>
            </button>
          ` : ''}
        </div>
        <button class="btn-purchase" id="confirm-purchase">구매 시도</button>
      </div>
    `;

        optionsContainer.classList.remove('hidden');

        // 가격 타입 선택
        optionsContainer.querySelectorAll('.price-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                optionsContainer.querySelectorAll('.price-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedPriceType = btn.dataset.type;
            });
        });

        // 기본 선택
        optionsContainer.querySelector('.price-btn.market')?.classList.add('selected');

        // 구매 시도
        document.getElementById('confirm-purchase')?.addEventListener('click', async () => {
            await this.attemptPurchase();
        });
    }

    // 토지 구매 시도
    async attemptPurchase() {
        const player = gameState.getCurrentPlayer();
        const land = gameState.availableLands[this.selectedCardIndex];

        if (this.selectedPriceType === 'market') {
            // 시세는 항상 성공
            const result = attemptLandPurchase(gameState.currentPlayerIndex, this.selectedCardIndex, 'market');
            if (result.isSuccess) {
                showNotification(result.message, 'success');
                this.nextPlayerOrPhase('land');
            } else {
                showNotification(result.message, 'error');
            }
        } else {
            // 급매/경매는 주사위
            const diceResult = await showLandPurchaseDice(
                land.name,
                this.selectedPriceType,
                land.diceRequired[this.selectedPriceType]
            );

            if (diceResult.isSuccess) {
                const result = attemptLandPurchase(gameState.currentPlayerIndex, this.selectedCardIndex, this.selectedPriceType);
                showNotification(result.message, 'success');
            } else {
                showNotification('매매 불발! 다른 토지를 선택하세요.', 'warning');
            }

            this.nextPlayerOrPhase('land');
        }

        document.getElementById('purchase-options')?.classList.add('hidden');
    }

    // 설계 페이즈
    runDesignPhase() {
        this.selectedArchitectIndex = null;
        this.selectedBuildingName = null;

        renderCardGrid(gameState.availableArchitects, 'architect', (index, architect) => {
            this.selectedArchitectIndex = index;
            highlightCard(index);
            this.showBuildingSelection();
        });
    }

    // 건물 선택 표시
    showBuildingSelection() {
        const player = gameState.getCurrentPlayer();
        const land = player.currentProject.land;
        const buildings = getAvailableBuildings(land);

        renderBuildingSelector(buildings, (index, building) => {
            this.selectedBuildingName = building.name;
            this.confirmDesign();
        });
    }

    // 설계 확정
    confirmDesign() {
        if (this.selectedArchitectIndex === null || !this.selectedBuildingName) {
            showNotification('건축가와 건물을 선택해주세요.', 'error');
            return;
        }

        const result = completeDesign(gameState.currentPlayerIndex, this.selectedArchitectIndex, this.selectedBuildingName);

        if (result.success) {
            showNotification(result.message, 'success');
            this.nextPlayerOrPhase('architect');
        } else {
            showNotification(result.message, 'error');
        }
    }

    // 시공 페이즈
    runConstructionPhase() {
        renderCardGrid(gameState.availableConstructors, 'constructor', async (index, constructor) => {
            const check = canSelectConstructor(gameState.currentPlayerIndex, index);

            if (!check.success) {
                showNotification(check.message, 'error');
                return;
            }

            if (!check.canAfford) {
                showNotification('자금이 부족합니다.', 'error');
                return;
            }

            // 시공사 선택
            const result = selectConstructor(gameState.currentPlayerIndex, index);

            if (result.success) {
                showNotification(result.message, 'success');

                // 리스크 카드 공개
                const player = gameState.getCurrentPlayer();
                await showRiskCardDraw(player.currentProject.risks);

                // 리스크 처리
                const riskResult = processRisks(gameState.currentPlayerIndex);

                if (riskResult.success) {
                    showResultModal('시공 완료', `
            <div class="risk-summary">
              <p>${riskResult.message}</p>
              <ul>
                <li>총 리스크: ${riskResult.summary.totalRisks}개</li>
                <li>방어: ${riskResult.summary.blocked}개</li>
                <li>비용 증가: ${riskResult.summary.costIncrease}</li>
                <li>이자비용: ${gameState.formatMoney(riskResult.summary.interestCost)}</li>
              </ul>
            </div>
          `, () => {
                        this.nextPlayerOrPhase('constructor');
                    });
                }
            } else {
                showNotification(result.message, 'error');
            }
        });
    }

    // 평가 페이즈
    runEvaluationPhase() {
        const player = gameState.getCurrentPlayer();
        const result = calculateSalePrice(gameState.currentPlayerIndex);

        if (!result.success) {
            showNotification(result.message, 'error');
            return;
        }

        const bd = result.breakdown;

        showResultModal(`${player.name}의 건물 평가`, `
      <div class="evaluation-result">
        <h3>${player.currentProject.building.emoji} ${player.currentProject.building.name}</h3>
        <p>📍 ${player.currentProject.land.name}</p>
        
        <table class="eval-table">
          <tr><td>토지 비용</td><td>${gameState.formatMoney(bd.landCost)}</td></tr>
          <tr><td>설계비</td><td>${gameState.formatMoney(bd.designCost)}</td></tr>
          <tr><td>시공비</td><td>${gameState.formatMoney(bd.constructionCost)}</td></tr>
          <tr class="total"><td>총 투자</td><td>${gameState.formatMoney(bd.totalInvestment)}</td></tr>
          <tr><td>손실비용</td><td>-${gameState.formatMoney(bd.lossCost)}</td></tr>
          <tr><td>평가 팩터</td><td>x${bd.finalFactor.toFixed(2)}</td></tr>
          ${bd.awards.map(a => `<tr class="award"><td>${a.name}</td><td>x${a.bonus}</td></tr>`).join('')}
          <tr class="sale"><td>매각 금액</td><td>${gameState.formatMoney(bd.salePrice)}</td></tr>
          <tr><td>대출 상환</td><td>-${gameState.formatMoney(bd.loanRepayment)}</td></tr>
          <tr class="final"><td>최종 수익</td><td>${gameState.formatMoney(bd.netProfit)}</td></tr>
        </table>
      </div>
    `, () => {
            completeEvaluation(gameState.currentPlayerIndex);
            this.nextPlayerOrPhase('salePrice');
        });
    }

    // 다음 플레이어 또는 다음 페이즈
    nextPlayerOrPhase(checkField) {
        // 모든 플레이어가 완료했는지 확인
        let allComplete = false;

        switch (checkField) {
            case 'land':
                allComplete = checkLandPhaseComplete();
                break;
            case 'architect':
                allComplete = checkDesignPhaseComplete();
                break;
            case 'constructor':
                allComplete = checkConstructionPhaseComplete();
                break;
            case 'salePrice':
                allComplete = checkEvaluationPhaseComplete();
                break;
        }

        if (allComplete) {
            gameState.nextPhase();
        } else {
            gameState.nextPlayer();
        }

        this.updateUI();
        this.runPhase();
    }

    // 라운드 종료
    endRound() {
        const summary = getRoundSummary();

        showResultModal(`라운드 ${summary.round} 결과`, `
      <div class="round-summary">
        <h3>🏆 순위</h3>
        <ol>
          ${summary.rankings.map((r, i) => `
            <li>${r.name}: ${r.building} - ${gameState.formatMoney(r.salePrice)}</li>
          `).join('')}
        </ol>
        <p>다음 라운드 선: ${summary.nextRoundFirst}</p>
      </div>
    `, () => {
            const hasNextRound = gameState.endRound();
            if (hasNextRound) {
                this.startRound();
            } else {
                this.showFinalResults();
            }
        });
    }

    // 최종 결과
    showFinalResults() {
        const results = getFinalResults();

        showResultModal('🏆 게임 종료!', `
      <div class="final-results">
        <h2>우승: ${results.winner.name}!</h2>
        <p>최종 자산: ${gameState.formatMoney(results.winner.totalMoney)}</p>
        
        <h3>최종 순위</h3>
        <ol>
          ${results.rankings.map(r => `
            <li>
              <strong>${r.name}</strong>: ${gameState.formatMoney(r.totalMoney)}
              <br>건물 ${r.buildingsCount}개
            </li>
          `).join('')}
        </ol>
      </div>
    `, () => {
            this.showMainMenu();
        });
    }

    // UI 업데이트
    updateUI() {
        renderGameBoard();
        renderPlayerPanels();
        renderGameLog();
    }

    // 게임 불러오기
    loadGame() {
        if (gameState.load()) {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            this.updateUI();
            this.runPhase();
        } else {
            showNotification('저장된 게임이 없습니다.', 'error');
        }
    }

    // 규칙 보기
    showRules() {
        showResultModal('📜 게임 규칙', `
      <div class="rules-content">
        <h3>🎯 목표</h3>
        <p>4라운드 동안 부동산 개발로 최대 수익을 올리세요!</p>
        
        <h3>📋 게임 진행</h3>
        <ol>
          <li><strong>대지 구매:</strong> 토지를 선택하고 주사위로 낙찰</li>
          <li><strong>설계:</strong> 건축가와 건물 유형 선택</li>
          <li><strong>시공:</strong> 시공사 선택 후 리스크 카드 처리</li>
          <li><strong>평가:</strong> 건물 가치 산정 및 매각</li>
        </ol>
        
        <h3>💡 팁</h3>
        <ul>
          <li>토지에 적합한 건물을 지으면 보너스!</li>
          <li>건축가의 대표작을 선택하면 보너스!</li>
          <li>대형 시공사는 리스크를 막을 수 있어요</li>
        </ul>
      </div>
    `);
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    const app = new GameApp();
    app.init();
});
