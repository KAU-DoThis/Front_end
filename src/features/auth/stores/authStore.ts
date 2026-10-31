import { create } from 'zustand';

import { tokenStorage } from '@/lib/tokenStorage';

interface AuthState {
    isLoggedIn: boolean;
    /** restore()가 끝났는지. 끝나기 전에는 로그인/홈 중 어디로 갈지 정할 수 없다. */
    isRestored: boolean;
    /** 앱 시작 시 저장된 토큰으로 로그인 상태 복원 */
    restore: () => Promise<void>;
    login: (accessToken: string, refreshToken?: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    isRestored: false,

    async restore() {
        try {
            const accessToken = await tokenStorage.getAccessToken();
            set({ isLoggedIn: Boolean(accessToken) });
        } finally {
            // 토큰을 읽다 실패해도 로그인 화면으로라도 진입할 수 있게 한다.
            set({ isRestored: true });
        }
    },

    async login(accessToken, refreshToken) {
        // 이전 세션의 토큰이 남지 않도록 비운 뒤 저장한다.
        await tokenStorage.clear();
        await tokenStorage.setTokens(accessToken, refreshToken);
        set({ isLoggedIn: true });
    },

    async logout() {
        await tokenStorage.clear();
        set({ isLoggedIn: false });
    },
}));
