# FINTRIS Frontend

> 잔액을 하나의 숫자가 아니라 목적별 **블록**으로 나눠, 배우지 않고도 자금 상태를 보고 느껴 행동하게 만드는 개인 금융 관리 서비스 **FINTRIS**의 모바일 앱입니다.

한국항공대학교 소프트웨어학과 · 팀 **이거해조 (KAU-DoThis)**

<br>

## 🛠 Tech Stack

| 구분 | 기술 |
| --- | --- |
| Language & Framework | TypeScript, React Native, Expo (EAS development build) |
| Styling | NativeWind |
| State Management | TanStack Query, Zustand |
| Notifications & Security | Expo Notifications (Expo Push), expo-secure-store |
| Build & Deploy | EAS Build, Google Play |
| Tools | Figma, ESLint, Prettier, VS Code, Android Studio, Git, GitHub |

<br>

## 👥 Frontend Team

| 이름 | 역할 |
| --- | --- |
| 김승욱 | Frontend |
| 정관혁 | Frontend, Design |

<br>

## 🧭 개발 원칙

- 서버 데이터는 **TanStack Query**, 클라이언트 상태는 **Zustand**로 관리한다.
- 금액·달성률·블록 상태 등 **계산 값은 서버 응답을 그대로 사용**하고, 화면에서 다시 계산하지 않는다.
- 금액은 **원 단위 정수**로 받으며, 표시할 때만 포맷팅한다. (예: `252000` → `252,000원`)
- 토큰 등 민감 정보는 **expo-secure-store**에 저장한다. AsyncStorage에 저장하지 않는다.
- API 개발 전에는 **API 명세의 응답 예시로 목업**을 만들어 먼저 개발한다.

<br>

## 🚀 Getting Started

### 요구 사항

- Node.js (LTS)
- pnpm
- Android Studio (에뮬레이터) 또는 Android 기기
- Expo 계정 (EAS Build 사용 시)

### 설치 및 실행

```bash
git clone https://github.com/KAU-DoThis/Front_end
cd Front_end
pnpm install
pnpm expo start
```

이 프로젝트는 **Expo Go가 아닌 development build**로 실행합니다. 처음 한 번 개발용 앱을 빌드해 기기 또는 에뮬레이터에 설치하세요.

```bash
eas build --profile development --platform android
```

### 환경 변수

민감 정보는 저장소에 올리지 않습니다. 프로젝트 루트에 `.env`(git 제외)를 만들어 설정하세요.

| 변수 | 설명 |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | 백엔드 API 서버 주소 |

> `EXPO_PUBLIC_` 접두사가 붙은 값은 앱 번들에 포함되므로, 비밀 키는 절대 넣지 않습니다.

<br>

## 🗂 Folder Structure

```
src/
├── app/                라우트 파일만 (Expo Router)
│   └── _layout.tsx     전역 Provider, 루트 레이아웃
├── assets/             앱 안에서 쓰는 정적 자산
│   ├── fonts/          로컬 폰트 파일
│   ├── icons/          SVG 아이콘 원본
│   └── images/         이미지
├── features/           도메인·기능 단위 비즈니스 로직
│   ├── auth/           로그인, 인증, 사용자 세션
│   │   ├── api/          요청 함수, TanStack Query 훅, query key
│   │   ├── components/   기능 전용 컴포넌트
│   │   ├── hooks/        기능 전용 로직 훅 (서버 통신 제외)
│   │   ├── stores/       클라이언트 상태 (Zustand)
│   │   └── types/        도메인 타입 정의
│   └── {domain}/       block, goal, suggestion 등
├── shared/             여러 기능에서 함께 쓰는 공통 자원
│   ├── components/
│   │   ├── layout/       공통 레이아웃 컴포넌트
│   │   └── ui/           Button, Input 등 순수 UI 컴포넌트
│   ├── constants/      공통 상수
│   ├── hooks/          공통 커스텀 훅
│   └── types/          공통 타입
├── lib/                API 클라이언트, QueryClient 설정, cn() 등 유틸
└── styles/
    └── global.css      NativeWind용 전역 CSS

루트(src/ 와 같은 계층)
├── assets/             앱 아이콘, 스플래시 (app.json에서 참조)
├── tailwind.config.js  색상·폰트·간격 등 디자인 토큰
├── nativewind-env.d.ts className 타입 지원
├── babel.config.js / metro.config.js   NativeWind 설정
└── app.json / eas.json
```

<br>

## 🌐 API

- Base URL: `{EXPO_PUBLIC_API_URL}/api/v1`
- 인증: `Authorization: Bearer {accessToken}`
- 응답 형식

```json
{
  "statusCode": 200,
  "timestamp": "2026-10-04T19:40:00+09:00",
  "path": "/api/v1/blocks/summary",
  "message": "요청이 성공했습니다.",
  "data": { },
  "error": null
}
```

실패 시 `data`는 `null`, `error`에 에러 코드(예: `BLOCK_INSUFFICIENT_AMOUNT`)가 담깁니다. 화면 분기는 `message`가 아니라 `error` 코드 기준으로 처리합니다.

<br>

---

# 📌 Convention

## 기본 원칙

- 모든 작업은 **브랜치 기반으로 진행**하며, `main` 브랜치에 직접 push 하지 않는다.
- 작업 시작 전 **최신 `dev` 브랜치를 pull** 한다.
- 기능 단위로 작업을 나누고 **PR을 통해 코드 리뷰 후 병합**한다.
- 기술적 의견이 다를 경우 **근거 기반으로 논의 후 다수결로 결정**한다.

<br>

## 🌿 Branch Strategy

```
main
dev        ← default
feature/*
refactor/*
fix/*
```

| 브랜치 | 설명 |
| --- | --- |
| `main` | 배포 가능한 안정 버전 유지, 직접 push 금지 |
| `dev` | 개발 통합 브랜치, feature 브랜치 병합 대상 |
| `feature/*` | 새로운 기능 개발 |
| `refactor/*` | 기능 변화 없는 코드 개선 |
| `fix/*` | 버그 수정 |

### 브랜치 네이밍

```
feature/{domainName}-{detail}
refactor/{domainName}-{detail}
fix/{domainName}-{detail}
```

예시: `feature/block-home`, `fix/auth-login-redirect`

<br>

## 🔄 Workflow

**1. 최신 `dev` 받기 및 의존성 설치** `현재 브랜치: dev`

```bash
git checkout dev
git pull origin dev
pnpm install
```

**2. 작업 브랜치 생성** `현재 브랜치: dev`

```bash
git checkout -b feature/{domainName}-{detail}
```

**3. 작업 후 커밋** `현재 브랜치: feature/*`

```bash
git add .
git commit -m "type: 작업 내용"
```

**4. 원격 브랜치에 push** `현재 브랜치: feature/*`

```bash
git push -u origin feature/{domainName}-{detail}
```

**5. GitHub에서 `dev` ← `feature/*` PR 생성 → 리뷰 후 merge**

**6. 다음 작업은 1번부터 반복**

> 작업 내역은 원격 `dev` 브랜치에 누적됩니다.
> 배포 시 `main` ← `dev` PR을 생성해 `main`에 merge 합니다.

<br>

## 📝 Commit Convention

```
type: 작업 내용
```

| 타입 | 설명 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 (코드 변경 없음) |
| `style` | 코드 포맷팅, 세미콜론 등 스타일 변경 (논리 변경 없음) |
| `refactor` | 리팩토링 (기능 변화 없음) |
| `test` | 테스트 코드 추가/수정 |
| `chore` | 빌드, 패키지 매니저 설정 등 기타 작업 |
| `design` | 사용자 UI 디자인 변경 |
| `comment` | 필요한 주석 추가 및 변경 |
| `rename` | 파일 혹은 폴더명을 수정하거나 옮기는 작업만 한 경우 |
| `remove` | 파일을 삭제하는 작업만 한 경우 |
| `!HOTFIX` | 급하게 치명적인 버그를 고쳐야 하는 경우 |

예시: `feat: 홈 화면 블록 시각화 구현`

<br>

## 🔀 Pull Request

### PR 생성 기준

- 기능 단위 작업 완료 시 PR 생성
- `dev` 브랜치 기준으로 PR 생성

### PR 제목

```
[타입] #이슈번호 제목
```

예시: `[feat] #12 홈 화면 블록 시각화 구현`

### PR 본문

```markdown
## 📌 관련 이슈
- close #이슈번호

## ✨ 작업 내용
- 홈 화면 블록 카드 컴포넌트 구현
- 블록 현황 조회 API 연동 (TanStack Query)
- 블록 상태(안전/주의/위험)에 따른 색상 적용

## 📸 스크린샷 / 테스트 결과
<!-- 화면 캡처 또는 녹화를 첨부해주세요. -->

## 🔍 리뷰 포인트
- 블록 크기 계산 로직이 화면 크기별로 자연스러운지 확인 부탁드립니다.

## ✅ 체크리스트
- [ ] 커밋 메시지 컨벤션을 준수했는가?
- [ ] 로컬에서 실행 및 빌드가 성공했는가?
- [ ] 불필요한 주석이나 console.log를 제거했는가?
- [ ] 민감 정보(키, 토큰)가 커밋에 포함되지 않았는가?
```

### PR 리뷰 규칙

- 최소 **1명 이상 리뷰 후 merge**
- 리뷰 코멘트 반영 후 merge 진행

<br>

## 🎨 Code Style

- **Prettier** 사용
- **ESLint** 적용
- 세미콜론 사용
- 싱글 쿼트 사용
- 들여쓰기 4칸
- 컴포넌트는 `PascalCase`, 함수·변수는 `camelCase`, 상수는 `UPPER_SNAKE_CASE`
- 커스텀 훅은 `use`로 시작 (예: `useBlockSummary`)
