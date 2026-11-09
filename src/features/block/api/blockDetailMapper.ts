import { formatAmount } from '@/lib/format';

import type {
    BlockDetail,
    FixedBlockDetail,
    GoalBlockDetail,
    SpendingBlockDetail,
} from '@/features/block/types/blockDetail';
import type {
    BlockDetailResponse,
    FixedDetailResponse,
    GoalDetailResponse,
    SpendingDetailResponse,
} from '@/features/block/types/blockDetailResponse';

import { toHomeBlock } from './blockHomeMapper';

/**
 * 서버 블록 상세 응답(BlockDetailResponse)을 화면용 BlockDetail로 바꾼다.
 * 값은 서버 계산 값을 그대로 옮기고, 차트 좌표·조건 문구처럼 화면 모양에 맞추는 일만 여기서 한다.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** yyyy-MM-dd 두 날짜 사이 일수 (시간대 영향 없이 날짜만 비교) */
function daysBetween(from: string, to: string) {
    return Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / DAY_MS);
}

/** 오늘 한국 날짜 (yyyy-MM-dd) */
function todayKst() {
    return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** "2027-01-15" → "1월 중순" (지금 속도면 ~) */
function toMonthPartLabel(date: string) {
    const [, month, day] = date.slice(0, 10).split('-').map(Number);
    const part = day <= 10 ? '초' : day <= 20 ? '중순' : '말';
    return `${month}월 ${part}`;
}

const won = (amount: number) => formatAmount(amount, { showUnit: false });

function toSpendingDetail(
    response: BlockDetailResponse,
    detail: SpendingDetailResponse,
): Omit<SpendingBlockDetail, keyof ReturnType<typeof toBase>> {
    const { block } = response;
    const { period, burn } = detail;
    return {
        type: 'SPENDING',
        allocatedAmount: block.capacity ?? block.balance,
        periodStartDate: period.from,
        periodEndDate: period.to,
        remainingDays: detail.remainingDays,
        today: detail.today,
        // 서버 계획선은 월 배분액을 기간 일수로 고르게 나눈 누적이라, 끝 금액이 월 배분액이다.
        // 서버 점은 그날까지의 누적이라 기간 시작(0일째)을 0으로 두고 하루씩 뒤로 민다.
        burnRate: burn && {
            diffPercent: burn.paceDiffRate ?? 0,
            paceText: burn.paceLabel ?? '',
            spentAmount: burn.actualSpent,
            plannedAmount:
                block.rule?.monthlyAmount ?? burn.series[burn.series.length - 1]?.planned ?? 0,
            totalDays: daysBetween(period.from, period.to) + 1,
            actual: [
                { day: 0, amount: 0 },
                ...burn.series.map((point) => ({
                    day: daysBetween(period.from, point.date) + 1,
                    amount: point.actual,
                })),
            ],
        },
        recentTransactions: detail.recentTransactions.map((transaction) => ({
            transactionId: transaction.transactionId,
            occurredAt: transaction.occurredAt,
            amount: transaction.amount,
            direction: transaction.direction,
            merchantOrPayee: transaction.merchantOrPayee,
            categoryName: transaction.category?.name ?? null,
            contextTag: transaction.contextTagLabel,
        })),
    };
}

/**
 * 차트용 모은 돈 점: 실제 구간의 달은 그달 1일에, 마지막에 오늘 점을 하나 더 둔다.
 * (목업과 같은 모양 — 지금 속도·목표대로 선이 오늘 점에서 출발한다)
 */
function toSavedPoints(series: GoalDetailResponse['projection']['series']) {
    const actual = series.filter((point) => !point.projected);
    const points = actual.map((point) => ({ date: `${point.month}-01`, amount: point.cumulative }));
    const last = actual[actual.length - 1];
    if (last) {
        points.push({ date: todayKst(), amount: last.cumulative });
    }
    return points;
}

function toGoalProjection(projection: GoalDetailResponse['projection']) {
    const { currentPaceDate, onTargetDate, series } = projection;
    // 지금 속도를 모르면(월 확보 금액 없음) 그릴 선이 없어서 카드를 숨긴다.
    if (!currentPaceDate || series.length === 0) {
        return null;
    }
    const months = [
        series[series.length - 1].month,
        currentPaceDate.slice(0, 7),
        ...(onTargetDate ? [onTargetDate.slice(0, 7)] : []),
    ];
    return {
        paceText: projection.label ?? '',
        isLate: (projection.delayDays ?? 0) > 0,
        expectedDate: currentPaceDate,
        expectedLabel: toMonthPartLabel(currentPaceDate),
        startMonth: series[0].month,
        endMonth: months.reduce((latest, month) => (month > latest ? month : latest)),
        saved: toSavedPoints(series),
    };
}

function toGoalDetail(
    response: BlockDetailResponse,
    detail: GoalDetailResponse,
): Omit<GoalBlockDetail, keyof ReturnType<typeof toBase>> {
    const { block } = response;
    return {
        type: 'GOAL',
        targetAmount: block.targetAmount ?? block.capacity ?? 0,
        daysLeft: block.dDay,
        monthly: {
            target: detail.thisMonth.target,
            saved: detail.thisMonth.secured,
            remaining: detail.thisMonth.needed,
        },
        projection: toGoalProjection(detail.projection),
        inflows: detail.recentInflows.map((item) => ({
            title: item.title,
            note: item.subTitle,
            occurredAt: item.date,
            amount: item.amount,
        })),
    };
}

/**
 * 납부 확인 조건을 화면 문구로 바꾼다.
 * TODO: 나가는 계좌는 linkedAccountId만 와서 이름을 알 수 없다. 서버가 계좌 이름을 주면 채운다.
 */
function toMatchRule(response: BlockDetailResponse, detail: FixedDetailResponse) {
    const condition = detail.matchCondition;
    if (!condition) {
        return null;
    }
    const { minAmount, maxAmount, amountMode, dayWindow } = condition;
    const amountText =
        minAmount === undefined
            ? null
            : amountMode === 'RANGE' && maxAmount !== undefined && maxAmount !== minAmount
              ? `${won(minAmount)} ~ ${formatAmount(maxAmount)}`
              : `${formatAmount(minAmount)} 그대로`;
    const payDay = response.block.rule?.payDay;
    const dateText =
        payDay === undefined ? null : `매월 ${payDay}일${dayWindow ? ` 앞뒤 ${dayWindow}일` : ''}`;
    return {
        payee: condition.payee ?? null,
        amountText,
        dateText,
        accountLabel: null,
    };
}

function toFixedDetail(
    response: BlockDetailResponse,
    detail: FixedDetailResponse,
): Omit<FixedBlockDetail, keyof ReturnType<typeof toBase>> {
    return {
        type: 'FIXED',
        nextPayDate: detail.nextPayDate,
        payAmount: detail.payAmount,
        shortfall: detail.shortage,
        matchRule: toMatchRule(response, detail),
        alerts: {
            shortageBeforePay: detail.alerts?.shortageBefore3Days ?? false,
            paymentConfirmed: detail.alerts?.paidConfirmed ?? false,
        },
        onTimeStreak: detail.onTimeStreak,
        payments: detail.recentPayments.map((payment) => ({
            paidAt: payment.date,
            payee: payment.payee,
            accountLabel: payment.account,
            amount: payment.amount,
        })),
    };
}

/**
 * 상세 공통 값
 * - 상태 칩 옆 이유는 블록 객체의 statusSubLabel이다.
 * - 응답의 statusReason은 '왜 주의인가요?' 문장이다. (상태 판정 전이라 지금은 null)
 */
function toBase(response: BlockDetailResponse) {
    return {
        block: toHomeBlock(response.block),
        statusReason: response.block.statusSubLabel,
        explanation: response.statusReason,
        ruleText: response.ruleText,
    };
}

export function toBlockDetail(response: BlockDetailResponse): BlockDetail {
    const base = toBase(response);
    // detail 모양은 block.type으로 정해진다. (서버가 같은 switch로 만든다)
    switch (response.block.type) {
        case 'SPENDING':
            return {
                ...base,
                ...toSpendingDetail(response, response.detail as SpendingDetailResponse),
            };
        case 'GOAL':
            return { ...base, ...toGoalDetail(response, response.detail as GoalDetailResponse) };
        case 'FIXED':
            return { ...base, ...toFixedDetail(response, response.detail as FixedDetailResponse) };
    }
}
