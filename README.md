# Archi BoardGame

캐시플로우 스타일의 자산 관리 보드게임 웹 애플리케이션입니다.

## 🎮 게임 특징

- 주사위를 굴려 게임 보드를 이동
- 주식, ETF, 부동산 등 다양한 투자 옵션
- 재무 상태 실시간 확인
- 패시브 인컴으로 Rat Race 탈출!

## 🚀 실행 방법

### 로컬 실행

정적 HTML 파일이므로 웹 브라우저에서 `index.html`을 직접 열거나, 로컬 서버를 사용하세요:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

## 🌐 배포

이 프로젝트는 Vercel에서 호스팅됩니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/archi_boardgame)

## 📁 프로젝트 구조

```
archi_boardgame/
├── index.html          # 메인 HTML
├── js/                 # JavaScript 모듈
│   ├── core/          # 게임 핵심 로직
│   ├── data/          # 게임 데이터
│   └── ui/            # UI 컴포넌트
├── styles/            # CSS 스타일시트
├── vercel.json        # Vercel 설정
└── README.md
```

## 📝 라이선스

MIT License
