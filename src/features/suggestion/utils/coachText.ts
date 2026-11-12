import { formatWon } from '@/lib/format';
import type { ImpactItem } from '@/shared/components/ui/ImpactList';

import type { TransferProposalCard } from '@/features/suggestion/types/coach';

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
/** 받침 ㄹ (ㄹ 받침은 "으로"가 아니라 "로") */
const RIEUL = 8;

/** 이름 뒤에 "로/으로"를 붙인다. 한글이 아니면 "로". (멜론으로 · 생활비로 · 서울로) */
export function withRo(name: string) {
    const code = name.charCodeAt(name.length - 1);
    if (code < HANGUL_START || code > HANGUL_END) return `${name}로`;
    const jongseong = (code - HANGUL_START) % 28;
    return jongseong === 0 || jongseong === RIEUL ? `${name}로` : `${name}으로`;
}

/** 이동 제안 카드의 영향(목표 지연 · 하루 쓸 돈 · 고정지출)을 결과 목록 줄로 바꾼다. */
export function toProposalImpacts(card: TransferProposalCard): ImpactItem[] {
    const items: ImpactItem[] = [];
    const { goalDelay, dailyBudget, fixedImpact } = card;

    if (goalDelay && goalDelay.delayDays > 0) {
        items.push({
            type: 'goal_date',
            severity: 'warn',
            blockId: goalDelay.blockId,
            title: `${goalDelay.name} 목표가 약 ${goalDelay.delayDays}일 늦어져요`,
            detail: `${goalDelay.before} → ${goalDelay.after}`,
        });
    }
    if (dailyBudget && dailyBudget.diff !== 0) {
        items.push({
            type: 'daily_budget',
            severity: dailyBudget.diff > 0 ? 'good' : 'warn',
            title: `하루 쓸 돈이 ${dailyBudget.diff > 0 ? '늘어요' : '줄어요'}`,
            detail: `${formatWon(dailyBudget.before)} → ${formatWon(dailyBudget.after)}`,
        });
    }
    const shortages = fixedImpact?.items.filter(({ shortage }) => shortage > 0) ?? [];
    if (shortages.length > 0) {
        shortages.forEach((item) =>
            items.push({
                type: 'payment',
                severity: 'danger',
                blockId: item.blockId,
                title: `${item.name} 납부에 ${formatWon(item.shortage)} 모자라요`,
                detail: `${item.payDate} ${formatWon(item.payAmount)}`,
            }),
        );
    } else if (fixedImpact) {
        items.push({ type: 'payment', severity: 'good', title: '고정지출 납부 영향 없음' });
    }
    return items;
}
