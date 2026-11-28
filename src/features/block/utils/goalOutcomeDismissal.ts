import * as SecureStore from 'expo-secure-store';

import type { GoalOutcomeKind } from '@/features/block/types/goalOutcome';

/**
 * 목표 달성(17) · 기한 지남(17-1) 시트를 다시 띄우지 않을 기록. 블록마다 따로 둔다. (AsyncStorage 사용 금지 → expo-secure-store)
 * 서버는 REMIND_LATER에 응답만 돌려주고, 끝난 목표인지도 따로 알려 주지 않아서 앱이 기억한다.
 * - 기한 지남을 고르지 않고 닫음(REMIND_LATER): 3일 뒤부터 다시 띄운다. (목표 달성은 미루지 않고 다음에 들어오면 다시 띄운다)
 * - 그대로 지키기 · 모은 만큼으로 끝내기: 같은 목표(종류·목표 금액·기한)면 다시 띄우지 않는다.
 * 목표 금액이나 기한이 바뀌면 다른 목표로 보고 다시 띄운다.
 * TODO: 알림(F-22)이 생기면 3일 뒤 알림을 예약하고, 서버가 끝난 목표를 알려 주면 이 기록을 지운다.
 */

const REMIND_AFTER_DAYS = 3;

/** 어떤 목표에 대한 기록인지 */
export interface GoalOutcomeTarget {
    kind: GoalOutcomeKind;
    targetAmount: number;
    /** yyyy-MM-dd (기한이 없으면 null) */
    dueDate: string | null;
}

interface DismissRecord extends GoalOutcomeTarget {
    /** 이 날부터 다시 띄운다 (yyyy-MM-dd). null이면 다시 띄우지 않는다. */
    until: string | null;
}

const keyOf = (blockId: number) => `goalOutcomeDismissed.${blockId}`;

function addDays(date: string, days: number) {
    const [year, month, day] = date.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function parseRecord(value: string | null): DismissRecord | null {
    if (!value) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'kind' in parsed &&
            'targetAmount' in parsed &&
            'dueDate' in parsed &&
            'until' in parsed &&
            (parsed.kind === 'ACHIEVED' || parsed.kind === 'OVERDUE') &&
            typeof parsed.targetAmount === 'number' &&
            (parsed.dueDate === null || typeof parsed.dueDate === 'string') &&
            (parsed.until === null || typeof parsed.until === 'string')
        ) {
            return {
                kind: parsed.kind,
                targetAmount: parsed.targetAmount,
                dueDate: parsed.dueDate,
                until: parsed.until,
            };
        }
    } catch {
        // 깨진 기록은 없는 것으로 본다.
    }
    return null;
}

const isSameTarget = (a: GoalOutcomeTarget, b: GoalOutcomeTarget) =>
    a.kind === b.kind && a.targetAmount === b.targetAmount && a.dueDate === b.dueDate;

/** 이 목표에 시트를 띄워야 하는지. 읽지 못하면 띄운다. */
export async function shouldShowGoalOutcome(
    blockId: number,
    target: GoalOutcomeTarget,
    today: string,
) {
    try {
        const record = parseRecord(await SecureStore.getItemAsync(keyOf(blockId)));
        if (!record || !isSameTarget(record, target)) return true;
        // 끝낸 목표는 다시 띄우지 않는다.
        if (record.until === null) return false;
        // 3일 미루기는 기한 지남에만 있다. yyyy-MM-dd는 문자열 비교가 날짜 비교와 같다.
        return target.kind === 'ACHIEVED' || today >= record.until;
    } catch {
        return true;
    }
}

async function save(blockId: number, record: DismissRecord) {
    await SecureStore.setItemAsync(keyOf(blockId), JSON.stringify(record)).catch(() => undefined);
}

/** 기한 지남을 고르지 않고 닫음: 3일 동안 띄우지 않는다. */
export const remindGoalOutcomeLater = (blockId: number, target: GoalOutcomeTarget, today: string) =>
    save(blockId, { ...target, until: addDays(today, REMIND_AFTER_DAYS) });

/** 끝낸 목표: 같은 목표면 다시 띄우지 않는다. */
export const settleGoalOutcome = (blockId: number, target: GoalOutcomeTarget) =>
    save(blockId, { ...target, until: null });
