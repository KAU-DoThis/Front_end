import { hashKey, keepPreviousData, useQuery } from '@tanstack/react-query';

import type { BlockSetupRequest } from '@/features/block/types/blockSetup';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

import { previewBlockSetup } from './blockApi';
import { blockKeys } from './blockKeys';

/** 금액을 바꿀 때마다 이만큼 쉬었다가 다시 요청한다. (디자인 시스템 '카드 공통 컴포넌트') */
const PREVIEW_DEBOUNCE_MS = 300;

/**
 * 고친 블록으로 계산한 합계·하루 쓸 돈·경고. 다시 계산하는 동안에는 이전 결과를 보여준다.
 * body가 null이면(제안을 아직 못 받음) 요청하지 않는다.
 * data.request는 그 결과를 계산한 요청이다. (막대처럼 결과와 같은 기준으로 그려야 하는 곳에 쓴다)
 */
export function useBlockSetupPreviewQuery(body: BlockSetupRequest | null) {
    const debouncedBody = useDebouncedValue(body, PREVIEW_DEBOUNCE_MS);

    const query = useQuery({
        queryKey: blockKeys.setupPreview(debouncedBody ?? { blocks: [] }),
        queryFn: async () => {
            const request = debouncedBody ?? { blocks: [] };
            return { request, preview: await previewBlockSetup(request) };
        },
        enabled: debouncedBody !== null,
        placeholderData: keepPreviousData,
    });

    // 보이는 결과가 지금 고친 내용으로 계산한 것인지. 아니면(계산 중·실패) 확정하지 않는다.
    // 같은 내용이어도 객체는 새로 만들어질 수 있어 값으로 비교한다.
    const isCurrent =
        body !== null &&
        query.isSuccess &&
        !query.isPlaceholderData &&
        hashKey([query.data.request]) === hashKey([body]);

    return { ...query, isCurrent };
}
