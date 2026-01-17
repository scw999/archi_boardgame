// 게임 상태 관리
import { createLandDeck } from '../data/lands.js';
import { createArchitectDeck } from '../data/architects.js';
import { createConstructorDeck } from '../data/constructors.js';
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

// 초기 자금 테이블 (주사위 합계에 따라)
const STARTING_MONEY = {
    18: 1000000000,  // 10억 (주사위 합 18)
    17: 1000000000,
    16: 500000000,   // 5억
    15: 500000000,
    14: 300000000,   // 3억
    13: 300000000,
    12: 300000000,
    11: 200000000,   // 2억
    10: 200000000,
    9: 200000000,
    8: 200000000,
    7: 200000000,
    6: 200000000,
    5: 200000000,
    4: 200000000,
    3: 200000000     // 최소 2억
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

        // 게임 설정
        this.settings = {
            easyStart: false,       // 같은 금액으로 시작
            startingMoney: 300000000 // 쉬운 시작시 기본 금액 3억
        };

        // 이벤트 로그
        this.log = [];
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
            this.players[playerIndex].money = STARTING_MONEY[diceTotal] || 200000000;
        }
        this.addLog(`${this.players[playerIndex].name}: 시작 자금 ${this.formatMoney(this.players[playerIndex].money)}`);
    }

    // 라운드 시작
    startRound() {
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
    }

    // 카드 드로우
    drawCards(deck, count) {
        const drawn = [];
        for (let i = 0; i < count && deck.length > 0; i++) {
            drawn.push(deck.pop());
        }
        return drawn;
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
