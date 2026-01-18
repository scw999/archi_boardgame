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

        // 이벤트 로그
        this.log = [];
    }

    // 도시 지도 초기화 (5x5 그리드)
    initCityMap() {
        const map = [];
        const districts = ['강남구', '서초구', '마포구', '용산구', '성동구'];

        for (let y = 0; y < 5; y++) {
            map[y] = [];
            for (let x = 0; x < 5; x++) {
                map[y][x] = {
                    x, y,
                    district: districts[y],
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
        this.addLog(`${this.players[playerIndex].name}: 시작 자금 ${this.formatMoney(this.players[playerIndex].money)}`);
    }

    // 라운드 시작
    startRound() {
        // 덱 리필 (부족하면 새로 생성하여 추가)
        this.refillDecks();

        // 라운드별 대지 덱 사용 (라운드 2부터 프리미엄 대지 추가, 가격 상승)
        const roundLandDeck = createRoundLandDeck(this.currentRound);
        this.landDeck = [...this.landDeck, ...roundLandDeck].sort(() => Math.random() - 0.5);

        // 선점 초기화 (매 라운드마다 리셋)
        this.selectedArchitects = new Set();
        this.selectedConstructors = new Set();

        // 카드 8장씩 공개
        this.availableLands = this.drawCards(this.landDeck, 8);
        this.availableArchitects = this.drawCards(this.architectDeck, 8);
        this.availableConstructors = this.drawCards(this.constructorDeck, 8);

        this.phase = GAME_PHASES.LAND_PURCHASE;
        this.currentPlayerIndex = 0;

        // 각 플레이어 프로젝트 초기화
        this.players.forEach(player => {
            player.currentProject = createProject();
        });

        this.addLog(`===== 라운드 ${this.currentRound} 시작 =====`);
        if (this.currentRound >= 2) {
            this.addLog(`💎 프리미엄 대지가 추가되었습니다!`);
        }
    }

    // 덱 리필 (부족하면 새로 추가)
    refillDecks() {
        const minCards = 8; // 최소 필요 카드 수

        // 건축가 덱 리필
        if (this.architectDeck.length < minCards) {
            const newCards = createArchitectDeck();
            this.architectDeck = [...this.architectDeck, ...newCards];
            this.addLog('🎨 건축가 카드가 보충되었습니다.');
        }

        // 시공사 덱 리필
        if (this.constructorDeck.length < minCards) {
            const newCards = createConstructorDeck();
            this.constructorDeck = [...this.constructorDeck, ...newCards];
            this.addLog('🏗️ 시공사 카드가 보충되었습니다.');
        }

        // 리스크 덱 리필
        if (this.riskDeck.length < 20) {
            const newCards = createRiskDeck();
            this.riskDeck = [...this.riskDeck, ...newCards];
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
        // 모든 프로젝트를 완성된 건물로 이동
        this.players.forEach(player => {
            if (player.currentProject && player.currentProject.building) {
                player.buildings.push({ ...player.currentProject });
                player.money = player.currentProject.salePrice;
            }
            player.currentProject = null;
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
            // 최종 자금 + 건물 가치 합산
            player.totalScore = player.money;
            this.addLog(`${player.name} 최종 점수: ${this.formatMoney(player.totalScore)}`);
        });

        // 순위 결정
        const sorted = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        this.addLog(`🏆 우승: ${sorted[0].name}!`);
    }

    // 대출 관련
    getMaxLoan(player) {
        return Math.floor(player.money * player.maxLoanMultiplier);
    }

    takeLoan(playerIndex, amount) {
        const player = this.players[playerIndex];
        const maxLoan = this.getMaxLoan(player);

        if (player.loan + amount > maxLoan) {
            return false;
        }

        player.loan += amount;
        player.money += amount;
        this.addLog(`${player.name}: ${this.formatMoney(amount)} 대출 실행`);
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

    // PM 활동 (턴 패스하고 돈 벌기)
    doPMActivity(playerIndex) {
        const player = this.players[playerIndex];
        // PM 활동 수익: 기본 5천만원 + 보유 건물 수 x 2천만원
        const baseIncome = 50000000;
        const buildingBonus = player.buildings.length * 20000000;
        const totalIncome = baseIncome + buildingBonus;

        player.money += totalIncome;
        this.addLog(`${player.name}: PM 활동으로 ${this.formatMoney(totalIncome)} 수입`);

        return {
            success: true,
            income: totalIncome,
            message: `PM 활동 완료! ${this.formatMoney(totalIncome)} 수입`
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
        if (amount >= 100000000) {
            return `${(amount / 100000000).toFixed(1)}억`;
        } else if (amount >= 10000) {
            return `${(amount / 10000).toFixed(0)}만`;
        }
        return `${amount}원`;
    }

    // 게임 상태 저장
    save() {
        const saveData = {
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentRound: this.currentRound,
            phase: this.phase,
            settings: this.settings,
            log: this.log.slice(-50) // 최근 50개 로그만
        };
        localStorage.setItem('godmulju_save', JSON.stringify(saveData));
    }

    // 게임 상태 불러오기
    load() {
        const saveData = localStorage.getItem('godmulju_save');
        if (saveData) {
            const data = JSON.parse(saveData);
            Object.assign(this, data);
            // 덱은 다시 생성 (셔플 상태 유지 어려움)
            this.landDeck = createLandDeck();
            this.architectDeck = createArchitectDeck();
            this.constructorDeck = createConstructorDeck();
            this.riskDeck = createRiskDeck();
            return true;
        }
        return false;
    }
}

// 싱글톤 인스턴스
export const gameState = new GameState();
export { createProject };
