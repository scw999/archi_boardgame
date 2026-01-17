// 시공사 카드 데이터
export const CONSTRUCTOR_SIZE = {
    LARGE: 'large',           // 대형
    MEDIUM: 'medium',         // 중소
    SMALL: 'small',           // 영세
    ATELIER: 'atelier',       // 아뜰리에
    DIRECT: 'direct'          // 직영공사
};

export const constructors = [
    // 대형 시공사 (3장)
    {
        id: 'constructor_large_1',
        name: '대한건설',
        size: CONSTRUCTOR_SIZE.LARGE,
        emoji: '🏗️',
        costMultiplier: 1.15,        // 시공비 1.15배
        riskBlocks: 3,               // 리스크 카드 3장까지 막음
        paymentStages: 4,            // 4단계 나눠 지출
        artistryBonus: 1.0,          // 예술성 보너스 없음
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '호텔', '대형카페', '상가', '복합몰', '펜션'],
        description: '국내 Top 5 건설사, 안정적인 시공'
    },
    {
        id: 'constructor_large_2',
        name: '삼성물산',
        size: CONSTRUCTOR_SIZE.LARGE,
        emoji: '🏢',
        costMultiplier: 1.2,
        riskBlocks: 3,
        paymentStages: 4,
        artistryBonus: 1.0,
        canBuild: ['상가주택', '호텔', '대형카페', '상가', '복합몰'],
        description: '프리미엄 대형 건물 전문'
    },
    {
        id: 'constructor_large_3',
        name: '현대건설',
        size: CONSTRUCTOR_SIZE.LARGE,
        emoji: '🌆',
        costMultiplier: 1.15,
        riskBlocks: 3,
        paymentStages: 4,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '호텔', '대형카페', '상가', '복합몰', '펜션'],
        description: '믿을 수 있는 대형 건설사'
    },

    // 중소 시공사 (4장)
    {
        id: 'constructor_medium_1',
        name: '중앙건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🔨',
        costMultiplier: 1.0,
        riskBlocks: 1,
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '펜션'],
        description: '중형 건물까지 안정적 시공'
    },
    {
        id: 'constructor_medium_2',
        name: '신뢰건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🛠️',
        costMultiplier: 1.0,
        riskBlocks: 1,
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '상가', '펜션'],
        description: '상가 건물 시공 경험 풍부'
    },
    {
        id: 'constructor_medium_3',
        name: '성실건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '⚒️',
        costMultiplier: 0.95,
        riskBlocks: 1,
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '풀빌라', '펜션'],
        description: '주거시설 전문 중견 건설사'
    },
    {
        id: 'constructor_medium_4',
        name: '미래건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🏠',
        costMultiplier: 1.05,
        riskBlocks: 2,  // 중소지만 리스크 2장 막음
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '대형카페', '펜션'],
        description: '성장하는 중견 건설사'
    },

    // 영세 시공사 (3장)
    {
        id: 'constructor_small_1',
        name: '동네건설',
        size: CONSTRUCTOR_SIZE.SMALL,
        emoji: '🔧',
        costMultiplier: 0.8,
        riskBlocks: 0,              // 리스크 못 막음
        paymentStages: 2,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '펜션'],
        description: '저렴하지만 리스크 있는 선택'
    },
    {
        id: 'constructor_small_2',
        name: '알뜰건설',
        size: CONSTRUCTOR_SIZE.SMALL,
        emoji: '💰',
        costMultiplier: 0.75,
        riskBlocks: 0,
        paymentStages: 2,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '펜션'],
        description: '최저가 시공, 하지만 불안'
    },
    {
        id: 'constructor_small_3',
        name: '희망건설',
        size: CONSTRUCTOR_SIZE.SMALL,
        emoji: '🌱',
        costMultiplier: 0.8,
        riskBlocks: 0,
        paymentStages: 2,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '카페', '풀빌라', '펜션'],
        description: '열정은 가득, 경험은 부족'
    },

    // 아뜰리에 시공사 (2장)
    {
        id: 'constructor_atelier_1',
        name: '아트빌드',
        size: CONSTRUCTOR_SIZE.ATELIER,
        emoji: '🎨',
        costMultiplier: 1.1,
        riskBlocks: 0,
        paymentStages: 3,
        artistryBonus: 1.3,         // 완공시 예술성 1.3 팩터
        canBuild: ['단독주택', '카페', '풀빌라', '펜션'],
        description: '예술적 감각의 장인 시공'
    },
    {
        id: 'constructor_atelier_2',
        name: '디자인공방',
        size: CONSTRUCTOR_SIZE.ATELIER,
        emoji: '✨',
        costMultiplier: 1.15,
        riskBlocks: 0,
        paymentStages: 3,
        artistryBonus: 1.4,
        canBuild: ['카페', '풀빌라', '대형카페'],
        description: 'SNS 핫플 전문, 예술성 최고'
    },

    // 직영공사 (2장)
    {
        id: 'constructor_direct_1',
        name: '직영공사 (소형)',
        size: CONSTRUCTOR_SIZE.DIRECT,
        emoji: '🏡',
        costMultiplier: 0.8,
        riskBlocks: 0,
        paymentStages: 6,           // 6단계 나눠 지출 (느림)
        artistryBonus: 1.0,
        canBuild: ['단독주택', '펜션'],
        description: '직접 관리하여 비용 절감, 시간 오래 걸림'
    },
    {
        id: 'constructor_direct_2',
        name: '직영공사 (중형)',
        size: CONSTRUCTOR_SIZE.DIRECT,
        emoji: '🏘️',
        costMultiplier: 0.85,
        riskBlocks: 0,
        paymentStages: 6,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '펜션'],
        description: '중형 건물까지 직접 관리 가능'
    }
];

// 시공비 계산
export function calculateConstructionCost(constructor, building, architect) {
    const baseCost = building.constructionCost;
    const architectMultiplier = architect.constructionMultiplier;
    const constructorMultiplier = constructor.costMultiplier;

    return Math.round(baseCost * architectMultiplier * constructorMultiplier);
}

// 시공사가 해당 건물을 지을 수 있는지 확인
export function canConstructorBuild(constructor, buildingName) {
    return constructor.canBuild.includes(buildingName);
}

// 리스크 블록 가능 여부
export function canBlockRisk(constructor, riskCount) {
    return riskCount <= constructor.riskBlocks;
}

// 카드 덱 생성
export function createConstructorDeck() {
    return [...constructors].sort(() => Math.random() - 0.5);
}

// 시공 단계별 지출 금액 계산
export function calculatePaymentSchedule(constructor, totalCost) {
    const stages = constructor.paymentStages;
    const perStage = Math.round(totalCost / stages);

    return Array(stages).fill(perStage);
}
