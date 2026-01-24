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
        name: '안도 타다오',
        portrait: '👨‍🎨',
        trait: ARCHITECT_TRAITS.ARTISTRY,
        traitBonus: 1.3,
        feeMultiplier: 1.2,
        constructionMultiplier: 1.2,
        masterpieces: ['카페', '풀빌라'],
        description: '콘크리트와 빛의 건축 철학으로 세계적 명성'
    },
    {
        id: 'architect_art_2',
        name: '자하 하디드',
        portrait: '👩‍🎨',
        trait: ARCHITECT_TRAITS.ARTISTRY,
        traitBonus: 1.4,
        feeMultiplier: 1.4,
        constructionMultiplier: 1.2,
        masterpieces: ['호텔', '대형카페'],
        description: '곡선의 여왕, 해체주의 건축의 거장'
    },
    {
        id: 'architect_art_3',
        name: '프랭크 게리',
        portrait: '🧑‍🎨',
        trait: ARCHITECT_TRAITS.ARTISTRY,
        traitBonus: 1.2,
        feeMultiplier: 1.0,
        constructionMultiplier: 1.2,
        masterpieces: ['단독주택'],
        description: '비정형 건축의 선구자, 빌바오 구겐하임 설계'
    },
    {
        id: 'architect_art_4',
        name: '알바로 시자',
        portrait: '🎭',
        trait: ARCHITECT_TRAITS.ARTISTRY,
        traitBonus: 1.25,
        feeMultiplier: 1.1,
        constructionMultiplier: 1.1,
        masterpieces: ['풀빌라', '카페', '단독주택'],
        description: '포르투갈 모더니즘의 거장, 빛과 공간의 시인'
    },

    // 효율성 건축가들
    {
        id: 'architect_eff_1',
        name: '노만 포스터',
        portrait: '👷',
        trait: ARCHITECT_TRAITS.EFFICIENCY,
        traitBonus: 1.3,
        feeMultiplier: 1.0,
        constructionMultiplier: 0.85,
        masterpieces: ['상가주택', '상가'],
        description: '하이테크 건축의 대가, 지속 가능한 설계'
    },
    {
        id: 'architect_eff_2',
        name: '렘 콜하스',
        portrait: '👨‍💼',
        trait: ARCHITECT_TRAITS.EFFICIENCY,
        traitBonus: 1.4,
        feeMultiplier: 1.1,
        constructionMultiplier: 0.8,
        masterpieces: ['단독주택', '상가주택', '복합몰'],
        description: 'OMA 설립자, 현대 건축의 혁신가'
    },
    {
        id: 'architect_eff_3',
        name: '시게루 반',
        portrait: '👨‍🔧',
        trait: ARCHITECT_TRAITS.EFFICIENCY,
        traitBonus: 1.2,
        feeMultiplier: 0.8,
        constructionMultiplier: 0.9,
        masterpieces: ['단독주택'],
        description: '종이 건축의 대가, 재해 건축 선구자'
    },
    {
        id: 'architect_eff_4',
        name: '발터 그로피우스',
        portrait: '🏛️',
        trait: ARCHITECT_TRAITS.EFFICIENCY,
        traitBonus: 1.35,
        feeMultiplier: 1.0,
        constructionMultiplier: 0.85,
        masterpieces: ['상가', '복합몰', '상가주택'],
        description: '바우하우스 창립자, 현대 건축 교육의 아버지'
    },

    // 기능성 건축가들
    {
        id: 'architect_func_1',
        name: '루이스 칸',
        portrait: '🧑‍🔬',
        trait: ARCHITECT_TRAITS.FUNCTIONALITY,
        traitBonus: 1.3,
        feeMultiplier: 1.0,
        constructionMultiplier: 1.0,
        masterpieces: ['단독주택', '상가주택'],
        description: '공간과 빛의 대가, 건축 교육의 선구자'
    },
    {
        id: 'architect_func_2',
        name: '알바 알토',
        portrait: '👨‍🏫',
        trait: ARCHITECT_TRAITS.FUNCTIONALITY,
        traitBonus: 1.4,
        feeMultiplier: 1.2,
        constructionMultiplier: 1.0,
        masterpieces: ['호텔', '복합몰', '상가'],
        description: '핀란드 모더니즘의 거장, 인간 중심 설계'
    },
    {
        id: 'architect_func_3',
        name: '피터 줌토르',
        portrait: '👩‍💼',
        trait: ARCHITECT_TRAITS.FUNCTIONALITY,
        traitBonus: 1.2,
        feeMultiplier: 0.9,
        constructionMultiplier: 1.0,
        masterpieces: ['풀빌라', '펜션'],
        description: '미니말리즘 건축의 대가, 장소성 중시'
    },
    {
        id: 'architect_func_4',
        name: '마리오 보타',
        portrait: '🧱',
        trait: ARCHITECT_TRAITS.FUNCTIONALITY,
        traitBonus: 1.25,
        feeMultiplier: 1.0,
        constructionMultiplier: 1.0,
        masterpieces: ['카페', '상가', '단독주택'],
        description: '스위스 건축의 거장, 기하학적 형태의 대가'
    },

    // 유명도 건축가들
    {
        id: 'architect_fame_1',
        name: '렌조 피아노',
        portrait: '⭐',
        trait: ARCHITECT_TRAITS.FAME,
        traitBonus: 1.4,
        feeMultiplier: 1.5,
        constructionMultiplier: 1.0,
        masterpieces: ['카페', '호텔', '대형카페'],
        description: '프리츠커상 수상자, 퐁피두 센터 설계'
    },
    {
        id: 'architect_fame_2',
        name: '르 코르뷔지에',
        portrait: '🏆',
        trait: ARCHITECT_TRAITS.FAME,
        traitBonus: 1.5,
        feeMultiplier: 1.8,
        constructionMultiplier: 1.1,
        masterpieces: ['단독주택', '복합몰', '호텔'],
        description: '현대 건축의 아버지, 모듈러 시스템 창시자'
    },
    {
        id: 'architect_fame_3',
        name: '켄고 쿠마',
        portrait: '📱',
        trait: ARCHITECT_TRAITS.FAME,
        traitBonus: 1.3,
        feeMultiplier: 1.3,
        constructionMultiplier: 1.0,
        masterpieces: ['카페', '풀빌라'],
        description: '일본 자연주의 건축의 대가, 신 국립경기장 설계'
    },
    {
        id: 'architect_fame_4',
        name: '미스 반 데어 로에',
        portrait: '🌆',
        trait: ARCHITECT_TRAITS.FAME,
        traitBonus: 1.45,
        feeMultiplier: 1.6,
        constructionMultiplier: 1.0,
        masterpieces: ['호텔', '상가', '복합몰'],
        description: 'Less is More, 모더니즘 건축의 거장'
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
