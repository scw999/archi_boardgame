# 3D 건물 모델 (GLB 파일)

이 폴더에 GLB 형식의 3D 건물 모델을 추가할 수 있습니다.

## 지원 건물 타입

| 건물 타입 | 권장 파일명 | 권장 높이 |
|-----------|-------------|-----------|
| 단독주택 | house.glb | 6m |
| 전원주택 | country-house.glb | 6m |
| 상가주택 | mixed-use.glb | 12m |
| 카페 | cafe.glb | 3m |
| 풀빌라 | pool-villa.glb | 6m |
| 호텔 | hotel.glb | 24m |
| 대형카페 | large-cafe.glb | 6m |
| 상가 | store.glb | 15m |
| 복합몰 | mall.glb | 12m |
| 펜션 | pension.glb | 6m |
| 대형빌딩 | skyscraper.glb | 45m |

## 모델 설정 방법

`js/ui/building-3d-viewer.js` 파일에서 `BUILDING_GLB_MODELS` 객체를 수정합니다:

```javascript
export const BUILDING_GLB_MODELS = {
    '단독주택': 'assets/models/house.glb',
    '호텔': 'assets/models/hotel.glb',
    // ... 다른 건물들
};
```

## 모델 요구사항

- **형식**: GLB (Binary glTF)
- **원점**: 건물 바닥 중앙에 위치
- **방향**: +Z가 정면
- **단위**: 미터 (1 unit = 1m)
- **최대 파일 크기**: 10MB 이하 권장

## 추가 옵션

코드에서 개별 모델의 스케일과 회전을 조정할 수 있습니다:

```javascript
// viewer 인스턴스에서 호출
viewer.setGLBModel('호텔', 'assets/models/hotel.glb', {
    scale: 1.5,      // 스케일 조정
    rotation: Math.PI / 2,  // Y축 회전 (라디안)
    height: 30       // 모델 높이 (깃발 위치용)
});
```

## 무료 3D 모델 리소스

- [Sketchfab](https://sketchfab.com/) - GLB 다운로드 지원
- [Poly Pizza](https://poly.pizza/) - 무료 로우폴리 모델
- [Kenney Assets](https://kenney.nl/assets) - 게임용 무료 에셋
- [Quaternius](https://quaternius.com/) - 무료 게임 에셋

## DRACO 압축

대용량 모델은 DRACO 압축을 사용하여 파일 크기를 줄일 수 있습니다.
뷰어는 자동으로 DRACO 압축 모델을 지원합니다.
