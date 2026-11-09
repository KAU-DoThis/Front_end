/**
 * 온보딩 단계 (시안 ① 시작 · 가입 · 온보딩)
 * 1 계좌·카드 연동 → 2 튜토리얼 → 3 블록 구성
 * TODO: 튜토리얼(2단계)은 앱 기능을 다 만든 뒤 붙인다. 그 전에는 연동에서 블록 구성으로 바로 넘어간다.
 */
export const ONBOARDING_TOTAL_STEPS = 3;

export const ONBOARDING_STEP = {
    CONNECT: 1,
    TUTORIAL: 2,
    BLOCK_SETUP: 3,
} as const;
