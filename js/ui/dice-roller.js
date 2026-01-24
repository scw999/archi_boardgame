// 주사위 굴리기 UI 및 애니메이션
import { rollDice, rollStartingDice, getDiceEmoji, generateRollSequence } from '../core/dice.js';

// 주사위 컨테이너 생성
export function createDiceContainer() {
    let container = document.getElementById('dice-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dice-container';
        container.className = 'dice-container';
        document.body.appendChild(container);
    }
    return container;
}

// 주사위 굴리기 UI (단일)
export async function showDiceRoll(onComplete) {
    const container = createDiceContainer();

    return new Promise((resolve) => {
        container.innerHTML = `
      <div class="dice-overlay">
        <div class="dice-modal">
          <div class="dice-title">🎲 주사위 굴리기</div>
          <div class="dice-display">
            <div class="dice rolling">🎲</div>
          </div>
          <button class="roll-button">굴리기!</button>
        </div>
      </div>
    `;

        container.classList.add('active');

        const rollBtn = container.querySelector('.roll-button');
        const diceEl = container.querySelector('.dice');

        rollBtn.addEventListener('click', async () => {
            rollBtn.disabled = true;
            rollBtn.textContent = '굴리는 중...';

            // 최종 결과 먼저 결정
            const finalValue = rollDice();
            const sequence = generateRollSequence(finalValue, 15);

            // 애니메이션
            for (let i = 0; i < sequence.length; i++) {
                diceEl.textContent = getDiceEmoji(sequence[i]);
                await delay(80 + i * 10); // 점점 느려짐
            }

            // 결과 표시
            diceEl.classList.remove('rolling');
            diceEl.classList.add('result');
            diceEl.textContent = getDiceEmoji(finalValue);

            rollBtn.textContent = `결과: ${finalValue}`;

            await delay(1500);

            container.classList.remove('active');
            container.innerHTML = '';

            if (onComplete) onComplete(finalValue);
            resolve(finalValue);
        });
    });
}

// 시작 자금용 주사위 (3개)
export async function showStartingDiceRoll(playerName, onComplete) {
    const container = createDiceContainer();

    return new Promise((resolve) => {
        container.innerHTML = `
      <div class="dice-overlay">
        <div class="dice-modal large">
          <div class="dice-title">💰 시작 자금 결정</div>
          <div class="dice-subtitle">${playerName}님의 차례</div>
          <div class="dice-display triple">
            <div class="dice rolling">🎲</div>
            <div class="dice rolling">🎲</div>
            <div class="dice rolling">🎲</div>
          </div>
          <div class="dice-total"></div>
          <button class="roll-button">주사위 굴리기!</button>
        </div>
      </div>
    `;

        container.classList.add('active');

        const rollBtn = container.querySelector('.roll-button');
        const diceEls = container.querySelectorAll('.dice');
        const totalEl = container.querySelector('.dice-total');

        rollBtn.addEventListener('click', async () => {
            rollBtn.disabled = true;
            rollBtn.textContent = '굴리는 중...';

            // 결과 결정
            const result = rollStartingDice();
            const sequences = result.dice.map(val => generateRollSequence(val, 15));

            // 각 주사위 애니메이션
            for (let i = 0; i < 15; i++) {
                diceEls.forEach((el, idx) => {
                    el.textContent = getDiceEmoji(sequences[idx][i]);
                });
                await delay(80 + i * 10);
            }

            // 결과 표시
            diceEls.forEach((el, idx) => {
                el.classList.remove('rolling');
                el.classList.add('result');
                el.textContent = getDiceEmoji(result.dice[idx]);
            });

            // 합계 표시 - 증가된 자금 테이블
            const moneyTable = {
                18: '20억', 17: '20억', 16: '15억', 15: '15억',
                14: '10억', 13: '10억', 12: '8억', 11: '8억',
                10: '7억', 9: '7억', 8: '6억', 7: '6억',
                6: '5억', 5: '5억', 4: '5억', 3: '5억'
            };

            totalEl.innerHTML = `
        <div class="total-sum">합계: ${result.total}</div>
        <div class="starting-money">시작 자금: ${moneyTable[result.total] || '5억'}</div>
      `;

            rollBtn.textContent = '확인';
            rollBtn.disabled = false;
            rollBtn.onclick = () => {
                container.classList.remove('active');
                container.innerHTML = '';
                if (onComplete) onComplete(result);
                resolve(result);
            };
        });
    });
}

// 토지 구매 주사위
export async function showLandPurchaseDice(landName, priceType, requiredDice, onComplete, canReroll = false) {
    const container = createDiceContainer();

    const probability = ((requiredDice.length / 6) * 100).toFixed(0);
    let rerollUsed = false;

    return new Promise((resolve) => {
        const renderDiceModal = () => {
            container.innerHTML = `
          <div class="dice-overlay">
            <div class="dice-modal">
              <div class="dice-title">🗺️ 토지 구매 도전</div>
              <div class="dice-subtitle">${landName} (${priceType === 'urgent' ? '급매' : priceType === 'auction' ? '경매' : '시세'})</div>
              <div class="dice-info">
                <div>필요한 눈: ${requiredDice.join(', ')}</div>
                <div>성공 확률: ${probability}%</div>
                ${canReroll && !rerollUsed ? '<div class="reroll-info">🎲 재굴림 기회 1회</div>' : ''}
              </div>
              <div class="dice-display">
                <div class="dice rolling">🎲</div>
              </div>
              <div class="dice-result"></div>
              <div class="dice-buttons">
                <button class="roll-button">도전!</button>
              </div>
            </div>
          </div>
        `;
        };

        renderDiceModal();
        container.classList.add('active');

        const handleRoll = async (isReroll = false) => {
            const rollBtn = container.querySelector('.roll-button');
            const rerollBtn = container.querySelector('.reroll-button');
            const diceEl = container.querySelector('.dice');
            const resultEl = container.querySelector('.dice-result');

            if (rollBtn) rollBtn.disabled = true;
            if (rerollBtn) rerollBtn.disabled = true;

            // 재굴림 시 초기화
            if (isReroll) {
                diceEl.classList.remove('result', 'fail', 'success');
                diceEl.classList.add('rolling');
                resultEl.innerHTML = '';
                rerollUsed = true;
            }

            const finalValue = rollDice();
            const sequence = generateRollSequence(finalValue, 20);

            // 긴장감 있는 애니메이션
            for (let i = 0; i < sequence.length; i++) {
                diceEl.textContent = getDiceEmoji(sequence[i]);
                await delay(50 + i * 15);
            }

            diceEl.classList.remove('rolling');
            diceEl.classList.add('result');

            const isSuccess = requiredDice.includes(finalValue);

            if (isSuccess) {
                diceEl.classList.add('success');
                resultEl.innerHTML = `
                  <div class="result-success">🎉 낙찰 성공!</div>
                  <div class="result-value">${getDiceEmoji(finalValue)} = ${finalValue}</div>
                `;
                // 성공 시 바로 종료
                await delay(2000);
                container.classList.remove('active');
                container.innerHTML = '';
                const result = { value: finalValue, isSuccess, rerollUsed };
                if (onComplete) onComplete(result);
                resolve(result);
            } else {
                diceEl.classList.add('fail');

                // 재굴림 가능 여부 확인
                if (canReroll && !rerollUsed) {
                    resultEl.innerHTML = `
                      <div class="result-fail">😢 매매 불발</div>
                      <div class="result-value">${getDiceEmoji(finalValue)} = ${finalValue}</div>
                      <div class="reroll-notice">🎲 재굴림 기회가 있습니다!</div>
                    `;
                    // 버튼 영역 업데이트
                    const buttonsEl = container.querySelector('.dice-buttons');
                    buttonsEl.innerHTML = `
                      <button class="reroll-button">🎲 재굴림!</button>
                      <button class="skip-button">포기하기</button>
                    `;

                    // 재굴림 버튼 이벤트
                    container.querySelector('.reroll-button').addEventListener('click', () => {
                        handleRoll(true);
                    });

                    // 포기 버튼 이벤트
                    container.querySelector('.skip-button').addEventListener('click', async () => {
                        await delay(500);
                        container.classList.remove('active');
                        container.innerHTML = '';
                        const result = { value: finalValue, isSuccess: false, rerollUsed: false };
                        if (onComplete) onComplete(result);
                        resolve(result);
                    });
                } else {
                    resultEl.innerHTML = `
                      <div class="result-fail">😢 매매 불발</div>
                      <div class="result-value">${getDiceEmoji(finalValue)} = ${finalValue}</div>
                    `;
                    // 실패 시 종료
                    await delay(2000);
                    container.classList.remove('active');
                    container.innerHTML = '';
                    const result = { value: finalValue, isSuccess, rerollUsed };
                    if (onComplete) onComplete(result);
                    resolve(result);
                }
            }
        };

        container.querySelector('.roll-button').addEventListener('click', () => handleRoll(false));
    });
}

// 유틸리티: 딜레이
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 리스크 카드 뽑기 애니메이션 (수동 모드)
export async function showRiskCardDraw(risks, onComplete) {
    return new Promise((resolve) => {
        const container = createDiceContainer();
        let currentCardIndex = 0;

        const renderCards = () => {
            container.innerHTML = `
            <div class="dice-overlay">
              <div class="dice-modal large">
                <div class="dice-title">⚠️ 리스크 카드 공개</div>
                <div class="risk-progress">
                  <span>진행: ${currentCardIndex} / ${risks.length}</span>
                </div>
                <div class="risk-cards-container manual">
                  ${risks.map((risk, idx) => `
                    <div class="risk-card-slot ${idx < currentCardIndex ? 'revealed' : ''} ${idx === currentCardIndex ? 'clickable' : ''}"
                         data-index="${idx}">
                      ${idx < currentCardIndex ? `
                        <div class="risk-revealed ${risk.severity}">
                          <span class="risk-emoji">${risk.emoji}</span>
                          <span class="risk-name">${risk.name}</span>
                        </div>
                      ` : `
                        <div class="card-back ${idx === currentCardIndex ? 'pulse' : ''}">
                          ${idx === currentCardIndex ? '클릭!' : '?'}
                        </div>
                      `}
                    </div>
                  `).join('')}
                </div>
                <div class="risk-instruction">
                  ${currentCardIndex < risks.length
                    ? `<p>🖱️ 카드 ${currentCardIndex + 1}번을 클릭하여 공개하세요!</p>`
                    : '<p>✅ 모든 카드가 공개되었습니다!</p>'
                  }
                </div>
                ${currentCardIndex >= risks.length ? `
                  <button class="reveal-button complete">결과 확인</button>
                ` : ''}
              </div>
            </div>
          `;
        };

        const handleCardClick = async (index) => {
            if (index !== currentCardIndex) return;

            const slot = container.querySelector(`[data-index="${index}"]`);
            if (!slot) return;

            slot.classList.add('revealing');
            await delay(300);

            currentCardIndex++;
            renderCards();

            // 모든 카드가 공개되면 완료 버튼 활성화
            if (currentCardIndex >= risks.length) {
                const completeBtn = container.querySelector('.reveal-button.complete');
                if (completeBtn) {
                    completeBtn.addEventListener('click', () => {
                        container.classList.remove('active');
                        container.innerHTML = '';
                        if (onComplete) onComplete(risks);
                        resolve(risks);
                    });
                }
            }
        };

        container.classList.add('active');
        renderCards();

        // 카드 클릭 이벤트 위임
        container.addEventListener('click', (e) => {
            const slot = e.target.closest('.risk-card-slot.clickable');
            if (slot) {
                const index = parseInt(slot.dataset.index);
                handleCardClick(index);
            }
        });
    });
}

// 리스크 카드 뽑기 (자동 모드 - 레거시 호환)
export async function showRiskCardDrawAuto(risks, onComplete) {
    const container = createDiceContainer();

    container.innerHTML = `
    <div class="dice-overlay">
      <div class="dice-modal large">
        <div class="dice-title">⚠️ 리스크 카드 공개</div>
        <div class="risk-cards-container">
          ${risks.map((_, idx) => `
            <div class="risk-card-slot" data-index="${idx}">
              <div class="card-back">?</div>
            </div>
          `).join('')}
        </div>
        <button class="reveal-button">카드 공개!</button>
      </div>
    </div>
  `;

    container.classList.add('active');

    const revealBtn = container.querySelector('.reveal-button');
    const slots = container.querySelectorAll('.risk-card-slot');

    revealBtn.addEventListener('click', async () => {
        revealBtn.disabled = true;

        // 순차적으로 카드 공개
        for (let i = 0; i < risks.length; i++) {
            await delay(500);

            const slot = slots[i];
            const risk = risks[i];

            slot.classList.add('revealing');
            await delay(300);

            slot.innerHTML = `
        <div class="risk-revealed ${risk.severity}">
          <span class="risk-emoji">${risk.emoji}</span>
          <span class="risk-name">${risk.name}</span>
        </div>
      `;

            slot.classList.remove('revealing');
            slot.classList.add('revealed');
        }

        revealBtn.textContent = '확인';
        revealBtn.disabled = false;
        revealBtn.onclick = () => {
            container.classList.remove('active');
            container.innerHTML = '';
            if (onComplete) onComplete(risks);
        };
    });
}
