import { create } from 'zustand';

import {
    completeMockOnboarding,
    getUserSettings,
    logout as logoutApi,
} from '@/features/auth/api/authApi';
import { closeSession, setSessionExpiredHandler } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';
import { queryClient } from '@/lib/queryClient';
import { tokenStorage } from '@/lib/tokenStorage';
import { ApiError } from '@/shared/types/api';

interface AuthState {
    isLoggedIn: boolean;
    /** 로그인했지만 온보딩을 아직 마치지 않았는지. true면 홈 대신 온보딩 화면만 열린다. */
    needsOnboarding: boolean;
    /**
     * 앱 시작 때 서버 온보딩 상태를 받지 못했는지. true면 홈·온보딩 대신 다시 시도 화면을 연다.
     * (온보딩 중인 사용자가 홈으로 들어가면 다시 온보딩으로 돌아올 길이 없어서)
     */
    onboardingCheckFailed: boolean;
    /** restore()가 끝났는지. 끝나기 전에는 로그인/홈 중 어디로 갈지 정할 수 없다. */
    isRestored: boolean;
    /** 앱 시작 시 저장된 토큰으로 로그인 상태 복원 */
    restore: () => Promise<void>;
    /** 온보딩 상태를 다시 받는다. 또 실패하면 onboardingCheckFailed를 그대로 둔다. */
    retryOnboardingCheck: () => Promise<void>;
    /** 토큰을 저장하고 서버 온보딩 상태를 받아 로그인한다. 온보딩 상태를 받지 못하면 실패한다. */
    login: (accessToken: string, refreshToken: string | undefined) => Promise<void>;
    /** 블록 구성까지 마치면 부른다. 상태가 바뀌면 루트 레이아웃이 홈으로 보낸다. */
    completeOnboarding: () => void;
    /** 서버의 리프레시 토큰을 폐기하고 로그아웃한다. 서버 요청이 실패해도 앱에서는 로그아웃한다. */
    logout: () => Promise<void>;
    /** 토큰 재발급까지 실패했을 때. 서버에 알리지 않고 저장된 토큰만 지운다. */
    expireSession: () => Promise<void>;
}

/**
 * 저장된 토큰과 이전 계정의 조회 결과를 지운다.
 * 토큰 삭제가 실패해도 나머지는 정리하고, 부르는 쪽이 로그아웃 상태로 바꿀 수 있게 오류를 넘기지 않는다.
 */
async function clearSession() {
    await tokenStorage.clear().catch(() => undefined);
    // 다른 계정으로 로그인했을 때 이전 계정의 데이터(블록 제안·홈 등)가 보이지 않도록 캐시를 비운다.
    queryClient.clear();
}

/**
 * 서버 온보딩 상태(GET /users/me/settings)로 온보딩을 거쳐야 하는지 정한다.
 * 서버 단계는 동의 → 연동 → 튜토리얼 → 블록 확정 순으로 계산되는데, 앱에는 튜토리얼 화면이 없다.
 * 그래서 블록을 이미 확정했으면 튜토리얼 여부와 상관없이 홈으로 보낸다. (다시 확정하면 서버가 거절한다)
 * TODO: 동의(CONSENT) 단계면 동의 화면으로 보낸다. 지금은 연결 화면부터 시작한다.
 */
async function fetchNeedsOnboarding() {
    const settings = await getUserSettings();
    return !settings.blocksConfirmed && settings.onboardingStep !== 'DONE';
}

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    needsOnboarding: false,
    onboardingCheckFailed: false,
    isRestored: false,

    async restore() {
        try {
            const accessToken = await tokenStorage.getAccessToken();
            if (!accessToken) {
                set({ isLoggedIn: false, needsOnboarding: false, onboardingCheckFailed: false });
                return;
            }
            try {
                // 온보딩 중에 앱을 껐다 켜도 서버 단계를 보고 온보딩으로 돌아간다.
                const needsOnboarding = await fetchNeedsOnboarding();
                set({ isLoggedIn: true, needsOnboarding, onboardingCheckFailed: false });
            } catch (error) {
                // 토큰이 만료돼 재발급까지 실패했으면(401) 세션 만료 처리가 로그인 화면으로 보낸다.
                if (error instanceof ApiError && error.status === 401) {
                    set({
                        isLoggedIn: false,
                        needsOnboarding: false,
                        onboardingCheckFailed: false,
                    });
                    return;
                }
                // 네트워크 오류 등으로 상태를 받지 못하면 로그인은 유지하고 다시 시도 화면을 연다.
                set({ isLoggedIn: true, needsOnboarding: false, onboardingCheckFailed: true });
            }
        } catch {
            // 토큰을 읽지 못하면 비로그인 상태로 시작한다.
            set({ isLoggedIn: false, needsOnboarding: false, onboardingCheckFailed: false });
        } finally {
            // 토큰을 읽다 실패해도 로그인 화면으로라도 진입할 수 있게 한다.
            set({ isRestored: true });
        }
    },

    async retryOnboardingCheck() {
        try {
            const needsOnboarding = await fetchNeedsOnboarding();
            set({ needsOnboarding, onboardingCheckFailed: false });
        } catch {
            // 재발급까지 실패했으면(401) 세션 만료 처리가 로그인 화면으로 보낸다. 그 밖에는 다시 시도 화면에 머문다.
        }
    },

    async login(accessToken, refreshToken) {
        // 이전 세션의 토큰이 남지 않도록 비운 뒤 저장한다. (온보딩 상태 요청에 이 토큰을 쓴다)
        await tokenStorage.clear();
        await tokenStorage.setTokens(accessToken, refreshToken);

        let needsOnboarding: boolean;
        try {
            needsOnboarding = await fetchNeedsOnboarding();
        } catch (error) {
            // 어느 화면으로 갈지 모른 채 로그인 상태로 두지 않는다. 토큰을 지우고 다시 시도하게 한다.
            await clearSession();
            throw error;
        }

        // 홈이 잠깐 보였다가 온보딩으로 튀지 않도록 두 값을 한 번에 바꾼다.
        set({ isLoggedIn: true, needsOnboarding, onboardingCheckFailed: false });
    },

    completeOnboarding() {
        if (USE_MOCK) {
            completeMockOnboarding();
        }
        set({ needsOnboarding: false });
    },

    async logout() {
        await closeSession(async () => {
            // 토큰을 읽지 못해도 앱에서는 로그아웃한다.
            const refreshToken = await tokenStorage.getRefreshToken().catch(() => null);
            // 목업 토큰은 서버가 모르는 값이라 목업 모드에서는 서버에 보내지 않는다.
            if (refreshToken && !USE_MOCK) {
                // 이미 만료된 토큰이면 서버가 거절하지만, 앱에서는 그대로 로그아웃한다.
                await logoutApi(refreshToken).catch(() => undefined);
            }
            await clearSession();
        });
        set({ isLoggedIn: false, needsOnboarding: false, onboardingCheckFailed: false });
    },

    async expireSession() {
        await closeSession(clearSession);
        set({ isLoggedIn: false, needsOnboarding: false, onboardingCheckFailed: false });
    },
}));

// 재발급까지 실패하면 로그인 화면으로 보낸다. (루트 레이아웃 가드가 isLoggedIn을 보고 이동)
setSessionExpiredHandler(() => {
    void useAuthStore.getState().expireSession();
});
