// 건물 유형 데이터
export const BUILDING_TYPES = {
    HOUSE: '단독주택',
    COMMERCIAL_HOUSE: '상가주택',
    CAFE: '카페',
    POOL_VILLA: '풀빌라',
    HOTEL: '호텔',
    LARGE_CAFE: '대형카페',
    COMMERCIAL: '상가',
    COMPLEX: '복합몰',
    PENSION: '펜션'
};

export const buildings = {
    '단독주택': {
        id: 'house',
        name: '단독주택',
        emoji: '🏡',
        area: 50,                           // 평
        designFee: 50000000,               // 설계비 5000만원 (평당 100만원)
        constructionCost: 500000000,       // 시공비 5억 (평당 1000만원)
        constructionPeriod: 5,              // 시공기간 5개월
        valueFactors: {
            artistry: 1.1,      // 예술성
            efficiency: 1.5,    // 효율성
            functionality: 1.8, // 기능성
            fame: 1.1           // 유명도
        },
        description: '아늑한 단독주택으로 가족의 보금자리'
    },

    '상가주택': {
        id: 'commercial_house',
        name: '상가주택',
        emoji: '🏣',
        area: 100,
        designFee: 100000000,              // 1억
        constructionCost: 1000000000,      // 10억
        constructionPeriod: 10,
        valueFactors: {
            artistry: 1.2,
            efficiency: 1.5,
            functionality: 1.7,
            fame: 1.2
        },
        description: '1층 상가, 상층부 주거의 수익형 건물'
    },

    '카페': {
        id: 'cafe',
        name: '카페',
        emoji: '☕',
        area: 60,
        designFee: 60000000,               // 6000만원
        constructionCost: 600000000,       // 6억
        constructionPeriod: 6,
        valueFactors: {
            artistry: 1.7,
            efficiency: 1.1,
            functionality: 1.3,
            fame: 1.6
        },
        description: '분위기 있는 카페로 핫플레이스 도전'
    },

    '풀빌라': {
        id: 'pool_villa',
        name: '풀빌라',
        emoji: '🛖',
        area: 50,
        designFee: 50000000,
        constructionCost: 500000000,
        constructionPeriod: 5,
        valueFactors: {
            artistry: 1.5,
            efficiency: 1.3,
            functionality: 1.6,
            fame: 1.5
        },
        description: '프라이빗 풀이 있는 럭셔리 숙소'
    },

    '호텔': {
        id: 'hotel',
        name: '호텔',
        emoji: '🏬',
        area: 200,
        designFee: 200000000,              // 2억
        constructionCost: 2000000000,      // 20억
        constructionPeriod: 20,
        valueFactors: {
            artistry: 1.5,
            efficiency: 1.5,
            functionality: 1.4,
            fame: 1.6
        },
        description: '대형 숙박시설로 대규모 수익 창출'
    },

    '대형카페': {
        id: 'large_cafe',
        name: '대형카페',
        emoji: '🏪',
        area: 120,
        designFee: 120000000,
        constructionCost: 1200000000,
        constructionPeriod: 12,
        valueFactors: {
            artistry: 1.6,
            efficiency: 1.2,
            functionality: 1.4,
            fame: 1.7
        },
        description: '랜드마크급 대형 카페'
    },

    '상가': {
        id: 'commercial',
        name: '상가',
        emoji: '🏢',
        area: 150,
        designFee: 150000000,
        constructionCost: 1500000000,
        constructionPeriod: 15,
        valueFactors: {
            artistry: 1.2,
            efficiency: 1.6,
            functionality: 1.5,
            fame: 1.3
        },
        description: '다양한 임차인을 위한 근린상가'
    },

    '복합몰': {
        id: 'complex',
        name: '복합몰',
        emoji: '🏛️',
        area: 250,
        designFee: 250000000,
        constructionCost: 2500000000,
        constructionPeriod: 25,
        valueFactors: {
            artistry: 1.4,
            efficiency: 1.4,
            functionality: 1.6,
            fame: 1.5
        },
        description: '쇼핑, 식사, 문화를 한곳에'
    },

    '펜션': {
        id: 'pension',
        name: '펜션',
        emoji: '🏕️',
        area: 40,
        designFee: 40000000,
        constructionCost: 400000000,
        constructionPeriod: 4,
        valueFactors: {
            artistry: 1.4,
            efficiency: 1.4,
            functionality: 1.5,
            fame: 1.4
        },
        description: '자연 속 휴양을 위한 펜션'
    }
};

// 건물 비용 계산 (설계비 + 시공비)
export function calculateBuildingBaseCost(buildingName) {
    const building = buildings[buildingName];
    if (!building) return 0;
    return building.designFee + building.constructionCost;
}

// 건물 목록 가져오기
export function getBuildingList() {
    return Object.values(buildings);
}

// 건물 이름으로 조회
export function getBuilding(name) {
    return buildings[name] || null;
}
