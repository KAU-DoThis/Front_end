import { useLocalSearchParams } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { BlockSetupScreen } from '@/features/block/screens/BlockSetupScreen';
import { toInstitutionNames } from '@/features/connection/constants/institutions';
import { fromListParam } from '@/lib/listParam';

/** 온보딩 3단계(블록 구성). 블록을 만들면 온보딩을 마치고 홈으로 간다. */
export default function BlockSetupRoute() {
    const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
    const logout = useAuthStore((state) => state.logout);
    const { failed } = useLocalSearchParams<{ failed?: string | string[] }>();

    return (
        <BlockSetupScreen
            missingInstitutionNames={toInstitutionNames(fromListParam(failed))}
            onComplete={completeOnboarding}
            onExit={logout}
        />
    );
}
