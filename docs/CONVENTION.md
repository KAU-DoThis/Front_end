# FINTRIS Frontend Convention

> 브랜치 전략, 커밋, PR 규칙은 [README](../README.md#-convention)를 따릅니다.
> 이 문서는 코드를 작성할 때 지켜야 할 규칙을 정리합니다. 규칙을 바꿀 때는 이 문서를 PR로 수정합니다.

<br>

## 1. 폴더 구조

```
src/
├── app/            라우트 파일만 (Expo Router)
├── assets/         폰트, 아이콘, 이미지
├── features/       도메인별 코드
│   └── {domain}/
│       ├── api/          요청 함수, query key, TanStack Query 훅
│       ├── components/   이 기능에서만 쓰는 컴포넌트
│       ├── hooks/        이 기능에서만 쓰는 로직 훅 (서버 통신 제외)
│       ├── screens/      화면 컴포넌트 (라우트에서 불러옴)
│       ├── stores/       클라이언트 상태 (Zustand)
│       └── types/        도메인 타입
├── shared/         두 기능 이상에서 쓰는 공통 코드
│   ├── components/
│   │   ├── layout/       Screen, Header 등 레이아웃
│   │   └── ui/           Button, Input 등 순수 UI
│   ├── constants/
│   ├── hooks/
│   └── types/
├── lib/            API 클라이언트, QueryClient, 토큰 저장소, 유틸
└── styles/         NativeWind 전역 CSS
```

- 필요한 폴더만 만든다. 빈 폴더를 미리 만들지 않는다.
- 다른 기능의 내부 파일을 직접 import하지 않는다. 두 기능 이상에서 필요해지면 `shared/`로 옮긴다.

### 도메인 매핑

백엔드 도메인과 이름을 맞춘다. 화면이 확정되면 보완한다.

| 도메인        | 범위                                            |
| ------------- | ----------------------------------------------- |
| `auth`        | 로그인, 회원가입, 온보딩, 세션                  |
| `connection`  | 금융기관 연결, 연결 상태                        |
| `transaction` | 거래 내역, 소비 통계                            |
| `block`       | 홈 블록 현황, 블록 생성·상세, 블록 간 자금 이동 |
| `goal`        | 목표 설정, 달성률, 절약 탭                      |
| `suggestion`  | AI 절약 제안, 챗봇(에이전트)                    |
| `report`      | 월간 리포트                                     |
| `mypage`      | 마이페이지, 설정                                |
| `dev`         | 개발 모드 전용 화면 (공통 컴포넌트 확인 등)     |

<br>

## 2. 라우팅

- `src/app/`에는 라우트 파일만 둔다. 화면 UI는 `features/{domain}/screens/`에 작성하고 라우트에서 불러온다.

```tsx
// src/app/(tabs)/index.tsx
import { BlockHomeScreen } from '@/features/block/screens/BlockHomeScreen';

export default BlockHomeScreen;
```

- 라우트 그룹: 로그인 전 화면은 `(auth)`, 하단 탭 화면은 `(tabs)`
- 하단 탭: 블록 `(tabs)/index` · 내역 `(tabs)/transactions` · 절약 `(tabs)/saving` · 리포트 `(tabs)/report`
    - 가운데 에이전트 버튼은 탭이 아니라 루트 스택의 `agent` 화면을 연다. (아래에서 올라오는 전체 화면, 뒤로 가기로 닫힘)
    - 탭 화면은 `<Screen edges={['top']}>`을 쓴다. 아래 여백은 탭 바가 처리한다.
- 개발용 화면은 `app/dev/` 아래에 두고 `__DEV__`가 아니면 홈으로 돌려보낸다. (공통 컴포넌트 확인: `/dev/components`)
- 라우트 파일명은 소문자 kebab-case (`block-detail.tsx`, `[blockId].tsx`)
- 라우트 파일만 `export default`를 쓴다. (Expo Router 규칙)

<br>

## 3. 스타일링

- 스타일은 NativeWind `className`으로 작성한다.
- **색상값을 코드에 직접 쓰지 않는다.** 디자인 토큰만 쓴다.
    - 토큰 값은 `src/styles/tokens.js`에 있고, `tailwind.config.js`가 이 파일로 className을 만든다. (Figma 변수 `Fintris Colors`와 같은 값)
    - `bg-primary-600` ⭕ / `bg-[#2D8F94]` ❌ / `style={{ color: '#2D8F94' }}` ❌
    - className을 쓸 수 없는 곳(ActivityIndicator `color`, 라이브러리 style prop 등)만 `tokens.js`를 import해서 쓴다.
    - 새 색상, 폰트 크기, 간격이 필요하면 프론트 팀과 합의한 뒤 `tokens.js`에 추가한다.
- 디자인 토큰

| 구분   | 클래스                                                                                   | 비고                                                |
| ------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 색     | `primary-*`, `ink`, `surface-*`, `line-*`, `caution-*`, `danger-*`, `delta-*`, `block-*` | 이름과 용도는 `tokens.js` 주석 참고                 |
| 글자   | `text-10` `11` `12` `13` `15` `16` `17` `20` `24` `30`                                   | 행간 포함. 10·11은 상태칩·배지·차트 축에만          |
| 굵기   | `font-regular`, `font-semibold`, `font-bold`                                             | Pretendard. `font-medium` 등은 없다                 |
| 모서리 | `rounded-8` `12` `14` `16` `24` `full`                                                   | 칩 · 중간/작은 버튼·입력 · 큰 버튼 · 카드 · 큰 카드 |

- 글자는 RN `Text` 대신 `AppText`를 쓴다. (기본 Pretendard Regular · 15 · `text-ink`, 폰트가 상속되지 않기 때문)
- 조건부 클래스는 `cn()`으로 합친다.

```tsx
<Pressable className={cn('rounded-12 px-4', isSelected && 'bg-primary-700', className)} />
```

- `StyleSheet`, `style` prop은 className으로 표현할 수 없는 경우에만 쓴다.
    - 예: Reanimated 애니메이션 값, 금액에 비례해 계산되는 블록 크기, 바텀시트 핸들·배경
- 화면 너비를 숫자로 고정하지 않는다. `flex`, `w-full`, 화면 패딩으로 배치한다.
- 모든 화면은 최상위를 `Screen` 컴포넌트로 감싼다. (Safe Area 처리)
- 스크롤이 필요한 화면은 `ScrollView`, 목록은 `FlatList`를 쓴다.
- 32~40px 크기의 누를 수 있는 요소는 `hitSlop`으로 터치 영역을 44px로 맞춘다.
- 바텀시트는 `shared/components/ui/BottomSheet`를 쓰고, 시트 안 입력칸은 같은 파일의 `BottomSheetTextInput`을 쓴다. (키보드에 맞춰 시트가 올라간다)

<br>

## 4. 상태 관리와 API

### 원칙

- 서버 데이터는 **TanStack Query**, 클라이언트 상태(UI 상태, 입력 중인 값 등)는 **Zustand**로 관리한다.
- 서버에서 받은 데이터를 Zustand store에 복사해 두지 않는다.
- 컴포넌트에서 `apiClient`를 직접 호출하지 않는다. `features/{domain}/api/`의 함수와 훅을 쓴다.

### api 폴더 구성

```
features/block/api/
├── blockApi.ts            요청 함수
├── blockKeys.ts           query key
└── useBlockSummaryQuery.ts
```

```ts
// blockApi.ts
export const getBlockSummary = () =>
    request<BlockSummary>({ method: 'GET', url: '/blocks/summary' });

// blockKeys.ts
export const blockKeys = {
    all: ['blocks'] as const,
    summary: () => [...blockKeys.all, 'summary'] as const,
    detail: (blockId: number) => [...blockKeys.all, blockId] as const,
};

// useBlockSummaryQuery.ts
export function useBlockSummaryQuery() {
    return useQuery({ queryKey: blockKeys.summary(), queryFn: getBlockSummary });
}
```

- 훅 이름: 조회는 `use{대상}Query`, 변경은 `use{동작}{대상}Mutation` (예: `useTransferBlockMutation`)
- Mutation 성공 후에는 관련 query key를 `invalidateQueries`로 갱신한다.
- Zustand store 이름은 `use{이름}Store`, 파일은 `features/{domain}/stores/{이름}Store.ts`

### 데이터 처리

- 금액·합계·달성률·블록 상태 등 **계산 값은 서버 응답을 그대로 쓴다.** 화면에서 다시 계산하지 않는다.
- 금액은 원 단위 정수(`number`)로 다루고, 표시할 때만 `formatWon()`으로 포맷팅한다.
- 에러 분기는 `message`가 아니라 `ApiError.code` 기준으로 한다.
- 토큰 등 민감 정보는 `tokenStorage`(expo-secure-store)로만 저장한다. AsyncStorage에 저장하지 않는다.
- API 개발 전에는 API 명세의 응답 예시로 목업을 만들어 먼저 개발한다.

<br>

## 5. 타입

- `any`를 쓰지 않는다. 모르는 값은 `unknown`으로 받고 좁힌다.
- API 요청·응답 타입은 `features/{domain}/types/`에, 여러 기능이 쓰는 타입은 `shared/types/`에 둔다.
- 컴포넌트 props 타입은 `{컴포넌트명}Props` interface로 같은 파일에 선언한다.

<br>

## 6. 네이밍

| 대상                | 규칙                                 | 예시                                   |
| ------------------- | ------------------------------------ | -------------------------------------- |
| 컴포넌트·화면 파일  | PascalCase.tsx                       | `BlockCard.tsx`, `BlockHomeScreen.tsx` |
| 훅 파일             | camelCase, `use`로 시작              | `useBlockSummaryQuery.ts`              |
| 유틸·api·store 파일 | camelCase                            | `formatDate.ts`, `blockApi.ts`         |
| 라우트 파일         | 소문자 kebab-case                    | `block-detail.tsx`                     |
| 이미지·아이콘 파일  | 영문 소문자 kebab-case               | `empty-block.png`                      |
| 함수·변수           | camelCase                            | `blockList`                            |
| 상수                | UPPER_SNAKE_CASE                     | `MAX_BLOCK_COUNT`                      |
| boolean             | `is`, `has`, `can`으로 시작          | `isLoading`, `hasGoal`                 |
| 이벤트              | props는 `on~`, 내부 함수는 `handle~` | `onPress={handlePress}`                |

- 파일명 대소문자만 바꿀 때는 `git mv`를 쓴다. (macOS, Windows는 대소문자 변경을 감지하지 못한다.)

<br>

## 7. 컴포넌트 작성

- 함수 선언문 + named export로 작성한다. (라우트 파일만 default export)

```tsx
interface BlockCardProps {
    name: string;
    amount: number;
    onPress?: () => void;
}

export function BlockCard({ name, amount, onPress }: BlockCardProps) {
    ...
}
```

- 두 화면 이상에서 반복되는 UI는 `shared/components/`로 옮기는 것을 검토한다.
- 공통 컴포넌트를 수정할 때는 사용하는 다른 화면도 확인하고, PR 리뷰 포인트에 적는다.
- import는 외부 패키지 → `@/` 경로 → 상대 경로 순으로 묶는다. 깊은 상대 경로(`../../`) 대신 `@/`를 쓴다.

<br>

## 8. 패키지와 환경

- Expo, React Native 관련 패키지는 `pnpm expo install {패키지}`로 설치한다. (SDK에 맞는 버전이 설치된다.)
- 네이티브 코드가 있는 패키지를 추가하면 개발 빌드를 다시 만들어야 하므로 PR에 명시하고 팀에 공유한다.
- 환경 변수를 추가하면 `.env.example`에 함께 반영한다. `EXPO_PUBLIC_` 값에는 비밀 키를 넣지 않는다.

<br>

## 9. PR 올리기 전

- [ ] `pnpm typecheck`, `pnpm lint` 통과
- [ ] 사용하지 않는 코드, import, `console.log` 제거
- [ ] 개발 빌드에서 실행 확인
- [ ] API 키, 토큰 등 민감 정보 미포함
