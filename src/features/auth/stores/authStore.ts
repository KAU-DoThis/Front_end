import { create } from 'zustand';

import { tokenStorage } from '@/lib/tokenStorage';

interface AuthState {
    isLoggedIn: boolean;
    /** 앱 시작 시 저장된 토큰으로 로그인 상태 복원 */
    restore: () => Promise<void>;
    login: (accessToken: string, refreshToken?: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,

    async restore() {
        const accessToken = await tokenStorage.getAccessToken();
        set({ isLoggedIn: Boolean(accessToken) });
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
