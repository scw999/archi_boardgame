// 앱 진입점 - 초기화 및 이벤트 바인딩
import { gameState, GAME_PHASES } from './core/game-state.js';
import { renderGameBoard, renderGameLog, renderActionArea, showNotification, showResultModal } from './ui/game-board.js';
import { renderPlayerPanels } from './ui/player-panel.js';
import { renderCardGrid, highlightCard, renderBuildingSelector } from './ui/card-display.js';
import { showDiceRoll, showStartingDiceRoll, showLandPurchaseDice, showRiskCardDraw } from './ui/dice-roller.js';
import { initProjectMap, renderProjectMap, renderCityGrid } from './ui/game-map.js';
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
        initProjectMap();
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
        // 플레이어 턴 시작 시 상태 초기화 (이전 플레이어 선택 유지 버그 수정)
        this.selectedCardIndex = null;
        this.selectedPriceType = 'market';

        const player = gameState.getCurrentPlayer();

        renderCardGrid(gameState.availableLands, 'land', (index, land) => {
            this.selectedCardIndex = index;
            highlightCard(index);
            this.showLandPurchaseOptions(land);
        });

        // 액션 버튼 - PM활동, 매각 옵션 추가
        const actions = [
            { id: 'pm-activity', label: 'PM 활동 (+5천만)', icon: '👷' },
            { id: 'sell-land', label: '대지 매각', icon: '💰' },
            { id: 'skip-land', label: '이번 턴 패스', icon: '⏭️' }
        ];

        // 완성된 건물이 있으면 건물 매각 버튼 추가
        if (player.buildings.length > 0) {
            actions.splice(2, 0, { id: 'sell-building', label: '건물 매각', icon: '🏢' });
        }

        renderActionArea(actions);

        // PM 활동
        document.querySelector('[data-action="pm-activity"]')?.addEventListener('click', () => {
            const result = gameState.doPMActivity(gameState.currentPlayerIndex);
            showNotification(result.message, 'success');
            this.updateUI();
            this.nextPlayerOrPhase('land');
        });

        // 대지 매각
        document.querySelector('[data-action="sell-land"]')?.addEventListener('click', () => {
            const result = gameState.sellCurrentLand(gameState.currentPlayerIndex);
            if (result.success) {
                showNotification(result.message, 'success');
                this.updateUI();
            } else {
                showNotification(result.message, 'error');
            }
        });

        // 건물 매각
        document.querySelector('[data-action="sell-building"]')?.addEventListener('click', () => {
            this.showBuildingSellModal();
        });

        // 턴 패스
        document.querySelector('[data-action="skip-land"]')?.addEventListener('click', () => {
            showNotification(`${player.name} 토지 구매 패스`, 'info');
            this.nextPlayerOrPhase('land');
        });
    }

    // 건물 매각 모달 표시
    showBuildingSellModal() {
        const player = gameState.getCurrentPlayer();

        if (player.buildings.length === 0) {
            showNotification('매각할 건물이 없습니다.', 'error');
            return;
        }

        const buildingList = player.buildings.map((b, idx) => `
            <div class="sell-building-item" data-index="${idx}">
                <span class="building-info">${b.building.emoji} ${b.building.name} @ ${b.land.name}</span>
                <span class="sell-price">매각가: ${gameState.formatMoney(Math.floor(b.salePrice * 0.9))}</span>
                <button class="btn-sell-item" data-index="${idx}">매각</button>
            </div>
        `).join('');

        showResultModal('건물 매각', `
            <div class="sell-modal">
                <p>매각할 건물을 선택하세요. (원가의 90%)</p>
                <div class="sell-list">${buildingList}</div>
            </div>
        `, () => { });

        // 매각 버튼 이벤트
        document.querySelectorAll('.btn-sell-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const result = gameState.sellBuilding(gameState.currentPlayerIndex, idx);
                if (result.success) {
                    showNotification(result.message, 'success');
                    document.querySelector('.modal-overlay')?.remove();
                    this.updateUI();
                } else {
                    showNotification(result.message, 'error');
                }
            });
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

            // 주사위 결과를 전달하여 이중 굴림 방지
            const result = attemptLandPurchase(
                gameState.currentPlayerIndex,
                this.selectedCardIndex,
                this.selectedPriceType,
                diceResult.value  // 이미 굴린 주사위 결과 전달
            );

            if (result.isSuccess) {
                showNotification(result.message, 'success');
            } else {
                showNotification(result.message, 'warning');
            }

            this.nextPlayerOrPhase('land');
        }

        document.getElementById('purchase-options')?.classList.add('hidden');
    }

    // 설계 페이즈
    runDesignPhase() {
        this.selectedArchitectIndex = null;
        this.selectedBuildingName = null;

        const player = gameState.getCurrentPlayer();

        // 토지가 없으면 설계 불가
        if (!player.currentProject || !player.currentProject.land) {
            showNotification('먼저 토지를 구매해야 합니다.', 'error');
            this.nextPlayerOrPhase('architect');
            return;
        }

        renderCardGrid(gameState.availableArchitects, 'architect', (index, architect) => {
            this.selectedArchitectIndex = index;
            highlightCard(index);
            this.showDesignPanel(architect);
        });
    }

    // 설계 패널 표시 (건축가 선택 후)
    showDesignPanel(architect) {
        const player = gameState.getCurrentPlayer();
        const land = player.currentProject.land;
        const buildings = getAvailableBuildings(land);

        const designPanel = document.getElementById('design-panel') || document.createElement('div');
        designPanel.id = 'design-panel';
        designPanel.className = 'design-panel';

        designPanel.innerHTML = `
            <div class="design-panel-content">
                <h3>📐 설계 진행</h3>
                <div class="architect-info">
                    <span class="portrait">${architect.portrait}</span>
                    <span class="name">${architect.name}</span>
                    <span class="trait">${architect.trait}</span>
                </div>
                
                <h4>건물 선택</h4>
                <div class="building-grid">
                    ${buildings.map((building, index) => {
            const designFee = this.calculateDesignFeePreview(architect, building);
            const constructionCost = Math.round(building.constructionCost * architect.constructionMultiplier);
            const isMasterpiece = architect.masterpieces.includes(building.name);

            return `
                            <div class="building-option ${building.isSuitable ? 'suitable' : ''}" 
                                 data-index="${index}" 
                                 data-building="${building.name}">
                                <div class="building-emoji">${building.emoji}</div>
                                <div class="building-name">${building.name}</div>
                                ${isMasterpiece ? '<div class="masterpiece-badge">✨ 대표작</div>' : ''}
                                <div class="building-costs">
                                    <div class="cost-item">
                                        <span class="cost-label">설계비</span>
                                        <span class="cost-value">${gameState.formatMoney(designFee)}</span>
                                    </div>
                                    <div class="cost-item">
                                        <span class="cost-label">예상 시공비</span>
                                        <span class="cost-value">${gameState.formatMoney(constructionCost)}</span>
                                    </div>
                                </div>
                                ${building.isSuitable ? '<div class="suitable-badge">✓ 토지 적합</div>' : ''}
                            </div>
                        `;
        }).join('')}
                </div>
                
                <div class="selected-building-info" id="selected-building-info" style="display: none;">
                    <h4>선택한 건물</h4>
                    <div id="building-summary"></div>
                    <button class="btn-confirm-design" id="btn-confirm-design">📐 설계 진행하기</button>
                </div>
            </div>
        `;

        // 패널을 DOM에 추가
        const actionArea = document.getElementById('action-area');
        if (actionArea) {
            actionArea.innerHTML = '';
            actionArea.appendChild(designPanel);
        }

        // 건물 선택 이벤트
        designPanel.querySelectorAll('.building-option').forEach(option => {
            option.addEventListener('click', () => {
                // 이전 선택 해제
                designPanel.querySelectorAll('.building-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');

                const buildingName = option.dataset.building;
                this.selectedBuildingName = buildingName;

                // 선택 정보 표시
                this.showSelectedBuildingInfo(architect, buildings.find(b => b.name === buildingName));
            });
        });
    }

    // 설계비 미리보기 계산
    calculateDesignFeePreview(architect, building) {
        let fee = building.designFee * architect.feeMultiplier;
        // 대표작이 아니면 30% 할인
        if (!architect.masterpieces.includes(building.name)) {
            fee *= 0.7;
        }
        return Math.round(fee);
    }

    // 선택한 건물 정보 표시
    showSelectedBuildingInfo(architect, building) {
        const infoContainer = document.getElementById('selected-building-info');
        const summaryContainer = document.getElementById('building-summary');

        if (!infoContainer || !summaryContainer) return;

        const designFee = this.calculateDesignFeePreview(architect, building);
        const constructionCost = Math.round(building.constructionCost * architect.constructionMultiplier);
        const isMasterpiece = architect.masterpieces.includes(building.name);
        const player = gameState.getCurrentPlayer();
        const canAfford = player.money >= designFee || (player.money + gameState.getMaxLoan(player) - player.loan) >= designFee;

        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="label">건물</span>
                    <span class="value">${building.emoji} ${building.name}</span>
                </div>
                <div class="summary-item">
                    <span class="label">건축가</span>
                    <span class="value">${architect.portrait} ${architect.name}</span>
                </div>
                <div class="summary-item highlight">
                    <span class="label">설계비</span>
                    <span class="value">${gameState.formatMoney(designFee)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">예상 시공비</span>
                    <span class="value">${gameState.formatMoney(constructionCost)}</span>
                </div>
                ${isMasterpiece ? '<div class="masterpiece-note">✨ 대표작 보너스 적용!</div>' : '<div class="non-masterpiece-note">⚠️ 대표작 아님 - 설계비 30% 할인, 보너스 반감</div>'}
            </div>
        `;

        infoContainer.style.display = 'block';

        // 설계 진행 버튼 이벤트
        const confirmBtn = document.getElementById('btn-confirm-design');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (!canAfford) {
                    showNotification('자금이 부족합니다. 대출이 필요합니다.', 'warning');
                }
                this.confirmDesignWithBlueprint(architect, building, designFee);
            };
        }
    }

    // 설계 확정 및 설계도 표시
    confirmDesignWithBlueprint(architect, building, designFee) {
        if (this.selectedArchitectIndex === null || !this.selectedBuildingName) {
            showNotification('건축가와 건물을 선택해주세요.', 'error');
            return;
        }

        const result = completeDesign(gameState.currentPlayerIndex, this.selectedArchitectIndex, this.selectedBuildingName);

        if (result.success) {
            // 설계도 모달 표시
            this.showBlueprintModal(architect, building, result);
        } else {
            showNotification(result.message, 'error');
        }
    }

    // 설계도 모달 표시
    showBlueprintModal(architect, building, result) {
        const player = gameState.getCurrentPlayer();

        showResultModal(`📐 설계 완료!`, `
            <div class="blueprint-modal">
                <div class="blueprint-header">
                    <div class="building-icon">${building.emoji}</div>
                    <h2>${building.name}</h2>
                </div>
                
                <div class="blueprint-content">
                    <div class="blueprint-image">
                        <div class="blueprint-frame">
                            <div class="blueprint-grid">
                                ${building.emoji}
                            </div>
                            <div class="blueprint-label">설계도</div>
                        </div>
                    </div>
                    
                    <div class="design-details">
                        <div class="detail-row">
                            <span class="label">건축가</span>
                            <span class="value">${architect.portrait} ${architect.name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">건물 면적</span>
                            <span class="value">${building.area}평</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">설계비 지불</span>
                            <span class="value paid">-${gameState.formatMoney(result.designFee)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">예상 시공비</span>
                            <span class="value">${gameState.formatMoney(result.estimatedConstructionCost)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">시공 기간</span>
                            <span class="value">${building.constructionPeriod}개월</span>
                        </div>
                    </div>
                </div>
                
                <p class="next-phase-notice">다음 단계: 시공사 선택 및 시공 진행</p>
            </div>
        `, () => {
            showNotification(result.message, 'success');
            this.nextPlayerOrPhase('architect');
        });
    }

    // 기존 건물 선택 표시 (렌더링용으로 남겨둠)
    showBuildingSelection() {
        const player = gameState.getCurrentPlayer();
        const land = player.currentProject.land;
        const buildings = getAvailableBuildings(land);

        renderBuildingSelector(buildings, (index, building) => {
            this.selectedBuildingName = building.name;
            this.confirmDesign();
        });
    }

    // 설계 확정 (기존 호환용)
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
        const player = gameState.getCurrentPlayer();

        // 설계가 완료되지 않은 경우
        if (!player.currentProject || !player.currentProject.building) {
            showNotification('먼저 설계를 완료해야 합니다.', 'error');
            this.nextPlayerOrPhase('constructor');
            return;
        }

        const building = player.currentProject.building;
        const architect = player.currentProject.architect;

        // 해당 건물을 시공할 수 있고 선점되지 않은 시공사만 필터링
        const availableConstructors = gameState.availableConstructors.filter(
            c => c.canBuild.includes(building.name) && gameState.isConstructorAvailable(c.id)
        );

        // 선점된 시공사 (표시용)
        const claimedConstructors = gameState.availableConstructors.filter(
            c => c.canBuild.includes(building.name) && !gameState.isConstructorAvailable(c.id)
        );

        if (availableConstructors.length === 0 && claimedConstructors.length === 0) {
            showNotification('이 건물을 시공할 수 있는 시공사가 없습니다.', 'error');
            return;
        }

        // 시공 비용 확인해서 부족하면 돈벌기 버튼 표시
        const cheapestConstructor = availableConstructors.length > 0
            ? availableConstructors.reduce((min, c) => {
                const cost = c.costMultiplier * building.constructionCost;
                return cost < min.cost ? { constructor: c, cost } : min;
            }, { constructor: null, cost: Infinity })
            : null;

        const needsMoney = cheapestConstructor && player.money < cheapestConstructor.cost * 0.3;

        // 액션 영역에 돈벌기 옵션 표시
        if (needsMoney) {
            this.showConstructionMoneyOptions(player, cheapestConstructor.cost);
        }

        // 카드 그리드에 선점된 카드 표시 포함
        const allConstructors = [
            ...availableConstructors.map(c => ({ ...c, isClaimed: false })),
            ...claimedConstructors.map(c => ({ ...c, isClaimed: true }))
        ];

        renderCardGrid(allConstructors, 'constructor', async (index, constructor) => {
            // 선점된 시공사는 클릭 불가
            if (constructor.isClaimed) {
                showNotification(`${constructor.name}은(는) 이미 다른 플레이어가 선택했습니다.`, 'warning');
                return;
            }
            // 원래 인덱스 찾기
            const originalIndex = gameState.availableConstructors.findIndex(c => c.id === constructor.id);
            this.showConstructionPanel(constructor, originalIndex, building, architect);
        });
    }

    // 시공 단계 돈벌기 옵션 표시
    showConstructionMoneyOptions(player, neededCost) {
        const actionArea = document.getElementById('action-area');
        if (!actionArea) return;

        const pmIncome = 50000000 + (player.buildings.length * 20000000);

        const moneyOptionsHtml = `
            <div class="money-options-panel">
                <h4>💰 자금이 부족합니다</h4>
                <p>필요 시공비: 약 ${gameState.formatMoney(neededCost)} / 보유: ${gameState.formatMoney(player.money)}</p>
                <div class="money-action-buttons">
                    <button class="action-btn pm" id="btn-pm-construction">
                        💼 PM 활동 (+${gameState.formatMoney(pmIncome)})
                    </button>
                    ${player.currentProject?.land ? `
                        <button class="action-btn sell" id="btn-sell-land-construction">
                            🏞️ 대지 매각 (${gameState.formatMoney(Math.floor((player.currentProject.landPrice + player.currentProject.developmentCost) * 1.1))})
                        </button>
                    ` : ''}
                    ${player.buildings.length > 0 ? `
                        <button class="action-btn sell" id="btn-sell-building-construction">
                            🏢 건물 매각
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // 기존 액션 영역 위에 추가
        const existingContent = actionArea.innerHTML;
        actionArea.innerHTML = moneyOptionsHtml + existingContent;

        // PM 활동 버튼
        const pmBtn = document.getElementById('btn-pm-construction');
        if (pmBtn) {
            pmBtn.onclick = () => {
                const result = gameState.doPMActivity(gameState.currentPlayerIndex);
                if (result.success) {
                    showNotification(result.message, 'success');
                    this.updateUI();
                    this.runConstructionPhase();
                }
            };
        }

        // 대지 매각 버튼
        const sellLandBtn = document.getElementById('btn-sell-land-construction');
        if (sellLandBtn) {
            sellLandBtn.onclick = () => {
                const result = gameState.sellCurrentLand(gameState.currentPlayerIndex);
                if (result.success) {
                    showNotification(result.message, 'success');
                    this.updateUI();
                    // 대지를 팔면 시공 불가, 다음 플레이어로
                    this.nextPlayerOrPhase('constructor');
                } else {
                    showNotification(result.message, 'error');
                }
            };
        }

        // 건물 매각 버튼
        const sellBuildingBtn = document.getElementById('btn-sell-building-construction');
        if (sellBuildingBtn) {
            sellBuildingBtn.onclick = () => {
                this.showBuildingSellModal(() => {
                    this.runConstructionPhase();
                });
            };
        }
    }

    // 시공 패널 표시
    showConstructionPanel(constructor, constructorIndex, building, architect) {
        const player = gameState.getCurrentPlayer();
        const check = canSelectConstructor(gameState.currentPlayerIndex, constructorIndex);

        if (!check.success) {
            showNotification(check.message, 'error');
            return;
        }

        const constructionPanel = document.getElementById('construction-panel') || document.createElement('div');
        constructionPanel.id = 'construction-panel';
        constructionPanel.className = 'construction-panel';

        const sizeNames = {
            large: '🏢 대형',
            medium: '🏠 중소',
            small: '🔧 영세',
            atelier: '🎨 아뜰리에',
            direct: '👷 직영공사'
        };

        constructionPanel.innerHTML = `
            <div class="construction-panel-content">
                <h3>🏗️ 시공 계약</h3>
                
                <div class="constructor-info">
                    <div class="constructor-header">
                        <span class="emoji">${constructor.emoji}</span>
                        <span class="name">${constructor.name}</span>
                        <span class="size">${sizeNames[constructor.size]}</span>
                    </div>
                    <p class="description">${constructor.description}</p>
                </div>
                
                <div class="construction-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">건물</span>
                            <span class="value">${building.emoji} ${building.name}</span>
                        </div>
                        <div class="detail-item highlight">
                            <span class="label">시공비</span>
                            <span class="value">${gameState.formatMoney(check.constructionCost)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">시공 기간</span>
                            <span class="value">${check.constructionPeriod}개월</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">리스크 방어</span>
                            <span class="value">${constructor.riskBlocks > 0 ? `🛡️ ${constructor.riskBlocks}개 방어 가능` : '⚠️ 방어 불가'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">지불 방식</span>
                            <span class="value">${constructor.paymentStages}단계 분할</span>
                        </div>
                        ${constructor.artistryBonus > 1 ? `
                            <div class="detail-item bonus">
                                <span class="label">예술성 보너스</span>
                                <span class="value">✨ x${constructor.artistryBonus}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="payment-schedule">
                        <h4>💰 지불 일정</h4>
                        <div class="schedule-grid">
                            ${check.paymentSchedule.map((payment, i) => `
                                <div class="schedule-item">
                                    <span class="stage">${i + 1}단계</span>
                                    <span class="amount">${gameState.formatMoney(payment)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="risk-warning">
                        <h4>⚠️ 리스크 안내</h4>
                        <p>시공 중 ${check.constructionPeriod}장의 리스크 카드가 공개됩니다.</p>
                        ${constructor.riskBlocks > 0
                ? `<p class="defense">🛡️ ${constructor.name}은 최대 ${constructor.riskBlocks}개의 리스크를 방어할 수 있습니다.</p>`
                : `<p class="no-defense">⚠️ 이 시공사는 리스크를 방어할 수 없습니다. 신중히 선택하세요!</p>`
            }
                    </div>
                </div>
                
                <div class="action-buttons">
                    ${check.canAfford
                ? `<button class="btn-confirm-construction" id="btn-confirm-construction">🏗️ 시공 계약 체결</button>`
                : `<button class="btn-confirm-construction disabled" disabled>💸 자금 부족</button>`
            }
                    <button class="btn-cancel" id="btn-cancel-construction">다른 시공사 선택</button>
                </div>
            </div>
        `;

        // 패널을 DOM에 추가
        const actionArea = document.getElementById('action-area');
        if (actionArea) {
            actionArea.innerHTML = '';
            actionArea.appendChild(constructionPanel);
        }

        // 시공 계약 버튼 이벤트
        const confirmBtn = document.getElementById('btn-confirm-construction');
        if (confirmBtn && check.canAfford) {
            confirmBtn.onclick = () => {
                this.executeConstruction(constructorIndex, constructor, check);
            };
        }

        // 취소 버튼 이벤트
        const cancelBtn = document.getElementById('btn-cancel-construction');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.runConstructionPhase();
            };
        }
    }

    // 시공 실행
    async executeConstruction(constructorIndex, constructor, check) {
        // 시공사 선택
        const result = selectConstructor(gameState.currentPlayerIndex, constructorIndex);

        if (result.success) {
            showNotification(result.message, 'success');

            // 리스크 카드 뽑기 안내
            showResultModal('🎴 리스크 카드 뽑기', `
                <div class="risk-draw-intro">
                    <p>시공 기간 동안 발생할 수 있는 리스크를 확인합니다.</p>
                    <p><strong>${result.riskCount}장</strong>의 리스크 카드를 뽑습니다.</p>
                    ${constructor.riskBlocks > 0
                    ? `<p class="defense-note">🛡️ ${constructor.name}이(가) 최대 ${constructor.riskBlocks}개까지 방어합니다.</p>`
                    : ''
                }
                </div>
            `, async () => {
                // 리스크 카드 공개
                const player = gameState.getCurrentPlayer();
                await showRiskCardDraw(player.currentProject.risks);

                // 리스크 처리
                const riskResult = processRisks(gameState.currentPlayerIndex);

                if (riskResult.success) {
                    this.showConstructionResult(constructor, riskResult);
                }
            });
        } else {
            showNotification(result.message, 'error');
        }
    }

    // 시공 결과 표시
    showConstructionResult(constructor, riskResult) {
        const player = gameState.getCurrentPlayer();
        const project = player.currentProject;

        showResultModal('🏗️ 시공 완료!', `
            <div class="construction-result">
                <div class="result-header">
                    <span class="building-emoji">${project.building.emoji}</span>
                    <h2>${project.building.name}</h2>
                </div>
                
                <div class="risk-summary">
                    <h4>📊 리스크 처리 결과</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="label">총 리스크</span>
                            <span class="value">${riskResult.summary.totalRisks}개</span>
                        </div>
                        <div class="summary-item success">
                            <span class="label">방어 성공</span>
                            <span class="value">🛡️ ${riskResult.summary.blocked}개</span>
                        </div>
                        <div class="summary-item ${riskResult.summary.costIncrease !== '+0%' ? 'warning' : ''}">
                            <span class="label">비용 증가</span>
                            <span class="value">${riskResult.summary.costIncrease}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">이자 비용</span>
                            <span class="value">${gameState.formatMoney(riskResult.summary.interestCost)}</span>
                        </div>
                    </div>
                    
                    ${riskResult.summary.isTotalLoss
                ? `<div class="total-loss-warning">💥 건물 붕괴! 모든 투자가 손실되었습니다.</div>`
                : `<div class="success-message">✅ 시공이 성공적으로 완료되었습니다!</div>`
            }
                </div>
                
                <div class="final-costs">
                    <h4>💰 최종 비용</h4>
                    <div class="cost-row">
                        <span class="label">시공비</span>
                        <span class="value">${gameState.formatMoney(project.constructionCost)}</span>
                    </div>
                    <div class="cost-row">
                        <span class="label">추가 손실</span>
                        <span class="value warning">${gameState.formatMoney(project.totalLoss)}</span>
                    </div>
                </div>
                
                <p class="next-phase-notice">다음 단계: 건물 평가 및 매각</p>
            </div>
        `, () => {
            this.nextPlayerOrPhase('constructor');
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
        const hasAwards = bd.awards.length > 0;
        const isProfit = bd.netProfit > bd.totalInvestment;

        showResultModal(`🏆 ${player.name}의 건물 평가`, `
      <div class="evaluation-result fancy">
        <div class="eval-building-showcase">
          <div class="building-icon-large">${player.currentProject.building.emoji}</div>
          <h2>${player.currentProject.building.name}</h2>
          <p class="location">📍 ${player.currentProject.land.name}</p>
        </div>

        ${hasAwards ? `
        <div class="awards-section">
          <h3>🎉 수상 내역</h3>
          <div class="awards-list">
            ${bd.awards.map(a => `
              <div class="award-item animate-pop">
                <span class="award-emoji">${a.emoji}</span>
                <span class="award-name">${a.name}</span>
                <span class="award-bonus">+${Math.round((a.bonus - 1) * 100)}%</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="eval-breakdown">
          <div class="breakdown-row">
            <span class="label">💰 총 투자비용</span>
            <span class="value">${gameState.formatMoney(bd.totalInvestment)}</span>
          </div>
          <div class="breakdown-details">
            <span>토지 ${gameState.formatMoney(bd.landCost)} + 설계 ${gameState.formatMoney(bd.designCost)} + 시공 ${gameState.formatMoney(bd.constructionCost)}</span>
          </div>

          ${bd.lossCost > 0 ? `
          <div class="breakdown-row loss">
            <span class="label">⚠️ 손실비용</span>
            <span class="value">-${gameState.formatMoney(bd.lossCost)}</span>
          </div>
          ` : ''}

          <div class="breakdown-row factor">
            <span class="label">⭐ 평가 팩터</span>
            <span class="value highlight">x${bd.finalFactor.toFixed(2)}</span>
          </div>

          ${bd.locationBonus > 0 ? `
          <div class="breakdown-row bonus">
            <span class="label">🏞️ 입지 보너스</span>
            <span class="value">+${(bd.locationBonus * 100).toFixed(0)}%</span>
          </div>
          ` : ''}
        </div>

        <div class="eval-final ${isProfit ? 'profit' : 'loss'}">
          <div class="final-row sale">
            <span class="label">💵 매각 금액</span>
            <span class="value large">${gameState.formatMoney(bd.salePrice)}</span>
          </div>
          ${bd.loanRepayment > 0 ? `
          <div class="final-row repay">
            <span class="label">🏦 대출 상환</span>
            <span class="value">-${gameState.formatMoney(bd.loanRepayment)}</span>
          </div>
          ` : ''}
          <div class="final-row result ${isProfit ? 'profit' : 'loss'}">
            <span class="label">${isProfit ? '🎉 최종 수익' : '📉 최종 결과'}</span>
            <span class="value super-large">${gameState.formatMoney(bd.netProfit)}</span>
          </div>
        </div>

        ${isProfit ?
                `<div class="celebration">🎊 축하합니다! 성공적인 투자입니다! 🎊</div>` :
                `<div class="consolation">📈 다음에는 더 좋은 결과가 있을 거예요!</div>`
            }
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
        renderProjectMap();
        renderCityGrid();

        // 도시 지도 표시
        const cityGrid = document.getElementById('city-grid');
        if (cityGrid && gameState.phase !== 'setup') {
            cityGrid.classList.remove('hidden');
        }
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
