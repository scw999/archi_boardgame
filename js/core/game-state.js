// 게임 상태 관리
import { createLandDeck, createRoundLandDeck, lands, premiumLands } from '../data/lands.js';
import { createArchitectDeck, architects } from '../data/architects.js';
import { createConstructorDeck, constructors } from '../data/constructors.js';
import { createRiskDeck } from '../data/risks.js';

// 게임 페이즈
export const GAME_PHASES = {
    SETUP: 'setup',
    LAND_PURCHASE: 'land_purchase',
    DESIGN: 'design',
    CONSTRUCTION: 'construction',
    EVALUATION: 'evaluation',
    ROUND_END: 'round_end',
    GAME_END: 'game_end'
};

// 초기 자금 테이블 (주사위 합계에 따라) - 증가된 자금으로 게임 플레이 원활화
const STARTING_MONEY = {
    18: 2000000000,  // 20억 (주사위 합 18)
    17: 2000000000,
    16: 1500000000,  // 15억
    15: 1500000000,
    14: 1000000000,  // 10억
    13: 1000000000,
    12: 800000000,   // 8억
    11: 800000000,
    10: 700000000,   // 7억
    9: 700000000,
    8: 600000000,    // 6억
    7: 600000000,
    6: 500000000,    // 5억
    5: 500000000,
    4: 500000000,
    3: 500000000     // 최소 5억
};

// 플레이어 초기 상태
function createPlayer(id, name) {
    return {
        id,
        name,
        money: 0,
        loan: 0,
        interestRate: 0.1,        // 대출 이자율 10%
        maxLoanMultiplier: 2.33,  // 최대 대출 배율
        buildings: [],            // 완성된 건물들
        soldHistory: [],          // 매각 이력
        currentProject: null,     // 현재 진행중인 프로젝트
        wildcardUsed: false,      // 토지 와일드카드 사용 여부
        totalScore: 0
    };
}

// 진행중인 프로젝트 구조
function createProject() {
    return {
        land: null,
        landPrice: 0,
        priceType: null,          // 'market', 'urgent', 'auction'
        developmentCost: 0,       // 토지 개발 추가비용

        architect: null,
        designFee: 0,
        building: null,

        constructor: null,
        constructionCost: 0,
        constructionProgress: 0,   // 시공 진행률

        risks: [],                // 뽑은 리스크 카드들
        riskBlocksUsed: 0,        // 사용한 리스크 블록 수
        totalLoss: 0,             // 리스크로 인한 손실
        interestCost: 0,          // 총 이자비용

        evaluationFactor: 1.0,    // 최종 평가 팩터
        salePrice: 0              // 매각 금액
    };
}

// 게임 상태 클래스
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentRound = 1;
        this.maxRounds = 4;
        this.phase = GAME_PHASES.SETUP;

        // 선 플레이어 관리
        this.startingPlayerIndex = 0;  // 첫 라운드 선 플레이어 (주사위로 결정)
        this.roundStartingPlayer = 0;  // 현재 라운드 선 플레이어

        // 카드 덱들
        this.landDeck = [];
        this.architectDeck = [];
        this.constructorDeck = [];
        this.riskDeck = [];

        // 현재 라운드에 공개된 카드들
        this.availableLands = [];
        this.availableArchitects = [];
        this.availableConstructors = [];

        // 거래 진행중인 토지 (다른 플레이어가 실패한 경우)
        this.pendingLands = [];

        // 선점된 카드 추적 (라운드당)
        this.selectedArchitects = new Set();  // 이번 라운드에 선택된 건축가 ID
        this.selectedConstructors = new Set(); // 이번 라운드에 선택된 시공사 ID

        // 도시 지도 (인접 보너스용)
        this.cityMap = this.initCityMap();

        // 게임 설정
        this.settings = {
            easyStart: false,       // 같은 금액으로 시작
            startingMoney: 1000000000 // 쉬운 시작시 기본 금액 10억
        };

        // 와일드카드 풀 (평가 시 획득 가능)
        this.wildcardPool = [];

        // 프리미엄 대지 추가 여부
        this.premiumLandsAdded = false;

        // 이벤트 로그
        this.log = [];
    }

    // 도시 지도 초기화 (5x5 그리드)
    // 지방 → 경기 외곽 → 경기 주요 → 서울 → 서울 핵심 순서로 배치
    initCityMap() {
        const map = [];
        // 행별 지역 정보 (위에서 아래로: 시골 → 서울 핵심)
        const regionData = [
            { name: '지방/시골', tier: 1, emoji: '🌾', color: '#4a7c4e' },
            { name: '경기 외곽', tier: 2, emoji: '🏘️', color: '#6b8e6b' },
            { name: '경기 주요', tier: 3, emoji: '🏙️', color: '#7a9ec2' },
            { name: '서울', tier: 4, emoji: '🌆', color: '#9b7cb8' },
            { name: '서울 핵심', tier: 5, emoji: '✨', color: '#d4af37' }
        ];

        for (let y = 0; y < 5; y++) {
            map[y] = [];
            for (let x = 0; x < 5; x++) {
                map[y][x] = {
                    x, y,
                    district: regionData[y].name,
                    tier: regionData[y].tier,
                    emoji: regionData[y].emoji,
                    color: regionData[y].color,
                    owner: null,
                    project: null,
                    building: null,
                    adjacentBonus: 0
                };
            }
        }
        return map;
    }

    // 지도에 프로젝트 배치
    placeProjectOnMap(playerIndex, project) {
        // 빈 칸 중 랜덤 선택 또는 가장 유리한 위치 선택
        const emptySlots = [];
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                if (!this.cityMap[y][x].project) {
                    emptySlots.push({ x, y });
                }
            }
        }

        if (emptySlots.length === 0) return null;

        // 인접한 자기 건물 근처 우선 선택
        const player = this.players[playerIndex];
        let bestSlot = emptySlots[0];
        let bestAdjacency = 0;

        for (const slot of emptySlots) {
            const adjacency = this.calculateAdjacencyScore(slot.x, slot.y, playerIndex);
            if (adjacency > bestAdjacency) {
                bestAdjacency = adjacency;
                bestSlot = slot;
            }
        }

        // 배치
        this.cityMap[bestSlot.y][bestSlot.x] = {
            ...this.cityMap[bestSlot.y][bestSlot.x],
            owner: playerIndex,
            project: project,
            building: project.building
        };

        return bestSlot;
    }

    // 지도에서 프로젝트 제거 (매각 시)
    removeProjectFromMap(playerIndex) {
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const cell = this.cityMap[y][x];
                if (cell.owner === playerIndex && !cell.building) {
                    // 건물이 없는 프로젝트(토지만 있는 상태)만 제거
                    this.cityMap[y][x] = {
                        ...cell,
                        owner: null,
                        project: null
                    };
                    return { x, y };
                }
            }
        }
        return null;
    }

    // 인접 점수 계산
    calculateAdjacencyScore(x, y, playerIndex) {
        let score = 0;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 상하좌우

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
                const cell = this.cityMap[ny][nx];
                if (cell.owner === playerIndex) {
                    score += 0.1; // 같은 플레이어 인접 보너스 10%
                }
                if (cell.building) {
                    score += 0.05; // 아무 건물이나 인접하면 5%
                }
            }
        }
        return score;
    }

    // 인접 보너스 계산 (평가 시 사용)
    calculateAdjacencyBonus(playerIndex) {
        let totalBonus = 0;

        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const cell = this.cityMap[y][x];
                if (cell.owner === playerIndex && cell.building) {
                    totalBonus += this.calculateAdjacencyScore(x, y, playerIndex);
                }
            }
        }

        return totalBonus;
    }

    // 게임 초기화
    initGame(playerNames, easyStart = false) {
        this.reset();
        this.settings.easyStart = easyStart;

        // 플레이어 생성
        playerNames.forEach((name, index) => {
            this.players.push(createPlayer(index, name));
        });

        // 덱 생성
        this.landDeck = createLandDeck();
        this.architectDeck = createArchitectDeck();
        this.constructorDeck = createConstructorDeck();
        this.riskDeck = createRiskDeck();

        this.phase = GAME_PHASES.SETUP;
        this.addLog('게임이 시작되었습니다!');
    }

    // 시작 자금 설정 (주사위 결과)
    setStartingMoney(playerIndex, diceTotal) {
        if (this.settings.easyStart) {
            this.players[playerIndex].money = this.settings.startingMoney;
        } else {
            this.players[playerIndex].money = STARTING_MONEY[diceTotal] || 500000000;
        }
        // 시작 자금 주사위 결과 저장 (선 플레이어 결정용)
        this.players[playerIndex].startingDiceTotal = diceTotal;
        this.addLog(`${this.players[playerIndex].name}: 시작 자금 ${this.formatMoney(this.players[playerIndex].money)}`);
    }

    // 선 플레이어 결정 (주사위 합계가 가장 높은 플레이어)
    determineStartingPlayer() {
        if (this.players.length === 0) return;

        let highestTotal = -1;
        let startingIndex = 0;

        this.players.forEach((player, index) => {
            const total = player.startingDiceTotal || 0;
            if (total > highestTotal) {
                highestTotal = total;
                startingIndex = index;
            }
        });

        this.startingPlayerIndex = startingIndex;
        this.roundStartingPlayer = startingIndex;
        this.addLog(`🎲 선 플레이어: ${this.players[startingIndex].name} (주사위 합: ${highestTotal})`);
    }

    // 라운드 시작
    startRound() {
        // 덱 리필 (부족하면 새로 생성하여 추가) - 라운드 정보 전달
        this.refillDecks(this.currentRound);

        // 선점 초기화 (매 라운드마다 리셋)
        this.selectedArchitects = new Set();
        this.selectedConstructors = new Set();

        // 경매/급매 실패 기록 초기화 (새 라운드에서는 새 카드가 나오므로)
        this.pendingLands = [];

        // 카드 8장씩 공개
        this.availableLands = this.drawCards(this.landDeck, 8);
        this.availableArchitects = this.drawCards(this.architectDeck, 8);
        this.availableConstructors = this.drawCards(this.constructorDeck, 8);

        this.phase = GAME_PHASES.LAND_PURCHASE;

        // 선 플레이어 설정 (라운드마다 돌아가면서)
        if (this.currentRound === 1) {
            // 첫 라운드는 주사위로 결정된 선 플레이어
            this.currentPlayerIndex = this.startingPlayerIndex;
            this.roundStartingPlayer = this.startingPlayerIndex;
        } else {
            // 이후 라운드는 다음 플레이어가 선
            this.roundStartingPlayer = (this.roundStartingPlayer + 1) % this.players.length;
            this.currentPlayerIndex = this.roundStartingPlayer;
        }

        // 각 플레이어 프로젝트 초기화
        this.players.forEach(player => {
            player.currentProject = createProject();
        });

        const startingPlayerName = this.players[this.roundStartingPlayer]?.name || '플레이어';
        this.addLog(`===== 라운드 ${this.currentRound} 시작 (선: ${startingPlayerName}) =====`);
        if (this.currentRound >= 2 && !this.premiumLandsAdded) {
            this.addLog(`💎 프리미엄 대지가 추가되었습니다!`);
        }
    }

    // 덱 리필 (부족하면 새로 추가)
    refillDecks(currentRound = 1) {
        const minCards = 8; // 최소 필요 카드 수

        // 대지 덱 리필
        if (this.landDeck.length < minCards) {
            // 라운드 2부터는 프리미엄 대지 포함
            const newCards = createRoundLandDeck(currentRound);
            this.landDeck = [...this.landDeck, ...newCards].sort(() => Math.random() - 0.5);
            this.addLog('🗺️ 토지 카드가 보충되었습니다.');
            if (currentRound >= 2) {
                this.premiumLandsAdded = true;
            }
        }

        // 건축가 덱 리필 (중복 방지)
        if (this.architectDeck.length < minCards) {
            const existingIds = new Set(this.architectDeck.map(a => a.id));
            const newCards = createArchitectDeck().filter(a => !existingIds.has(a.id));
            this.architectDeck = [...this.architectDeck, ...newCards].sort(() => Math.random() - 0.5);
            this.addLog('🎨 건축가 카드가 보충되었습니다.');
        }

        // 시공사 덱 리필 (중복 방지)
        if (this.constructorDeck.length < minCards) {
            const existingIds = new Set(this.constructorDeck.map(c => c.id));
            const newCards = createConstructorDeck().filter(c => !existingIds.has(c.id));
            this.constructorDeck = [...this.constructorDeck, ...newCards].sort(() => Math.random() - 0.5);
            this.addLog('🏗️ 시공사 카드가 보충되었습니다.');
        }

        // 리스크 덱 리필
        if (this.riskDeck.length < 20) {
            const newCards = createRiskDeck();
            this.riskDeck = [...this.riskDeck, ...newCards].sort(() => Math.random() - 0.5);
        }
    }

    // 카드 드로우
    drawCards(deck, count) {
        const drawn = [];
        for (let i = 0; i < count && deck.length > 0; i++) {
            drawn.push(deck.pop());
        }
        return drawn;
    }

    // 건축가 선점 확인
    isArchitectAvailable(architectId) {
        return !this.selectedArchitects.has(architectId);
    }

    // 건축가 선점
    claimArchitect(architectId, playerIndex) {
        if (this.selectedArchitects.has(architectId)) {
            return { success: false, message: '이미 다른 플레이어가 선택한 건축가입니다.' };
        }
        this.selectedArchitects.add(architectId);
        return { success: true };
    }

    // 건축가 선점 해제
    releaseArchitect(architectId) {
        this.selectedArchitects.delete(architectId);
    }

    // 시공사 선점 확인
    isConstructorAvailable(constructorId) {
        return !this.selectedConstructors.has(constructorId);
    }

    // 시공사 선점
    claimConstructor(constructorId, playerIndex) {
        if (this.selectedConstructors.has(constructorId)) {
            return { success: false, message: '이미 다른 플레이어가 선택한 시공사입니다.' };
        }
        this.selectedConstructors.add(constructorId);
        return { success: true };
    }

    // 선점 가능한 건축가 목록 반환
    getAvailableArchitects() {
        return this.availableArchitects.filter(a => !this.selectedArchitects.has(a.id));
    }

    // 선점 가능한 시공사 목록 반환
    getAvailableConstructors() {
        return this.availableConstructors.filter(c => !this.selectedConstructors.has(c.id));
    }

    // 현재 플레이어 가져오기
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // 다음 플레이어로
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        return this.getCurrentPlayer();
    }

    // 모든 플레이어가 현재 페이즈를 완료했는지 확인
    allPlayersCompletedPhase(checkField) {
        return this.players.every(player =>
            player.currentProject && player.currentProject[checkField] !== null
        );
    }

    // 다음 페이즈로
    nextPhase() {
        const phaseOrder = [
            GAME_PHASES.LAND_PURCHASE,
            GAME_PHASES.DESIGN,
            GAME_PHASES.CONSTRUCTION,
            GAME_PHASES.EVALUATION,
            GAME_PHASES.ROUND_END
        ];

        const currentIndex = phaseOrder.indexOf(this.phase);
        if (currentIndex < phaseOrder.length - 1) {
            this.phase = phaseOrder[currentIndex + 1];
            this.currentPlayerIndex = 0;
        }

        return this.phase;
    }

    // 라운드 종료
    endRound() {
        // 모든 프로젝트를 완성된 건물로 이동 (자산으로 보유)
        this.players.forEach((player, playerIndex) => {
            if (player.currentProject && player.currentProject.building) {
                // 건물을 자산으로 추가 (현금은 지급하지 않음 - 매각해야 현금 획득)
                player.buildings.push({ ...player.currentProject });
                // 대출은 상환하지 않고 유지 (건물 자산이 담보가 됨)
                this.addLog(`🏢 ${player.name}: ${player.currentProject.building.name} 완공! (자산가치: ${this.formatMoney(player.currentProject.salePrice)})`);

                // 개발지도에서 해당 프로젝트 셀을 완성 상태로 업데이트
                // (project를 null로 설정하여 다음 라운드에 새 셀을 사용할 수 있게 함)
                for (let y = 0; y < 5; y++) {
                    for (let x = 0; x < 5; x++) {
                        const cell = this.cityMap[y][x];
                        if (cell.owner === playerIndex && cell.project === player.currentProject) {
                            // 건물은 유지하고 project만 null로 (완성 상태)
                            this.cityMap[y][x].project = null;
                        }
                    }
                }
            } else if (player.currentProject && player.currentProject.land && !player.currentProject.building) {
                // 건물 없이 토지만 있는 경우 - 개발지도에서 제거
                for (let y = 0; y < 5; y++) {
                    for (let x = 0; x < 5; x++) {
                        const cell = this.cityMap[y][x];
                        if (cell.owner === playerIndex && cell.project === player.currentProject) {
                            this.cityMap[y][x].owner = null;
                            this.cityMap[y][x].project = null;
                            this.cityMap[y][x].building = null;
                        }
                    }
                }
            }
            player.currentProject = null;
            // wildcardUsed는 게임 전체에서 1회만 사용 가능하므로 리셋하지 않음
        });

        this.currentRound++;

        if (this.currentRound > this.maxRounds) {
            this.phase = GAME_PHASES.GAME_END;
            this.calculateFinalScores();
            return false;
        }

        return true;
    }

    // 최종 점수 계산
    calculateFinalScores() {
        this.players.forEach(player => {
            // 건물 가치 계산
            const buildingValue = this.getTotalBuildingValue(player);
            // 최종 자금 + 건물 가치 - 대출 = 순자산
            player.totalScore = player.money + buildingValue - player.loan;
            this.addLog(`${player.name} 최종 점수:`);
            this.addLog(`  💵 현금: ${this.formatMoney(player.money)}`);
            this.addLog(`  🏢 건물 가치: ${this.formatMoney(buildingValue)}`);
            this.addLog(`  🏦 대출: -${this.formatMoney(player.loan)}`);
            this.addLog(`  📊 순자산: ${this.formatMoney(player.totalScore)}`);
        });

        // 순위 결정
        const sorted = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        this.addLog(`🏆 우승: ${sorted[0].name}!`);
    }

    // 대출 관련
    getMaxLoan(player) {
        // 현금 기준 대출 한도
        const cashBasedLimit = Math.floor(player.money * player.maxLoanMultiplier);

        // 건물 가치 기준 대출 한도 (건물 가치의 80%까지 추가 대출 가능)
        const buildingValue = this.getTotalBuildingValue(player);
        const buildingBasedLimit = Math.floor(buildingValue * 0.8);

        return cashBasedLimit + buildingBasedLimit;
    }

    // 플레이어의 총 건물 자산 가치 계산
    getTotalBuildingValue(player) {
        if (!player.buildings || player.buildings.length === 0) return 0;
        return player.buildings.reduce((total, building) => {
            return total + (building.salePrice || 0);
        }, 0);
    }

    takeLoan(playerIndex, amount, loanType = 'construction') {
        const player = this.players[playerIndex];
        const maxLoan = this.getMaxLoan(player);

        // 라운드당 1회 제한 체크
        if (loanType === 'construction' && player.constructionLoanUsedRound === this.currentRound) {
            return { success: false, message: '이번 라운드에 이미 건설자금대출을 받았습니다.' };
        }
        if (loanType === 'landMortgage' && player.landMortgageUsedRound === this.currentRound) {
            return { success: false, message: '이번 라운드에 이미 토지담보대출을 받았습니다.' };
        }

        if (player.loan + amount > maxLoan) {
            return { success: false, message: '대출 한도를 초과했습니다.' };
        }

        player.loan += amount;
        player.money += amount;

        // 대출 사용 기록
        if (loanType === 'construction') {
            player.constructionLoanUsedRound = this.currentRound;
        } else if (loanType === 'landMortgage') {
            player.landMortgageUsedRound = this.currentRound;
        }

        const loanTypeName = loanType === 'landMortgage' ? '토지담보대출' : '건설자금대출';
        this.addLog(`${player.name}: ${loanTypeName} ${this.formatMoney(amount)} 실행`);
        return { success: true, message: `${this.formatMoney(amount)} 대출이 실행되었습니다.` };
    }

    // 대출 가능 여부 체크
    canTakeLoan(playerIndex, loanType = 'construction') {
        const player = this.players[playerIndex];
        if (loanType === 'construction') {
            return player.constructionLoanUsedRound !== this.currentRound;
        }
        if (loanType === 'landMortgage') {
            return player.landMortgageUsedRound !== this.currentRound;
        }
        return true;
    }

    // 이자 계산 (월 단위)
    calculateInterest(player, months = 1) {
        return Math.floor(player.loan * player.interestRate * months);
    }

    // 돈 지불
    payMoney(playerIndex, amount) {
        const player = this.players[playerIndex];
        if (player.money >= amount) {
            player.money -= amount;
            return true;
        }
        return false;
    }

    // PM 활동 (라운드 스킵하고 2억 벌기)
    doPMActivity(playerIndex) {
        const player = this.players[playerIndex];
        // PM 활동 수익: 고정 2억
        const totalIncome = 200000000;

        player.money += totalIncome;
        // 라운드 스킵 플래그 설정
        player.pmSkippedRound = this.currentRound;

        this.addLog(`${player.name}: PM 컨설팅으로 ${this.formatMoney(totalIncome)} 수입 (이번 라운드 스킵)`);

        return {
            success: true,
            income: totalIncome,
            skippedRound: true,
            message: `PM 컨설팅 완료! ${this.formatMoney(totalIncome)} 수입 (이번 라운드 스킵)`
        };
    }

    // 대지 중간 매각 (현재 프로젝트의 대지 판매 - 설계 전에만 가능)
    sellCurrentLand(playerIndex) {
        const player = this.players[playerIndex];
        const project = player.currentProject;

        if (!project || !project.land) {
            return { success: false, message: '판매할 대지가 없습니다.' };
        }

        if (project.building) {
            return { success: false, message: '설계가 시작된 후에는 대지만 판매할 수 없습니다.' };
        }

        // 판매 가격: 구매가의 110% (토지 가치 상승)
        const purchasePrice = project.landPrice + project.developmentCost;
        const sellPrice = Math.floor(purchasePrice * 1.1);
        const profit = sellPrice - purchasePrice;
        player.money += sellPrice;

        // 매각 이력에 추가
        player.soldHistory.push({
            type: 'land',
            land: project.land,
            sellPrice,
            profit,
            soldAt: this.round
        });

        // 개발 지도에서 제거
        this.removeProjectFromMap(playerIndex);

        // 프로젝트 초기화
        const landName = project.land.name;
        project.land = null;
        project.landPrice = 0;
        project.developmentCost = 0;

        this.addLog(`${player.name}: ${landName} 대지 매각 (${this.formatMoney(sellPrice)}, 수익 +${this.formatMoney(profit)})`);

        return {
            success: true,
            sellPrice,
            profit,
            message: `${landName} 대지를 ${this.formatMoney(sellPrice)}에 매각했습니다. (수익: +${this.formatMoney(profit)})`
        };
    }

    // 설계 완료된 프로젝트 매각 (시공 단계에서 설계비 포함 매각)
    sellDesignedProject(playerIndex) {
        const player = this.players[playerIndex];
        const project = player.currentProject;

        if (!project || !project.land) {
            return { success: false, message: '판매할 프로젝트가 없습니다.' };
        }

        if (!project.building) {
            return { success: false, message: '설계가 완료되지 않은 프로젝트입니다. 대지 매각을 이용하세요.' };
        }

        // 시공 중인 프로젝트도 매각 가능 (시공사가 선택되어 있어도 매각 허용)
        const hasConstructor = !!project.constructor;

        // 판매 가격 계산: 토지 + 개발비 + 설계비 + (시공비가 있으면 시공비도 포함)
        const landCost = project.landPrice + project.developmentCost;
        const designCost = project.designFee;
        const constructionCost = hasConstructor ? (project.constructionCost || 0) : 0;
        const totalInvestment = landCost + designCost + constructionCost;

        // 시공 중인 경우 80% 회수, 설계만 완료된 경우 90% 회수
        const recoveryRate = hasConstructor ? 0.8 : 0.9;
        const sellPrice = Math.floor(totalInvestment * recoveryRate);
        const loss = totalInvestment - sellPrice;

        player.money += sellPrice;

        // 매각 이력에 추가
        player.soldHistory.push({
            type: hasConstructor ? 'construction_project' : 'designed_project',
            land: project.land,
            building: project.building,
            architect: project.architect,
            constructor: project.constructor,
            constructionCost: constructionCost,
            sellPrice,
            loss,
            soldAt: this.currentRound
        });

        // 개발 지도에서 제거
        this.removeProjectFromMap(playerIndex);

        // 건축가 선점 해제
        if (project.architect) {
            this.releaseArchitect(project.architect.id);
        }

        // 시공사 선점 해제
        if (project.constructor) {
            this.selectedConstructors.delete(project.constructor.id);
        }

        const projectName = `${project.land.name}/${project.building.name}`;
        const phaseText = hasConstructor ? '시공 중 프로젝트' : '설계 프로젝트';

        // 프로젝트 초기화
        project.land = null;
        project.landPrice = 0;
        project.developmentCost = 0;
        project.architect = null;
        project.designFee = 0;
        project.building = null;
        project.constructor = null;
        project.constructionCost = 0;
        project.constructionProgress = 0;
        project.risks = [];
        project.totalLoss = 0;

        // 평가 단계까지 스킵 플래그 설정
        player.designSoldRound = this.currentRound;

        this.addLog(`${player.name}: ${projectName} ${phaseText} 매각 (${this.formatMoney(sellPrice)}, 손실 -${this.formatMoney(loss)})`);

        return {
            success: true,
            sellPrice,
            loss,
            hasConstructor,
            message: `${projectName} 프로젝트를 ${this.formatMoney(sellPrice)}에 매각했습니다. (손실: -${this.formatMoney(loss)}, 평가까지 휴식)`
        };
    }

    // 완성된 건물 매각 (평가 반영, 시장 상황에 따라 변동)
    sellBuilding(playerIndex, buildingIndex) {
        const player = this.players[playerIndex];

        if (buildingIndex < 0 || buildingIndex >= player.buildings.length) {
            return { success: false, message: '판매할 건물이 없습니다.' };
        }

        const building = player.buildings[buildingIndex];

        // 기본 가치: 총 투자 비용 (토지 + 설계 + 시공)
        const totalInvestment = building.landPrice + building.designFee + building.constructionCost;

        // 평가 팩터 적용 (평가가 완료된 경우 evaluationFactor 사용)
        const evalFactor = building.evaluationFactor || 1.0;

        // 시장 상황 변동 (85% ~ 115% 랜덤)
        const marketFactor = 0.85 + Math.random() * 0.3;

        // 건축가 명성 보너스 (있는 경우)
        const architectBonus = building.architect ? (building.architect.fame || 0) * 0.02 : 0;

        // 최종 판매가 = 투자비용 * 평가팩터 * 시장변동 * (1 + 건축가보너스)
        const finalMultiplier = evalFactor * marketFactor * (1 + architectBonus);
        const sellPrice = Math.floor(totalInvestment * finalMultiplier);

        // 손익 계산
        const originalSalePrice = building.salePrice || totalInvestment;
        const profitLoss = sellPrice - originalSalePrice;
        const profitLossText = profitLoss >= 0
            ? `+${this.formatMoney(profitLoss)}`
            : `-${this.formatMoney(Math.abs(profitLoss))}`;

        player.money += sellPrice;

        const buildingName = `${building.building.name} @ ${building.land.name}`;

        // 매각 이력에 추가
        player.soldHistory.push({
            type: 'building',
            building: building.building,
            land: building.land,
            architect: building.architect,
            sellPrice,
            profitLoss,
            marketFactor,
            soldAt: this.round,
            originalProject: { ...building }
        });

        player.buildings.splice(buildingIndex, 1);

        const marketStatus = marketFactor >= 1.0 ? '호황' : '불황';
        this.addLog(`${player.name}: ${buildingName} 건물 매각 (${this.formatMoney(sellPrice)}, 시장: ${marketStatus}, ${profitLossText})`);

        return {
            success: true,
            sellPrice,
            profitLoss,
            marketFactor,
            evalFactor,
            message: `${buildingName}을 ${this.formatMoney(sellPrice)}에 매각했습니다. (시장: ${marketStatus}, 손익: ${profitLossText})`
        };
    }

    // 대출 상환
    repayLoan(playerIndex, amount) {
        const player = this.players[playerIndex];

        if (amount > player.money) {
            return { success: false, message: '상환할 자금이 부족합니다.' };
        }

        if (amount > player.loan) {
            amount = player.loan;
        }

        player.money -= amount;
        player.loan -= amount;

        this.addLog(`${player.name}: 대출 ${this.formatMoney(amount)} 상환`);

        return {
            success: true,
            amount,
            remainingLoan: player.loan,
            message: `${this.formatMoney(amount)} 상환 완료 (남은 대출: ${this.formatMoney(player.loan)})`
        };
    }

    // 로그 추가
    addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.log.push({ timestamp, message });
        console.log(`[${timestamp}] ${message}`);
    }

    // 금액 포맷
    formatMoney(amount) {
        // 음수 처리
        const isNegative = amount < 0;
        const absAmount = Math.abs(amount);
        const prefix = isNegative ? '-' : '';

        if (absAmount >= 100000000) {
            return `${prefix}${(absAmount / 100000000).toFixed(1)}억`;
        } else if (absAmount >= 10000) {
            return `${prefix}${(absAmount / 10000).toFixed(0)}만`;
        }
        return `${prefix}${absAmount}원`;
    }

    // 게임 상태 저장
    save() {
        const saveData = {
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentRound: this.currentRound,
            maxRounds: this.maxRounds,
            phase: this.phase,
            settings: this.settings,
            usedArchitects: this.usedArchitects,
            usedConstructors: this.usedConstructors,
            // 덱 상태
            landDeck: this.landDeck,
            architectDeck: this.architectDeck,
            constructorDeck: this.constructorDeck,
            riskDeck: this.riskDeck,
            // 현재 공개된 카드들
            availableLands: this.availableLands,
            availableArchitects: this.availableArchitects,
            availableConstructors: this.availableConstructors,
            // 실패한 경매/급매 기록
            pendingLands: this.pendingLands,
            // 선점 상태 (Set을 배열로 변환)
            selectedArchitects: Array.from(this.selectedArchitects || []),
            selectedConstructors: Array.from(this.selectedConstructors || []),
            // 라운드 관련
            startingPlayerIndex: this.startingPlayerIndex,
            roundStartingPlayer: this.roundStartingPlayer,
            premiumLandsAdded: this.premiumLandsAdded,
            // 로그
            log: this.log.slice(-50),
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('godmulju_save', JSON.stringify(saveData));
    }

    // 게임 상태 불러오기
    load() {
        const saveData = localStorage.getItem('godmulju_save');
        if (saveData) {
            const data = JSON.parse(saveData);

            // 기본 상태 복원
            this.players = data.players || [];
            this.currentPlayerIndex = data.currentPlayerIndex || 0;
            this.currentRound = data.currentRound || 1;
            this.maxRounds = data.maxRounds || 4;
            this.phase = data.phase || 'land';
            this.settings = data.settings || {};
            this.usedArchitects = data.usedArchitects || [];
            this.usedConstructors = data.usedConstructors || [];
            this.log = data.log || [];

            // 덱 복원
            this.landDeck = data.landDeck || createLandDeck();
            this.architectDeck = data.architectDeck || createArchitectDeck();
            this.constructorDeck = data.constructorDeck || createConstructorDeck();
            this.riskDeck = data.riskDeck || createRiskDeck();

            // 현재 공개된 카드들 복원
            this.availableLands = data.availableLands || [];
            this.availableArchitects = data.availableArchitects || [];
            this.availableConstructors = data.availableConstructors || [];

            // 실패한 경매/급매 기록 복원
            this.pendingLands = data.pendingLands || [];

            // 선점 상태 복원 (배열을 Set으로 변환)
            this.selectedArchitects = new Set(data.selectedArchitects || []);
            this.selectedConstructors = new Set(data.selectedConstructors || []);

            // 라운드 관련 복원
            this.startingPlayerIndex = data.startingPlayerIndex || 0;
            this.roundStartingPlayer = data.roundStartingPlayer || 0;
            this.premiumLandsAdded = data.premiumLandsAdded || false;

            return true;
        }
        return false;
    }

    // 저장된 게임 확인
    hasSavedGame() {
        return localStorage.getItem('godmulju_save') !== null;
    }

    // 저장된 게임 정보 가져오기
    getSaveInfo() {
        const saveData = localStorage.getItem('godmulju_save');
        if (saveData) {
            const data = JSON.parse(saveData);
            return {
                savedAt: data.savedAt,
                round: data.currentRound,
                maxRounds: data.maxRounds,
                phase: data.phase,
                playerCount: data.players?.length || 0,
                playerNames: data.players?.map(p => p.name) || []
            };
        }
        return null;
    }

    // 저장된 게임 삭제
    deleteSave() {
        localStorage.removeItem('godmulju_save');
    }
}

// 싱글톤 인스턴스
export const gameState = new GameState();
export { createProject };
