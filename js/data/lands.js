// 토지 카드 데이터
export const LAND_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL_RESIDENTIAL: 'commercial_residential',
  SEASIDE: 'seaside',
  UNDEVELOPED: 'undeveloped',
  RURAL: 'rural',
  COMMERCIAL: 'commercial'
};

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
    bonuses: []
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
    bonuses: ['🚉 학군보너스']
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
    bonuses: []
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
    bonuses: ['🏞️ 경관보너스']
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
    bonuses: ['🚉 역세권보너스']
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
    bonuses: []
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
    bonuses: ['🚉 마트보너스']
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
    bonuses: ['🏞️ 오션뷰보너스']
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
    bonuses: ['🏞️ 경관보너스']
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
    bonuses: ['🚉 입지보너스', '🏞️ 경관보너스']
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
    bonuses: []
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
    bonuses: ['🏞️ 경관보너스']
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
    bonuses: []
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
    bonuses: ['🏞️ 경관보너스']
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
    bonuses: ['🚉 역세권보너스', '🚉 입지보너스']
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
    bonuses: ['🚉 역세권보너스', '🚉 직장보너스']
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

// 카드 덱 생성을 위한 함수
export function createLandDeck() {
  return [...lands].sort(() => Math.random() - 0.5);
}
