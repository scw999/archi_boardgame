// 리스크 카드 데이터
export const RISK_TYPES = {
    DELAY: 'delay',               // 지연 - 이자비용 발생
    COST_INCREASE: 'cost_increase', // 비용 증가
    DISASTER: 'disaster',         // 재해 - 치명적
    POSITIVE: 'positive',         // 긍정적 카드
    NEUTRAL: 'neutral'            // 무사 통과
};

export const risks = [
    // 지연 카드 (이자비용 1달)
    {
        id: 'risk_complaint',
        name: '민원 발생',
        type: RISK_TYPES.DELAY,
        emoji: '📢',
        effect: 'interest_1month',
        description: '주변 주민 민원으로 공사 1달 지연',
        severity: 'low'
    },
    {
        id: 'risk_permit_delay',
        name: '인허가 지연',
        type: RISK_TYPES.DELAY,
        emoji: '📋',
        effect: 'interest_1month',
        description: '행정 절차 지연으로 1달 추가',
        severity: 'low'
    },
    {
        id: 'risk_completion_delay',
        name: '준공 지연',
        type: RISK_TYPES.DELAY,
        emoji: '📅',
        effect: 'interest_1month',
        description: '준공 검사 지연으로 1달 추가',
        severity: 'low'
    },
    {
        id: 'risk_accident',
        name: '공사장 사고',
        type: RISK_TYPES.DELAY,
        emoji: '🚧',
        effect: 'interest_1month',
        description: '안전사고 발생, 공사 1달 중단',
        severity: 'medium'
    },

    // 비용 증가 카드
    {
        id: 'risk_reconstruction',
        name: '재시공',
        type: RISK_TYPES.COST_INCREASE,
        emoji: '🔄',
        effect: 'cost_increase_10',
        costIncrease: 0.1,
        description: '시공 불량으로 재시공 필요 (건축비 10% 상승)',
        severity: 'medium'
    },
    {
        id: 'risk_design_change',
        name: '설계 변경',
        type: RISK_TYPES.COST_INCREASE,
        emoji: '📐',
        effect: 'cost_increase_10',
        costIncrease: 0.1,
        description: '현장 상황으로 설계 변경 (건축비 10% 상승)',
        severity: 'medium'
    },
    {
        id: 'risk_material_cost',
        name: '자재비 상승',
        type: RISK_TYPES.COST_INCREASE,
        emoji: '📦',
        effect: 'cost_increase_20',
        costIncrease: 0.2,
        description: '원자재 가격 폭등 (건축비 20% 상승)',
        severity: 'high'
    },
    {
        id: 'risk_labor_cost',
        name: '인건비 상승',
        type: RISK_TYPES.COST_INCREASE,
        emoji: '👷',
        effect: 'cost_increase_20',
        costIncrease: 0.2,
        description: '인력난으로 인건비 폭등 (건축비 20% 상승)',
        severity: 'high'
    },
    {
        id: 'risk_regulation',
        name: '건축법규 추가',
        type: RISK_TYPES.COST_INCREASE,
        emoji: '⚖️',
        effect: 'cost_increase_10',
        costIncrease: 0.1,
        description: '법규 변경으로 추가 공사 (건축비 10% 상승)',
        severity: 'medium'
    },
    {
        id: 'risk_interest_up',
        name: '금리 상승',
        type: RISK_TYPES.COST_INCREASE,
        emoji: '📈',
        effect: 'interest_increase',
        interestMultiplier: 1.5,
        description: '기준금리 인상으로 이자비용 1.5배',
        severity: 'high'
    },

    // 재해 카드 (치명적)
    {
        id: 'risk_bankruptcy',
        name: '시공사 부도',
        type: RISK_TYPES.DISASTER,
        emoji: '💸',
        effect: 'payment_stage_loss',
        description: '시공사 부도! 1단계 시공비 재지출 (영세 시공사는 못 막음)',
        severity: 'critical',
        smallConstructorOnly: true  // 영세 시공사만 해당
    },
    {
        id: 'risk_natural_disaster',
        name: '천재지변',
        type: RISK_TYPES.DISASTER,
        emoji: '🌊',
        effect: 'conditional_delay',
        description: '폭우/태풍/폭설 발생 (50% 이전이면 1달 지연)',
        severity: 'medium',
        condition: 'before_50_percent'
    },
    {
        id: 'risk_earthquake',
        name: '지진으로 건물 붕괴',
        type: RISK_TYPES.DISASTER,
        emoji: '🌋',
        effect: 'total_loss',
        description: '지진으로 건물 무너짐! 나대지만 매각 가능',
        severity: 'critical',
        probability: 0.02  // 매우 낮은 확률 (덱에 1장)
    },
    {
        id: 'risk_collapse',
        name: '부실시공 붕괴',
        type: RISK_TYPES.DISASTER,
        emoji: '💥',
        effect: 'total_loss',
        description: '부실시공으로 건물 무너짐! 나대지만 매각 가능',
        severity: 'critical',
        probability: 0.02
    },

    // 긍정적 카드
    {
        id: 'risk_veteran',
        name: '베테랑 현장소장',
        type: RISK_TYPES.POSITIVE,
        emoji: '👨‍💼',
        effect: 'interest_save_1month',
        description: '유능한 소장으로 공기 단축! (1달 이자비용 감소)',
        severity: 'positive'
    },

    // 중립 카드 (무사 통과)
    {
        id: 'risk_safe_1',
        name: '무사히 진행중',
        type: RISK_TYPES.NEUTRAL,
        emoji: '✅',
        effect: 'none',
        description: '오늘도 무사히!',
        severity: 'none'
    },
    {
        id: 'risk_safe_2',
        name: '무소식이 희소식',
        type: RISK_TYPES.NEUTRAL,
        emoji: '😌',
        effect: 'none',
        description: '조용한 하루, 좋은 하루',
        severity: 'none'
    },
    {
        id: 'risk_safe_3',
        name: '착착 진행중',
        type: RISK_TYPES.NEUTRAL,
        emoji: '👍',
        effect: 'none',
        description: '모든 것이 순조롭습니다',
        severity: 'none'
    }
];

// 리스크 덱 생성 (가중치 적용)
export function createRiskDeck() {
    const deck = [];

    risks.forEach(risk => {
        // 중립/긍정 카드는 더 많이 넣어 부정적 리스크 비율 낮춤
        let count = 1;
        if (risk.type === RISK_TYPES.NEUTRAL) {
            count = 6;  // 무사 통과 카드 6장씩 (기존 4장)
        } else if (risk.type === RISK_TYPES.POSITIVE) {
            count = 3;  // 긍정 카드 3장 (기존 2장)
        } else if (risk.severity === 'critical') {
            count = 1;  // 치명적 카드 1장
        } else if (risk.severity === 'high') {
            count = 1;  // 높은 심각도 1장 (기존 2장)
        } else {
            count = 2;  // 일반 카드 2장 (기존 3장)
        }

        for (let i = 0; i < count; i++) {
            deck.push({ ...risk });
        }
    });

    // 셔플
    return deck.sort(() => Math.random() - 0.5);
}

// 리스크 효과 적용
// 주의: 방어 여부는 UI에서 risk.isBlocked로 설정됨
// 이 함수는 방어되지 않은 리스크의 효과만 적용
export function applyRiskEffect(risk, gameState, constructor) {
    const result = {
        costIncrease: 0,
        delayMonths: 0,
        interestMultiplier: 1,
        isTotalLoss: false,
        isBlocked: false,
        message: ''
    };

    // 중립/긍정 카드는 부정적 효과 없음
    if (risk.type === RISK_TYPES.NEUTRAL || risk.type === RISK_TYPES.POSITIVE) {
        // 효과 적용은 switch문에서 처리
    }

    switch (risk.effect) {
        case 'interest_1month':
            result.delayMonths = 1;
            result.message = `${risk.name}: 1달 지연 (이자비용 발생)`;
            break;

        case 'cost_increase_10':
            result.costIncrease = 0.1;
            result.message = `${risk.name}: 건축비 10% 상승`;
            break;

        case 'cost_increase_20':
            result.costIncrease = 0.2;
            result.message = `${risk.name}: 건축비 20% 상승`;
            break;

        case 'interest_increase':
            result.interestMultiplier = 1.5;
            result.message = `${risk.name}: 이자비용 1.5배 증가`;
            break;

        case 'payment_stage_loss':
            result.costIncrease = 1 / constructor.paymentStages;
            result.message = `${risk.name}: 1단계 시공비 재지출!`;
            break;

        case 'total_loss':
            result.isTotalLoss = true;
            result.message = `${risk.name}: 건물 붕괴! 모든 투자 손실!`;
            break;

        case 'interest_save_1month':
            result.delayMonths = -1;
            result.message = `${risk.name}: 공기 단축! 1달 이자비용 절감`;
            break;

        case 'none':
            result.message = `${risk.name}: ${risk.description}`;
            break;

        case 'conditional_delay':
            // 50% 이전이면 1달 지연 (건설 초반에 뽑힌 카드에만 적용)
            // 카드가 시공 기간 전반부에 뽑히면 지연 적용
            result.delayMonths = 1;
            result.message = `${risk.name}: 공사 1달 지연!`;
            break;
    }

    return result;
}
