# 나만의고물상 (gomulsang-shop)

앱인토스 미니앱 7번째. 광고 시청 기반 **앱테크**. 업계 1위 「금 모으기」 참고 — **방치형+활동형 혼합**. 고물을 주워 모아 팔면 **엽전**, 엽전은 **토스 포인트**로 교환.

- **카테고리**: 비게임 (`grantPromotionReward`)
- **타겟**: 핀테크 열성/앱테크 사용자
- **인앱 재화**: 엽전 (≠ 토스 포인트) · 현금화 = "토스 포인트로 받기"
- **현재 단계**: 설계 문서 완료, 코드 스캐폴딩 전

## 핵심
- 손수레 idle 적재(방치=싼 고물↑) → [광고] 활동(고철↑) → 창고로 옮기기 → 판매(시세) → 엽전 → [광고] 토스 포인트 교환
- 고물 4종 확률형: 📄폐지(1) 🍾공병(5) ⚙️고철(20) 🔩특수(100)
- 코드 재사용: 딸기 idle(`../semicon-shop/app`) + 빙수 확률 티어(`bingsu-shop`)

## 문서
- [`CLAUDE.md`](./CLAUDE.md) · [`docs/PRD.md`](./docs/PRD.md) · [`docs/BM_DESIGN.md`](./docs/BM_DESIGN.md) · [`docs/DESIGN_SPEC.md`](./docs/DESIGN_SPEC.md) · [`docs/ILLUSTRATION_GUIDE.md`](./docs/ILLUSTRATION_GUIDE.md) · [`docs/ROADMAP.md`](./docs/ROADMAP.md)

## 다음 단계
1. BM 정밀 수치 시뮬레이션 (시세·확률·엽전 환율·캡, 마진 ~50%)
2. 스캐폴딩 — 딸기 idle + 빙수 티어 결합
