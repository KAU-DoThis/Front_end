import { useLocalSearchParams } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { toInstitutionNames } from '@/features/connection/constants/institutions';
import { parseFailedCodes } from '@/features/onboarding/utils/failedCodesParam';

/**
 * 온보딩 3단계(블록 구성)를 앞뒤 단계와 잇는다.
 * 블록 구성 화면은 block 기능이라 연결하지 못한 기관(connection)과 온보딩 완료(auth)는 여기서 이어 준다.
 */
export function useOnboardingBlockSetupStep() {
    const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
    const logout = useAuthStore((state) => state.logout);
    const { failed } = useLocalSearchParams<{ failed?: string | string[] }>();

    return {
        missingInstitutionNames: toInstitutionNames(parseFailedCodes(failed)),
        onComplete: completeOnboarding,
        onExit: logout,
    };
}
