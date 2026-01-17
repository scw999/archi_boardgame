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

            // 합계 표시
            const moneyTable = {
                18: '10억', 17: '10억', 16: '5억', 15: '5억',
                14: '3억', 13: '3억', 12: '3억',
                11: '2억', 10: '2억', 9: '2억', 8: '2억', 7: '2억', 6: '2억', 5: '2억', 4: '2억', 3: '2억'
            };

            totalEl.innerHTML = `
        <div class="total-sum">합계: ${result.total}</div>
        <div class="starting-money">시작 자금: ${moneyTable[result.total] || '2억'}</div>
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
export async function showLandPurchaseDice(landName, priceType, requiredDice, onComplete) {
    const container = createDiceContainer();

    const probability = ((requiredDice.length / 6) * 100).toFixed(0);

    return new Promise((resolve) => {
        container.innerHTML = `
      <div class="dice-overlay">
        <div class="dice-modal">
          <div class="dice-title">🗺️ 토지 구매 도전</div>
          <div class="dice-subtitle">${landName} (${priceType === 'urgent' ? '급매' : priceType === 'auction' ? '경매' : '시세'})</div>
          <div class="dice-info">
            <div>필요한 눈: ${requiredDice.join(', ')}</div>
            <div>성공 확률: ${probability}%</div>
          </div>
          <div class="dice-display">
            <div class="dice rolling">🎲</div>
          </div>
          <div class="dice-result"></div>
          <button class="roll-button">도전!</button>
        </div>
      </div>
    `;

        container.classList.add('active');

        const rollBtn = container.querySelector('.roll-button');
        const diceEl = container.querySelector('.dice');
        const resultEl = container.querySelector('.dice-result');

        rollBtn.addEventListener('click', async () => {
            rollBtn.disabled = true;

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
            } else {
                diceEl.classList.add('fail');
                resultEl.innerHTML = `
          <div class="result-fail">😢 매매 불발</div>
          <div class="result-value">${getDiceEmoji(finalValue)} = ${finalValue}</div>
        `;
            }

            await delay(2000);

            container.classList.remove('active');
            container.innerHTML = '';

            const result = { value: finalValue, isSuccess };
            if (onComplete) onComplete(result);
            resolve(result);
        });
    });
}

// 유틸리티: 딜레이
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 리스크 카드 뽑기 애니메이션
export async function showRiskCardDraw(risks, onComplete) {
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
