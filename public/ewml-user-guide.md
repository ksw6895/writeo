# EWML User Guide (Comprehensive)

External Working Memory Language (EWML) — 논증과 의사결정을 위해 “외부 작업 기억”을 구조화하는 초경량 표기입니다. 이 가이드는 EWML의 철학, 마인드셋, 문법/메타, 계산 규칙, 활용 분야와 베스트 프랙티스를 한눈에 제공합니다.

- 참고 소스: `src/ewml/parser.ts`, `src/ewml/engine.ts`, `public/demo.ewml`
- 실행/패드: `npm run dev` 후 `/pad.html` (README 참고)

## 철학 (Why EWML?)
- 가벼운 형식화: 한 줄 한 주장/근거로 외부화해 인지부하를 낮춤
- 점진적 엄밀성: 메타(@p/@lo/@LR/@grade/@kappa/@ref 등)로 필요 시 정밀화
- 투명한 업데이트: LR와 logit 누적으로 사전→사후를 일관 기록
- 출처/시간성: `@src`, `@time`, `M:`로 맥락/최신성 보존
- 도구 친화성: 라인 기반 파싱으로 UI·린트 연계 용이

## 마인드셋
- 원자화: 각 줄은 하나의 역할/핵심 주장만
- 연결: 모든 E±는 `@ref=Hn`
- 보수적 업데이트: 불확실/상관 근거는 `@kappa<1`
- 캘리브레이션: `@p`/`@lo` 일관성, grade→LR 팀 합의 유지
- 추적: `R/D/T/C`로 의사결정 문맥 보존

## 언어 개요 (Roles)
- `H` 가설 — 가능하면 `@p` 또는 `@lo` 권장
- `E+` 지지 — `@ref` 필수, `@LR>1` 또는 `@grade`
- `E-` 반증 — `@ref` 필수, `@LR<1` 또는 `@grade`
- `R` 설명/관계 — 계산 미반영
- `C` 주석 — 계산 미반영
- `D` 결정 — 임계/행동 명시
- `T` 작업 — 일정/결과 기록
- `M` 문서 메타 — 전역 정보

형식: `ROLE: 내용 @meta1=값, @meta2=값`

## 메타 키
- 확률: `@p`(0~1), `@lo`(logit) — 한쪽만 써도 동기화
- 강도: `@LR` 또는 `@grade`(very-strong+/…/very-strong-)
- 연결: `@ref=H1,H2`(콤마/세미콜론 허용)
- 가중치: `@kappa`(기본 1.0)
- 출처/시간: `@src`, `@time`

등급→LR: very-strong+ 10 | strong+ 5 | moderate+ 3 | weak+ 1.5 | neutral 1 | weak- 1/1.5 | moderate- 1/3 | strong- 1/5 | very-strong- 1/10

## 계산 규칙 (Bayes-lite)
- `lo = ln(p/(1-p))`, `p = 1/(1+e^{-lo})`
- `lo_post = lo_prior + Σ κ·ln(LR)` (H별)
- 린트: prior 누락, @ref 누락, E±·LR 방향성 위반 등 경고

## 빠른 시작
```
H: PE 의심 환자 @p=0.02
E+: 빈맥 @ref=H1 @grade=weak+
E-: D-dimer(-) @ref=H1 @grade=strong-
D: if p(H1) < 0.01 => CTPA 생략
T: 결과 확인 @time=2025-08-17
```

## 쓰기 좋은 분야
- 제품/실험, 보안/사건 대응, 연구 리딩 노트, 조사/법정 논증, 설계 의사결정 기록 등

## 특장점
- 단순성, 명시적 연결, 수치/서술 공존, 자동 점검, 확장성

## 한계/주의
- 근거 독립 가정, LR 추정 주관성, 순환 의존 미검출(MVP), 본문 내 `@` 주의

## 베스트 프랙티스
- H에 prior 명시, E±는 `@ref`·강도 필수, 상관 근거 `@kappa<1`, D는 임계/행동 포함, T로 검증 루프 닫기

## FAQ
- `@p`와 `@lo` 중 하나만 적어도 자동 동기화
- `E-`에 `LR>1` 사용 시 경고(권장 위반) — 의미상 `LR<1` 권장
- `@ref`는 여러 H 가능 (콤마/세미콜론)

---

LLM Assist: `/api/ewml-assist`(Vercel). 환경변수 `GEMINI_API_KEY` 필요. 모델은 `GEMINI_MODEL`(기본: `gemini-1.5-flash`). 2.5 Flash가 가능하면 해당 모델 ID로 설정하세요.
