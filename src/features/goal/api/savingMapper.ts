import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

import type { SavingGoalDraft, SavingGoalDraftResponse } from '@/features/goal/types/saving';

/** 절약 목표 설정 시트 초기값 응답 → 화면 모양. 서버 블록 색(대문자)을 비커 색(소문자)으로 바꾼다. */
export function toSavingGoalDraft(response: SavingGoalDraftResponse): SavingGoalDraft {
    return {
        ...response,
        targetBlocks: response.targetBlocks.map((block) => ({
            ...block,
            color: block.color.toLowerCase() as BlockColor,
        })),
    };
}
