import type { BlockPatch, BlockUpdateRequest } from '@/features/block/types/blockUpdate';
import type { BlockColorCode } from '@/features/block/types/homeResponse';

/** 화면 수정 값(BlockPatch)을 PATCH /blocks/{blockId} 요청으로 바꾼다. 비어 있는 키는 JSON에서 빠진다. */
export function toBlockUpdateRequest(patch: BlockPatch, version?: number): BlockUpdateRequest {
    const {
        name,
        color,
        targetAmount,
        dueDate,
        monthlyAmount,
        startDay,
        payDay,
        payAmount,
        alerts,
    } = patch;
    const rule = {
        monthlyAmount,
        startDay,
        payDay,
        payAmount,
        alerts: alerts && {
            shortageBefore3Days: alerts.shortageBeforePay,
            paidConfirmed: alerts.paymentConfirmed,
        },
    };
    return {
        name,
        // 화면 색 토큰은 소문자(i), 서버는 대문자(I)
        color: color && (color.toUpperCase() as BlockColorCode),
        targetAmount,
        dueDate,
        rule: Object.values(rule).some((value) => value !== undefined) ? rule : undefined,
        version,
    };
}
