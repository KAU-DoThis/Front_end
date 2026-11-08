import { create } from 'zustand';

import { onboardingStorage } from '@/lib/onboardingStorage';
import { queryClient } from '@/lib/queryClient';
import { tokenStorage } from '@/lib/tokenStorage';

interface LoginOptions {
    /** 로그인한 계정 이메일. 이 계정이 온보딩을 마쳤는지 확인하는 데 쓴다. */
    email: string;
    /** 방금 가입했으면 true. 온보딩(계좌 연동 → 블록 구성)을 거친 뒤 홈으로 간다. */
    isNewUser?: boolean;
}

interface AuthState {
    isLoggedIn: boolean;
    /** 로그인했지만 온보딩을 아직 마치지 않았는지. true면 홈 대신 온보딩 화면만 열린다. */
    needsOnboarding: boolean;
    /** restore()가 끝났는지. 끝나기 전에는 로그인/홈 중 어디로 갈지 정할 수 없다. */
    isRestored: boolean;
    /** 앱 시작 시 저장된 토큰으로 로그인 상태 복원 */
    restore: () => Promise<void>;
    login: (
        accessToken: string,
        refreshToken: string | undefined,
        options: LoginOptions,
    ) => Promise<void>;
    /** 블록 구성까지 마치면 부른다. 상태가 바뀌면 루트 레이아웃이 홈으로 보낸다. */
    completeOnboarding: () => Promise<void>;
    logout: () => Promise<void>;
}

/** 저장된 기록으로 이 계정이 온보딩을 마쳤는지 본다. 읽지 못하면 홈으로 보낸다. */
async function readNeedsOnboarding(email: string | null) {
    if (!email) return false;
    try {
        return await onboardingStorage.isPending(email);
    } catch {
        return false;
    }
}

// TODO: 온보딩 완료 여부를 서버(로그인 응답 또는 내 정보 API)에서 받으면 restore·login에서 그 값을 쓰고
//       onboardingStorage는 지운다. 지금은 가입한 기기에 남긴 기록으로만 판단한다.
export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    needsOnboarding: false,
    isRestored: false,

    async restore() {
        try {
            const accessToken = await tokenStorage.getAccessToken();
            if (!accessToken) {
                set({ isLoggedIn: false, needsOnboarding: false });
                return;
            }
            // 온보딩 중에 앱을 껐다 켜도 온보딩으로 돌아가게 한다.
            const email = await onboardingStorage.getCurrentEmail().catch(() => null);
            const needsOnboarding = await readNeedsOnboarding(email);
            set({ isLoggedIn: true, needsOnboarding });
        } catch {
            // 토큰을 읽지 못하면 비로그인 상태로 시작한다.
            set({ isLoggedIn: false, needsOnboarding: false });
        } finally {
            // 토큰을 읽다 실패해도 로그인 화면으로라도 진입할 수 있게 한다.
            set({ isRestored: true });
        }
    },

    async login(accessToken, refreshToken, { email, isNewUser = false }) {
        // 이전 세션의 토큰이 남지 않도록 비운 뒤 저장한다.
        await tokenStorage.clear();
        await tokenStorage.setTokens(accessToken, refreshToken);

        // 온보딩 기록을 남기지 못해도 로그인은 막지 않는다. (가입 직후라면 이번에는 온보딩으로 보낸다)
        let needsOnboarding = isNewUser;
        try {
            await onboardingStorage.setCurrentEmail(email);
            if (isNewUser) {
                await onboardingStorage.markPending(email);
            } else {
                // 가입하고 온보딩을 마치지 않은 채 로그아웃했던 계정이면 이어서 하게 한다.
                needsOnboarding = await onboardingStorage.isPending(email);
            }
        } catch {
            // 기록을 읽거나 쓰지 못하면 위 기본값을 쓴다.
        }

        // 홈이 잠깐 보였다가 온보딩으로 튀지 않도록 두 값을 한 번에 바꾼다.
        set({ isLoggedIn: true, needsOnboarding });
    },

    async completeOnboarding() {
        try {
            const email = await onboardingStorage.getCurrentEmail();
            if (email) {
                await onboardingStorage.clearPending(email);
            }
        } catch {
            // 기록을 지우지 못해도 블록은 이미 만들어졌으니 홈으로 보낸다.
        } finally {
            set({ needsOnboarding: false });
        }
    },

    async logout() {
        await tokenStorage.clear();
        await onboardingStorage.clearCurrentEmail().catch(() => undefined);
        set({ isLoggedIn: false, needsOnboarding: false });
        // 다른 계정으로 로그인했을 때 이전 계정의 데이터(블록 제안·홈 등)가 보이지 않도록 캐시를 비운다.
        queryClient.clear();
    },
}));
