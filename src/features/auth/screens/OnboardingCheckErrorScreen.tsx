import { useState } from 'react';

import { Screen } from '@/shared/components/layout/Screen';
import { ScreenState } from '@/shared/components/ui/ScreenState';

import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * 앱 시작 때 서버 온보딩 상태를 받지 못했을 때 보여준다.
 * 온보딩을 마쳤는지 모른 채 홈으로 보내지 않고, 다시 받으면 루트 레이아웃이 홈·온보딩으로 보낸다.
 */
export function OnboardingCheckErrorScreen() {
    const retryOnboardingCheck = useAuthStore((state) => state.retryOnboardingCheck);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await retryOnboardingCheck();
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <Screen>
            {isRetrying ? (
                <ScreenState variant="loading" title="정보를 불러오고 있어요" />
            ) : (
                <ScreenState
                    variant="error"
                    title="정보를 불러오지 못했어요"
                    description="인터넷 연결을 확인하고 다시 시도해 주세요"
                    actionTitle="다시 시도"
                    onPressAction={handleRetry}
                />
            )}
        </Screen>
    );
}
