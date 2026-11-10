import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateUserSettings } from './authApi';
import { authKeys } from './authKeys';

/** 온보딩 상태 수정 (튜토리얼 완료 등). 응답이 바뀐 상태라 캐시를 그대로 바꾼다. */
export function useUpdateUserSettingsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUserSettings,
        onSuccess: (settings) => queryClient.setQueryData(authKeys.settings(), settings),
    });
}
