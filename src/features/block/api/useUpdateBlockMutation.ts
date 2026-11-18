import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateBlock } from './blockApi';
import { blockKeys } from './blockKeys';

/**
 * 블록 수정 (이름 바꾸기 · 블록 수정 시트 · 알림 토글)
 * 성공·실패 모두 홈·상세·블록 목록을 다시 받는다. (409 버전 충돌이면 새 값을 불러와야 해서)
 */
export function useUpdateBlockMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBlock,
        onSettled: () => queryClient.invalidateQueries({ queryKey: blockKeys.all }),
    });
}
