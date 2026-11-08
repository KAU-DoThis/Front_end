import { useLocalSearchParams } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { BlockSetupScreen } from '@/features/block/screens/BlockSetupScreen';
import { findInstitution } from '@/features/connection/constants/institutions';

// 블록 구성 화면은 block 기능이라 온보딩 완료(auth)와 연결하지 못한 기관(connection)은 라우트에서 이어 준다.
export default function BlockSetupRoute() {
    const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
    const logout = useAuthStore((state) => state.logout);
    const { failed } = useLocalSearchParams<{ failed?: string }>();

    const missingInstitutionNames = (failed ?? '')
        .split(',')
        .filter((code) => code !== '')
        .map((code) => findInstitution(code)?.name ?? '기관');

    return (
        <BlockSetupScreen
            missingInstitutionNames={missingInstitutionNames}
            onComplete={completeOnboarding}
            onExit={logout}
        />
    );
}
