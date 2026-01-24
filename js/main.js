// 앱 진입점 - 초기화 및 이벤트 바인딩
import { gameState, GAME_PHASES } from './core/game-state.js';
import { renderGameBoard, renderGameLog, renderActionArea, showNotification, showResultModal, showConfirmModal } from './ui/game-board.js';
import { renderPlayerPanels } from './ui/player-panel.js';
import { renderCardGrid, highlightCard, renderBuildingSelector } from './ui/card-display.js';
import { showDiceRoll, showStartingDiceRoll, showLandPurchaseDice, showRiskCardDraw } from './ui/dice-roller.js';
import { initProjectMap, renderProjectMap, renderCityGrid, resetPlotAssignments, toggle3DCityView } from './ui/game-map.js';
import { selectLand, attemptLandPurchase, attemptLandPurchaseByLand, checkLandPhaseComplete, getLandDisplayInfo, useWildcard as useLandWildcard } from './phases/land-phase.js';
import { getAvailableBuildings, selectArchitect, selectBuilding, completeDesign, checkDesignPhaseComplete } from './phases/design-phase.js';
import { canSelectConstructor, selectConstructor, processRisks, checkConstructionPhaseComplete } from './phases/construction-phase.js';
import { calculateSalePrice, completeEvaluation, checkEvaluationPhaseComplete, getRoundSummary, getFinalResults } from './phases/evaluation-phase.js';
import { buildings, BUILDING_IMAGES } from './data/buildings.js';
import { constructors } from './data/constructors.js';
import { architects } from './data/architects.js';

// 건물 이미지 HTML 생성 헬퍼 함수
function getBuildingImage(buildingName, size = '48px') {
    const imagePath = BUILDING_IMAGES[buildingName];
    if (imagePath) {
        return `<img src="${imagePath}" alt="${buildingName}" class="building-img" style="width: ${size}; height: ${size}; object-fit: contain;">`;
    }
    // 이미지가 없으면 기본 이모지 반환
    const building = buildings[buildingName];
    return building ? building.emoji : '🏢';
}

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
        this.preloadAllAssets(); // 이미지 및 에셋 프리로드
    }

    // 모든 에셋 프리로드 (이미지, 지도 등)
    async preloadAllAssets() {
        const preloader = document.getElementById('preloader');
        const progressBar = document.getElementById('preloader-progress-bar');
        const preloaderText = document.querySelector('.preloader-text');

        // 프리로드할 이미지 목록
        const buildingImages = Object.values(BUILDING_IMAGES);
        const mapImages = ['assets/images/city-map.png'];
        const allImages = [...buildingImages, ...mapImages];

        let loadedCount = 0;
        const totalCount = allImages.length;

        const updateProgress = () => {
            loadedCount++;
            const percent = Math.round((loadedCount / totalCount) * 100);
            if (progressBar) {
                progressBar.style.width = `${percent}%`;
            }
            if (preloaderText) {
                preloaderText.textContent = `로딩 중... ${percent}%`;
            }
        };

        // 이미지 로드 프로미스 생성
        const loadImage = (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    updateProgress();
                    resolve(true);
                };
                img.onerror = () => {
                    updateProgress();
                    resolve(false); // 에러가 나도 진행
                };
                img.src = url;
            });
        };

        console.log(`🖼️ ${totalCount}개 에셋 프리로드 시작...`);

        // 모든 이미지 로드 대기
        await Promise.all(allImages.map(url => loadImage(url)));

        console.log('✅ 모든 에셋 로드 완료!');

        // 프리로더 숨기기 (약간의 딜레이 후)
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('hidden');
            }
            this.showMainMenu();
        }, 500);
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

        // 유틸리티 버튼
        document.getElementById('btn-budget-table')?.addEventListener('click', () => this.showBudgetTable());
        document.getElementById('btn-game-manual')?.addEventListener('click', () => this.showGameManual());

        // 메뉴 드롭다운
        const menuBtn = document.getElementById('btn-game-menu');
        const menuDropdown = document.getElementById('game-menu-dropdown');

        menuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown?.classList.toggle('show');
        });

        // 메뉴 외부 클릭 시 닫기
        document.addEventListener('click', () => {
            menuDropdown?.classList.remove('show');
        });

        // 메뉴 항목 클릭
        document.getElementById('btn-save-game')?.addEventListener('click', () => {
            menuDropdown?.classList.remove('show');
            this.saveGame();
        });
        document.getElementById('btn-load-game-utility')?.addEventListener('click', () => {
            menuDropdown?.classList.remove('show');
            this.loadGame();
        });
        document.getElementById('btn-new-game')?.addEventListener('click', () => {
            menuDropdown?.classList.remove('show');
            this.confirmNewGame();
        });
    }

    // 새 게임 확인
    confirmNewGame() {
        showConfirmModal('새 게임', '현재 게임을 종료하고 새 게임을 시작하시겠습니까?\n저장하지 않은 진행 상황은 사라집니다.', () => {
            this.showMainMenu();
        });
    }

    // 게임 저장
    saveGame() {
        gameState.save();
        showNotification('게임이 저장되었습니다! 💾', 'success');
    }

    // 게임 규칙 메뉴얼
    showGameManual() {
        showResultModal('📖 갓물주 게임 규칙', `
            <div class="game-manual">
                <div class="manual-section">
                    <h3>🎯 게임 목표</h3>
                    <p>부동산 개발을 통해 가장 많은 자산을 모으는 것이 목표입니다.</p>
                    <p>최종 자산 = <strong>현금 + 건물 가치 - 대출금</strong></p>
                </div>

                <div class="manual-section">
                    <h3>🔄 게임 진행 (4라운드)</h3>
                    <p>각 라운드는 4단계로 진행됩니다:</p>
                    <ol>
                        <li><strong>🏞️ 대지 구매</strong> - 토지 카드를 선택하여 구매</li>
                        <li><strong>📐 설계 단계</strong> - 건축가와 건물 유형 선택</li>
                        <li><strong>🏗️ 시공 단계</strong> - 시공사 선택 및 리스크 처리</li>
                        <li><strong>🏆 평가</strong> - 완성된 건물 평가 및 보너스 획득</li>
                    </ol>
                </div>

                <div class="manual-section">
                    <h3>🏞️ 대지 구매</h3>
                    <ul>
                        <li><strong>시세</strong>: 100% 확률로 구매 가능</li>
                        <li><strong>급매</strong>: 특정 주사위 눈이 나와야 구매 (더 저렴)</li>
                        <li><strong>경매</strong>: 가장 저렴하지만 확률 낮음</li>
                    </ul>
                    <p>💡 지역별로 토지 가치가 다릅니다: 서울 핵심 > 서울 > 경기 주요 > 경기 외곽 > 지방</p>
                </div>

                <div class="manual-section">
                    <h3>📐 설계 단계</h3>
                    <ul>
                        <li>건축가마다 <strong>대표작</strong>이 있습니다 (보너스 100%)</li>
                        <li>대표작이 아닌 건물은 설계비 30% 할인, 보너스 50%</li>
                        <li>건축가의 <strong>특성</strong>이 건물 평가에 영향:</li>
                        <ul>
                            <li>예술성: 디자인 평가 보너스</li>
                            <li>효율성: 시공비 절감</li>
                            <li>기능성: 실용성 평가 보너스</li>
                        </ul>
                    </ul>
                </div>

                <div class="manual-section">
                    <h3>🏗️ 시공 단계</h3>
                    <ul>
                        <li>시공사 규모에 따라 <strong>리스크 카드</strong> 수가 다릅니다:</li>
                        <ul>
                            <li>대형: 리스크 1장 (안전, 비용 높음)</li>
                            <li>중견: 리스크 2장</li>
                            <li>영세: 리스크 3장 (위험, 비용 낮음)</li>
                        </ul>
                        <li>리스크 카드는 <strong>공사 지연, 비용 증가, 품질 문제</strong> 등 발생</li>
                        <li>자금 부족 시 <strong>대출</strong> 또는 <strong>건물/토지 매각</strong> 가능</li>
                    </ul>
                </div>

                <div class="manual-section">
                    <h3>🏆 평가 단계</h3>
                    <ul>
                        <li>완성된 건물의 가치가 산정됩니다</li>
                        <li>평가 요소: 건축가 명성, 건물 품질, 시공 상태</li>
                        <li>수상 시 추가 보너스:
                            <ul>
                                <li>🏅 건축상: 우수 건축 평가</li>
                                <li>🌿 친환경상: 지속가능 건축</li>
                                <li>💎 랜드마크상: 지역 상징 건물</li>
                            </ul>
                        </li>
                        <li>🃏 <strong>와일드카드</strong> 획득 기회!</li>
                    </ul>
                </div>

                <div class="manual-section">
                    <h3>🃏 와일드카드</h3>
                    <ul>
                        <li>특별한 효과를 가진 카드</li>
                        <li>건물 완공 시 확률적으로 획득</li>
                        <li>종류: 설계비 무료, 시공비 할인, 리스크 무효화 등</li>
                        <li>적절한 타이밍에 사용하면 큰 이점!</li>
                    </ul>
                </div>

                <div class="manual-section">
                    <h3>💰 자금 관리</h3>
                    <ul>
                        <li><strong>대출</strong>: 현금의 최대 233%까지 (이자율 10%)</li>
                        <li><strong>토지담보대출</strong>: 토지 가치의 70%</li>
                        <li><strong>PM 컨설팅</strong>: 2억 수입, 해당 라운드 스킵</li>
                        <li><strong>건물 매각</strong>: 시장 상황에 따라 85%~115% 가격</li>
                    </ul>
                </div>

                <div class="manual-section">
                    <h3>🎮 게임 팁</h3>
                    <ul>
                        <li>💡 건축가의 대표작을 선택하면 보너스 2배!</li>
                        <li>💡 대형 시공사는 안전하지만 비용이 높습니다</li>
                        <li>💡 와일드카드는 위기 상황에 대비해 아껴두세요</li>
                        <li>💡 무리한 대출은 최종 자산에서 차감됩니다</li>
                        <li>💡 토지 적합 건물을 선택하면 평가 보너스!</li>
                    </ul>
                </div>
            </div>
        `, () => {});

        // 메뉴얼 모달 너비 조정 및 버튼 변경
        const overlay = document.querySelector('.modal-overlay:last-child');
        const modal = overlay?.querySelector('.result-modal');
        if (overlay && modal) {
            overlay.style.background = 'rgba(0, 0, 0, 0.95)';
            modal.style.maxWidth = '700px';
            modal.style.width = '95%';
        }
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

        // 지도 플롯 할당 초기화
        resetPlotAssignments();

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
                gameState.setStartingMoney(index, 14); // 10억
            });
            // 쉬운 시작 시 첫 번째 플레이어가 선
            gameState.startingPlayerIndex = 0;
            gameState.roundStartingPlayer = 0;
            return;
        }

        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            const result = await showStartingDiceRoll(player.name);
            gameState.setStartingMoney(i, result.total);
        }

        // 주사위 합이 가장 높은 플레이어가 선 플레이어
        gameState.determineStartingPlayer();
    }

    // 라운드 시작
    startRound() {
        gameState.startRound();
        this.updateUI();

        // 라운드 시작 알림 (선 플레이어 표시)
        const startingPlayer = gameState.players[gameState.roundStartingPlayer];
        showNotification(`🎮 라운드 ${gameState.currentRound} 시작! 선: ${startingPlayer.name}`, 'info');

        this.runPhase();
    }

    // 현재 페이즈 실행
    runPhase() {
        // 공통 액션 패널 제거 (하단 액션 영역에 통합)
        document.getElementById('common-action-panel')?.remove();

        // 단계 시작 시 화면 위치 유지 (스크롤하지 않음)
        // this.scrollToMapThenCards();

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

    // 단계 시작 시 지도로 스크롤 (가장 위로)
    scrollToMapThenCards() {
        // 개발 지도가 시작 화면에 보이도록 맨 위로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 공통 액션 패널 - 더 이상 사용하지 않음 (항상 가능한 액션 박스 제거됨)
    showCommonActionPanel() {
        // 기존 패널 제거만 수행
        document.getElementById('common-action-panel')?.remove();
    }

    // 현재 체크 필드 반환
    getCurrentCheckField() {
        switch (gameState.phase) {
            case GAME_PHASES.LAND_PURCHASE: return 'land';
            case GAME_PHASES.DESIGN: return 'architect';
            case GAME_PHASES.CONSTRUCTION: return 'constructor';
            case GAME_PHASES.EVALUATION: return 'salePrice';
            default: return 'land';
        }
    }

    // 대지 구매 페이즈
    runLandPhase() {
        // 플레이어 턴 시작 시 상태 초기화 (이전 플레이어 선택 유지 버그 수정)
        this.selectedCardIndex = null;
        this.selectedPriceType = 'market';

        const player = gameState.getCurrentPlayer();

        // PM 컨설팅으로 라운드 스킵한 플레이어는 자동 스킵
        if (player.pmSkippedRound === gameState.currentRound) {
            showNotification(`${player.name}님은 PM 컨설팅으로 이번 라운드를 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('land');
            return;
        }

        // 이미 이번 라운드에 토지를 구매한 플레이어는 스킵
        if (player.currentProject && player.currentProject.land) {
            showNotification(`${player.name}님은 이미 토지를 구매했습니다. 다음 플레이어로 넘어갑니다.`, 'info');
            this.nextPlayerOrPhase('land');
            return;
        }

        renderCardGrid(gameState.availableLands, 'land', (index, land) => {
            this.selectedCardIndex = index;
            highlightCard(index);
            this.showLandPurchaseOptions(land);
        });

        // 액션 버튼 - PM활동, 매각 옵션 추가
        const actions = [
            { id: 'pm-activity', label: 'PM 컨설팅 (+2억)', icon: '👷' },
            { id: 'sell-land', label: '대지 매각', icon: '💰' },
            { id: 'skip-land', label: '이번 턴 패스', icon: '⏭️' }
        ];

        // 완성된 건물이 있으면 건물 매각 버튼 추가 (오렌지색)
        if (player.buildings.length > 0) {
            actions.splice(2, 0, { id: 'sell-building', label: '건물 매각', icon: '🏢', className: 'sell-building-btn' });
        }

        // 토지 가로채기 가능한 경우 버튼 추가 (게임당 1회, 1.5배 비용)
        const canStealLand = this.getStealableLands(player);
        if (canStealLand.length > 0 && !player.wildcardUsed) {
            actions.push({ id: 'steal-land', label: '토지 가로채기 (1회) 🃏', icon: '🃏' });
        }

        renderActionArea(actions);

        // PM 활동
        const self = this; // this 바인딩 보존
        document.querySelector('[data-action="pm-activity"]')?.addEventListener('click', () => {
            showConfirmModal('PM 컨설팅', 'PM 컨설팅을 진행하면 2억을 받고 이번 라운드를 스킵합니다.\n\n진행하시겠습니까?', () => {
                const result = gameState.doPMActivity(gameState.currentPlayerIndex);
                showNotification(result.message, 'success');
                self.updateUI();
                self.nextPlayerOrPhase('land');
            });
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

        // 토지 가로채기
        document.querySelector('[data-action="steal-land"]')?.addEventListener('click', () => {
            this.showStealLandModal();
        });
    }

    // 가로챌 수 있는 토지 목록 가져오기
    // 설계나 시공이 시작된 토지는 가로챌 수 없음
    getStealableLands(currentPlayer) {
        const stealable = [];
        const currentPlayerIndex = gameState.currentPlayerIndex;

        gameState.players.forEach((player, index) => {
            if (index !== currentPlayerIndex &&
                player.currentProject &&
                player.currentProject.land &&
                !player.currentProject.architect) {  // 설계 시작 전만 가로채기 가능
                stealable.push({
                    playerIndex: index,
                    playerName: player.name,
                    land: player.currentProject.land,
                    price: player.currentProject.landPrice
                });
            }
        });

        return stealable;
    }

    // 토지 가로채기 모달 표시
    showStealLandModal() {
        // 토지 구매 단계에서만 가로채기 가능
        if (gameState.phase !== GAME_PHASES.LAND_PURCHASE) {
            showNotification('토지 구매 단계에서만 가로채기가 가능합니다.', 'error');
            return;
        }

        const player = gameState.getCurrentPlayer();
        const stealable = this.getStealableLands(player);

        if (stealable.length === 0) {
            showNotification('가로챌 수 있는 토지가 없습니다.', 'error');
            return;
        }

        if (player.wildcardUsed) {
            showNotification('이미 가로채기를 사용했습니다. (게임당 1회)', 'error');
            return;
        }

        const stealableList = stealable.map(item => {
            const stealCost = Math.floor(item.price * 1.5);
            const canAfford = player.money + gameState.getMaxLoan(player) - player.loan >= stealCost + (item.land.attributes?.slope === 'high' ? 50000000 : 0);

            return `
                <div class="steal-land-item ${canAfford ? '' : 'cannot-afford'}" data-player="${item.playerIndex}">
                    <div class="steal-info">
                        <span class="player-name">🎯 ${item.playerName}의 토지</span>
                        <span class="land-name">${item.land.name}</span>
                    </div>
                    <div class="steal-cost">
                        <span class="original-price">원가: ${gameState.formatMoney(item.price)}</span>
                        <span class="steal-price">가로채기 비용: ${gameState.formatMoney(stealCost)} (1.5배)</span>
                    </div>
                    <button class="btn-steal ${canAfford ? '' : 'disabled'}" data-player="${item.playerIndex}"
                        ${canAfford ? '' : 'disabled'}>
                        ${canAfford ? '🃏 가로채기!' : '자금 부족'}
                    </button>
                </div>
            `;
        }).join('');

        showResultModal('🃏 토지 가로채기', `
            <div class="steal-land-modal">
                <p class="steal-description">
                    다른 플레이어가 구매한 토지를 1.5배 비용으로 가로챌 수 있습니다.
                    <br><strong>⚠️ 게임 전체에서 단 1회만 사용 가능!</strong>
                    <br><span style="color: #f59e0b;">📐 설계가 시작된 토지는 가로챌 수 없습니다.</span>
                </p>
                <div class="steal-land-list">
                    ${stealableList}
                </div>
            </div>
        `, () => {}, false);

        // 가로채기 버튼 이벤트
        setTimeout(() => {
            document.querySelectorAll('.btn-steal:not(.disabled)').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetPlayerIndex = parseInt(e.target.dataset.player);
                    this.executeStealLand(targetPlayerIndex);
                });
            });
        }, 100);
    }

    // 토지 가로채기 실행
    executeStealLand(targetPlayerIndex) {
        const result = useLandWildcard(gameState.currentPlayerIndex, targetPlayerIndex);

        // 모달 닫기
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.remove();

        if (result.success) {
            showNotification(result.message, 'success');
            this.updateUI();
            this.nextPlayerOrPhase('land');
        } else {
            showNotification(result.message, 'error');
        }
    }

    // 건물 매각 모달 표시
    showBuildingSellModal(onSellCallback) {
        const player = gameState.getCurrentPlayer();

        if (player.buildings.length === 0) {
            showNotification('매각할 건물이 없습니다.', 'error');
            return;
        }

        const buildingList = player.buildings.map((b, idx) => {
            // 실제 매각 계산식과 동일하게 예상 가격 계산
            const totalInvestment = b.landPrice + b.designFee + b.constructionCost;
            const evalFactor = b.evaluationFactor || 1.0;
            const architectBonus = b.architect ? (b.architect.fame || 0) * 0.02 : 0;
            // 시장 변동 범위 (85% ~ 115%)
            const minPrice = Math.floor(totalInvestment * evalFactor * 0.85 * (1 + architectBonus));
            const maxPrice = Math.floor(totalInvestment * evalFactor * 1.15 * (1 + architectBonus));

            return `
            <div class="sell-building-item" data-index="${idx}">
                <span class="building-info">${getBuildingImage(b.building.name, '32px')} ${b.building.name} @ ${b.land.name}</span>
                <span class="sell-price">예상가: ${gameState.formatMoney(minPrice)} ~ ${gameState.formatMoney(maxPrice)}</span>
                <button class="btn-sell-item" data-index="${idx}">매각</button>
            </div>
            `;
        }).join('');

        showResultModal('건물 매각', `
            <div class="sell-modal">
                <p>매각할 건물을 선택하세요. (시장 상황에 따라 85%~115% 변동)</p>
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
                    // 콜백이 있으면 실행 (설계 패널 갱신 등)
                    if (onSellCallback && typeof onSellCallback === 'function') {
                        onSellCallback();
                    }
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
        const currentPlayerIndex = gameState.currentPlayerIndex;
        const player = gameState.getCurrentPlayer();

        // 현재 플레이어가 이 토지에서 경매/급매 실패한 적 있는지 확인
        const failedAttempt = gameState.pendingLands.find(
            p => p.land.id === land.id && p.failedPlayer === currentPlayerIndex
        );
        const canUseUrgent = land.prices.urgent && !failedAttempt;
        const canUseAuction = land.prices.auction && !failedAttempt;

        // 와일드카드 할인 적용 여부 확인
        const discountRate = player.landDiscountActive || 0;
        const hasDiscount = discountRate > 0;

        // 할인 적용된 가격 계산
        const marketPrice = land.prices.market;
        const urgentPrice = land.prices.urgent;
        const auctionPrice = land.prices.auction;

        const discountedMarketPrice = hasDiscount ? Math.floor(marketPrice * (1 - discountRate)) : marketPrice;
        const discountedUrgentPrice = urgentPrice && hasDiscount ? Math.floor(urgentPrice * (1 - discountRate)) : urgentPrice;
        const discountedAuctionPrice = auctionPrice && hasDiscount ? Math.floor(auctionPrice * (1 - discountRate)) : auctionPrice;

        // 가격 표시 포맷 (할인 시 원래 가격과 할인가 모두 표시)
        const formatPriceDisplay = (originalPrice, discountedPrice, hasDiscount) => {
            if (hasDiscount) {
                return `<span class="original-price">${gameState.formatMoney(originalPrice)}</span> → <span class="discounted-price">${gameState.formatMoney(discountedPrice)}</span>`;
            }
            return gameState.formatMoney(originalPrice);
        };

        optionsContainer.innerHTML = `
      <div class="purchase-panel">
        <div class="purchase-panel-header">
          <h3>${land.name} 구매</h3>
          <button class="purchase-panel-close" id="close-purchase-panel">&times;</button>
        </div>
        ${hasDiscount ? `
          <div class="discount-notice">
            🎫 토지 할인권 적용 중 (${discountRate * 100}% 할인)
          </div>
        ` : ''}
        ${failedAttempt ? `
          <div class="failed-attempt-notice">
            ⚠️ 이전에 매매 불발된 토지입니다. 시세로만 구매 가능합니다.
          </div>
        ` : ''}
        <div class="price-options">
          <button class="price-btn market" data-type="market" data-price="${discountedMarketPrice}">
            시세: ${formatPriceDisplay(marketPrice, discountedMarketPrice, hasDiscount)}
            <span class="prob">100%</span>
          </button>
          ${canUseUrgent ? `
            <button class="price-btn urgent" data-type="urgent" data-price="${discountedUrgentPrice}">
              급매: ${formatPriceDisplay(urgentPrice, discountedUrgentPrice, hasDiscount)}
              <span class="prob">${((land.diceRequired.urgent.length / 6) * 100).toFixed(0)}%</span>
            </button>
          ` : ''}
          ${canUseAuction ? `
            <button class="price-btn auction" data-type="auction" data-price="${discountedAuctionPrice}">
              경매: ${formatPriceDisplay(auctionPrice, discountedAuctionPrice, hasDiscount)}
              <span class="prob">${((land.diceRequired.auction.length / 6) * 100).toFixed(0)}%</span>
            </button>
          ` : ''}
        </div>
        <button class="btn-purchase" id="confirm-purchase">구매 시도</button>
      </div>
    `;

        optionsContainer.classList.remove('hidden');

        // 닫기 버튼 이벤트
        document.getElementById('close-purchase-panel')?.addEventListener('click', () => {
            this.closePurchaseOptions();
        });

        // 외부 클릭 시 닫기
        this.setupPurchaseOptionsOutsideClick(optionsContainer);

        // 개발 비용 계산
        const developmentCost = info.developmentCost;

        // 가격 타입 선택 시 자금 체크
        optionsContainer.querySelectorAll('.price-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const priceType = btn.dataset.type;
                const landPrice = parseInt(btn.dataset.price);
                const totalCost = landPrice + developmentCost;

                // 현금 부족 체크 (대출 가능 금액 제외 - 순수 현금만 체크)
                if (player.money < totalCost) {
                    // 자금 부족 시 매각 안내 모달 표시
                    this.showInsufficientFundsForLandModal(totalCost, priceType, land);
                    return;
                }

                optionsContainer.querySelectorAll('.price-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedPriceType = priceType;
            });
        });

        // 기본 선택 (시세로 시작하되, 자금 체크는 클릭 시에만)
        optionsContainer.querySelector('.price-btn.market')?.classList.add('selected');

        // 구매 시도 - 이벤트 버블링 방지
        document.getElementById('confirm-purchase')?.addEventListener('click', async (event) => {
            event.stopPropagation();  // 버블링 방지
            event.preventDefault();

            // 중복 클릭 방지
            const btn = event.currentTarget;
            if (btn.disabled) return;
            btn.disabled = true;

            await this.attemptPurchase();
        });
    }

    // 토지 구매 시 자금 부족 모달 표시
    showInsufficientFundsForLandModal(totalCost, priceType, land) {
        const player = gameState.getCurrentPlayer();
        const shortage = totalCost - player.money;
        const priceTypeLabel = priceType === 'market' ? '시세' : priceType === 'urgent' ? '급매' : '경매';

        const hasBuildings = player.buildings.length > 0;
        const hasLand = player.currentProject && player.currentProject.land;

        // 대기 중인 구매 정보 저장
        this._pendingLandPurchase = {
            landIndex: this.selectedCardIndex,
            land: { ...land },
            priceType: priceType,
            totalCost: totalCost
        };

        let sellOptions = '';
        if (hasBuildings) {
            sellOptions += `<button class="action-btn sell-building-btn" id="btn-sell-building-land">🏢 건물 매각하기</button>`;
        }
        if (hasLand) {
            sellOptions += `<button class="action-btn" id="btn-sell-land-land">🏞️ 대지 매각하기</button>`;
        }

        if (!hasBuildings && !hasLand) {
            sellOptions = `<p class="no-assets-msg">매각할 건물이나 대지가 없습니다.</p>`;
        }

        showResultModal('💰 자금 부족', `
            <div class="insufficient-funds-modal">
                <div class="funds-info">
                    <p><strong>${land.name}</strong> ${priceTypeLabel} 구매에 필요한 금액:</p>
                    <p class="required-amount">${gameState.formatMoney(totalCost)}</p>
                    <p>현재 보유 현금: <span class="current-money">${gameState.formatMoney(player.money)}</span></p>
                    <p class="shortage">부족액: <span class="shortage-amount">${gameState.formatMoney(shortage)}</span></p>
                </div>
                <div class="sell-options">
                    <p>💡 건물 또는 대지를 매각하여 자금을 확보하세요.</p>
                    <div class="sell-buttons">
                        ${sellOptions}
                    </div>
                </div>
            </div>
        `, () => {
            // 모달 닫힐 때 대기 중인 구매 정보 초기화
            this._pendingLandPurchase = null;
        });

        // 건물 매각 버튼 이벤트
        const sellBuildingBtn = document.getElementById('btn-sell-building-land');
        if (sellBuildingBtn) {
            sellBuildingBtn.onclick = () => {
                document.querySelector('.modal-overlay')?.remove();
                this.showBuildingSellModal(() => {
                    this.updateUI();
                    // 매각 후 자금 확인 및 자동 구매 시도
                    this.checkAndAutoPurchaseLand();
                });
            };
        }

        // 대지 매각 버튼 이벤트
        const sellLandBtn = document.getElementById('btn-sell-land-land');
        if (sellLandBtn) {
            sellLandBtn.onclick = () => {
                document.querySelector('.modal-overlay')?.remove();
                this.showLandSellConfirm();
            };
        }
    }

    // 건물 매각 후 자금 확인 및 자동 구매
    checkAndAutoPurchaseLand() {
        if (!this._pendingLandPurchase) return;

        const player = gameState.getCurrentPlayer();
        const { landIndex, land, priceType, totalCost } = this._pendingLandPurchase;

        // 자금이 충분한지 확인
        if (player.money >= totalCost) {
            // 자금 충분 - 자동으로 구매 진행
            showNotification('💰 자금이 확보되었습니다. 구매를 진행합니다.', 'success');

            // 선택 정보 복원
            this.selectedCardIndex = landIndex;
            this.selectedPriceType = priceType;

            // 대기 정보 초기화
            this._pendingLandPurchase = null;

            // 약간의 딜레이 후 구매 진행
            setTimeout(async () => {
                await this.attemptPurchase();
            }, 500);
        } else {
            // 아직 자금 부족 - 다시 구매 옵션 표시
            const updatedLand = gameState.availableLands[landIndex];
            if (updatedLand) {
                this.selectedCardIndex = landIndex;
                this.selectedPriceType = priceType;
                this.showLandPurchaseOptions(updatedLand);
            }
            this._pendingLandPurchase = null;
        }
    }

    // 구매 옵션 패널 닫기
    closePurchaseOptions() {
        const optionsContainer = document.getElementById('purchase-options');
        if (optionsContainer) {
            optionsContainer.classList.add('hidden');
            optionsContainer.innerHTML = '';
        }
        this.selectedCardIndex = null;
        // 카드 하이라이트 제거
        document.querySelectorAll('.game-card.highlighted').forEach(card => {
            card.classList.remove('highlighted');
        });
        // 외부 클릭 리스너 제거
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }
    }

    // 외부 클릭 시 패널 닫기 설정
    setupPurchaseOptionsOutsideClick(optionsContainer) {
        // 이전 리스너 제거
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
        }

        // 약간의 딜레이 후 리스너 등록 (현재 클릭 이벤트가 바로 트리거되는 것 방지)
        setTimeout(() => {
            this._outsideClickHandler = (event) => {
                const purchasePanel = optionsContainer.querySelector('.purchase-panel');
                const cardGrid = document.getElementById('card-grid');
                const diceContainer = document.getElementById('dice-container');

                // 주사위 모달이 활성화되어 있으면 무시
                if (diceContainer && diceContainer.classList.contains('active')) return;

                // 패널이 숨겨져 있으면 무시
                if (optionsContainer.classList.contains('hidden')) return;

                // 클릭이 패널 내부이면 무시
                if (purchasePanel && purchasePanel.contains(event.target)) return;

                // 클릭이 카드 그리드 내부이면 무시 (다른 카드 선택 허용)
                if (cardGrid && cardGrid.contains(event.target)) return;

                // 클릭이 주사위 컨테이너 내부이면 무시
                if (diceContainer && diceContainer.contains(event.target)) return;

                // 그 외의 경우 패널 닫기
                this.closePurchaseOptions();
            };
            document.addEventListener('click', this._outsideClickHandler);
        }, 100);
    }

    // 토지 구매 시도
    async attemptPurchase() {
        const player = gameState.getCurrentPlayer();

        // 주사위 모달 표시 전에 선택 정보를 로컬 변수에 저장
        const savedLandIndex = this.selectedCardIndex;
        const priceType = this.selectedPriceType;
        const land = gameState.availableLands[savedLandIndex];

        if (savedLandIndex === null || !land) {
            showNotification('토지를 선택해주세요.', 'error');
            return;
        }

        // 토지 객체를 완전히 복사해서 저장 (참조 문제 방지)
        const savedLand = { ...land };

        // 자금 체크 - 구매 시도 버튼 클릭 시에도 자금 부족 체크
        const info = getLandDisplayInfo(land);
        const developmentCost = info.developmentCost;
        const discountRate = player.landDiscountActive || 0;
        const landPrice = land.prices[priceType];
        const discountedPrice = discountRate > 0 ? Math.floor(landPrice * (1 - discountRate)) : landPrice;
        const totalCost = discountedPrice + developmentCost;

        if (player.money < totalCost) {
            // 자금 부족 시 매각 안내 모달 표시
            this.showInsufficientFundsForLandModal(totalCost, priceType, land);
            // 구매 시도 버튼 다시 활성화
            const purchaseBtn = document.getElementById('confirm-purchase');
            if (purchaseBtn) purchaseBtn.disabled = false;
            return;
        }

        // 외부 클릭 핸들러 제거 (주사위 모달 중 오작동 방지)
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }

        // 구매 옵션 패널 먼저 숨기기
        document.getElementById('purchase-options')?.classList.add('hidden');

        if (priceType === 'market') {
            // 시세는 항상 성공 - 인덱스 기반 함수 사용
            const result = attemptLandPurchase(gameState.currentPlayerIndex, savedLandIndex, 'market');
            if (result.isSuccess) {
                showNotification(result.message, 'success');
                this.nextPlayerOrPhase('land');
            } else {
                showNotification(result.message, 'error');
            }
        } else {
            // 급매/경매는 주사위
            const currentPlayer = gameState.getCurrentPlayer();
            const canReroll = currentPlayer.bonusDiceActive || false;

            const diceResult = await showLandPurchaseDice(
                savedLand.name,
                priceType,
                savedLand.diceRequired[priceType],
                null,
                canReroll
            );

            // 재굴림 사용 시 플래그 리셋
            if (diceResult.rerollUsed) {
                currentPlayer.bonusDiceActive = false;
                renderPlayerPanels();
            }

            // 토지 객체를 직접 전달하는 새 함수 사용 (인덱스 문제 완전 우회)
            const result = attemptLandPurchaseByLand(
                gameState.currentPlayerIndex,
                savedLand,
                priceType,
                diceResult.value
            );

            if (result.isSuccess) {
                showNotification(result.message, 'success');
            } else {
                showNotification(result.message, 'warning');
            }

            this.nextPlayerOrPhase('land');
        }

        this.selectedCardIndex = null;
    }

    // 설계 페이즈
    runDesignPhase() {
        this.selectedArchitectIndex = null;
        this.selectedBuildingName = null;

        const player = gameState.getCurrentPlayer();

        // PM 컨설팅으로 라운드 스킵한 플레이어는 자동 스킵
        if (player.pmSkippedRound === gameState.currentRound) {
            showNotification(`${player.name}님은 PM 컨설팅으로 이번 라운드를 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('architect');
            return;
        }

        // 토지가 없으면 설계 불가 - 평가 단계까지 쉼
        if (!player.currentProject || !player.currentProject.land) {
            showNotification(`${player.name}님은 토지가 없어 평가 단계까지 쉽니다.`, 'info');
            this.nextPlayerOrPhase('architect');
            return;
        }

        // 이미 건축가와 계약을 했으면 설계 변경 불가 - 다음 플레이어로
        if (player.currentProject.architect) {
            showNotification(`${player.name}님은 이미 ${player.currentProject.architect.name} 건축가와 계약했습니다.`, 'info');
            this.nextPlayerOrPhase('architect');
            return;
        }

        renderCardGrid(gameState.availableArchitects, 'architect', (index, architect) => {
            this.selectedArchitectIndex = index;
            highlightCard(index);
            this.showDesignPanel(architect);
        });

        // 페이즈 시작 시 화면 위치 유지 (스크롤하지 않음)
        // setTimeout(() => {
        //     window.scrollTo({ top: 0, behavior: 'smooth' });
        // }, 100);
    }

    // 설계 패널 표시 (건축가 선택 후)
    showDesignPanel(architect) {
        const player = gameState.getCurrentPlayer();
        const land = player.currentProject.land;
        const buildings = getAvailableBuildings(land);
        const pmIncome = 200000000; // 고정 2억

        // 기존 모달 제거
        document.getElementById('design-modal-overlay')?.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'design-modal-overlay';
        modalOverlay.className = 'design-modal-overlay';

        modalOverlay.innerHTML = `
            <div class="design-modal-content">
                <button class="modal-close-btn" id="design-close-btn">&times;</button>
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

            // 총 필요 비용 계산 (설계비 + 시공비)
            const totalCost = designFee + constructionCost;
            const maxAvailable = player.money + gameState.getMaxLoan(player) - player.loan;
            const canAfford = maxAvailable >= totalCost;
            const disabledClass = canAfford ? '' : ' building-disabled';

            return `
                            <div class="building-option${disabledClass}"
                                 data-index="${index}"
                                 data-building="${building.name}"
                                 data-affordable="${canAfford}">
                                <div class="building-emoji">${getBuildingImage(building.name, '100px')}</div>
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
                                ${!canAfford ? '<div class="unaffordable-badge">💸 자금 부족</div>' : ''}
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

                <div class="design-action-buttons">
                    <button class="action-btn pm-consulting" id="design-pm">👷 PM 컨설팅 (+2억, 라운드 스킵)</button>
                    <button class="action-btn" id="design-sell-land">🏞️ 대지 매각</button>
                    ${player.buildings.length > 0 ? '<button class="action-btn sell-building-btn" id="design-sell-building">🏢 건물 매각</button>' : ''}
                    <button class="action-btn" id="design-skip">⏭️ 턴 넘기기</button>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        document.body.appendChild(modalOverlay);

        // 닫기 버튼 이벤트
        document.getElementById('design-close-btn')?.addEventListener('click', () => {
            this.hideDesignPanel();
        });

        // 기존 공통 액션 패널 제거 (중복 방지)
        document.getElementById('common-action-panel')?.remove();

        // this 바인딩 보존
        const self = this;

        // 액션 버튼 이벤트 바인딩
        document.getElementById('design-pm')?.addEventListener('click', () => {
            showConfirmModal('PM 컨설팅', 'PM 컨설팅을 진행하면 2억을 받고 이번 라운드를 스킵합니다.\n\n진행하시겠습니까?', () => {
                // 모달 닫기
                self.hideDesignPanel();

                const result = gameState.doPMActivity(gameState.currentPlayerIndex);
                if (result.success) {
                    showNotification(result.message, 'success');
                    self.updateUI();
                    self.nextPlayerOrPhase('architect');
                }
            });
        });

        document.getElementById('design-sell-land')?.addEventListener('click', () => {
            showConfirmModal('대지 매각', '⚠️ 주의: 대지를 매각하면 설계/시공 단계를 스킵하고 평가 단계까지 쉬어야 합니다.\n\n정말로 대지를 매각하시겠습니까?', () => {
                const result = gameState.sellCurrentLand(gameState.currentPlayerIndex);
                if (result.success) {
                    // 설계 모달 먼저 닫기
                    modalOverlay.classList.add('closing');
                    setTimeout(() => modalOverlay.remove(), 300);

                    // 쉬어야 합니다 알림 표시
                    showResultModal('😴 휴식 알림', `
                        <div style="text-align: center; padding: 1rem;">
                            <p style="font-size: 1.2rem; margin-bottom: 1rem;">대지를 매각하여 설계/시공 단계를 스킵합니다.</p>
                            <p style="color: var(--text-muted);">평가 단계까지 자동으로 진행됩니다.</p>
                        </div>
                    `, () => {
                        showNotification(result.message, 'success');
                        self.nextPlayerOrPhase('architect');
                    });
                }
            });
        });

        document.getElementById('design-sell-building')?.addEventListener('click', () => {
            self.showBuildingSellModal(() => {
                // 매각 후 설계 패널 갱신 (건물 목록의 자금 부족 상태 업데이트)
                self.showDesignPanel(architect);
            });
        });

        document.getElementById('design-skip')?.addEventListener('click', () => {
            showConfirmModal('턴 넘기기', '이번 턴을 넘기시겠습니까?', () => {
                gameState.addLog(`${player.name}: 턴 패스`);
                showNotification(`${player.name}님이 턴을 넘깁니다.`, 'info');
                self.nextPlayerOrPhase('architect');
            });
        });

        // 건물 선택 이벤트
        modalOverlay.querySelectorAll('.building-option').forEach(option => {
            option.addEventListener('click', () => {
                // 비활성화된 건물은 선택 불가
                if (option.dataset.affordable === 'false') {
                    showNotification('자금이 부족하여 이 건물을 선택할 수 없습니다.', 'warning');
                    return;
                }

                // 이전 선택 해제
                modalOverlay.querySelectorAll('.building-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');

                const buildingName = option.dataset.building;
                this.selectedBuildingName = buildingName;

                // 선택 정보 표시
                this.showSelectedBuildingInfo(architect, buildings.find(b => b.name === buildingName));

                // 설계 진행 버튼이 보이도록 모달 하단으로 스크롤
                setTimeout(() => {
                    const confirmBtn = document.getElementById('btn-confirm-design');
                    if (confirmBtn) {
                        confirmBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
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
                    <span class="value">${getBuildingImage(building.name, '24px')} ${building.name}</span>
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

    // 설계 확정 및 설계도 표시 (미리보기 먼저)
    confirmDesignWithBlueprint(architect, building, designFee) {
        if (this.selectedArchitectIndex === null || !this.selectedBuildingName) {
            showNotification('건축가와 건물을 선택해주세요.', 'error');
            return;
        }

        // 설계 모달 닫기
        this.hideDesignPanel();

        const player = gameState.getCurrentPlayer();
        const constructionCost = Math.round(building.constructionCost * architect.constructionMultiplier);
        const isMasterpiece = architect.masterpieces.includes(building.name);

        // 미리보기 모달 표시 (확정 전)
        this.showDesignPreviewModal(architect, building, designFee, constructionCost, isMasterpiece);
    }

    // 설계 미리보기 모달 (확정/취소 선택)
    showDesignPreviewModal(architect, building, designFee, constructionCost, isMasterpiece) {
        const container = document.createElement('div');
        container.id = 'design-preview-modal';
        container.className = 'modal-overlay';
        container.innerHTML = `
            <div class="modal-content design-preview">
                <div class="modal-header">
                    <h2>📐 설계 확인</h2>
                    <button class="modal-close-btn" id="close-preview">&times;</button>
                </div>

                <div class="blueprint-modal">
                    <div class="blueprint-header">
                        <div class="building-icon">${getBuildingImage(building.name, '64px')}</div>
                        <h2>${building.name}</h2>
                        ${isMasterpiece ? '<span class="masterpiece-badge">✨ 대표작</span>' : ''}
                    </div>

                    <div class="blueprint-content">
                        <div class="blueprint-image">
                            <div class="blueprint-frame compact">
                                <div class="blueprint-grid">
                                    ${getBuildingImage(building.name, '100px')}
                                </div>
                                <div class="blueprint-label">설계도 미리보기</div>
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
                            <div class="detail-row highlight">
                                <span class="label">설계비</span>
                                <span class="value">-${gameState.formatMoney(designFee)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">예상 시공비</span>
                                <span class="value">${gameState.formatMoney(constructionCost)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">시공 기간</span>
                                <span class="value">${building.constructionPeriod}개월</span>
                            </div>
                        </div>
                    </div>

                    <div class="preview-warning">
                        <p>⚠️ 설계를 확정하면 설계비가 지불되고, 이 건축가는 다른 플레이어가 사용할 수 없게 됩니다.</p>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel-design" id="btn-cancel-preview">취소 (다른 건축가 선택)</button>
                    <button class="btn-confirm-design" id="btn-confirm-preview">✓ 설계 확정</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // 확정 버튼
        document.getElementById('btn-confirm-preview').onclick = () => {
            container.remove();
            this.executeDesign(architect, building);
        };

        // 취소 버튼 - 다른 건축가 선택할 수 있게
        document.getElementById('btn-cancel-preview').onclick = () => {
            container.remove();
            // 설계 패널 숨기고 다시 건축가 선택 화면으로
            this.hideDesignPanel();
            this.selectedArchitectIndex = null;
            this.selectedBuildingName = null;
            showNotification('설계를 취소했습니다. 다른 건축가를 선택해주세요.', 'info');
            this.runDesignPhase();
        };

        // X 버튼 - 취소와 동일
        document.getElementById('close-preview').onclick = () => {
            container.remove();
            this.hideDesignPanel();
            this.selectedArchitectIndex = null;
            this.selectedBuildingName = null;
            showNotification('설계를 취소했습니다. 다른 건축가를 선택해주세요.', 'info');
            this.runDesignPhase();
        };
    }

    // 설계 실행 (확정 후)
    executeDesign(architect, building) {
        const result = completeDesign(gameState.currentPlayerIndex, this.selectedArchitectIndex, this.selectedBuildingName);

        if (result.success) {
            // 설계 패널 숨기기
            this.hideDesignPanel();
            // 설계도 완료 모달 표시
            this.showBlueprintModal(architect, building, result);
        } else {
            showNotification(result.message, 'error');
        }
    }

    // 설계 패널 숨기기
    hideDesignPanel() {
        const designPanel = document.getElementById('design-panel');
        if (designPanel) {
            designPanel.remove();
        }
        const actionArea = document.getElementById('action-area');
        if (actionArea) {
            actionArea.innerHTML = '';
        }
    }

    // 설계도 모달 표시
    showBlueprintModal(architect, building, result) {
        const player = gameState.getCurrentPlayer();

        showResultModal(`📐 설계 완료!`, `
            <div class="blueprint-modal">
                <div class="blueprint-header">
                    <div class="building-icon">${getBuildingImage(building.name, '64px')}</div>
                    <h2>${building.name}</h2>
                </div>

                <div class="blueprint-content">
                    <div class="blueprint-image">
                        <div class="blueprint-frame">
                            <div class="blueprint-grid">
                                ${getBuildingImage(building.name, '120px')}
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
        // 이전 돈벌기 옵션 패널 제거 (중복 방지)
        document.querySelectorAll('.money-options-panel').forEach(el => el.remove());

        const player = gameState.getCurrentPlayer();

        // PM 컨설팅으로 라운드 스킵한 플레이어는 자동 스킵
        if (player.pmSkippedRound === gameState.currentRound) {
            showNotification(`${player.name}님은 PM 컨설팅으로 이번 라운드를 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('constructor');
            return;
        }

        // 토지가 없는 경우 - 평가 단계까지 쉼
        if (!player.currentProject || !player.currentProject.land) {
            showNotification(`${player.name}님은 토지가 없어 평가 단계까지 쉽니다.`, 'info');
            this.nextPlayerOrPhase('constructor');
            return;
        }

        // 설계가 완료되지 않은 경우 - 평가 단계까지 쉼
        if (!player.currentProject.building) {
            showNotification(`${player.name}님은 설계가 완료되지 않아 평가 단계까지 쉽니다.`, 'info');
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

        // 자금 부족 확인: 어떤 시공사도 선택할 수 없는 경우 옵션 표시
        const canAffordAny = availableConstructors.some(c => {
            const constructorIndex = gameState.availableConstructors.findIndex(gc => gc.id === c.id);
            const check = canSelectConstructor(gameState.currentPlayerIndex, constructorIndex);
            return check.success && check.canAfford;
        });

        if (availableConstructors.length > 0 && !canAffordAny) {
            // 자금 부족으로 시공 불가 - 옵션 제공
            this.showInsufficientFundsOptions(player, building);
            return;
        }

        // 시공 비용 확인해서 부족하면 돈벌기 버튼 표시
        const cheapestConstructor = availableConstructors.length > 0
            ? availableConstructors.reduce((min, c) => {
                const cost = c.costMultiplier * building.constructionCost;
                return cost < min.cost ? { constructor: c, cost } : min;
            }, { constructor: null, cost: Infinity })
            : null;

        // 자금 부족 여부: 가장 저렴한 시공사의 시공비보다 보유금이 적으면 부족
        const needsMoney = cheapestConstructor && player.money < cheapestConstructor.cost;

        // 액션 영역에 돈벌기 옵션 표시 (자금 부족 시)
        if (needsMoney) {
            this.showConstructionMoneyOptions(player, cheapestConstructor.cost);
        } else {
            // 자금이 충분하면 액션 영역 초기화
            const actionArea = document.getElementById('action-area');
            if (actionArea) {
                actionArea.innerHTML = '';
            }
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

        // 페이즈 시작 시 화면 위치 유지 (스크롤하지 않음)
        // setTimeout(() => {
        //     window.scrollTo({ top: 0, behavior: 'smooth' });
        // }, 100);
    }

    // 시공 단계 돈벌기 옵션 표시
    showConstructionMoneyOptions(player, neededCost) {
        const actionArea = document.getElementById('action-area');
        if (!actionArea) return;

        // 기존 돈벌기 옵션 패널이 있으면 제거
        document.querySelectorAll('.money-options-panel').forEach(el => el.remove());

        const pmIncome = 200000000; // 고정 2억

        // 대출 관련 계산
        const maxLoan = gameState.getMaxLoan(player);
        const availableLoan = maxLoan - player.loan;
        const shortfall = neededCost - player.money;
        const suggestedLoan = Math.min(availableLoan, Math.max(shortfall, 100000000)); // 최소 1억 단위

        // 토지 담보대출 가능 금액 (현재 토지 가치의 70%)
        const landValue = player.currentProject?.landPrice || 0;
        const landMortgage = Math.floor(landValue * 0.7);

        // 라운드당 1회 제한 체크
        const canUseConstructionLoan = gameState.canTakeLoan(gameState.currentPlayerIndex, 'construction');
        const canUseLandMortgage = gameState.canTakeLoan(gameState.currentPlayerIndex, 'landMortgage');

        const moneyOptionsHtml = `
            <div class="money-options-panel">
                <h4>💰 자금이 부족합니다</h4>
                <p>필요 시공비: 약 ${gameState.formatMoney(neededCost)} / 보유: ${gameState.formatMoney(player.money)}</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">대출 한도: ${gameState.formatMoney(maxLoan)} / 현재 대출: ${gameState.formatMoney(player.loan)}</p>
                <div class="money-action-buttons">
                    ${availableLoan > 0 && canUseConstructionLoan ? `
                        <button class="action-btn loan" id="btn-loan-construction">
                            🏦 건설자금대출 (+${gameState.formatMoney(suggestedLoan)})
                        </button>
                    ` : availableLoan > 0 && !canUseConstructionLoan ? `
                        <button class="action-btn loan disabled" disabled title="이번 라운드에 이미 사용">
                            🏦 건설자금대출 (사용완료)
                        </button>
                    ` : ''}
                    ${landMortgage > 0 && availableLoan > 0 && canUseLandMortgage ? `
                        <button class="action-btn loan" id="btn-land-mortgage">
                            🏠 토지담보대출 (+${gameState.formatMoney(Math.min(landMortgage, availableLoan))})
                        </button>
                    ` : landMortgage > 0 && availableLoan > 0 && !canUseLandMortgage ? `
                        <button class="action-btn loan disabled" disabled title="이번 라운드에 이미 사용">
                            🏠 토지담보대출 (사용완료)
                        </button>
                    ` : ''}
                    <button class="action-btn pm" id="btn-pm-construction">
                        💼 PM 컨설팅 (+${gameState.formatMoney(pmIncome)})
                    </button>
                    ${player.currentProject?.land ? `
                        <button class="action-btn sell" id="btn-sell-land-construction">
                            🏞️ ${player.currentProject.constructor ? '시공중 프로젝트' : '대지'} 매각 (${gameState.formatMoney(
                                player.currentProject.constructor
                                    ? Math.floor((player.currentProject.landPrice + player.currentProject.developmentCost + player.currentProject.designFee + (player.currentProject.constructionCost || 0)) * 0.8)
                                    : player.currentProject.building
                                        ? Math.floor((player.currentProject.landPrice + player.currentProject.developmentCost + player.currentProject.designFee) * 0.9)
                                        : Math.floor((player.currentProject.landPrice + player.currentProject.developmentCost) * 1.1))})
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

        // 기존 액션 영역 내용 교체 (중복 방지)
        actionArea.innerHTML = moneyOptionsHtml;

        // 공통 액션 패널 다시 표시
        this.showCommonActionPanel();

        // 건설자금대출 버튼
        const loanBtn = document.getElementById('btn-loan-construction');
        if (loanBtn) {
            loanBtn.onclick = () => {
                const maxLoan = gameState.getMaxLoan(player);
                const availableLoan = maxLoan - player.loan;
                const shortfall = neededCost - player.money;
                const loanAmount = Math.min(availableLoan, Math.max(shortfall, 100000000));

                if (loanAmount <= 0) {
                    showNotification('추가 대출이 불가능합니다.', 'error');
                    return;
                }

                const result = gameState.takeLoan(gameState.currentPlayerIndex, loanAmount, 'construction');
                if (result.success) {
                    showNotification(`건설자금대출 ${gameState.formatMoney(loanAmount)} 실행!`, 'success');
                    this.updateUI();
                    this.runConstructionPhase();
                } else {
                    showNotification(result.message, 'error');
                }
            };
        }

        // 토지담보대출 버튼
        const mortgageBtn = document.getElementById('btn-land-mortgage');
        if (mortgageBtn) {
            mortgageBtn.onclick = () => {
                const landValue = player.currentProject?.landPrice || 0;
                const maxLoan = gameState.getMaxLoan(player);
                const availableLoan = maxLoan - player.loan;
                const mortgageAmount = Math.min(Math.floor(landValue * 0.7), availableLoan);

                if (mortgageAmount <= 0) {
                    showNotification('토지담보대출이 불가능합니다.', 'error');
                    return;
                }

                const result = gameState.takeLoan(gameState.currentPlayerIndex, mortgageAmount, 'landMortgage');
                if (result.success) {
                    showNotification(`토지담보대출 ${gameState.formatMoney(mortgageAmount)} 실행! (토지 가치의 70%)`, 'success');
                    this.updateUI();
                    this.runConstructionPhase();
                } else {
                    showNotification(result.message, 'error');
                }
            };
        }

        // PM 활동 버튼
        const pmBtn = document.getElementById('btn-pm-construction');
        if (pmBtn) {
            // 현재 플레이어 인덱스를 클로저로 저장
            const currentPlayerIdx = gameState.currentPlayerIndex;
            const self = this; // this 바인딩 보존
            pmBtn.onclick = () => {
                // 현재 턴인 플레이어만 PM 컨설팅 실행 가능
                if (gameState.currentPlayerIndex !== currentPlayerIdx) {
                    showNotification('현재 턴이 아닙니다.', 'error');
                    return;
                }

                showConfirmModal('PM 컨설팅', 'PM 컨설팅을 진행하면 2억을 받고 이번 라운드를 스킵합니다.\n\n진행하시겠습니까?', () => {
                    const result = gameState.doPMActivity(gameState.currentPlayerIndex);
                    if (result.success) {
                        showNotification(result.message, 'success');
                        self.updateUI();
                        // PM 컨설팅 후 다음 플레이어로 이동
                        self.nextPlayerOrPhase('constructor');
                    }
                });
            };
        }

        // 대지 매각 버튼 (설계중/시공중 프로젝트 포함)
        const sellLandBtn = document.getElementById('btn-sell-land-construction');
        if (sellLandBtn) {
            const self = this; // this 바인딩 보존
            sellLandBtn.onclick = () => {
                const currentPlayer = gameState.getCurrentPlayer();
                const hasBuilding = currentPlayer.currentProject?.building;
                const hasConstructor = currentPlayer.currentProject?.constructor;

                // 시공중인 프로젝트면 확인 메시지 표시
                if (hasConstructor) {
                    showConfirmModal('프로젝트 매각', '시공중인 프로젝트를 매각하면 투자비의 80%만 회수됩니다.\n또한 이번 라운드 평가까지 휴식합니다.\n\n진행하시겠습니까?', () => {
                        const result = gameState.sellDesignedProject(gameState.currentPlayerIndex);
                        if (result.success) {
                            showNotification(result.message, 'success');
                            self.updateUI();
                            self.nextPlayerOrPhase('constructor');
                        } else {
                            showNotification(result.message, 'error');
                        }
                    });
                } else if (hasBuilding) {
                    // 설계만 완료된 프로젝트
                    showConfirmModal('프로젝트 매각', '설계 완료된 프로젝트를 매각하면 투자비의 90%만 회수됩니다.\n또한 이번 라운드 평가까지 휴식합니다.\n\n진행하시겠습니까?', () => {
                        const result = gameState.sellDesignedProject(gameState.currentPlayerIndex);
                        if (result.success) {
                            showNotification(result.message, 'success');
                            self.updateUI();
                            self.nextPlayerOrPhase('constructor');
                        } else {
                            showNotification(result.message, 'error');
                        }
                    });
                } else {
                    const result = gameState.sellCurrentLand(gameState.currentPlayerIndex);
                    if (result.success) {
                        showNotification(result.message, 'success');
                        self.updateUI();
                        // 대지를 팔면 시공 불가, 다음 플레이어로
                        self.nextPlayerOrPhase('constructor');
                    } else {
                        showNotification(result.message, 'error');
                    }
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

    // 자금 부족 시 옵션 표시 (시공 불가) - 카드 그리드 + 액션 버튼 형태로 표시
    showInsufficientFundsOptions(player, building) {
        // 기존 패널 제거
        document.querySelectorAll('.money-options-panel').forEach(el => el.remove());
        document.getElementById('common-action-panel')?.remove();

        // 해당 건물을 시공할 수 있는 시공사 필터링 (모두 unaffordable로 표시)
        const availableConstructors = gameState.availableConstructors.filter(
            c => c.canBuild.includes(building.name) && gameState.isConstructorAvailable(c.id)
        );

        // 선점된 시공사
        const claimedConstructors = gameState.availableConstructors.filter(
            c => c.canBuild.includes(building.name) && !gameState.isConstructorAvailable(c.id)
        );

        // 가장 저렴한 시공사 비용 계산
        const cheapestCost = availableConstructors.length > 0
            ? Math.min(...availableConstructors.map(c => c.costMultiplier * building.constructionCost))
            : 0;

        // 모든 시공사 카드를 unaffordable 또는 claimed로 표시
        const allConstructors = [
            ...availableConstructors.map(c => ({ ...c, isUnaffordable: true })),
            ...claimedConstructors.map(c => ({ ...c, isClaimed: true }))
        ];

        // 카드 그리드 렌더링 (클릭해도 경고 메시지만 표시)
        renderCardGrid(allConstructors, 'constructor', (index, constructor) => {
            if (constructor.isClaimed) {
                showNotification(`${constructor.name}은(는) 이미 다른 플레이어가 선택했습니다.`, 'warning');
            } else if (constructor.isUnaffordable) {
                showNotification(`자금이 부족하여 ${constructor.name}을(를) 선택할 수 없습니다.`, 'warning');
            }
        });

        // 액션 영역에 자금 부족 안내 + 버튼 표시
        const actionArea = document.getElementById('action-area');
        if (!actionArea) return;

        const pmIncome = 200000000; // 고정 2억
        // 시공중: 80%, 설계 완료: 90%, 대지만: 110% 회수
        const hasConstructor = !!player.currentProject?.constructor;
        const landSellPrice = player.currentProject?.land
            ? (hasConstructor
                ? Math.floor((player.currentProject.landPrice + player.currentProject.developmentCost + player.currentProject.designFee + (player.currentProject.constructionCost || 0)) * 0.8)
                : player.currentProject.building
                    ? Math.floor((player.currentProject.landPrice + player.currentProject.developmentCost + player.currentProject.designFee) * 0.9)
                    : Math.floor((player.currentProject.landPrice + player.currentProject.developmentCost) * 1.1))
            : 0;

        // 대출 관련 계산
        const maxLoan = gameState.getMaxLoan(player);
        const availableLoan = maxLoan - player.loan;
        const shortfall = cheapestCost - player.money;
        const suggestedLoan = Math.min(availableLoan, Math.max(shortfall, 100000000)); // 최소 1억 단위

        // 토지 담보대출 가능 금액 (현재 토지 가치의 70%)
        const landValue = player.currentProject?.landPrice || 0;
        const landMortgage = Math.floor(landValue * 0.7);

        // 라운드당 1회 제한 체크
        const canUseConstructionLoan = gameState.canTakeLoan(gameState.currentPlayerIndex, 'construction');
        const canUseLandMortgage = gameState.canTakeLoan(gameState.currentPlayerIndex, 'landMortgage');

        const insufficientHtml = `
            <div class="insufficient-funds-notice">
                <div class="notice-header">
                    <span class="notice-icon">💸</span>
                    <span class="notice-text">시공 자금 부족</span>
                </div>
                <div class="notice-details">
                    <span>필요 시공비: 약 <strong>${gameState.formatMoney(cheapestCost)}</strong></span>
                    <span>현재 보유: <strong>${gameState.formatMoney(player.money)}</strong></span>
                </div>
                <div class="notice-loan-info" style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                    대출 한도: ${gameState.formatMoney(maxLoan)} / 현재 대출: ${gameState.formatMoney(player.loan)}
                </div>
            </div>
            <div class="insufficient-action-buttons">
                ${availableLoan > 0 && canUseConstructionLoan ? `
                    <button class="action-btn loan-btn" id="btn-loan-insufficient">
                        <span class="btn-icon">🏦</span>
                        <span class="btn-label">건설자금대출</span>
                        <span class="btn-value">+${gameState.formatMoney(suggestedLoan)}</span>
                    </button>
                ` : availableLoan > 0 && !canUseConstructionLoan ? `
                    <button class="action-btn loan-btn disabled" disabled title="이번 라운드에 이미 사용">
                        <span class="btn-icon">🏦</span>
                        <span class="btn-label">건설자금대출</span>
                        <span class="btn-value">사용완료</span>
                    </button>
                ` : ''}
                ${landMortgage > 0 && availableLoan > 0 && canUseLandMortgage ? `
                    <button class="action-btn loan-btn" id="btn-land-mortgage-insufficient">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-label">토지담보대출</span>
                        <span class="btn-value">+${gameState.formatMoney(Math.min(landMortgage, availableLoan))}</span>
                    </button>
                ` : landMortgage > 0 && availableLoan > 0 && !canUseLandMortgage ? `
                    <button class="action-btn loan-btn disabled" disabled title="이번 라운드에 이미 사용">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-label">토지담보대출</span>
                        <span class="btn-value">사용완료</span>
                    </button>
                ` : ''}
                <button class="action-btn pm-btn" id="btn-pm-insufficient">
                    <span class="btn-icon">💼</span>
                    <span class="btn-label">PM 컨설팅</span>
                    <span class="btn-value">+${gameState.formatMoney(pmIncome)}</span>
                </button>
                ${player.currentProject?.land ? `
                    <button class="action-btn sell-btn" id="btn-sell-land-insufficient">
                        <span class="btn-icon">🏞️</span>
                        <span class="btn-label">${hasConstructor ? '시공중 프로젝트' : '대지'} 매각</span>
                        <span class="btn-value">+${gameState.formatMoney(landSellPrice)}</span>
                    </button>
                ` : ''}
                ${player.buildings.length > 0 ? `
                    <button class="action-btn sell-btn" id="btn-sell-building-insufficient">
                        <span class="btn-icon">🏢</span>
                        <span class="btn-label">건물 매각</span>
                        <span class="btn-value">${player.buildings.length}개 보유</span>
                    </button>
                ` : ''}
                <button class="action-btn skip-btn" id="btn-skip-insufficient">
                    <span class="btn-icon">⏭️</span>
                    <span class="btn-label">턴 넘기기</span>
                    <span class="btn-value">휴식</span>
                </button>
            </div>
        `;

        actionArea.innerHTML = insufficientHtml;

        // 건설자금대출 버튼
        const loanBtn = document.getElementById('btn-loan-insufficient');
        if (loanBtn) {
            loanBtn.onclick = () => {
                const maxLoan = gameState.getMaxLoan(player);
                const availableLoan = maxLoan - player.loan;
                const shortfall = cheapestCost - player.money;
                const loanAmount = Math.min(availableLoan, Math.max(shortfall, 100000000));

                if (loanAmount <= 0) {
                    showNotification('추가 대출이 불가능합니다.', 'error');
                    return;
                }

                const result = gameState.takeLoan(gameState.currentPlayerIndex, loanAmount, 'construction');
                if (result.success) {
                    showNotification(`건설자금대출 ${gameState.formatMoney(loanAmount)} 실행!`, 'success');
                    this.updateUI();
                    this.runConstructionPhase(); // 다시 시공 단계 시도
                } else {
                    showNotification(result.message, 'error');
                }
            };
        }

        // 토지담보대출 버튼
        const mortgageBtn = document.getElementById('btn-land-mortgage-insufficient');
        if (mortgageBtn) {
            mortgageBtn.onclick = () => {
                const landValue = player.currentProject?.landPrice || 0;
                const maxLoan = gameState.getMaxLoan(player);
                const availableLoan = maxLoan - player.loan;
                const mortgageAmount = Math.min(Math.floor(landValue * 0.7), availableLoan);

                if (mortgageAmount <= 0) {
                    showNotification('토지담보대출이 불가능합니다.', 'error');
                    return;
                }

                const result = gameState.takeLoan(gameState.currentPlayerIndex, mortgageAmount, 'landMortgage');
                if (result.success) {
                    showNotification(`토지담보대출 ${gameState.formatMoney(mortgageAmount)} 실행! (토지 가치의 70%)`, 'success');
                    this.updateUI();
                    this.runConstructionPhase(); // 다시 시공 단계 시도
                } else {
                    showNotification(result.message, 'error');
                }
            };
        }

        // PM 활동 버튼
        const pmBtn = document.getElementById('btn-pm-insufficient');
        if (pmBtn) {
            pmBtn.onclick = () => {
                const result = gameState.doPMActivity(gameState.currentPlayerIndex);
                if (result.success) {
                    showNotification(result.message, 'success');
                    this.updateUI();
                    this.runConstructionPhase(); // 다시 시공 단계 시도
                }
            };
        }

        // 대지 매각 버튼 (설계중/시공중 프로젝트 포함)
        const sellLandBtn = document.getElementById('btn-sell-land-insufficient');
        if (sellLandBtn) {
            const self = this; // this 바인딩 보존
            sellLandBtn.onclick = () => {
                const currentPlayer = gameState.getCurrentPlayer();
                const hasBuilding = currentPlayer.currentProject?.building;
                const hasConstructor = currentPlayer.currentProject?.constructor;

                // 시공중인 프로젝트면 확인 메시지 표시
                if (hasConstructor) {
                    showConfirmModal('프로젝트 매각', '시공중인 프로젝트를 매각하면 투자비의 80%만 회수됩니다.\n또한 이번 라운드 평가까지 휴식합니다.\n\n진행하시겠습니까?', () => {
                        const result = gameState.sellDesignedProject(gameState.currentPlayerIndex);
                        if (result.success) {
                            showNotification(result.message, 'success');
                            self.updateUI();
                            self.nextPlayerOrPhase('constructor');
                        } else {
                            showNotification(result.message, 'error');
                        }
                    });
                } else if (hasBuilding) {
                    // 설계만 완료된 프로젝트
                    showConfirmModal('프로젝트 매각', '설계 완료된 프로젝트를 매각하면 투자비의 90%만 회수됩니다.\n또한 이번 라운드 평가까지 휴식합니다.\n\n진행하시겠습니까?', () => {
                        const result = gameState.sellDesignedProject(gameState.currentPlayerIndex);
                        if (result.success) {
                            showNotification(result.message, 'success');
                            self.updateUI();
                            self.nextPlayerOrPhase('constructor');
                        } else {
                            showNotification(result.message, 'error');
                        }
                    });
                } else {
                    const result = gameState.sellCurrentLand(gameState.currentPlayerIndex);
                    if (result.success) {
                        showNotification(result.message, 'success');
                        self.updateUI();
                        // 대지를 팔면 시공 불가, 다음 플레이어로
                        self.nextPlayerOrPhase('constructor');
                    } else {
                        showNotification(result.message, 'error');
                    }
                }
            };
        }

        // 건물 매각 버튼
        const sellBuildingBtn = document.getElementById('btn-sell-building-insufficient');
        if (sellBuildingBtn) {
            sellBuildingBtn.onclick = () => {
                this.showBuildingSellModal(() => {
                    this.runConstructionPhase(); // 다시 시공 단계 시도
                });
            };
        }

        // 턴 넘기기 버튼 - 시공사 미선택 상태로 다음 플레이어로 넘어감
        const skipBtn = document.getElementById('btn-skip-insufficient');
        if (skipBtn) {
            skipBtn.onclick = () => {
                gameState.addLog(`${player.name}: 자금 부족으로 시공 포기 (다음 라운드까지 휴식)`);
                showNotification(`${player.name}님이 시공을 포기하고 휴식합니다.`, 'info');
                // 시공사 미선택 상태 명시
                player.currentProject.constructor = null;
                player.currentProject.skippedConstruction = true; // 시공 스킵 표시
                this.nextPlayerOrPhase('constructor');
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

        // 기존 모달 제거
        document.getElementById('construction-modal-overlay')?.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'construction-modal-overlay';
        modalOverlay.className = 'construction-modal-overlay';

        const sizeNames = {
            large: '🏢 대형',
            medium: '🏠 중소',
            small: '🔧 영세',
            atelier: '🎨 아뜰리에',
            direct: '👷 직영공사'
        };

        modalOverlay.innerHTML = `
            <div class="construction-modal-content">
                <button class="modal-close-btn" id="construction-close-btn">&times;</button>
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
                            <span class="value">${getBuildingImage(building.name, '24px')} ${building.name}</span>
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

        // 모달을 body에 추가
        document.body.appendChild(modalOverlay);

        // 닫기 버튼 이벤트
        document.getElementById('construction-close-btn')?.addEventListener('click', () => {
            this.hideConstructionPanel();
            this.runConstructionPhase();
        });

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
                this.hideConstructionPanel();
                this.runConstructionPhase();
            };
        }
    }

    // 시공 모달 숨기기
    hideConstructionPanel() {
        const modal = document.getElementById('construction-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    // 설계 모달 숨기기
    hideDesignPanel() {
        const modal = document.getElementById('design-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    // 시공 실행
    async executeConstruction(constructorIndex, constructor, check) {
        // 시공 패널 숨기기
        this.hideConstructionPanel();

        // 시공사 선택
        const result = selectConstructor(gameState.currentPlayerIndex, constructorIndex);

        if (result.success) {
            showNotification(result.message, 'success');

            // 리스크 카드 자동 공개
            const player = gameState.getCurrentPlayer();
            const riskCards = player.currentProject.risks;

            // 와일드카드 방어권 개수 확인
            const wildcardBlocks = player.wildcards?.filter(w => w.effect.type === 'risk_block').length || 0;
            const totalDefense = constructor.riskBlocks + wildcardBlocks + (player.extraRiskBlock || 0);

            showResultModal('🃏 리스크 카드 공개', `
                <div class="risk-draw-intro">
                    <p>시공 기간 동안 발생할 수 있는 리스크를 확인합니다.</p>
                    <p><strong>${result.riskCount}장</strong>의 리스크 카드가 공개됩니다.</p>
                    <div class="defense-summary">
                        <p class="defense-note">🛡️ 총 방어력: <strong>${totalDefense}개</strong></p>
                        ${constructor.riskBlocks > 0 ? `<p class="defense-detail">🏗️ ${constructor.name}: ${constructor.riskBlocks}개</p>` : ''}
                        ${wildcardBlocks > 0 ? `<p class="defense-detail">🃏 와일드카드: ${wildcardBlocks}개</p>` : ''}
                    </div>
                </div>
            `, async () => {
                // 리스크 카드 자동 공개 (수동 클릭 아닌 자동)
                await this.showRiskCardsAuto(riskCards, constructor);
            });
        } else {
            showNotification(result.message, 'error');
        }
    }

    // 리스크 카드 자동 공개 (큰 카드 + 애니메이션 모달)
    async showRiskCardsAuto(riskCards, constructor) {
        const player = gameState.getCurrentPlayer();
        // 와일드카드 리스크 방어권 개수 확인
        const wildcardBlocks = player.wildcards?.filter(w => w.effect.type === 'risk_block').length || 0;
        const extraBlocks = player.extraRiskBlock || 0;
        const totalBlocks = constructor.riskBlocks + wildcardBlocks + extraBlocks;

        return new Promise((resolve) => {
            // 리스크 카드 모달 생성
            const modal = document.createElement('div');
            modal.className = 'modal-overlay risk-modal-overlay';
            modal.innerHTML = `
                <div class="risk-card-modal">
                    <div class="risk-modal-header">
                        <h2>🃏 리스크 카드 공개</h2>
                        <div class="defense-info">
                            <span class="defense-badge">🛡️ 방어력: <span id="defense-remaining">${totalBlocks}</span>개</span>
                            ${wildcardBlocks > 0 ? `<span class="wildcard-used">(와일드카드 ${wildcardBlocks}개 포함)</span>` : ''}
                        </div>
                        <div class="risk-progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <p class="risk-counter">0 / ${riskCards.length}개월</p>
                    </div>
                    <div class="risk-cards-display">
                        ${riskCards.map((_, i) => `
                            <div class="risk-card-large" data-index="${i}">
                                <div class="card-inner">
                                    <div class="card-back">
                                        <div class="card-back-design">
                                            <span class="card-pattern">⚠️</span>
                                            <span class="card-back-text">${i + 1}개월</span>
                                        </div>
                                    </div>
                                    <div class="card-front">
                                        <div class="card-content"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="defense-selection-phase" style="display: none;">
                        <div class="selection-header">
                            <h3>🛡️ 방어할 리스크를 선택하세요</h3>
                            <p class="selection-hint">유해한 리스크 카드를 클릭하여 방어를 적용하세요. (남은 방어: <span id="defense-count">${totalBlocks}</span>개)</p>
                        </div>
                        <button class="btn-confirm-defense" id="btn-confirm-defense">방어 적용 완료</button>
                    </div>
                    <div class="risk-result-summary" style="display: none;">
                        <div class="summary-content"></div>
                        <button class="btn-continue" id="btn-risk-continue">계속하기</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            let currentIndex = 0;
            let revealedCards = [];
            let selectedDefenses = new Set(); // 방어를 적용할 카드 인덱스
            let remainingDefense = totalBlocks;

            // 카드가 유해한지 확인 (방어가 필요한 카드)
            const isHarmfulRisk = (risk) => {
                return risk.type !== 'positive' && risk.type !== 'neutral' && risk.effect !== 'none';
            };

            // 카드 공개 함수
            const revealNextCard = () => {
                if (currentIndex >= riskCards.length) {
                    // 모든 카드 공개 완료 - 방어 선택 단계로
                    setTimeout(() => showDefenseSelection(), 500);
                    return;
                }

                const risk = riskCards[currentIndex];
                const cardEl = modal.querySelector(`.risk-card-large[data-index="${currentIndex}"]`);
                const cardContent = cardEl.querySelector('.card-content');

                // 카드 유형 판단
                const isHarmful = isHarmfulRisk(risk);
                const riskTypeLabel = isHarmful ? '⚠️ 유해' : '✅ 안전';
                const riskTypeClass = isHarmful ? 'harmful' : 'safe';

                // 카드 내용 설정
                cardContent.innerHTML = `
                    <div class="risk-emoji">${risk.emoji}</div>
                    <div class="risk-name">${risk.name}</div>
                    <div class="risk-effect">${risk.description || ''}</div>
                    <div class="risk-type-badge ${riskTypeClass}">${riskTypeLabel}</div>
                `;

                // 카드 뒤집기 애니메이션
                cardEl.classList.add('flipped');
                cardEl.classList.add(riskTypeClass);
                cardEl.dataset.harmful = isHarmful;
                cardEl.dataset.riskType = risk.type;

                revealedCards.push({ index: currentIndex, risk, isHarmful });

                // 진행률 업데이트
                const progressFill = modal.querySelector('.progress-fill');
                const counter = modal.querySelector('.risk-counter');
                progressFill.style.width = `${((currentIndex + 1) / riskCards.length) * 100}%`;
                counter.textContent = `${currentIndex + 1} / ${riskCards.length}개월`;

                currentIndex++;

                // 다음 카드
                setTimeout(revealNextCard, 800);
            };

            // 방어 선택 단계 표시
            const showDefenseSelection = () => {
                const harmfulCards = revealedCards.filter(c => c.isHarmful);

                // 유해한 카드가 없으면 바로 결과 표시
                if (harmfulCards.length === 0 || totalBlocks === 0) {
                    showFinalResult();
                    return;
                }

                // 방어 선택 UI 표시
                const selectionPhase = modal.querySelector('.defense-selection-phase');
                selectionPhase.style.display = 'block';

                // 유해한 카드에 클릭 이벤트 추가
                harmfulCards.forEach(({ index }) => {
                    const cardEl = modal.querySelector(`.risk-card-large[data-index="${index}"]`);
                    cardEl.classList.add('selectable');

                    cardEl.addEventListener('click', () => {
                        if (selectedDefenses.has(index)) {
                            // 선택 해제
                            selectedDefenses.delete(index);
                            cardEl.classList.remove('defense-selected');
                            remainingDefense++;
                        } else if (remainingDefense > 0) {
                            // 선택
                            selectedDefenses.add(index);
                            cardEl.classList.add('defense-selected');
                            remainingDefense--;
                        } else {
                            showNotification('남은 방어력이 없습니다!', 'warning');
                        }

                        // 남은 방어력 업데이트
                        modal.querySelector('#defense-count').textContent = remainingDefense;
                        modal.querySelector('#defense-remaining').textContent = remainingDefense;
                    });
                });

                // 확인 버튼
                document.getElementById('btn-confirm-defense').onclick = () => {
                    selectionPhase.style.display = 'none';
                    applyDefenses();
                };
            };

            // 방어 적용 및 결과 표시
            const applyDefenses = () => {
                let blockedCount = 0;
                let activeCount = 0;
                let usedConstructorBlocks = 0;
                let usedWildcardBlocks = 0;

                revealedCards.forEach(({ index, risk, isHarmful }) => {
                    const cardEl = modal.querySelector(`.risk-card-large[data-index="${index}"]`);
                    const cardContent = cardEl.querySelector('.card-content');

                    if (!isHarmful) {
                        // 안전한 카드 - 그대로 통과
                        cardEl.classList.add('passed');
                        return;
                    }

                    if (selectedDefenses.has(index)) {
                        // 방어 적용
                        blockedCount++;

                        // 방어 소스 결정 (시공사 먼저, 그다음 와일드카드)
                        let blockSource;
                        if (usedConstructorBlocks < constructor.riskBlocks) {
                            blockSource = `🏗️ ${constructor.name}`;
                            usedConstructorBlocks++;
                        } else {
                            blockSource = '🃏 와일드카드';
                            usedWildcardBlocks++;
                        }

                        cardEl.classList.remove('harmful');
                        cardEl.classList.add('blocked');

                        // 카드 내용 업데이트
                        cardContent.innerHTML = `
                            <div class="risk-emoji">${risk.emoji}</div>
                            <div class="risk-name">${risk.name}</div>
                            <div class="risk-effect">${risk.description || ''}</div>
                            <div class="risk-blocked">🛡️ 방어!</div>
                        `;

                        // 리스크 카드에 방어 표시
                        risk.isBlocked = true;
                    } else {
                        // 방어 안 함 - 리스크 적용
                        activeCount++;
                        cardEl.classList.add('active');

                        cardContent.innerHTML = `
                            <div class="risk-emoji">${risk.emoji}</div>
                            <div class="risk-name">${risk.name}</div>
                            <div class="risk-effect">${risk.description || ''}</div>
                            <div class="risk-active">⚠️ 적용됨</div>
                        `;

                        risk.isBlocked = false;
                    }
                });

                // 사용된 와일드카드 제거
                if (usedWildcardBlocks > 0 && player.wildcards) {
                    for (let i = 0; i < usedWildcardBlocks; i++) {
                        const idx = player.wildcards.findIndex(w => w.effect.type === 'risk_block');
                        if (idx !== -1) {
                            player.wildcards.splice(idx, 1);
                        }
                    }
                    gameState.addLog(`${player.name}: 와일드카드 리스크 방어권 ${usedWildcardBlocks}개 사용`);
                    // 플레이어 패널 즉시 업데이트 (카드 개수 반영)
                    renderPlayerPanels();
                }

                // 결과 요약 표시
                setTimeout(() => {
                    const summaryEl = modal.querySelector('.risk-result-summary');
                    const summaryContent = modal.querySelector('.summary-content');

                    const safeCount = revealedCards.filter(c => !c.isHarmful).length;

                    summaryContent.innerHTML = `
                        <div class="risk-final-summary">
                            <div class="summary-stat">
                                <span class="stat-label">총 리스크</span>
                                <span class="stat-value">${riskCards.length}개</span>
                            </div>
                            <div class="summary-stat safe">
                                <span class="stat-label">✅ 안전 통과</span>
                                <span class="stat-value">${safeCount}개</span>
                            </div>
                            <div class="summary-stat success">
                                <span class="stat-label">🛡️ 방어 성공</span>
                                <span class="stat-value">${blockedCount}개</span>
                            </div>
                            <div class="summary-stat ${activeCount > 0 ? 'danger' : 'success'}">
                                <span class="stat-label">⚠️ 적용됨</span>
                                <span class="stat-value">${activeCount}개</span>
                            </div>
                        </div>
                        ${usedWildcardBlocks > 0 ? `<p class="wildcard-note">🃏 와일드카드 ${usedWildcardBlocks}개 사용됨</p>` : ''}
                        <p class="defense-note">💡 시공사 방어 ${usedConstructorBlocks}개 사용</p>
                    `;
                    summaryEl.style.display = 'block';

                    // 계속하기 버튼
                    document.getElementById('btn-risk-continue').onclick = () => {
                        modal.remove();
                        // 리스크 처리
                        const riskResult = processRisks(gameState.currentPlayerIndex);
                        if (riskResult.success) {
                            this.showConstructionResult(constructor, riskResult);
                        }
                        resolve();
                    };
                }, 500);
            };

            // 유해한 카드가 없거나 방어력이 0일 때 바로 결과 표시
            const showFinalResult = () => {
                let activeCount = 0;
                const safeCount = revealedCards.filter(c => !c.isHarmful).length;

                revealedCards.forEach(({ index, risk, isHarmful }) => {
                    const cardEl = modal.querySelector(`.risk-card-large[data-index="${index}"]`);
                    const cardContent = cardEl.querySelector('.card-content');

                    if (!isHarmful) {
                        cardEl.classList.add('passed');
                    } else {
                        activeCount++;
                        cardEl.classList.add('active');
                        cardContent.innerHTML = `
                            <div class="risk-emoji">${risk.emoji}</div>
                            <div class="risk-name">${risk.name}</div>
                            <div class="risk-effect">${risk.description || ''}</div>
                            <div class="risk-active">⚠️ 적용됨</div>
                        `;
                        risk.isBlocked = false;
                    }
                });

                const summaryEl = modal.querySelector('.risk-result-summary');
                const summaryContent = modal.querySelector('.summary-content');

                summaryContent.innerHTML = `
                    <div class="risk-final-summary">
                        <div class="summary-stat">
                            <span class="stat-label">총 리스크</span>
                            <span class="stat-value">${riskCards.length}개</span>
                        </div>
                        <div class="summary-stat safe">
                            <span class="stat-label">✅ 안전 통과</span>
                            <span class="stat-value">${safeCount}개</span>
                        </div>
                        <div class="summary-stat ${activeCount > 0 ? 'danger' : 'success'}">
                            <span class="stat-label">⚠️ 적용됨</span>
                            <span class="stat-value">${activeCount}개</span>
                        </div>
                    </div>
                `;
                summaryEl.style.display = 'block';

                document.getElementById('btn-risk-continue').onclick = () => {
                    modal.remove();
                    const riskResult = processRisks(gameState.currentPlayerIndex);
                    if (riskResult.success) {
                        this.showConstructionResult(constructor, riskResult);
                    }
                    resolve();
                };
            };

            // 첫 카드 공개 시작
            setTimeout(revealNextCard, 500);
        });
    }

    // 시공 결과 표시
    showConstructionResult(constructor, riskResult) {
        const player = gameState.getCurrentPlayer();
        const project = player.currentProject;

        showResultModal('🏗️ 시공 완료!', `
            <div class="construction-result">
                <div class="result-header">
                    <span class="building-emoji">${getBuildingImage(project.building.name, '64px')}</span>
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
        const project = player.currentProject;

        // PM 컨설팅으로 라운드 스킵한 플레이어는 자동 스킵
        if (player.pmSkippedRound === gameState.currentRound) {
            showNotification(`${player.name}님은 PM 컨설팅으로 이번 라운드를 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('salePrice');
            return;
        }

        // 설계 프로젝트 매각한 플레이어는 자동 스킵
        if (player.designSoldRound === gameState.currentRound) {
            showNotification(`${player.name}님은 설계 프로젝트를 매각하여 이번 라운드를 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('salePrice');
            return;
        }

        // 시공 단계에서 자금 부족으로 스킵한 경우
        if (project?.constructionSkippedRound === gameState.currentRound) {
            showNotification(`${player.name}님은 시공을 진행하지 못해 평가를 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('salePrice');
            return;
        }

        // 평가할 프로젝트가 없는 경우 스킵 (토지, 건물, 시공사 모두 필요)
        if (!project || !project.land || !project.building) {
            showNotification(`${player.name}님은 평가할 건물이 없어 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('salePrice');
            return;
        }

        if (!project.constructor) {
            showNotification(`${player.name}님은 시공이 완료되지 않아 스킵합니다.`, 'info');
            this.nextPlayerOrPhase('salePrice');
            return;
        }

        // 이미 평가가 완료된 경우 스킵 (중복 평가 방지)
        if (project.evaluationCompleted) {
            showNotification(`${player.name}님은 이미 평가가 완료되었습니다.`, 'info');
            this.nextPlayerOrPhase('salePrice');
            return;
        }

        // 먼저 평가 완료 처리 (와일드카드 지급 포함)
        const evalResult = completeEvaluation(gameState.currentPlayerIndex);

        if (!evalResult.success) {
            showNotification(evalResult.message, 'error');
            return;
        }

        const bd = evalResult.breakdown;
        const hasAwards = bd.awards.length > 0;
        const isProfit = bd.netProfit > bd.totalInvestment;
        const grantedWildcards = evalResult.grantedWildcards || [];

        showResultModal(`🏆 ${player.name}의 건물 평가`, `
      <div class="evaluation-result fancy">
        <div class="eval-building-showcase">
          <div class="building-icon-large">${getBuildingImage(player.currentProject.building.name, '100px')}</div>
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

        ${grantedWildcards.length > 0 ? `
        <div class="wildcard-grant-section">
          <h3>🎁 와일드카드 획득!</h3>
          <div class="wildcard-grant-list">
            ${grantedWildcards.map((card, i) => `
              <div class="wildcard-grant-item animate-wildcard" style="animation-delay: ${i * 0.3}s">
                <div class="wildcard-grant-icon">${card.name.split(' ')[0]}</div>
                <div class="wildcard-grant-info">
                  <div class="wildcard-grant-name">${card.name}</div>
                  <div class="wildcard-grant-desc">${card.description}</div>
                </div>
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
            <span class="label">💎 총 평가금액</span>
            <span class="value large">${gameState.formatMoney(bd.salePrice)}</span>
          </div>
          ${bd.loanRepayment > 0 ? `
          <div class="final-row repay">
            <span class="label">🏦 대출 잔액</span>
            <span class="value">-${gameState.formatMoney(bd.loanRepayment)}</span>
          </div>
          ` : ''}
          <div class="final-row result ${isProfit ? 'profit' : 'loss'}">
            <span class="label">${isProfit ? '🎉 예상 순이익' : '📉 예상 결과'}</span>
            <span class="value super-large">${gameState.formatMoney(bd.netProfit)}</span>
          </div>
        </div>

        ${isProfit ?
                `<div class="celebration">🎊 축하합니다! 성공적인 투자입니다! 🎊</div>` :
                `<div class="consolation">📈 다음에는 더 좋은 결과가 있을 거예요!</div>`
            }
      </div>
    `, () => {
            // completeEvaluation은 이미 위에서 호출됨
            this.nextPlayerOrPhase('salePrice');
        });
    }

    // 다음 플레이어 또는 다음 페이즈
    nextPlayerOrPhase(checkField) {
        // 현재 플레이어의 턴이 끝나므로 사용하지 않은 턴 한정 와일드카드 효과 초기화
        const currentPlayer = gameState.getCurrentPlayer();
        if (currentPlayer) {
            // 대지 할인 와일드카드: 해당 턴에 사용 안하면 초기화
            if (currentPlayer.landDiscountActive) {
                currentPlayer.landDiscountActive = null;
            }
        }

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
        const medalEmojis = ['🥇', '🥈', '🥉', '4️⃣'];

        showResultModal(`🎉 라운드 ${summary.round} 완료!`, `
            <div class="round-result-fancy">
                <div class="round-header">
                    <div class="round-badge">ROUND ${summary.round}</div>
                    <h2>라운드 결과</h2>
                </div>

                <div class="rankings-podium">
                    ${summary.rankings.map((r, i) => {
            const player = gameState.players.find(p => p.name === r.name);
            return `
                            <div class="ranking-card ${i === 0 ? 'winner' : ''}" style="--rank: ${i + 1}">
                                <div class="rank-medal">${medalEmojis[i] || ''}</div>
                                <div class="rank-number">${i + 1}위</div>
                                <div class="player-info">
                                    <div class="player-name">${r.name}</div>
                                    <div class="player-building">${r.building || '건물 없음'}</div>
                                </div>
                                <div class="player-stats">
                                    <div class="stat-item">
                                        <span class="label">수익</span>
                                        <span class="value ${r.salePrice > 0 ? 'profit' : 'loss'}">${gameState.formatMoney(r.salePrice)}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="label">총 자산</span>
                                        <span class="value">${gameState.formatMoney(player?.money || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>

                <div class="round-footer">
                    <div class="next-round-info">
                        ${summary.round < gameState.maxRounds ?
            `<p>📍 다음 라운드 선공: <strong>${summary.nextRoundFirst}</strong></p>
                             <p class="round-remaining">남은 라운드: ${gameState.maxRounds - summary.round}라운드</p>` :
            `<p class="final-notice">🏆 최종 결과를 확인하세요!</p>`
        }
                    </div>
                </div>
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
        const medalEmojis = ['🥇', '🥈', '🥉', '4️⃣'];

        showResultModal('🏆 게임 종료!', `
      <div class="final-results-fancy">
        <div class="winner-celebration">
          <div class="confetti-container">
            <span class="confetti">🎊</span>
            <span class="confetti">🎉</span>
            <span class="confetti">✨</span>
            <span class="confetti">🌟</span>
            <span class="confetti">🎊</span>
          </div>
          <div class="winner-trophy animate-bounce">🏆</div>
          <h1 class="winner-name animate-glow">${results.winner.name}</h1>
          <p class="winner-subtitle">최고의 건축왕!</p>
          <div class="winner-stats">
            <div class="winner-stat">
              <span class="stat-value">${gameState.formatMoney(results.winner.totalAssets)}</span>
              <span class="stat-label">총 자산</span>
            </div>
          </div>
        </div>

        <div class="final-rankings">
          <h2>🏅 최종 순위</h2>
          <div class="ranking-cards">
            ${results.rankings.map((r, i) => `
              <div class="final-rank-card ${i === 0 ? 'winner' : ''}" style="--delay: ${i * 0.15}s">
                <div class="rank-badge">${medalEmojis[i] || (i + 1) + '위'}</div>
                <div class="rank-info">
                  <div class="rank-name">${r.name}</div>
                  <div class="rank-buildings">
                    ${r.buildings.map(b => `<span class="building-emoji">${getBuildingImage(b.name, '32px')}</span>`).join('')}
                    ${r.buildingsCount === 0 ? '<span class="no-buildings">건물 없음</span>' : ''}
                  </div>
                </div>
                <div class="rank-assets">
                  <div class="asset-breakdown">
                    <div class="asset-row">
                      <span class="asset-label">💵 보유 현금</span>
                      <span class="asset-value">${gameState.formatMoney(r.money)}</span>
                    </div>
                    <div class="asset-row">
                      <span class="asset-label">🏢 건물 가치</span>
                      <span class="asset-value">${gameState.formatMoney(r.buildingValue)}</span>
                    </div>
                    ${r.loan > 0 ? `
                    <div class="asset-row negative">
                      <span class="asset-label">🏦 대출</span>
                      <span class="asset-value">-${gameState.formatMoney(r.loan)}</span>
                    </div>
                    ` : ''}
                    <div class="asset-row total">
                      <span class="asset-label">📊 총 자산</span>
                      <span class="asset-value highlight">${gameState.formatMoney(r.totalAssets)}</span>
                    </div>
                  </div>
                  ${r.awards.length > 0 ? `
                  <div class="rank-awards">
                    ${r.awards.map(a => `<span class="award-badge">${a}</span>`).join('')}
                  </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="game-summary">
          <p>📅 ${results.totalRounds}라운드 게임 완료</p>
        </div>
      </div>
    `, () => {
            this.showFinalMapView();
        });
    }

    // 최종 지도 보기 (게임 종료 후)
    showFinalMapView() {
        // 게임 컨테이너 숨기고 최종 지도 뷰 표시
        const gameContainer = document.getElementById('game-container');
        const setupContainer = document.getElementById('setup-container');

        if (gameContainer) gameContainer.classList.add('hidden');
        if (setupContainer) setupContainer.classList.add('hidden');

        // 최종 지도 뷰 생성
        let finalMapView = document.getElementById('final-map-view');
        if (!finalMapView) {
            finalMapView = document.createElement('div');
            finalMapView.id = 'final-map-view';
            document.body.appendChild(finalMapView);
        }

        const results = getFinalResults();
        const medalEmojis = ['🥇', '🥈', '🥉', '4️⃣'];
        const playerColors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'];

        finalMapView.innerHTML = `
            <div class="final-map-container">
                <div class="final-map-header">
                    <h2>🏆 최종 결과 화면</h2>
                    <p class="final-map-subtitle">${gameState.maxRounds}라운드 동안 개발한 자산 결과</p>
                </div>
                <div class="final-map-content">
                    <div id="final-city-grid" class="final-map-grid"></div>
                </div>
                <div class="final-rankings-panel">
                    <h3>🏆 최종 순위 및 성과</h3>
                    <div class="final-rankings-list">
                        ${results.rankings.map((r, i) => `
                            <div class="final-rank-item ${i === 0 ? 'winner' : ''}" style="border-left: 4px solid ${playerColors[i] || playerColors[0]}">
                                <div class="rank-header">
                                    <span class="rank-medal">${medalEmojis[i] || (i + 1) + '위'}</span>
                                    <span class="rank-name">${r.name}</span>
                                </div>
                                <div class="rank-stats">
                                    <div class="stat">
                                        <span class="stat-label">보유 현금</span>
                                        <span class="stat-value">${gameState.formatMoney(r.money)}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">건물 가치</span>
                                        <span class="stat-value">${gameState.formatMoney(r.buildingValue)}</span>
                                    </div>
                                    ${r.loan > 0 ? `
                                    <div class="stat negative">
                                        <span class="stat-label">대출</span>
                                        <span class="stat-value">-${gameState.formatMoney(r.loan)}</span>
                                    </div>
                                    ` : ''}
                                    <div class="stat total">
                                        <span class="stat-label">총 자산</span>
                                        <span class="stat-value highlight">${gameState.formatMoney(r.totalAssets)}</span>
                                    </div>
                                </div>
                                <div class="rank-buildings-info">
                                    <span class="buildings-count">🏢 ${r.buildingsCount}채</span>
                                    ${r.buildings.length > 0 ? `
                                    <div class="buildings-icons">
                                        ${r.buildings.slice(0, 4).map(b => getBuildingImage(b.name, '24px')).join('')}
                                        ${r.buildings.length > 4 ? `<span class="more">+${r.buildings.length - 4}</span>` : ''}
                                    </div>
                                    ` : ''}
                                </div>
                                ${r.awards.length > 0 ? `
                                <div class="rank-awards">
                                    ${r.awards.map(a => `<span class="award-badge">${a}</span>`).join('')}
                                </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="final-map-footer">
                    <button id="end-game-btn" class="btn-end-game">🏠 게임 종료</button>
                </div>
            </div>
        `;

        finalMapView.classList.remove('hidden');

        // 지도 렌더링 - 기존 city-grid를 final-city-grid로 이동
        const finalCityGrid = document.getElementById('final-city-grid');
        const cityGridSection = document.getElementById('city-grid');

        if (finalCityGrid && cityGridSection) {
            // 기존 city-grid를 final-city-grid 안으로 이동
            finalCityGrid.appendChild(cityGridSection);
            cityGridSection.classList.remove('hidden');

            // 개발자 모드 버튼 숨기기 (최종 결과에서는 필요없음)
            const devModeBtn = cityGridSection.querySelector('#toggle-dev-mode-btn');
            if (devModeBtn) devModeBtn.style.display = 'none';

            // 3D 토글 버튼 이벤트 재바인딩
            const toggle3DBtn = cityGridSection.querySelector('#toggle-3d-city-btn');
            if (toggle3DBtn) {
                // 기존 이벤트 리스너 제거를 위해 버튼 복제
                const newToggle3DBtn = toggle3DBtn.cloneNode(true);
                toggle3DBtn.parentNode.replaceChild(newToggle3DBtn, toggle3DBtn);
                newToggle3DBtn.addEventListener('click', () => {
                    toggle3DCityView();
                });
            }

            // 플롯 마커 클릭 이벤트 재바인딩 (상세 정보 표시)
            this.bindFinalMapPlotEvents(cityGridSection);
        }

        // 게임 종료 버튼 이벤트
        const endGameBtn = document.getElementById('end-game-btn');
        if (endGameBtn) {
            endGameBtn.addEventListener('click', () => {
                // city-grid를 원래 위치(game-container)로 복원
                const gameContainer = document.getElementById('game-container');
                const cityGrid = document.getElementById('city-grid');
                if (gameContainer && cityGrid) {
                    gameContainer.appendChild(cityGrid);
                    // 개발자 모드 버튼 다시 표시
                    const devModeBtn = cityGrid.querySelector('#toggle-dev-mode-btn');
                    if (devModeBtn) devModeBtn.style.display = '';
                }
                finalMapView.classList.add('hidden');
                this.showMainMenu();
            });
        }

        // 스타일 추가
        if (!document.getElementById('final-map-styles')) {
            const style = document.createElement('style');
            style.id = 'final-map-styles';
            style.textContent = `
                #final-map-view {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: var(--bg-primary);
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 1rem 2rem;
                }
                .final-map-container {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .final-map-header {
                    text-align: center;
                    margin-bottom: 0.5rem;
                }
                .final-map-header h2 {
                    font-size: 1.75rem;
                    color: var(--accent-gold);
                    margin-bottom: 0.25rem;
                }
                .final-map-subtitle {
                    color: var(--text-secondary);
                    font-size: 1rem;
                    margin: 0;
                }
                .final-map-content {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    padding: 0.5rem;
                    margin-bottom: 1rem;
                }
                /* 최종 결과에서 city-grid 헤더 숨기기 */
                .final-map-grid .iso-city-header {
                    display: none;
                }
                .final-map-grid .iso-city-container {
                    padding-top: 0;
                }
                .final-map-footer {
                    text-align: center;
                }
                .btn-end-game {
                    padding: 1rem 3rem;
                    font-size: 1.2rem;
                    background: var(--gradient-gold);
                    color: var(--bg-primary);
                    border: none;
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    font-weight: 700;
                    transition: all 0.3s ease;
                }
                .btn-end-game:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
                }
                #final-map-view.hidden {
                    display: none;
                }
                .final-map-content .plot-marker {
                    cursor: pointer;
                    pointer-events: auto !important;
                }
                .final-map-content .plot-marker.owned {
                    cursor: pointer;
                }
                .final-map-content .plot-marker.owned:hover {
                    z-index: 100;
                    filter: brightness(1.2);
                }
                .final-map-content .plot-marker * {
                    pointer-events: none;
                }
                .final-map-grid .map-grid .plot-marker,
                .final-map-grid .map-grid .plot-marker:hover {
                    transform: none !important;
                    transition: none !important;
                }
                .final-map-controls {
                    margin-top: 1rem;
                }
                .btn-3d-toggle {
                    padding: 0.5rem 1.5rem;
                    font-size: 1rem;
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-3d-toggle:hover {
                    background: var(--accent-blue);
                    border-color: var(--accent-blue);
                }
                .final-rankings-panel {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }
                .final-rankings-panel h3 {
                    text-align: center;
                    color: var(--accent-gold);
                    margin-bottom: 1rem;
                    font-size: 1.25rem;
                }
                .final-rankings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .final-rank-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding: 1rem 1.25rem;
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-md);
                }
                .final-rank-item.winner {
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
                    border: 1px solid var(--accent-gold);
                }
                .final-rank-item .rank-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .final-rank-item .rank-medal {
                    font-size: 1.5rem;
                    width: 40px;
                    text-align: center;
                }
                .final-rank-item .rank-name {
                    flex: 1;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .final-rank-item .rank-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 0.5rem;
                    padding: 0.5rem 0;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .final-rank-item .stat {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }
                .final-rank-item .stat-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .final-rank-item .stat-value {
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .final-rank-item .stat.negative .stat-value {
                    color: #ef4444;
                }
                .final-rank-item .stat.total .stat-value {
                    color: var(--accent-gold);
                    font-size: 1.1rem;
                }
                .final-rank-item .stat.total .stat-value.highlight {
                    text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
                }
                .final-rank-item .rank-buildings-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .final-rank-item .buildings-count {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                .final-rank-item .buildings-icons {
                    display: flex;
                    gap: 0.25rem;
                    align-items: center;
                }
                .final-rank-item .buildings-icons .more {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .final-rank-item .rank-awards {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                .final-rank-item .award-badge {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.5rem;
                    background: rgba(245, 158, 11, 0.2);
                    border-radius: var(--radius-sm);
                    color: var(--accent-gold);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 최종 지도 건물 클릭 이벤트 바인딩
    bindFinalMapPlotEvents(container) {
        // iso-city-map 컨테이너에 이벤트 위임 사용 (더 넓은 범위)
        const isoCityMap = container.querySelector('.iso-city-map') || container.querySelector('#iso-city-map');

        if (isoCityMap) {
            // 이벤트 위임으로 모든 플롯 마커 클릭 처리
            isoCityMap.addEventListener('click', (e) => {
                const marker = e.target.closest('.plot-marker.owned');
                if (marker) {
                    e.stopPropagation();
                    e.preventDefault();
                    const plotIndex = parseInt(marker.dataset.plotIndex);
                    this.showFinalMapBuildingDetail(plotIndex, marker);
                }
            });
        }

        // 모든 owned 마커에 직접 이벤트 바인딩 (백업)
        const ownedMarkers = container.querySelectorAll('.plot-marker.owned');
        ownedMarkers.forEach(marker => {
            marker.style.cursor = 'pointer';
            marker.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const plotIndex = parseInt(marker.dataset.plotIndex);
                this.showFinalMapBuildingDetail(plotIndex, marker);
            };
        });
    }

    // 최종 지도 건물 상세 정보 표시
    showFinalMapBuildingDetail(plotIndex, marker) {
        // 기존 모달 제거
        document.querySelectorAll('.final-building-modal').forEach(m => m.remove());

        // 소유 정보 수집
        const ownedPlots = [];
        gameState.players.forEach((player, playerIndex) => {
            // 완성된 건물
            player.buildings.forEach(building => {
                ownedPlots.push({
                    type: 'completed',
                    playerIndex,
                    playerName: player.name,
                    land: building.land,
                    building: building.building,
                    architect: building.architect,
                    constructor: building.constructor,
                    salePrice: building.salePrice,
                    plotIndex: building.plotIndex
                });
            });

            // 매각 이력
            player.soldHistory.forEach(sold => {
                if (sold.type === 'building' && sold.originalProject) {
                    ownedPlots.push({
                        type: 'sold',
                        playerIndex,
                        playerName: player.name,
                        land: sold.land,
                        building: sold.building,
                        architect: sold.architect,
                        sellPrice: sold.sellPrice,
                        soldAt: sold.soldAt,
                        plotIndex: sold.originalProject.plotIndex
                    });
                }
            });
        });

        const owned = ownedPlots.find(o => o.plotIndex === plotIndex);
        if (!owned) return;

        const playerColors = [
            { bg: '#ef4444', border: '#f87171' },
            { bg: '#3b82f6', border: '#60a5fa' },
            { bg: '#22c55e', border: '#4ade80' },
            { bg: '#f59e0b', border: '#fbbf24' }
        ];
        const playerColor = playerColors[owned.playerIndex] || playerColors[0];

        const isSold = owned.type === 'sold';
        const statusText = isSold ? '매각됨' : '완공';
        const statusClass = isSold ? 'status-sold' : 'status-completed';

        const modal = document.createElement('div');
        modal.className = 'final-building-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">✕</button>
                <div class="modal-header" style="border-left: 4px solid ${playerColor.border}">
                    <span class="modal-status ${statusClass}">${statusText}</span>
                    <span class="modal-owner">${owned.playerName}</span>
                </div>
                <div class="modal-body">
                    <div class="modal-land">
                        <strong>📍 ${owned.land?.name || '알 수 없음'}</strong>
                        <span>${owned.land?.area || '-'}평</span>
                    </div>
                    ${owned.building ? `
                        <div class="modal-building">
                            <strong>🏢 ${owned.building.name}</strong>
                        </div>
                    ` : ''}
                    ${owned.architect ? `
                        <div class="modal-architect">
                            <span>${owned.architect.portrait || '👤'} ${owned.architect.name}</span>
                        </div>
                    ` : ''}
                    ${owned.constructor ? `
                        <div class="modal-constructor">
                            <span>${owned.constructor.emoji || '🏗️'} ${owned.constructor.name}</span>
                        </div>
                    ` : ''}
                    <div class="modal-price">
                        ${isSold
                            ? `<span class="sold">💰 매각가: ${gameState.formatMoney(owned.sellPrice)} (라운드 ${owned.soldAt})</span>`
                            : `<span>💎 건물 가치: ${gameState.formatMoney(owned.salePrice || 0)}</span>`
                        }
                    </div>
                </div>
            </div>
        `;

        // 스타일 추가
        if (!document.getElementById('final-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'final-modal-styles';
            style.textContent = `
                .final-building-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    z-index: 2000;
                    min-width: 300px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .final-building-modal .modal-content {
                    position: relative;
                }
                .final-building-modal .modal-close {
                    position: absolute;
                    top: -0.5rem;
                    right: -0.5rem;
                    background: var(--bg-tertiary);
                    border: none;
                    color: var(--text-secondary);
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1rem;
                }
                .final-building-modal .modal-close:hover {
                    background: var(--accent-red);
                    color: white;
                }
                .final-building-modal .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem;
                    margin-bottom: 1rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: var(--radius-sm);
                }
                .final-building-modal .modal-status {
                    padding: 0.25rem 0.5rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .final-building-modal .status-completed {
                    background: var(--accent-green);
                    color: white;
                }
                .final-building-modal .status-sold {
                    background: var(--accent-purple);
                    color: white;
                }
                .final-building-modal .modal-owner {
                    font-weight: 600;
                }
                .final-building-modal .modal-body > div {
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .final-building-modal .modal-body > div:last-child {
                    border-bottom: none;
                }
                .final-building-modal .modal-price .sold {
                    color: var(--accent-purple);
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);

        // 닫기 버튼 이벤트
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
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

        // 자산 클릭 이벤트 바인딩
        this.bindPropertyClickEvents();

        // 와일드카드 패널 업데이트
        this.updateWildcardPanel();

        // 플레이어 패널 클릭 이벤트 바인딩
        this.bindPlayerPanelClickEvents();
    }

    // 플레이어 건물 목록 모달 표시
    showPlayerBuildingsModal(playerIndex) {
        const player = gameState.players[playerIndex];
        if (!player || !player.buildings || player.buildings.length === 0) {
            showNotification('건물이 없습니다.', 'info');
            return;
        }

        const buildingsList = player.buildings.map((building, index) => {
            const estimatedValue = building.salePrice || 0;
            return `<div class="building-list-item" data-player="${playerIndex}" data-building="${index}">
                <div class="building-icon-box">
                    ${getBuildingImage(building.building.name, '56px')}
                </div>
                <div class="building-info">
                    <div class="building-name">${building.building.name}</div>
                    <div class="building-land">📍 ${building.land.name}</div>
                    <div class="building-value">💰 ${gameState.formatMoney(estimatedValue)}</div>
                </div>
                <div class="building-arrow-btn">▶</div>
            </div>`;
        }).join('');

        showResultModal(`🏢 ${player.name}의 건물 (${player.buildings.length}개)`,
`<div class="player-buildings-modal">
<div class="buildings-list">${buildingsList}</div>
</div>`, null, true);

        // 건물 아이템 클릭 이벤트 바인딩
        setTimeout(() => {
            document.querySelectorAll('.building-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const pIdx = parseInt(item.dataset.player);
                    const bIdx = parseInt(item.dataset.building);
                    const building = gameState.players[pIdx]?.buildings[bIdx];
                    if (building) {
                        // 기존 모달 닫기
                        document.querySelector('.modal-overlay')?.remove();
                        // 건물 상세 보기
                        this.showPropertyDetail(building, pIdx);
                    }
                });
            });
        }, 100);
    }

    // 플레이어 와일드카드 모달 표시
    showPlayerWildcardsModal(playerIndex) {
        const player = gameState.players[playerIndex];
        if (!player || !player.wildcards || player.wildcards.length === 0) {
            showNotification('와일드카드가 없습니다.', 'info');
            return;
        }

        const isCurrentPlayer = playerIndex === gameState.currentPlayerIndex;

        const wildcardsList = player.wildcards.map((card, index) => {
            const effectDescription = this.getWildcardEffectDescription(card.effect);
            const usagePhase = this.getWildcardUsagePhase(card.effect.type);
            // 카드 아이콘 선택 (카드 타입에 따라)
            const cardIcon = card.effect.type === 'bonus_dice' || card.effect.type === 'extra_dice' ? '🎲' :
                             card.effect.type === 'risk_block' ? '🛡️' :
                             card.effect.type === 'land_discount' ? '🎫' :
                             card.effect.type === 'design_free' ? '🎫' :
                             card.effect.type === 'loan_rate_cut' ? '💰' : '🃏';

            return `<div class="wildcard-list-item ${isCurrentPlayer ? 'can-use' : ''}" data-player="${playerIndex}" data-card="${index}">
                <div class="wildcard-card-icon">
                    <span class="card-emoji">${cardIcon}</span>
                </div>
                <div class="wildcard-details">
                    <div class="wildcard-header">
                        <span class="wildcard-name">${card.name}</span>
                    </div>
                    <div class="wildcard-desc">${card.description}</div>
                    <div class="wildcard-effect">✨ ${effectDescription}</div>
                    <div class="wildcard-phase">🎯 ${usagePhase}</div>
                </div>
                ${isCurrentPlayer ? `<button class="btn-use-wildcard" data-index="${index}">사용</button>` : ''}
            </div>`;
        }).join('');

        showResultModal(`🃏 ${player.name}의 와일드카드 (${player.wildcards.length}장)`,
`<div class="player-wildcards-modal">
<div class="wildcards-list">${wildcardsList}</div>
</div>`, null, true);

        // 와일드카드 사용 버튼 이벤트 바인딩
        if (isCurrentPlayer) {
            setTimeout(() => {
                document.querySelectorAll('.btn-use-wildcard').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const cardIndex = parseInt(btn.dataset.index);
                        // 모달 닫기
                        document.querySelector('.modal-overlay')?.remove();
                        // 와일드카드 사용
                        this.useWildcard(cardIndex);
                    });
                });
            }, 100);
        }
    }

    // 자산 클릭 이벤트 바인딩
    bindPropertyClickEvents() {
        // 개발 지도의 지역 기반 셀 클릭 이벤트
        document.querySelectorAll('.city-cell.region-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const ownerIndex = cell.dataset.owner !== undefined ? parseInt(cell.dataset.owner) : null;
                const cellType = cell.dataset.type;

                if (ownerIndex === null || isNaN(ownerIndex)) return;

                const player = gameState.players[ownerIndex];
                if (!player) return;

                if (cellType === 'building') {
                    // 완성된 건물 - 토지명으로 찾기
                    const landName = cell.querySelector('.cell-land-name')?.textContent;
                    const building = player.buildings.find(b => b.land?.name === landName);
                    if (building) {
                        this.showPropertyDetail(building, ownerIndex);
                    }
                } else if (cellType === 'project') {
                    // 진행 중인 프로젝트
                    if (player.currentProject && player.currentProject.land) {
                        this.showPropertyDetail(player.currentProject, ownerIndex);
                    }
                } else if (cellType === 'sold') {
                    // 매각된 건물/토지
                    const landName = cell.querySelector('.cell-land-name')?.textContent;
                    const soldItem = player.soldHistory?.find(s => s.land?.name === landName);
                    if (soldItem) {
                        if (soldItem.building) {
                            this.showSoldDetail(soldItem, ownerIndex);
                        } else {
                            this.showSoldLandDetail(soldItem, ownerIndex);
                        }
                    }
                }
            });
        });

        // 프로젝트 맵의 건물/대지 클릭 이벤트 (모든 프로젝트 클릭 가능)
        document.querySelectorAll('.project-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const playerIndex = parseInt(tile.dataset.player);
                const player = gameState.players[playerIndex];
                const tileType = tile.dataset.type;

                if (tileType === 'owned') {
                    // 보유 중인 완성 건물
                    const buildingIndex = parseInt(tile.dataset.building);
                    if (player && player.buildings[buildingIndex]) {
                        this.showPropertyDetail(player.buildings[buildingIndex], playerIndex);
                    }
                } else if (tileType === 'sold') {
                    // 매각된 건물
                    const soldIndex = parseInt(tile.dataset.sold);
                    if (player && player.soldHistory && player.soldHistory[soldIndex]) {
                        this.showSoldDetail(player.soldHistory[soldIndex], playerIndex);
                    }
                } else if (tileType === 'sold-land') {
                    // 매각된 토지
                    const soldIndex = parseInt(tile.dataset.sold);
                    if (player && player.soldHistory && player.soldHistory[soldIndex]) {
                        this.showSoldLandDetail(player.soldHistory[soldIndex], playerIndex);
                    }
                } else {
                    // 현재 진행 중인 프로젝트
                    if (player && player.currentProject && player.currentProject.land) {
                        this.showPropertyDetail(player.currentProject, playerIndex);
                    }
                }
            });
        });
    }

    // 자산 상세 정보 모달
    showPropertyDetail(property, ownerIndex = null) {
        // property가 cell data인지 project인지 확인
        // cell data: {x, y, district, project, building, owner, ...}
        // project: {land, building, architect, constructor, ...}
        let project;

        if (property.project) {
            // cell data에 프로젝트가 있는 경우 (진행 중인 프로젝트)
            project = property.project;
            if (ownerIndex === null) ownerIndex = property.owner;
        } else if (property.building && property.owner !== undefined) {
            // cell data에 완성된 건물만 있는 경우 (project는 null)
            // player.buildings에서 해당 건물 찾기
            const player = gameState.players[property.owner];
            if (player && player.buildings) {
                project = player.buildings.find(b => b.building === property.building);
            }
            if (!project) {
                // buildings에서 못 찾으면 cell 정보로 임시 프로젝트 생성
                project = {
                    building: property.building,
                    land: { name: property.district || '알 수 없음' },
                    salePrice: 0
                };
            }
            if (ownerIndex === null) ownerIndex = property.owner;
        } else if (property.land) {
            // project 직접 전달된 경우 (프로젝트 맵에서 클릭)
            project = property;
        } else {
            showNotification('상세 정보를 볼 수 없습니다.', 'warning');
            return;
        }

        // building이 없어도 land가 있으면 상세 정보 표시
        const building = project.building || property.building;
        const land = project.land;

        // 최소한 land는 있어야 함
        if (!land && !building) {
            showNotification('프로젝트 정보가 없습니다.', 'warning');
            return;
        }

        // 소유자 확인 (현재 플레이어인지)
        const isMyProperty = ownerIndex === gameState.currentPlayerIndex;
        const ownerName = ownerIndex !== null ? gameState.players[ownerIndex]?.name : '알 수 없음';

        // 건물이 없는 경우 (땅만 있는 경우)
        if (!building) {
            this.showLandDetail(project, ownerIndex);
            return;
        }

        const totalInvestment = (project.landPrice || 0) +
            (project.developmentCost || 0) +
            (project.designFee || 0) +
            (project.constructionCost || 0);

        const estimatedValue = Math.round(totalInvestment * (project.evaluationFactor || 1));
        const landName = project.land?.name || property.district || '알 수 없음';

        showResultModal(`📊 ${building.name} 상세 정보`, `
            <div class="property-detail">
                <div class="property-header">
                    <span class="property-emoji">${getBuildingImage(building.name, '64px')}</span>
                    <div class="property-title">
                        <h2>${building.name}</h2>
                        <span class="property-location">📍 ${landName}</span>
                        <span class="property-owner">👤 소유자: ${ownerName}</span>
                    </div>
                </div>

                <div class="property-info-grid">
                    <div class="info-section">
                        <h4>🏗️ 프로젝트 정보</h4>
                        <div class="info-row">
                            <span class="label">건축가</span>
                            <span class="value">${project.architect?.portrait || ''} ${project.architect?.name || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">시공사</span>
                            <span class="value">${project.constructor?.emoji || ''} ${project.constructor?.name || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">평가 팩터</span>
                            <span class="value highlight">x${(project.evaluationFactor || 1).toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4>💰 투자 내역</h4>
                        <div class="info-row">
                            <span class="label">대지비</span>
                            <span class="value">${gameState.formatMoney(project.landPrice || 0)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">개발비</span>
                            <span class="value">${gameState.formatMoney(project.developmentCost || 0)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">설계비</span>
                            <span class="value">${gameState.formatMoney(project.designFee || 0)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">시공비</span>
                            <span class="value">${gameState.formatMoney(project.constructionCost || 0)}</span>
                        </div>
                        <div class="info-row total">
                            <span class="label">총 투자</span>
                            <span class="value">${gameState.formatMoney(totalInvestment)}</span>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4>📈 예상 가치</h4>
                        <div class="info-row large">
                            <span class="label">현재 예상 가치</span>
                            <span class="value gold">${gameState.formatMoney(estimatedValue)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">수익률</span>
                            <span class="value ${estimatedValue > totalInvestment ? 'profit' : 'loss'}">
                                ${totalInvestment > 0 ? ((estimatedValue / totalInvestment - 1) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>
                </div>

                ${isMyProperty ? `
                <div class="property-actions">
                    <button class="btn-sell-property" id="btn-sell-this-property">
                        🏷️ 매각하기 (예상: ${gameState.formatMoney(estimatedValue)})
                    </button>
                </div>
                ` : `
                <div class="property-actions view-only">
                    <p class="view-only-notice">👁️ 다른 플레이어의 자산입니다 (열람만 가능)</p>
                </div>
                `}
            </div>
        `, null, true);

        // 매각 버튼 이벤트 (본인 자산인 경우만)
        if (isMyProperty) {
            setTimeout(() => {
                const sellBtn = document.getElementById('btn-sell-this-property');
                if (sellBtn) {
                    sellBtn.onclick = () => {
                        this.confirmPropertySale(project, estimatedValue);
                    };
                }
            }, 100);
        }
    }

    // 자산 매각 확인
    confirmPropertySale(project, estimatedValue) {
        const self = this; // this 바인딩 보존
        showConfirmModal('건물 매각', `정말로 ${project.building.name}을(를) ${gameState.formatMoney(estimatedValue)}에 매각하시겠습니까?`, () => {
            const player = gameState.getCurrentPlayer();

            // 손익 계산
            const originalSalePrice = project.salePrice || estimatedValue;
            const profitLoss = estimatedValue - originalSalePrice;

            // 매각 이력에 추가 (지도에 흔적을 남김)
            player.soldHistory.push({
                type: 'building',
                building: project.building,
                land: project.land,
                architect: project.architect,
                sellPrice: estimatedValue,
                profitLoss,
                marketFactor: 1.0,
                soldAt: gameState.currentRound,
                originalProject: { ...project }
            });

            // 매각 처리
            player.money += estimatedValue;

            // 대출 상환
            if (player.loan > 0) {
                const repayment = Math.min(player.loan, estimatedValue);
                player.loan -= repayment;
                gameState.addLog(`${player.name}: 대출 ${gameState.formatMoney(repayment)} 상환`);
            }

            // 건물 제거 (완성된 건물 목록에서)
            const buildingIndex = player.buildings.findIndex(b => b === project);
            if (buildingIndex !== -1) {
                player.buildings.splice(buildingIndex, 1);
            }

            // 현재 프로젝트인 경우 null로 설정
            if (player.currentProject === project) {
                player.currentProject = null;
            }

            // 지도에서 제거 (cityMap에서만 제거, 아이소메트릭 맵에서는 soldHistory로 표시)
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 5; x++) {
                    if (gameState.cityMap[y][x].project === project) {
                        gameState.cityMap[y][x].owner = null;
                        gameState.cityMap[y][x].project = null;
                        gameState.cityMap[y][x].building = null;
                    }
                }
            }

            gameState.addLog(`${player.name}: ${project.building.name} 매각 (${gameState.formatMoney(estimatedValue)})`);
            showNotification(`${project.building.name}을(를) 매각했습니다!`, 'success');

            // 모달 닫기 및 UI 업데이트
            document.querySelector('.modal-overlay')?.remove();
            self.updateUI();

            // 시공 단계에서 매각한 경우 턴 넘기기
            if (gameState.phase === GAME_PHASES.CONSTRUCTION && !player.currentProject) {
                self.nextPlayerOrPhase('constructor');
            }
        });
    }

    // 대지 상세 정보 모달 (건물 없는 경우)
    showLandDetail(project, ownerIndex = null) {
        const land = project.land;
        const currentPhase = this.getProjectCurrentPhase(project);

        // 소유자 확인
        const isMyProperty = ownerIndex === gameState.currentPlayerIndex;
        const ownerName = ownerIndex !== null ? gameState.players[ownerIndex]?.name : '알 수 없음';

        const totalInvestment = (project.landPrice || 0) + (project.developmentCost || 0) + (project.designFee || 0);

        showResultModal(`🗺️ ${land.name} 상세 정보`, `
            <div class="land-detail">
                <div class="land-header">
                    <span class="land-emoji">${land.emoji || '🏞️'}</span>
                    <div class="land-title">
                        <h2>${land.name}</h2>
                        <span class="land-region">📍 ${land.region || '알 수 없음'}</span>
                        <span class="land-owner">👤 소유자: ${ownerName}</span>
                    </div>
                </div>

                <div class="land-status">
                    <span class="status-badge ${currentPhase.class}">${currentPhase.label}</span>
                </div>

                <div class="land-info-grid">
                    <div class="info-section">
                        <h4>🗺️ 대지 정보</h4>
                        <div class="info-row">
                            <span class="label">대지 유형</span>
                            <span class="value">${land.type || '일반'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">구매가</span>
                            <span class="value">${gameState.formatMoney(project.landPrice || 0)}</span>
                        </div>
                        ${project.developmentCost > 0 ? `
                        <div class="info-row">
                            <span class="label">개발비</span>
                            <span class="value">${gameState.formatMoney(project.developmentCost)}</span>
                        </div>
                        ` : ''}
                    </div>

                    ${project.architect ? `
                    <div class="info-section">
                        <h4>📏 설계 정보</h4>
                        <div class="info-row">
                            <span class="label">건축가</span>
                            <span class="value">${project.architect.portrait} ${project.architect.name}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">설계비</span>
                            <span class="value">${gameState.formatMoney(project.designFee || 0)}</span>
                        </div>
                        ${project.building ? `
                        <div class="info-row">
                            <span class="label">설계 건물</span>
                            <span class="value">${getBuildingImage(project.building.name, '24px')} ${project.building.name}</span>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}

                    <div class="info-section">
                        <h4>💰 총 투자액</h4>
                        <div class="info-row large">
                            <span class="label">현재까지 투자</span>
                            <span class="value gold">${gameState.formatMoney(totalInvestment)}</span>
                        </div>
                    </div>
                </div>

                ${isMyProperty ? `
                <div class="land-actions">
                    <button class="btn-sell-land" id="btn-sell-this-land">
                        🏷️ 대지 매각 (${gameState.formatMoney(Math.floor(totalInvestment * 0.8))})
                    </button>
                </div>
                ` : `
                <div class="land-actions view-only">
                    <p class="view-only-notice">👁️ 다른 플레이어의 자산입니다 (열람만 가능)</p>
                </div>
                `}
            </div>
        `, null, true);

        // 매각 버튼 이벤트 (본인 자산인 경우만)
        if (isMyProperty) {
            setTimeout(() => {
                const sellBtn = document.getElementById('btn-sell-this-land');
                if (sellBtn) {
                    sellBtn.onclick = () => {
                        this.confirmLandSale(project);
                    };
                }
            }, 100);
        }
    }

    // 프로젝트 현재 단계 반환
    getProjectCurrentPhase(project) {
        if (project.constructor) {
            return { label: '🏗️ 시공 중', class: 'construction' };
        } else if (project.architect && project.building) {
            return { label: '📏 설계 완료', class: 'designed' };
        } else if (project.architect) {
            return { label: '🎨 건축가 선정', class: 'architect' };
        } else if (project.land) {
            return { label: '🗺️ 대지 확보', class: 'land' };
        }
        return { label: '⏳ 대기', class: 'waiting' };
    }

    // 대지 매각 확인
    confirmLandSale(project) {
        const self = this; // this 바인딩 보존
        const totalInvestment = (project.landPrice || 0) + (project.developmentCost || 0) + (project.designFee || 0);
        const salePrice = Math.floor(totalInvestment * 0.8);
        const profit = salePrice - totalInvestment;

        showConfirmModal('대지 매각', `정말로 ${project.land.name}을(를) ${gameState.formatMoney(salePrice)}에 매각하시겠습니까?\n(투자 대비 20% 손실)`, () => {
            const player = gameState.getCurrentPlayer();

            // 매각 이력에 추가 (지도에 흔적을 남김)
            player.soldHistory.push({
                type: 'land',
                land: project.land,
                sellPrice: salePrice,
                profit,
                soldAt: gameState.currentRound
            });

            // 매각 처리
            player.money += salePrice;
            player.currentProject = null;

            gameState.addLog(`${player.name}: ${project.land.name} 대지 매각 (${gameState.formatMoney(salePrice)})`);
            showNotification(`${project.land.name}을(를) 매각했습니다!`, 'success');

            // 모달 닫기 및 UI 업데이트
            document.querySelector('.modal-overlay')?.remove();
            self.updateUI();
        });
    }

    // 매각된 건물 상세 정보 표시
    showSoldDetail(sold, ownerIndex) {
        const ownerName = gameState.players[ownerIndex]?.name || '알 수 없음';
        const profitLossText = sold.profitLoss >= 0
            ? `+${gameState.formatMoney(sold.profitLoss)}`
            : `-${gameState.formatMoney(Math.abs(sold.profitLoss))}`;
        const marketStatus = sold.marketFactor >= 1.0 ? '호황' : '불황';

        showResultModal(`💰 ${sold.building.name} 매각 이력`, `
            <div class="sold-detail">
                <div class="sold-header">
                    <span class="sold-emoji">${getBuildingImage(sold.building.name, '64px')}</span>
                    <div class="sold-title">
                        <h2>${sold.building.name}</h2>
                        <span class="sold-location">📍 ${sold.land.name}</span>
                        <span class="sold-owner">👤 ${ownerName}</span>
                    </div>
                    <span class="sold-badge">매각 완료</span>
                </div>

                <div class="sold-info-grid">
                    <div class="info-section">
                        <h4>🏗️ 건물 정보</h4>
                        <div class="info-row">
                            <span class="label">건축가</span>
                            <span class="value">${sold.architect?.portrait || ''} ${sold.architect?.name || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">매각 라운드</span>
                            <span class="value">라운드 ${sold.soldAt}</span>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4>💰 매각 정보</h4>
                        <div class="info-row large">
                            <span class="label">매각가</span>
                            <span class="value gold">${gameState.formatMoney(sold.sellPrice)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">손익</span>
                            <span class="value ${sold.profitLoss >= 0 ? 'profit' : 'loss'}">${profitLossText}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">시장 상황</span>
                            <span class="value">${marketStatus} (x${sold.marketFactor.toFixed(2)})</span>
                        </div>
                    </div>
                </div>
            </div>
        `, null, true);
    }

    // 매각된 토지 상세 정보 표시
    showSoldLandDetail(sold, ownerIndex) {
        const ownerName = gameState.players[ownerIndex]?.name || '알 수 없음';

        showResultModal(`💰 ${sold.land.name} 토지 매각 이력`, `
            <div class="sold-detail land-sold">
                <div class="sold-header">
                    <span class="sold-emoji">🏞️</span>
                    <div class="sold-title">
                        <h2>${sold.land.name}</h2>
                        <span class="sold-owner">👤 ${ownerName}</span>
                    </div>
                    <span class="sold-badge">토지 매각</span>
                </div>

                <div class="sold-info-grid">
                    <div class="info-section">
                        <h4>💰 매각 정보</h4>
                        <div class="info-row large">
                            <span class="label">매각가</span>
                            <span class="value gold">${gameState.formatMoney(sold.sellPrice)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">수익</span>
                            <span class="value profit">+${gameState.formatMoney(sold.profit)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">매각 라운드</span>
                            <span class="value">라운드 ${sold.soldAt}</span>
                        </div>
                    </div>
                </div>
            </div>
        `, null, true);
    }

    // 와일드카드 패널 업데이트
    updateWildcardPanel() {
        const player = gameState.getCurrentPlayer();

        // 와일드카드 토글 버튼 업데이트/생성
        this.updateWildcardToggleButton(player);

        if (!player || !player.wildcards || player.wildcards.length === 0) {
            // 와일드카드 패널 숨기기
            const wildcardPanel = document.getElementById('wildcard-panel');
            if (wildcardPanel) wildcardPanel.classList.add('hidden');
            return;
        }

        let wildcardPanel = document.getElementById('wildcard-panel');
        if (!wildcardPanel) {
            wildcardPanel = document.createElement('div');
            wildcardPanel.id = 'wildcard-panel';
            wildcardPanel.className = 'wildcard-panel hidden'; // 기본적으로 숨김
            // game-container에 추가
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(wildcardPanel);
            }
        }

        wildcardPanel.innerHTML = `
            <div class="wildcard-header">
                <h4>🃏 보유 와일드카드</h4>
                <div class="wildcard-header-right">
                    <span class="card-count">${player.wildcards.length}장</span>
                    <button class="wildcard-close-btn" id="wildcard-close-btn">&times;</button>
                </div>
            </div>
            <div class="wildcard-list">
                ${player.wildcards.map((card, index) => `
                    <div class="wildcard-item" data-index="${index}">
                        <div class="wildcard-item-header">
                            <span class="card-name">${card.name}</span>
                            <span class="card-detail-hint">ℹ️ 상세보기</span>
                        </div>
                        <span class="card-desc">${card.description}</span>
                        <button class="btn-use-wildcard" data-index="${index}">사용</button>
                    </div>
                `).join('')}
            </div>
        `;

        // 닫기 버튼 이벤트
        document.getElementById('wildcard-close-btn')?.addEventListener('click', () => {
            wildcardPanel.classList.add('hidden');
        });

        // 와일드카드 아이템 클릭 시 상세보기
        wildcardPanel.querySelectorAll('.wildcard-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 버튼 클릭은 제외
                if (e.target.classList.contains('btn-use-wildcard')) return;
                const index = parseInt(item.dataset.index);
                this.showWildcardDetail(player.wildcards[index]);
            });
        });

        // 와일드카드 사용 버튼 이벤트
        wildcardPanel.querySelectorAll('.btn-use-wildcard').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.useWildcard(index);
            });
        });
    }

    // 와일드카드 토글 버튼 업데이트/생성
    updateWildcardToggleButton(player) {
        let toggleBtn = document.getElementById('wildcard-toggle-btn');

        // 와일드카드가 없으면 버튼 숨기기
        if (!player || !player.wildcards || player.wildcards.length === 0) {
            if (toggleBtn) toggleBtn.classList.add('hidden');
            return;
        }

        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.id = 'wildcard-toggle-btn';
            toggleBtn.className = 'wildcard-toggle-btn';
            // game-container에 추가
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(toggleBtn);
            }
        }

        toggleBtn.innerHTML = `🃏 와일드카드 <span class="badge">${player.wildcards.length}</span>`;
        toggleBtn.classList.remove('hidden');

        // 토글 이벤트 (새로 바인딩)
        toggleBtn.onclick = () => {
            const panel = document.getElementById('wildcard-panel');
            if (panel) {
                panel.classList.toggle('hidden');
            }
        };
    }

    // 와일드카드 상세 보기
    showWildcardDetail(card) {
        if (!card) return;

        const effectDescription = this.getWildcardEffectDescription(card.effect);
        const usagePhase = this.getWildcardUsagePhase(card.effect.type);

        showResultModal(`🃏 ${card.name}`, `
            <div class="wildcard-detail-modal">
                <div class="wildcard-card-display">
                    <div class="card-glow"></div>
                    <div class="card-face">
                        <div class="card-icon">🃏</div>
                        <div class="card-title">${card.name}</div>
                    </div>
                </div>

                <div class="wildcard-info">
                    <div class="info-section">
                        <h4>📝 카드 설명</h4>
                        <p class="card-description">${card.description}</p>
                    </div>

                    <div class="info-section">
                        <h4>✨ 효과</h4>
                        <p class="effect-description">${effectDescription}</p>
                    </div>

                    <div class="info-section">
                        <h4>⏰ 사용 가능 시점</h4>
                        <p class="usage-phase">${usagePhase}</p>
                    </div>
                </div>
            </div>
        `);
    }

    // 와일드카드 효과 설명
    getWildcardEffectDescription(effect) {
        switch (effect.type) {
            case 'land_discount':
                return `대지 구매 시 ${effect.value * 100}% 할인이 적용됩니다.`;
            case 'design_free':
                return '설계비가 무료가 됩니다.';
            case 'construction_discount':
                return `시공비가 ${effect.value * 100}% 할인됩니다.`;
            case 'risk_block':
                return '리스크 카드 1장을 자동으로 방어합니다.';
            case 'evaluation_boost':
                return `평가 시 가치가 ${effect.value * 100}% 증가합니다.`;
            case 'extra_dice':
                return '주사위를 한 번 더 굴릴 수 있습니다.';
            default:
                return effect.description || '특수 효과가 적용됩니다.';
        }
    }

    // 와일드카드 사용 가능 시점
    getWildcardUsagePhase(effectType) {
        switch (effectType) {
            case 'land_discount':
                return '🗺️ 대지 구매 단계';
            case 'design_free':
                return '📏 설계 단계';
            case 'construction_discount':
                return '🏗️ 시공 단계';
            case 'risk_block':
                return '🏗️ 시공 단계 (리스크 카드 공개 시 자동 적용)';
            case 'evaluation_boost':
                return '☑️ 평가 단계';
            case 'extra_dice':
            case 'bonus_dice':
                return '🗺️ 토지 구매 단계 (주사위 굴리기 시)';
            default:
                return '상황에 따라 다름';
        }
    }

    // 와일드카드 사용
    useWildcard(index) {
        const player = gameState.getCurrentPlayer();
        const card = player.wildcards[index];

        if (!card) return;

        let canUse = false;
        let message = '';

        switch (card.effect.type) {
            case 'land_discount':
                // 대지 구매 단계에서만 사용 가능
                if (gameState.phase === GAME_PHASES.LAND_PURCHASE) {
                    // 라운드당 1회만 사용 가능
                    if (player.landDiscountUsedRound === gameState.currentRound) {
                        message = '이번 라운드에 이미 대지 할인 와일드카드를 사용했습니다. (라운드당 1회)';
                    } else {
                        player.landDiscountActive = card.effect.value;
                        player.landDiscountUsedRound = gameState.currentRound;
                        canUse = true;
                        message = `이번 턴 토지 구매 시 ${card.effect.value * 100}% 할인이 적용됩니다!`;
                    }
                } else {
                    message = '대지 구매 단계에서만 사용할 수 있습니다.';
                }
                break;

            case 'design_free':
                // 설계 단계에서만 사용 가능
                if (gameState.phase === GAME_PHASES.DESIGN) {
                    player.designFreeActive = true;
                    canUse = true;
                    message = '다음 설계비가 무료가 됩니다!';
                } else {
                    message = '설계 단계에서만 사용할 수 있습니다.';
                }
                break;

            case 'risk_block':
                // 시공 단계에서만 사용 가능
                if (gameState.phase === GAME_PHASES.CONSTRUCTION) {
                    player.extraRiskBlock = (player.extraRiskBlock || 0) + 1;
                    canUse = true;
                    message = '리스크 방어력이 1 증가했습니다!';
                } else {
                    message = '시공 단계에서만 사용할 수 있습니다.';
                }
                break;

            case 'bonus_dice':
            case 'extra_dice':
                // 토지 구매 단계에서만 사용 가능
                if (gameState.phase === GAME_PHASES.LAND_PURCHASE) {
                    player.bonusDiceActive = true;
                    canUse = true;
                    message = '주사위 재굴림 기회가 생겼습니다!';
                } else {
                    message = '토지 구매 단계에서만 사용할 수 있습니다.';
                }
                break;

            case 'loan_rate_cut':
                // 즉시 적용
                player.interestRate *= (1 - card.effect.value);
                canUse = true;
                message = `이자율이 ${card.effect.value * 100}% 감소했습니다!`;
                break;
        }

        if (canUse) {
            // 카드 제거
            player.wildcards.splice(index, 1);
            showNotification(`🃏 ${card.name} 사용! ${message}`, 'success');
            gameState.addLog(`${player.name}: ${card.name} 사용`);
            this.updateWildcardPanel();
            // 플레이어 패널 즉시 업데이트 (카드 개수 반영) + 클릭 이벤트 재바인딩
            renderPlayerPanels();
            this.bindPlayerPanelClickEvents();
        } else {
            showNotification(message, 'warning');
        }
    }

    // 플레이어 패널 클릭 이벤트 바인딩 (이벤트 위임 방식)
    bindPlayerPanelClickEvents() {
        const container = document.getElementById('player-panels');
        if (!container) return;

        // 이미 이벤트 핸들러가 등록되어 있으면 스킵
        if (container._playerPanelEventsBound) return;
        container._playerPanelEventsBound = true;

        // 이벤트 위임: 컨테이너에서 클릭 이벤트 처리
        container.addEventListener('click', (e) => {
            // 와일드카드 슬롯 클릭
            const wildcardSlot = e.target.closest('.clickable-wildcard');
            if (wildcardSlot) {
                const playerIndex = parseInt(wildcardSlot.dataset.playerIndex);
                if (!isNaN(playerIndex)) {
                    this.showPlayerWildcardsModal(playerIndex);
                }
                return;
            }

            // 건물 슬롯 클릭
            const buildingSlot = e.target.closest('.clickable-building');
            if (buildingSlot) {
                const playerIndex = parseInt(buildingSlot.dataset.playerIndex);
                if (!isNaN(playerIndex)) {
                    this.showPlayerBuildingsModal(playerIndex);
                }
                return;
            }
        });
    }

    // 게임 불러오기
    loadGame() {
        const saveInfo = gameState.getSaveInfo();

        if (!saveInfo) {
            showNotification('저장된 게임이 없습니다.', 'error');
            return;
        }

        // 저장된 게임 정보 표시
        const phaseNames = {
            'land': '대지 구매',
            'architect': '설계 단계',
            'constructor': '시공 단계',
            'evaluation': '평가'
        };

        const self = this; // this 바인딩 보존
        const savedDate = saveInfo.savedAt ? new Date(saveInfo.savedAt).toLocaleString('ko-KR') : '알 수 없음';
        const confirmMsg = `저장된 게임을 불러올까요?\n\n` +
            `📅 저장 시간: ${savedDate}\n` +
            `🎮 라운드: ${saveInfo.round}/${saveInfo.maxRounds}\n` +
            `📍 단계: ${phaseNames[saveInfo.phase] || saveInfo.phase}\n` +
            `👥 플레이어: ${saveInfo.playerNames.join(', ')}`;

        showConfirmModal('게임 불러오기', confirmMsg, () => {
            if (gameState.load()) {
                document.getElementById('main-menu').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');
                self.updateUI();
                self.runPhase();
                showNotification('게임을 불러왔습니다! 🎮', 'success');
            } else {
                showNotification('게임 불러오기에 실패했습니다.', 'error');
            }
        });
    }

    // 단가표 보기
    showBudgetTable() {
        const buildingRows = Object.values(buildings).map(b => `
            <tr>
                <td class="building-cell">${b.emoji} ${b.name}</td>
                <td class="number-cell">${b.area}평</td>
                <td class="number-cell">${gameState.formatMoney(b.designFee)}</td>
                <td class="number-cell">${gameState.formatMoney(b.constructionCost)}</td>
                <td class="number-cell total">${gameState.formatMoney(b.designFee + b.constructionCost)}</td>
                <td class="number-cell">${b.constructionPeriod}개월</td>
            </tr>
        `).join('');

        const sizeLabels = {
            'large': '대형',
            'medium': '중견',
            'small': '영세',
            'atelier': '아뜰리에',
            'direct': '직영'
        };

        const constructorRows = constructors.map(c => `
            <tr>
                <td class="constructor-cell">${c.emoji} ${c.name}</td>
                <td class="type-cell">${sizeLabels[c.size] || c.size}</td>
                <td class="number-cell">${(c.costMultiplier * 100).toFixed(0)}%</td>
                <td class="number-cell">${c.paymentStages}단계</td>
                <td class="number-cell">${c.riskBlocks}개</td>
                <td class="desc-cell">${c.description}</td>
            </tr>
        `).join('');

        const traitLabels = {
            'artistry': '예술성',
            'efficiency': '효율성',
            'functionality': '기능성',
            'fame': '유명도'
        };

        const architectRows = architects.map(a => `
            <tr>
                <td class="architect-cell">${a.portrait} ${a.name}</td>
                <td class="type-cell">${traitLabels[a.trait] || a.trait}</td>
                <td class="number-cell">+${((a.traitBonus - 1) * 100).toFixed(0)}%</td>
                <td class="number-cell">${(a.feeMultiplier * 100).toFixed(0)}%</td>
                <td class="number-cell">${(a.constructionMultiplier * 100).toFixed(0)}%</td>
                <td class="desc-cell">${a.masterpieces.join(', ')}</td>
            </tr>
        `).join('');

        showResultModal('💰 건설 단가표', `
            <div class="budget-table-container">
                <div class="table-section">
                    <h3>🏗️ 건물별 비용</h3>
                    <table class="budget-table">
                        <thead>
                            <tr>
                                <th>건물</th>
                                <th>면적</th>
                                <th>설계비</th>
                                <th>시공비</th>
                                <th>총 비용</th>
                                <th>공사기간</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${buildingRows}
                        </tbody>
                    </table>
                </div>

                <div class="table-section">
                    <h3>🎨 건축가 정보</h3>
                    <table class="budget-table architect-table">
                        <thead>
                            <tr>
                                <th>건축가</th>
                                <th>특성</th>
                                <th>보너스</th>
                                <th>설계비</th>
                                <th>시공비</th>
                                <th>대표작</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${architectRows}
                        </tbody>
                    </table>
                </div>

                <div class="table-section">
                    <h3>🏗️ 시공사 정보</h3>
                    <table class="budget-table constructor-table">
                        <thead>
                            <tr>
                                <th>시공사</th>
                                <th>유형</th>
                                <th>시공비 배율</th>
                                <th>분할납부</th>
                                <th>리스크 방어</th>
                                <th>특징</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${constructorRows}
                        </tbody>
                    </table>
                </div>

                <div class="budget-notes">
                    <p>💡 <strong>참고사항:</strong></p>
                    <ul>
                        <li>설계비는 건축가의 설계비 배율에 따라 달라집니다</li>
                        <li>대표작이 아닌 건물은 설계비 30% 할인, 보너스 반감</li>
                        <li>시공비는 건축가의 시공비 배율과 시공사 배율이 적용됩니다</li>
                        <li>대형 시공사는 리스크 카드를 막을 수 있지만 비용이 높습니다</li>
                    </ul>
                </div>
            </div>
        `, null, true);
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
