import { router } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { ConnectAccountScreen } from '@/features/connection/screens/ConnectAccountScreen';
import { toListParam } from '@/lib/listParam';

/** 온보딩 1단계(계좌·카드 연동). 연동이 끝나면 블록 구성으로 넘어간다. */
export default function ConnectRoute() {
    const logout = useAuthStore((state) => state.logout);

    const handleConnected = (failedCodes: string[]) => {
        // TODO: 튜토리얼(온보딩 2단계)이 생기면 그쪽으로 먼저 보낸다.
        router.push({
            pathname: '/onboarding/blocks',
            params: { failed: toListParam(failedCodes) },
        });
    };

    return <ConnectAccountScreen onConnected={handleConnected} onExit={logout} />;
}
