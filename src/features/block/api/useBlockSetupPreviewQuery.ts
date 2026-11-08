import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { BlockSetupRequest } from '@/features/block/types/blockSetup';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

import { previewBlockSetup } from './blockApi';
import { blockKeys } from './blockKeys';

/** 금액을 바꿀 때마다 이만큼 쉬었다가 다시 요청한다. (디자인 시스템 '카드 공통 컴포넌트') */
const PREVIEW_DEBOUNCE_MS = 300;

/**
 * 고친 블록으로 계산한 합계·하루 쓸 돈·경고. 다시 계산하는 동안에는 이전 결과를 보여준다.
 * body가 null이면(제안을 아직 못 받음) 요청하지 않는다.
 */
export function useBlockSetupPreviewQuery(body: BlockSetupRequest | null) {
    const debouncedBody = useDebouncedValue(body, PREVIEW_DEBOUNCE_MS);

    return useQuery({
        queryKey: blockKeys.setupPreview(debouncedBody ?? { blocks: [] }),
        queryFn: () => previewBlockSetup(debouncedBody ?? { blocks: [] }),
        enabled: debouncedBody !== null,
        placeholderData: keepPreviousData,
    });
}
