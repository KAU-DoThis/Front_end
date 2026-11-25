import type { AllocationDraft, AllocationDraftResponse } from '@/features/block/types/waitingFund';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

/** 배분하기 초기값: 블록 색만 비커 색(소문자)으로 바꾼다. */
export const toAllocationDraft = (response: AllocationDraftResponse): AllocationDraft => ({
    ...response,
    targets: response.targets.map((target) => ({
        ...target,
        color: target.color.toLowerCase() as BlockColor,
    })),
});
