import { useQuery } from '@tanstack/react-query';

import { getUserSettings } from './authApi';
import { authKeys } from './authKeys';

/**
 * 온보딩 상태. 로그인한 뒤 onboardingStep이 DONE이 아니면 그 단계 화면으로 보낸다.
 * TODO: 온보딩 화면이 머지되면 루트 레이아웃에서 이 값으로 첫 화면을 정한다.
 */
export function useUserSettingsQuery({ enabled = true }: { enabled?: boolean } = {}) {
    return useQuery({ queryKey: authKeys.settings(), queryFn: getUserSettings, enabled });
}
