// 건축가 카드 데이터
export const ARCHITECT_TRAITS = {
    ARTISTRY: 'artistry',       // 예술성 - 시공비 1.2 증가
    EFFICIENCY: 'efficiency',   // 효율성 - 시공비 0.8
    FUNCTIONALITY: 'functionality', // 기능성 - 시공비 그대로
    FAME: 'fame'                // 유명도 - 설계비 증가
};

export const architects = [
    // 예술성 건축가들
    {
        id: 'architect_art_1',
        name: '김예술',
        portrait: '👨‍🎨',
        trait: ARCHITECT_TRAITS.ARTISTRY,
        traitBonus: 1.3,          // 예술성 보너스 +30%
        feeMultiplier: 1.2,       // 설계비 1.2배
        constructionMultiplier: 1.2, // 시공비 1.2배 증가
        masterpieces: ['카페', '풀빌라'],  // 대표작
        description: '감각적인 디자인으로 유명한 아티스트 건축가'
    },
    {
        id: 'architect_art_2',
        name: '박디자인',
        portrait: '👩‍🎨',
        trait: ARCHITECT_TRAITS.ARTISTRY,
        traitBonus: 1.4,
        feeMultiplier: 1.4,
        constructionMultiplier: 1.2,
        masterpieces: ['호텔', '대형카페'],
        description: '세계적으로 인정받는 디자인 거장'
    },
    {
        id: 'architect_art_3',
        name: '이모던',
        portrait: '🧑‍🎨',
        trait: ARCHITECT_TRAITS.ARTISTRY,
        traitBonus: 1.2,
        feeMultiplier: 1.0,
        constructionMultiplier: 1.2,
        masterpieces: ['단독주택'],
        description: '신진 아티스트 건축가, 저렴하지만 재능있음'
    },

    // 효율성 건축가들
    {
        id: 'architect_eff_1',
        name: '최효율',
        portrait: '👷',
        trait: ARCHITECT_TRAITS.EFFICIENCY,
        traitBonus: 1.3,
        feeMultiplier: 1.0,
        constructionMultiplier: 0.85, // 시공비 15% 절감
        masterpieces: ['상가주택', '상가'],
        description: '공사비 절감의 달인, 실용적인 설계'
    },
    {
        id: 'architect_eff_2',
        name: '정합리',
        portrait: '👨‍💼',
        trait: ARCHITECT_TRAITS.EFFICIENCY,
        traitBonus: 1.4,
        feeMultiplier: 1.1,
        constructionMultiplier: 0.8,  // 시공비 20% 절감
        masterpieces: ['단독주택', '상가주택', '복합몰'],
        description: '베테랑 건축가, 효율과 품질의 균형'
    },
    {
        id: 'architect_eff_3',
        name: '한절약',
        portrait: '👨‍🔧',
        trait: ARCHITECT_TRAITS.EFFICIENCY,
        traitBonus: 1.2,
        feeMultiplier: 0.8,
        constructionMultiplier: 0.9,
        masterpieces: ['단독주택'],
        description: '비용 절감 전문, 가성비 최고'
    },

    // 기능성 건축가들
    {
        id: 'architect_func_1',
        name: '강기능',
        portrait: '🧑‍🔬',
        trait: ARCHITECT_TRAITS.FUNCTIONALITY,
        traitBonus: 1.3,
        feeMultiplier: 1.0,
        constructionMultiplier: 1.0,
        masterpieces: ['단독주택', '상가주택'],
        description: '사용자 편의를 최우선으로 고려하는 건축가'
    },
    {
        id: 'architect_func_2',
        name: '오편리',
        portrait: '👨‍🏫',
        trait: ARCHITECT_TRAITS.FUNCTIONALITY,
        traitBonus: 1.4,
        feeMultiplier: 1.2,
        constructionMultiplier: 1.0,
        masterpieces: ['호텔', '복합몰', '상가'],
        description: '대형 건물 기능 설계의 대가'
    },
    {
        id: 'architect_func_3',
        name: '윤실용',
        portrait: '👩‍💼',
        trait: ARCHITECT_TRAITS.FUNCTIONALITY,
        traitBonus: 1.2,
        feeMultiplier: 0.9,
        constructionMultiplier: 1.0,
        masterpieces: ['풀빌라', '펜션'],
        description: '숙박시설 전문 건축가'
    },

    // 유명도 건축가들
    {
        id: 'architect_fame_1',
        name: '스타건축',
        portrait: '⭐',
        trait: ARCHITECT_TRAITS.FAME,
        traitBonus: 1.4,
        feeMultiplier: 1.5,        // 설계비 1.5배
        constructionMultiplier: 1.0,
        masterpieces: ['카페', '호텔', '대형카페'],
        description: 'TV에 자주 출연하는 스타 건축가'
    },
    {
        id: 'architect_fame_2',
        name: '월드클래스',
        portrait: '🌟',
        trait: ARCHITECT_TRAITS.FAME,
        traitBonus: 1.5,
        feeMultiplier: 2.0,
        constructionMultiplier: 1.1,
        masterpieces: ['호텔', '복합몰'],
        description: '세계적 명성의 건축가, 건물 가치 대폭 상승'
    },
    {
        id: 'architect_fame_3',
        name: '인플루언서',
        portrait: '📱',
        trait: ARCHITECT_TRAITS.FAME,
        traitBonus: 1.3,
        feeMultiplier: 1.3,
        constructionMultiplier: 1.0,
        masterpieces: ['카페', '풀빌라'],
        description: 'SNS 팔로워 100만, 홍보 효과 대박'
    }
];

// 건축가 설계비 계산 (건물 기본 설계비 × 건축가 팩터)
export function calculateDesignFee(architect, building) {
    const baseFee = building.designFee;
    let fee = baseFee * architect.feeMultiplier;

    // 대표작이 아니면 설계비 30% 할인, 대신 보너스 반감
    if (!architect.masterpieces.includes(building.name)) {
        fee *= 0.7;
    }

    return Math.round(fee);
}

// 건축가 특성에 따른 건물 가치 보너스 계산
export function calculateArchitectBonus(architect, building) {
    const trait = architect.trait;
    const baseBonus = building.valueFactors[trait] || 1.0;
    let bonus = baseBonus * architect.traitBonus;

    // 대표작이 아니면 보너스 반감
    if (!architect.masterpieces.includes(building.name)) {
        bonus = 1 + (bonus - 1) * 0.5;
    }

    return bonus;
}

// 시공비 팩터 반환
export function getConstructionMultiplier(architect) {
    return architect.constructionMultiplier;
}

// 카드 덱 생성
export function createArchitectDeck() {
    return [...architects].sort(() => Math.random() - 0.5);
}
