import * as SecureStore from 'expo-secure-store';

/**
 * 목표 지키기(16)를 자동으로 띄운 기록. 블록마다 따로 둔다. (AsyncStorage 사용 금지 → expo-secure-store)
 * 한 번 띄운 경고는 아래 경우에만 다시 띄운다.
 * - 예상일이 더 늦어졌을 때 (2주 → 4주)
 * - 달이 바뀌었을 때
 * - 안전으로 돌아왔다가 다시 늦어졌을 때 (안전이면 기록을 지운다)
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

interface ShownRecord {
    /** 띄울 때의 예상일 (yyyy-MM-dd) */
    expectedDate: string;
    /** 띄운 달 (yyyy-MM, 한국 날짜 기준) */
    month: string;
}

const keyOf = (blockId: number) => `goalGuardShown.${blockId}`;

const currentMonth = () => new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 7);

function parseRecord(value: string | null): ShownRecord | null {
    if (!value) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'expectedDate' in parsed &&
            'month' in parsed &&
            typeof parsed.expectedDate === 'string' &&
            typeof parsed.month === 'string'
        ) {
            return { expectedDate: parsed.expectedDate, month: parsed.month };
        }
    } catch {
        // 깨진 기록은 없는 것으로 본다.
    }
    return null;
}

/** 이 경고를 띄워야 하는지. 읽지 못하면 띄운다. */
export async function shouldShowGoalGuard(blockId: number, expectedDate: string) {
    try {
        const record = parseRecord(await SecureStore.getItemAsync(keyOf(blockId)));
        if (!record) return true;
        // yyyy-MM-dd는 문자열 비교가 날짜 비교와 같다.
        return record.month !== currentMonth() || expectedDate > record.expectedDate;
    } catch {
        return true;
    }
}

/** 띄웠다고 기록한다. 저장에 실패해도 화면은 그대로 쓴다. */
export async function markGoalGuardShown(blockId: number, expectedDate: string) {
    const record: ShownRecord = { expectedDate, month: currentMonth() };
    await SecureStore.setItemAsync(keyOf(blockId), JSON.stringify(record)).catch(() => undefined);
}

/** 안전으로 돌아오면 기록을 지워서, 다시 늦어질 때 띄운다. */
export async function clearGoalGuardShown(blockId: number) {
    await SecureStore.deleteItemAsync(keyOf(blockId)).catch(() => undefined);
}
