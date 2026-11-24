import type { BlockCreateRequest, NewBlock } from '@/features/block/types/blockCreate';
import type { BlockColorCode } from '@/features/block/types/homeResponse';

/** 블록 추가 시트 값을 POST /blocks 요청으로 바꾼다. 유형에 안 쓰는 값은 보내지 않는다. */
export function toBlockCreateRequest(block: NewBlock): BlockCreateRequest {
    const base = {
        type: block.type,
        name: block.name.trim(),
        // 화면 색 토큰은 소문자(i), 서버는 대문자(I)
        color: block.color.toUpperCase() as BlockColorCode,
    };
    switch (block.type) {
        case 'SPENDING':
            // 기간 끝은 비우면 서버가 이번 달 말일로 둔다. (04 블록 구성과 같음)
            return { ...base, rule: { monthlyAmount: block.amount, startDay: block.day ?? 1 } };
        case 'GOAL':
            // 월 확보 금액은 비우면 서버가 권장값으로 채운다.
            return { ...base, targetAmount: block.amount, dueDate: block.dueDate ?? undefined };
        case 'FIXED':
            return {
                ...base,
                rule: { payDay: block.day ?? undefined, payAmount: block.amount },
            };
    }
}
