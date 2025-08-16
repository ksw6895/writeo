
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

배포(Vercel):
- `vercel.json` 설정 포함. 정적 빌드(`dist`) + 서버리스 함수(`/api/*`) 동작.
- 환경변수 설정(대시보드 → Project → Settings → Environment Variables):
  - `GEMINI_API_KEY` (필수): Google Generative Language API 키
  - `GEMINI_MODEL` (선택): 모델 ID (기본 `gemini-1.5-flash`; 2.5 Flash 사용 시 정확한 ID 지정)
  - `GEMINI_API_VERSION` (선택): `v1`, `v1beta`, 또는 `auto`(기본 `v1beta`; `auto`는 v1 실패 시 v1beta 재시도)
  - `GEMINI_API_BASE` (선택): 기본 `https://generativelanguage.googleapis.com`

## 폴더

- `src/ewml/parser.ts`  : EWML 라인 파서/정규화
- `src/ewml/engine.ts`  : posterior 계산, 린트
- `src/components/*`    : 패널 UI (Editor/Outline/Graph/Console/Learn)
- `public/demo.ewml`    : 샘플 문서
- `src/lessons/lesson1.json` : 학습 모드 예시
- `api/ewml-assist.ts`  : LLM 어시스트(Vercel Edge) — 자유서술→EWML 변환/보강
  - POST `/api/ewml-assist` `{ mode: 'translate'|'enrich', input: string, options?: { language?: 'ko'|'en', includePriors?: boolean } }`
  - 응답: `{ output: string }` (EWML 라인들)
  - 환경: `GEMINI_MODEL`, `GEMINI_API_VERSION(v1|v1beta|auto)`, `GEMINI_API_BASE` 지원

## LLM Assist (Gemini)
- 에디터 상단 “AI 변환/AI 보강”: LLM으로 EWML을 자동 생성/보강합니다.
- 로컬 개발 시 `/api`가 없으므로 404가 날 수 있습니다(배포 환경에서 동작).
- API는 Google Generative Language `generateContent`(v1beta)를 호출합니다. 모델 ID는 환경변수로 주입하세요.
 - 로컬에서 서버리스까지 함께 테스트하려면 Vercel CLI를 사용하세요:
   ```bash
   npm i -g vercel
   vercel dev    # http://localhost:3000 (Vite와 충돌 시 포트를 조정)
   ```

## EWML 요약
- 역할: `H, E+, E-, R, C, D, T, M`
- 메타: `@p, @lo, @LR, @grade, @ref, @kappa, @src, @time`
- 기본 규칙: `lo_post = lo_prior + Σ κ·ln(LR)`; `p = 1 / (1+e^{-lo})`
- 등급→LR: very-strong+ 10 | strong+ 5 | moderate+ 3 | weak+ 1.5 | neutral 1 | weak- 1/1.5 | moderate- 1/3 | strong- 1/5 | very-strong- 1/10
