import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { GoalOutcomeKind } from '@/features/block/types/goalOutcome';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
/** 이번 달이 이만큼도 안 남았으면 기한 늘리기 추천일을 다음 달 말일로 둔다. */
const MIN_EXTEND_DAYS = 7;

const pad = (value: number) => String(value).padStart(2, '0');

const parse = (date: string) => date.slice(0, 10).split('-').map(Number);

/** 오늘 (yyyy-MM-dd, 한국 날짜 기준) */
export const todayKst = () => new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);

/** 기한이 없거나 아직 안 지났으면 true (기한 당일까지는 안 지난 것으로 본다) */
export const isBeforeDue = (dueDate: string | null, today: string) =>
    !dueDate || dueDate.slice(0, 10) >= today;

/**
 * 목표형 블록이 끝났는지. 다 모았으면 기한이 지났어도 달성으로 본다.
 * 기한을 정하지 않은 블록은 기한 지남이 없다.
 */
export function goalOutcomeOf(
    detail: BlockDetail | null | undefined,
    today: string,
): GoalOutcomeKind | null {
    if (detail?.type !== 'GOAL' || detail.targetAmount <= 0) return null;
    const { balance, dueDate } = detail.block;
    if (balance >= detail.targetAmount) return 'ACHIEVED';
    if (!isBeforeDue(dueDate, today)) return 'OVERDUE';
    return null;
}

/** 달성률 0~100, 내림 (서버 achievementRate와 같은 식) */
export const achievementRate = (balance: number, targetAmount: number) =>
    targetAmount <= 0 ? 0 : Math.min(100, Math.max(0, Math.floor((balance / targetAmount) * 100)));

/** 시작한 달과 지금까지 걸린 개월 (시작한 달 포함). 예: 3월부터 7개월 */
export function monthsSince(startDate: string, today: string) {
    const [startYear, startMonth] = parse(startDate);
    const [year, month] = parse(today);
    return {
        startMonth,
        months: Math.max(1, (year - startYear) * 12 + (month - startMonth) + 1),
    };
}

/**
 * 기한 늘리기 추천: 이번 달 말일(얼마 안 남았으면 다음 달 말일)까지.
 * 남은 개월은 이번 달을 포함한 달력 월로 센다. (서버 EXTEND와 같은 식, 명세 13장 TBD)
 * TODO: 서버가 추천일·월 확보 금액을 내려 주면 그 값을 쓴다.
 */
export function extendPlan(targetAmount: number, balance: number, today: string) {
    const [year, month, day] = parse(today);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const isNextMonth = lastDay - day < MIN_EXTEND_DAYS;
    const due = new Date(Date.UTC(year, month - 1 + (isNextMonth ? 1 : 0) + 1, 0));
    const newDueDate = `${due.getUTCFullYear()}-${pad(due.getUTCMonth() + 1)}-${pad(due.getUTCDate())}`;
    const months = isNextMonth ? 2 : 1;
    const remaining = Math.max(0, targetAmount - balance);
    return { newDueDate, monthlyAmount: Math.ceil(remaining / months), remaining };
}
