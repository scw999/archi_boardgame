// 토지 카드 데이터
export const LAND_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL_RESIDENTIAL: 'commercial_residential',
  SEASIDE: 'seaside',
  UNDEVELOPED: 'undeveloped',
  RURAL: 'rural',
  COMMERCIAL: 'commercial'
};

// 지역 구분 (가격 티어 기반)
export const REGIONS = {
  RURAL: { id: 'rural', name: '지방/시골', emoji: '🌾', tier: 1, color: '#3d5c3d' },
  GYEONGGI_OUTER: { id: 'gyeonggi_outer', name: '경기 외곽', emoji: '🏘️', tier: 2, color: '#5a7a5a' },
  GYEONGGI_MAIN: { id: 'gyeonggi_main', name: '경기 주요', emoji: '🏙️', tier: 3, color: '#5a7a9a' },
  SEOUL: { id: 'seoul', name: '서울', emoji: '🌆', tier: 4, color: '#7a5a8a' },
  SEOUL_CORE: { id: 'seoul_core', name: '서울 핵심', emoji: '✨', tier: 5, color: '#b8962b' },
  LANDMARK: { id: 'landmark', name: '명소/특구', emoji: '🌟', tier: 4, color: '#2a8a8a' },
  TECH_HUB: { id: 'tech_hub', name: '테크밸리', emoji: '💼', tier: 4, color: '#4a6a9a' }
};

// 시세 기준 지역 결정 함수
export function getRegionByPrice(marketPrice) {
  if (marketPrice < 200000000) return REGIONS.RURAL;           // 2억 미만 - 지방
  if (marketPrice < 400000000) return REGIONS.GYEONGGI_OUTER;  // 2~4억 - 경기 외곽
  if (marketPrice < 800000000) return REGIONS.GYEONGGI_MAIN;   // 4~8억 - 경기 주요
  if (marketPrice < 1200000000) return REGIONS.SEOUL;          // 8~12억 - 서울
  return REGIONS.SEOUL_CORE;                                    // 12억 이상 - 서울 핵심
}

export const lands = [
  // 단독주택 택지 (4장)
  {
    id: 'land_residential_1',
    type: LAND_TYPES.RESIDENTIAL,
    name: '단독주택 택지',
    description: '조용한 주거지역의 단독주택 부지',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 50, // 평
    prices: {
      market: 200000000,    // 2억 (시세)
      urgent: 160000000,    // 1.6억 (급매 0.8)
      auction: 100000000    // 1억 (경매 0.5)
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],  // 항상 성공
      urgent: [2, 3, 4, 5, 6],     // 2 이상
      auction: [4, 5, 6]           // 4 이상
    },
    attributes: {
      slope: 'low',           // 경사도: 낮음
      infrastructure: true,   // 기반시설 있음
      roadAccess: true        // 도로 접함
    },
    bonuses: [],
    region: REGIONS.GYEONGGI_OUTER
  },
  {
    id: 'land_residential_2',
    type: LAND_TYPES.RESIDENTIAL,
    name: '단독주택 택지',
    description: '학군이 좋은 주거지역 부지',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 60,
    prices: {
      market: 250000000,
      urgent: 200000000,
      auction: 125000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: [5, 6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 학군보너스'],
    region: REGIONS.GYEONGGI_OUTER
  },
  {
    id: 'land_residential_3',
    type: LAND_TYPES.RESIDENTIAL,
    name: '단독주택 택지',
    description: '경사가 있는 저렴한 부지',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 70,
    prices: {
      market: 150000000,
      urgent: 120000000,
      auction: 75000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [2, 3, 4, 5, 6],
      auction: [4, 5, 6]
    },
    attributes: {
      slope: 'high',          // 토목비용 추가
      infrastructure: true,
      roadAccess: true
    },
    bonuses: [],
    region: REGIONS.RURAL
  },
  {
    id: 'land_residential_4',
    type: LAND_TYPES.RESIDENTIAL,
    name: '단독주택 택지',
    description: '전망 좋은 고급 주거지',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 80,
    prices: {
      market: 350000000,
      urgent: 280000000,
      auction: 175000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: [5, 6]
    },
    attributes: {
      slope: 'medium',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🏞️ 경관보너스'],
    region: REGIONS.GYEONGGI_OUTER
  },

  // 상가주택 택지 (3장)
  {
    id: 'land_commercial_res_1',
    type: LAND_TYPES.COMMERCIAL_RESIDENTIAL,
    name: '상가주택 택지',
    description: '번화가 인근 상가주택 부지',
    suitableBuildings: ['상가주택'],
    suitabilityBonus: 1.2,
    area: 100,
    prices: {
      market: 400000000,
      urgent: 320000000,
      auction: 200000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: [5, 6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 역세권보너스'],
    region: REGIONS.GYEONGGI_MAIN
  },
  {
    id: 'land_commercial_res_2',
    type: LAND_TYPES.COMMERCIAL_RESIDENTIAL,
    name: '상가주택 택지',
    description: '주거밀집지역 상가주택 부지',
    suitableBuildings: ['상가주택'],
    suitabilityBonus: 1.2,
    area: 80,
    prices: {
      market: 300000000,
      urgent: 240000000,
      auction: 150000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [2, 3, 4, 5, 6],
      auction: [4, 5, 6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: [],
    region: REGIONS.GYEONGGI_OUTER
  },
  {
    id: 'land_commercial_res_3',
    type: LAND_TYPES.COMMERCIAL_RESIDENTIAL,
    name: '상가주택 택지',
    description: '대형마트 인근 부지',
    suitableBuildings: ['상가주택'],
    suitabilityBonus: 1.2,
    area: 90,
    prices: {
      market: 350000000,
      urgent: 280000000,
      auction: 175000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: [5, 6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 마트보너스'],
    region: REGIONS.GYEONGGI_OUTER
  },

  // 바닷가 부지 (3장)
  {
    id: 'land_seaside_1',
    type: LAND_TYPES.SEASIDE,
    name: '바닷가 부지',
    description: '해변이 보이는 프리미엄 부지',
    suitableBuildings: ['카페', '펜션', '풀빌라'],
    suitabilityBonus: 1.2,
    area: 60,
    prices: {
      market: 300000000,
      urgent: 240000000,
      auction: 150000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: [5, 6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🏞️ 오션뷰보너스'],
    region: REGIONS.GYEONGGI_OUTER
  },
  {
    id: 'land_seaside_2',
    type: LAND_TYPES.SEASIDE,
    name: '바닷가 부지',
    description: '한적한 해변가 부지',
    suitableBuildings: ['카페', '펜션', '풀빌라'],
    suitabilityBonus: 1.2,
    area: 80,
    prices: {
      market: 250000000,
      urgent: 200000000,
      auction: 125000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [2, 3, 4, 5, 6],
      auction: [4, 5, 6]
    },
    attributes: {
      slope: 'medium',
      infrastructure: false,  // 인입비용 추가
      roadAccess: true
    },
    bonuses: ['🏞️ 경관보너스'],
    region: REGIONS.GYEONGGI_OUTER
  },
  {
    id: 'land_seaside_3',
    type: LAND_TYPES.SEASIDE,
    name: '바닷가 부지',
    description: '서핑 명소 인근 부지',
    suitableBuildings: ['카페', '펜션', '풀빌라'],
    suitabilityBonus: 1.2,
    area: 100,
    prices: {
      market: 400000000,
      urgent: 320000000,
      auction: 200000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [4, 5, 6],
      auction: [6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 입지보너스', '🏞️ 경관보너스'],
    region: REGIONS.GYEONGGI_MAIN
  },

  // 미개발 임야 (2장)
  {
    id: 'land_undeveloped_1',
    type: LAND_TYPES.UNDEVELOPED,
    name: '미개발 임야',
    description: '개발이 필요한 저렴한 임야',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 100,
    prices: {
      market: 100000000,
      urgent: 80000000,
      auction: 50000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [2, 3, 4, 5, 6],
      auction: [3, 4, 5, 6]
    },
    attributes: {
      slope: 'high',
      infrastructure: false,
      roadAccess: false       // 맹지 - 도로 연결 비용
    },
    bonuses: [],
    region: REGIONS.RURAL
  },
  {
    id: 'land_undeveloped_2',
    type: LAND_TYPES.UNDEVELOPED,
    name: '미개발 임야',
    description: '자연경관이 좋은 임야',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 150,
    prices: {
      market: 150000000,
      urgent: 120000000,
      auction: 75000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [2, 3, 4, 5, 6],
      auction: [4, 5, 6]
    },
    attributes: {
      slope: 'medium',
      infrastructure: false,
      roadAccess: true
    },
    bonuses: ['🏞️ 경관보너스'],
    region: REGIONS.RURAL
  },

  // 전원주택 단지 필지 (2장)
  {
    id: 'land_rural_1',
    type: LAND_TYPES.RURAL,
    name: '전원주택 단지 필지',
    description: '잘 조성된 전원주택 단지',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 80,
    prices: {
      market: 200000000,
      urgent: 160000000,
      auction: 100000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [2, 3, 4, 5, 6],
      auction: [4, 5, 6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: [],
    region: REGIONS.GYEONGGI_OUTER
  },
  {
    id: 'land_rural_2',
    type: LAND_TYPES.RURAL,
    name: '전원주택 단지 필지',
    description: '산과 계곡이 가까운 필지',
    suitableBuildings: ['단독주택'],
    suitabilityBonus: 1.1,
    area: 100,
    prices: {
      market: 250000000,
      urgent: 200000000,
      auction: 125000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: [5, 6]
    },
    attributes: {
      slope: 'medium',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🏞️ 경관보너스'],
    region: REGIONS.GYEONGGI_OUTER
  },

  // 준주거 및 상업 필지 (2장)
  {
    id: 'land_commercial_1',
    type: LAND_TYPES.COMMERCIAL,
    name: '준주거 상업 필지',
    description: '유동인구 많은 상업지구',
    suitableBuildings: ['대형카페', '상가', '복합몰'],
    suitabilityBonus: 1.2,
    area: 150,
    prices: {
      market: 600000000,
      urgent: null,           // 급매 없음
      auction: null           // 경매 없음
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [],
      auction: []
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 역세권보너스', '🚉 입지보너스'],
    region: REGIONS.GYEONGGI_MAIN
  },
  {
    id: 'land_commercial_2',
    type: LAND_TYPES.COMMERCIAL,
    name: '준주거 상업 필지',
    description: '신도시 핵심 상업지구',
    suitableBuildings: ['대형카페', '상가', '복합몰', '호텔'],
    suitabilityBonus: 1.2,
    area: 200,
    prices: {
      market: 800000000,
      urgent: null,
      auction: null
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [],
      auction: []
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 역세권보너스', '🚉 직장보너스'],
    region: REGIONS.SEOUL
  }
];

// 토지 속성에 따른 추가 비용 계산
export function calculateLandDevelopmentCost(land) {
  let extraCost = 0;
  
  // 경사도에 따른 토목공사비
  if (land.attributes.slope === 'high') {
    extraCost += 50000000; // 5천만원
  } else if (land.attributes.slope === 'medium') {
    extraCost += 20000000; // 2천만원
  }
  
  // 기반시설 없으면 인입비용
  if (!land.attributes.infrastructure) {
    extraCost += 30000000; // 3천만원
  }
  
  // 맹지면 도로 연결 비용
  if (!land.attributes.roadAccess) {
    extraCost += 40000000; // 4천만원
  }
  
  return extraCost;
}

// 라운드별 추가 프리미엄 대지 (라운드 2+)
export const premiumLands = [
  // 강남권 고급 필지
  {
    id: 'land_premium_gangnam_1',
    type: LAND_TYPES.COMMERCIAL,
    name: '강남 역세권 필지',
    description: '강남역 도보 5분, 최고 입지',
    suitableBuildings: ['대형카페', '상가', '복합몰', '호텔'],
    suitabilityBonus: 1.4,
    area: 250,
    prices: {
      market: 1500000000,  // 15억
      urgent: null,
      auction: null
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [],
      auction: []
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 역세권보너스', '🚉 입지보너스', '💎 프리미엄'],
    tier: 'premium',
    region: REGIONS.SEOUL_CORE
  },
  {
    id: 'land_premium_gangnam_2',
    type: LAND_TYPES.COMMERCIAL,
    name: '청담동 고급 필지',
    description: '명품거리 인접 초프리미엄 부지',
    suitableBuildings: ['대형카페', '상가', '호텔'],
    suitabilityBonus: 1.5,
    area: 180,
    prices: {
      market: 2000000000,  // 20억
      urgent: null,
      auction: null
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [],
      auction: []
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['💎 럭셔리', '🚉 입지보너스'],
    tier: 'ultra_premium',
    region: REGIONS.SEOUL_CORE
  },
  // 해운대 고급 필지
  {
    id: 'land_premium_haeundae',
    type: LAND_TYPES.SEASIDE,
    name: '해운대 오션뷰 필지',
    description: '해운대 해변 최전선 부지',
    suitableBuildings: ['풀빌라', '호텔', '펜션', '대형카페'],
    suitabilityBonus: 1.4,
    area: 200,
    prices: {
      market: 1200000000,  // 12억
      urgent: 960000000,
      auction: null
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: []
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🏞️ 오션뷰보너스', '💎 프리미엄', '🚉 입지보너스'],
    tier: 'premium',
    region: REGIONS.SEOUL_CORE
  },
  // 제주 프리미엄
  {
    id: 'land_premium_jeju',
    type: LAND_TYPES.SEASIDE,
    name: '제주 서귀포 절경 필지',
    description: '한라산과 바다가 함께 보이는 명당',
    suitableBuildings: ['풀빌라', '펜션', '카페', '호텔'],
    suitabilityBonus: 1.35,
    area: 300,
    prices: {
      market: 900000000,  // 9억
      urgent: 720000000,
      auction: 450000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [3, 4, 5, 6],
      auction: [5, 6]
    },
    attributes: {
      slope: 'medium',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🏞️ 경관보너스', '🏞️ 오션뷰보너스', '💎 프리미엄'],
    tier: 'premium',
    region: REGIONS.LANDMARK
  },
  // 판교 테크밸리
  {
    id: 'land_premium_pangyo',
    type: LAND_TYPES.COMMERCIAL,
    name: '판교 테크노밸리 필지',
    description: 'IT기업 밀집지역 상업용지',
    suitableBuildings: ['상가', '대형카페', '복합몰'],
    suitabilityBonus: 1.3,
    area: 220,
    prices: {
      market: 1100000000,  // 11억
      urgent: null,
      auction: null
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [],
      auction: []
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🚉 직장보너스', '🚉 역세권보너스', '💎 프리미엄'],
    tier: 'premium',
    region: REGIONS.TECH_HUB
  },
  // 고급 전원주택 필지
  {
    id: 'land_premium_rural',
    type: LAND_TYPES.RURAL,
    name: '양평 프리미엄 전원 필지',
    description: '한강이 보이는 고급 전원주택 단지',
    suitableBuildings: ['단독주택', '풀빌라', '펜션'],
    suitabilityBonus: 1.3,
    area: 200,
    prices: {
      market: 500000000,  // 5억
      urgent: 400000000,
      auction: 250000000
    },
    diceRequired: {
      market: [1, 2, 3, 4, 5, 6],
      urgent: [2, 3, 4, 5, 6],
      auction: [4, 5, 6]
    },
    attributes: {
      slope: 'low',
      infrastructure: true,
      roadAccess: true
    },
    bonuses: ['🏞️ 경관보너스', '💎 프리미엄'],
    tier: 'premium',
    region: REGIONS.GYEONGGI_MAIN
  }
];

// 라운드에 따른 가격 배율 (라운드가 올라갈수록 땅값 상승)
export function getRoundPriceMultiplier(round) {
  const multipliers = {
    1: 1.0,
    2: 1.15,
    3: 1.3,
    4: 1.5
  };
  return multipliers[round] || 1.0;
}

// 라운드별 대지 가격 적용
export function applyRoundPricing(land, round) {
  const multiplier = getRoundPriceMultiplier(round);
  return {
    ...land,
    prices: {
      market: land.prices.market ? Math.floor(land.prices.market * multiplier) : null,
      urgent: land.prices.urgent ? Math.floor(land.prices.urgent * multiplier) : null,
      auction: land.prices.auction ? Math.floor(land.prices.auction * multiplier) : null
    }
  };
}

// 기본 대지 덱 생성
export function createLandDeck() {
  return [...lands].sort(() => Math.random() - 0.5);
}

// 프리미엄 대지 덱 생성 (라운드 2+)
export function createPremiumLandDeck() {
  return [...premiumLands].sort(() => Math.random() - 0.5);
}

// 라운드별 대지 덱 생성 (라운드가 높을수록 비싼 땅 비율 증가)
export function createRoundLandDeck(round) {
  let deck = [...lands];

  // 라운드별 저가 토지 필터링 (라운드가 높을수록 저가 토지 감소)
  if (round >= 2) {
    // 라운드 2: 2억 미만 토지 50% 제거
    deck = deck.filter(land => {
      if (land.prices.market < 200000000) {
        return Math.random() > 0.5;
      }
      return true;
    });
  }

  if (round >= 3) {
    // 라운드 3: 3억 미만 토지 40% 추가 제거
    deck = deck.filter(land => {
      if (land.prices.market < 300000000) {
        return Math.random() > 0.4;
      }
      return true;
    });
  }

  if (round >= 4) {
    // 라운드 4: 4억 미만 토지 30% 추가 제거
    deck = deck.filter(land => {
      if (land.prices.market < 400000000) {
        return Math.random() > 0.3;
      }
      return true;
    });
  }

  // 라운드 2부터 프리미엄 대지 추가 (점점 많이)
  if (round >= 2) {
    // 라운드 2: 프리미엄 1배
    deck = [...deck, ...premiumLands];
  }
  if (round >= 3) {
    // 라운드 3: 프리미엄 추가
    deck = [...deck, ...premiumLands];
  }
  if (round >= 4) {
    // 라운드 4: 프리미엄 더 추가
    deck = [...deck, ...premiumLands];
  }

  // 가격 배율 적용
  deck = deck.map(land => applyRoundPricing(land, round));

  // 최소 카드 수 보장
  if (deck.length < 12) {
    const additionalLands = [...lands]
      .sort(() => Math.random() - 0.5)
      .slice(0, 12 - deck.length)
      .map(land => applyRoundPricing(land, round));
    deck = [...deck, ...additionalLands];
  }

  return deck.sort(() => Math.random() - 0.5);
}
