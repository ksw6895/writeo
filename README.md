
# EWML Pad v0.1

External Working Memory Language (EWML) — 학습 + 실습 통합 웹앱 (Vite + React + TS).

## Guide (메인 페이지)

- 홈: `/` — 가이드 + 소개(한국어 기본, EN 토글)
- In-app: Editor 상단 `Guide` 버튼으로 새 탭에서 열기
- Pad(편집기): `/pad.html` (Vite dev: http://localhost:5173/pad.html)

## 실행

```bash
npm i
npm run dev   # http://localhost:5173
```

## 폴더

- `src/ewml/parser.ts`  : EWML 라인 파서/정규화
- `src/ewml/engine.ts`  : posterior 계산, 린트
- `src/components/*`    : 패널 UI (Editor/Outline/Graph/Console/Learn)
- `public/demo.ewml`    : 샘플 문서
- `src/lessons/lesson1.json` : 학습 모드 예시

## EWML 요약
- 역할: `H, E+, E-, R, C, D, T, M`
- 메타: `@p, @lo, @LR, @grade, @ref, @kappa, @src, @time`
- 기본 규칙: `lo_post = lo_prior + Σ κ·ln(LR)`; `p = 1 / (1+e^{-lo})`
- 등급→LR: very-strong+ 10 | strong+ 5 | moderate+ 3 | weak+ 1.5 | neutral 1 | weak- 1/1.5 | moderate- 1/3 | strong- 1/5 | very-strong- 1/10
