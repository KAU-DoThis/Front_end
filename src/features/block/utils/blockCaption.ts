import { formatAmount } from '@/lib/format';

import type { HomeBlock } from '@/features/block/types/block';

/**
 * 홈 블록 이름 아래 보조 문구 (서버 값을 문구로만 바꾼다)
 * 사용형 "사용형  63% 남음" · 목표형 "목표 3,000,000  67%" / "목표 달성" · 고정지출형 "D-11"
 */
export function getBlockCaption(block: HomeBlock): string | undefined {
    switch (block.type) {
        case 'SPENDING':
            return `사용형  ${block.fillRate}% 남음`;
        case 'GOAL':
            if (block.fillRate >= 100) {
                return '목표 달성';
            }
            return block.targetAmount === null
                ? undefined
                : `목표 ${formatAmount(block.targetAmount, { showUnit: false })}  ${block.fillRate}%`;
        case 'FIXED':
            if (block.daysUntilPay === null) {
                return undefined;
            }
            return block.daysUntilPay === 0 ? 'D-day' : `D-${block.daysUntilPay}`;
    }
}
