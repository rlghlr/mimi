# Muse — 뷰티 모델 × 아티스트 매칭 마켓플레이스

뷰티 모델·고객과 뷰티 전문가를 잇는 양면형 매칭 플랫폼. 모바일 우선 + 웹 반응형.
설계 문서: [`docs/planning.html`](docs/planning.html)

## 스택
- **Frontend**: Next.js 14 (App Router) · TypeScript · Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL · Auth · Realtime · Storage) · RLS
- **권한**: CUSTOMER / PROFESSIONAL / ADMIN (Role 기반 + RLS)

## 프로젝트 구조
```
src/
  app/                # 라우트 (App Router)
  lib/
    supabase/         # client / server / middleware
    database.types.ts # DB 타입 (스키마와 동기화)
    constants.ts      # 라벨·에러 메시지·크레딧 정책
supabase/
  migrations/         # 스키마 · 함수/RPC · RLS
  seed.sql            # 데모 데이터
docs/planning.html    # 설계서
```

## 데이터베이스 실행 (둘 중 하나 선택)

### A. 로컬 (Docker 필요)
```bash
# Docker Desktop 설치 후
npm run db:start      # 로컬 Supabase 기동 (URL·anon key 출력)
npm run db:reset      # 마이그레이션 + seed 적용
npm run db:types      # DB 타입 재생성
```
출력된 URL/anon key/service_role key를 `.env.local`에 채웁니다.

### B. 클라우드 (Docker 불필요)
1. https://supabase.com 에서 새 프로젝트 생성
2. `supabase link --project-ref <ref>` 후 `supabase db push`
3. Project Settings → API 의 URL·anon·service_role 키를 `.env.local`에 입력

## 개발 서버
```bash
npm run dev           # http://127.0.0.1:3000
```

## 데모 계정 (seed 적용 시) — 비밀번호 `muse1234`
| 역할 | 이메일 |
|------|--------|
| 관리자 | admin@muse.dev |
| 전문가 | soo@muse.dev · jin@muse.dev |
| 고객/모델 | mina@muse.dev · hana@muse.dev |

## 참고
- Git 루트가 홈 디렉토리이므로 이 프로젝트는 `/Users/jaeu/mimi` 내에서만 관리합니다.
- 벤치마킹 대상의 상표·로고·카피·UI는 복제하지 않으며, 기능 구조와 UX만 참고합니다.
