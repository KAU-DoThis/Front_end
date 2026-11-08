import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { blockKeys } from '@/features/block/api/blockKeys';
import { ConnectAccountScreen } from '@/features/connection/screens/ConnectAccountScreen';

// 연동 화면은 connection 기능이라 로그인 상태(auth)와 다음 단계(block)는 라우트에서 이어 준다.
export default function ConnectRoute() {
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();

    const handleConnected = (failedCodes: string[]) => {
        // 연결한 기관이 바뀌었을 수 있어 이전 블록 제안은 버리고 새로 받는다.
        queryClient.removeQueries({ queryKey: blockKeys.setupProposal() });
        // TODO: 튜토리얼(온보딩 2단계)이 생기면 그쪽으로 먼저 보낸다.
        router.push({
            pathname: '/onboarding/blocks',
            params: { failed: failedCodes.join(',') },
        });
    };

    return <ConnectAccountScreen onConnected={handleConnected} onExit={logout} />;
}
