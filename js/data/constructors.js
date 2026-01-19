// 시공사 카드 데이터
export const CONSTRUCTOR_SIZE = {
    LARGE: 'large',           // 대형
    MEDIUM: 'medium',         // 중소
    SMALL: 'small',           // 영세
    ATELIER: 'atelier',       // 아뜰리에
    DIRECT: 'direct'          // 직영공사
};

export const constructors = [
    // 대형 시공사 (5장)
    {
        id: 'constructor_large_1',
        name: '대한건설',
        size: CONSTRUCTOR_SIZE.LARGE,
        emoji: '🏗️',
        costMultiplier: 1.15,
        riskBlocks: 3,
        paymentStages: 4,
        artistryBonus: 1.0,
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
    {
        id: 'constructor_large_4',
        name: '포스코이앤씨',
        size: CONSTRUCTOR_SIZE.LARGE,
        emoji: '🏛️',
        costMultiplier: 1.18,
        riskBlocks: 3,
        paymentStages: 4,
        artistryBonus: 1.0,
        canBuild: ['상가주택', '호텔', '대형카페', '상가', '복합몰', '단독주택'],
        description: '철강 기반 대형 건설사, 견고한 시공'
    },
    {
        id: 'constructor_large_5',
        name: 'GS건설',
        size: CONSTRUCTOR_SIZE.LARGE,
        emoji: '🌟',
        costMultiplier: 1.12,
        riskBlocks: 3,
        paymentStages: 4,
        artistryBonus: 1.05,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '호텔', '대형카페', '상가', '복합몰', '펜션'],
        description: '자이 브랜드의 프리미엄 시공'
    },

    // 중소 시공사 (7장)
    {
        id: 'constructor_medium_1',
        name: '중앙건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🔨',
        costMultiplier: 1.0,
        riskBlocks: 1,
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '펜션', '상가', '대형카페'],
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
        canBuild: ['단독주택', '상가주택', '카페', '상가', '펜션', '복합몰'],
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
        canBuild: ['단독주택', '상가주택', '풀빌라', '펜션', '호텔'],
        description: '주거시설 전문 중견 건설사'
    },
    {
        id: 'constructor_medium_4',
        name: '미래건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🏠',
        costMultiplier: 1.05,
        riskBlocks: 2,
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '대형카페', '펜션', '호텔', '상가'],
        description: '성장하는 중견 건설사'
    },
    {
        id: 'constructor_medium_5',
        name: '아키리얼 종합건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🏆',
        costMultiplier: 1.08,
        riskBlocks: 2,
        paymentStages: 3,
        artistryBonus: 1.15,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '대형카페', '펜션', '호텔', '복합몰'],
        description: '건축 전문 설계시공사, 디자인과 품질의 완벽 조화'
    },
    {
        id: 'constructor_medium_6',
        name: '한양종합건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🏘️',
        costMultiplier: 0.98,
        riskBlocks: 1,
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '펜션', '상가', '대형카페'],
        description: '40년 전통의 중견 건설사'
    },
    {
        id: 'constructor_medium_7',
        name: '태영건설',
        size: CONSTRUCTOR_SIZE.MEDIUM,
        emoji: '🌄',
        costMultiplier: 1.02,
        riskBlocks: 2,
        paymentStages: 3,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '풀빌라', '상가', '펜션', '복합몰', '호텔'],
        description: '데시앙 브랜드, 품질과 가격의 균형'
    },

    // 영세 시공사 (5장)
    {
        id: 'constructor_small_1',
        name: '동네건설',
        size: CONSTRUCTOR_SIZE.SMALL,
        emoji: '🔧',
        costMultiplier: 0.8,
        riskBlocks: 0,
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
    {
        id: 'constructor_small_4',
        name: '청년건설',
        size: CONSTRUCTOR_SIZE.SMALL,
        emoji: '💪',
        costMultiplier: 0.82,
        riskBlocks: 0,
        paymentStages: 2,
        artistryBonus: 1.05,
        canBuild: ['단독주택', '카페', '펜션'],
        description: '젊은 건축가들의 도전'
    },
    {
        id: 'constructor_small_5',
        name: '새벽건설',
        size: CONSTRUCTOR_SIZE.SMALL,
        emoji: '🌅',
        costMultiplier: 0.78,
        riskBlocks: 0,
        paymentStages: 2,
        artistryBonus: 1.0,
        canBuild: ['단독주택', '상가주택', '카페', '펜션'],
        description: '새벽같이 일하는 열정 시공사'
    },

    // 아뜰리에 시공사 (4장)
    {
        id: 'constructor_atelier_1',
        name: '아트빌드',
        size: CONSTRUCTOR_SIZE.ATELIER,
        emoji: '🎨',
        costMultiplier: 1.1,
        riskBlocks: 0,
        paymentStages: 3,
        artistryBonus: 1.3,
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
    {
        id: 'constructor_atelier_3',
        name: '공간예술',
        size: CONSTRUCTOR_SIZE.ATELIER,
        emoji: '🖼️',
        costMultiplier: 1.12,
        riskBlocks: 0,
        paymentStages: 3,
        artistryBonus: 1.35,
        canBuild: ['단독주택', '카페', '풀빌라', '호텔'],
        description: '공간을 예술로 만드는 장인들'
    },
    {
        id: 'constructor_atelier_4',
        name: '모던크래프트',
        size: CONSTRUCTOR_SIZE.ATELIER,
        emoji: '🌿',
        costMultiplier: 1.18,
        riskBlocks: 1,
        paymentStages: 3,
        artistryBonus: 1.45,
        canBuild: ['단독주택', '카페', '풀빌라', '대형카페', '펜션'],
        description: '자연과 모던의 조화, 프리미엄 아뜰리에'
    },

    // 직영공사 (3장)
    {
        id: 'constructor_direct_1',
        name: '직영공사 (소형)',
        size: CONSTRUCTOR_SIZE.DIRECT,
        emoji: '🏡',
        costMultiplier: 0.8,
        riskBlocks: 0,
        paymentStages: 6,
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
    },
    {
        id: 'constructor_direct_3',
        name: '셀프빌드 프로젝트',
        size: CONSTRUCTOR_SIZE.DIRECT,
        emoji: '🛠️',
        costMultiplier: 0.7,
        riskBlocks: 0,
        paymentStages: 8,
        artistryBonus: 1.1,
        canBuild: ['단독주택', '카페', '펜션'],
        description: '최저 비용 직접 시공, 매우 느림'
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
