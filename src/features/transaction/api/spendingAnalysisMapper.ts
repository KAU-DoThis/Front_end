import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';
import type { SpendingAnalysisResponse } from '@/features/transaction/types/spendingAnalysisResponse';

const RECURRING_TAG = {
    REPEAT: '반복 소비',
    DUPLICATE_SUBSCRIPTION: '중복',
    FIXED: '고정',
} as const;

const monthNumber = (date: string) => Number(date.slice(5, 7));
const dayNumber = (date: string) => Number(date.slice(8, 10));

/** 소비 분석 서버 응답 → 화면 모양. today(yyyy-MM-dd)로 이번 달인지 정한다. */
export function toSpendingAnalysis(
    response: SpendingAnalysisResponse,
    today: string,
): SpendingAnalysis {
    const { period, compareTo, biggestIncrease } = response;
    const month = period.from.slice(0, 7);
    const comparable = response.previousAvailable;
    // 가장 늘어난 곳의 이번 금액은 분류 목록의 서버 금액을 그대로 쓴다. (두 카드가 같은 값)
    const increasedCategory = biggestIncrease
        ? response.categories.find(({ categoryId }) => categoryId === biggestIncrease.categoryId)
        : undefined;

    const slots = biggestIncrease?.timeOfDay ?? [];
    const peakCount = Math.max(0, ...slots.map(({ count }) => count));
    const slotTotal = slots.reduce((sum, { count }) => sum + count, 0);

    return {
        month,
        compareLabel: compareTo.label,
        periodLabel: `${monthNumber(period.from)}월 ${dayNumber(period.from)}일 ~ ${dayNumber(period.to)}일`,
        isCurrentMonth: month === today.slice(0, 7),
        spent: {
            amount: response.totalSpent,
            previousAmount: comparable ? response.previousSpent : null,
            diffAmount: comparable ? (response.changeAmount ?? 0) : 0,
            diffPercent: comparable ? (response.changeRate ?? undefined) : undefined,
        },
        categories: response.categories.map((category) => ({
            categoryName: category.name,
            count: category.count,
            amount: category.amount,
            diffAmount: category.changeAmount,
        })),
        topIncrease: biggestIncrease && {
            categoryName: biggestIncrease.name,
            diffAmount: biggestIncrease.changeAmount,
            diffPercent: biggestIncrease.changeRate ?? undefined,
            previousLabel: `${monthNumber(compareTo.from)}월`,
            currentLabel: `${monthNumber(period.from)}월`,
            previousAmount: biggestIncrease.previousAmount,
            // 분류 목록에 없을 때만(서버 응답 이상) 지난 금액 + 증가액으로 대신한다.
            currentAmount:
                increasedCategory?.amount ??
                biggestIncrease.previousAmount + biggestIncrease.changeAmount,
            message: biggestIncrease.explanation,
        },
        timeOfDay:
            biggestIncrease && slotTotal > 0
                ? {
                      targetLabel: `${biggestIncrease.name} ${slotTotal}번`,
                      headline: biggestIncrease.timeSummary
                          ? [{ text: biggestIncrease.timeSummary, isBold: false }]
                          : [],
                      slots: slots.map(({ label, count }) => {
                          // 서버 label은 "밤 22시~"처럼 이름과 시간이 붙어 온다.
                          const [name, ...range] = label.split(' ');
                          return {
                              label: name,
                              range: range.join(' '),
                              count,
                              isPeak: count === peakCount,
                          };
                      }),
                      footnote: biggestIncrease.excludedNote,
                  }
                : null,
        recurring: response.recurring.map((item) => ({
            name: item.label,
            tag: RECURRING_TAG[item.kind] ?? item.kind,
            description: item.summary,
            amount: item.amount,
        })),
        // 절약 제안(savingPotential)은 서버에 아직 없다.
        savingTip: null,
    };
}
