import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { GoalOutcomeKind } from '@/features/block/types/goalOutcome';
import { goalOutcomeOf, todayKst } from '@/features/block/utils/goalOutcome';
import { shouldShowGoalOutcome } from '@/features/block/utils/goalOutcomeDismissal';

/**
 * 블록 상세에 들어왔을 때 목표형 블록이 끝났으면 시트를 띄운다.
 * - 다 모았으면 17 목표 달성 (기한이 지났어도 달성이 먼저)
 * - 기한을 정해 둔 블록의 기한이 지났는데 다 못 모았으면 17-1 목표 기한 지남
 * 모든 목표형 블록에 같은 규칙을 쓴다. 상세가 포커스일 때만 확인하고, 미뤘거나 끝낸 목표(goalOutcomeDismissal)는 띄우지 않는다.
 * - 목표 달성을 고르지 않고 닫았으면 상세에서 나갔다가 다시 들어올 때 또 띄운다.
 * - 기한 지남을 고르지 않고 닫았으면 3일 동안 띄우지 않는다.
 */
export function useGoalOutcomeAutoOpen(detail: BlockDetail | null | undefined) {
    // 이번 포커스에서 이미 확인한 목표 (blockId + 종류 + 목표 금액 + 기한). 같은 포커스에서 상세를 다시 받아도 또 띄우지 않는다.
    const checkedKey = useRef<string | null>(null);
    // 닫는 동안에도 시트 내용을 그대로 그리도록 마지막으로 띄운 종류를 남겨 둔다.
    const [kind, setKind] = useState<GoalOutcomeKind | null>(null);
    // 지금 띄운 목표의 키. 닫으면 null
    const [openKey, setOpenKey] = useState<string | null>(null);

    const today = todayKst();
    const outcome = goalOutcomeOf(detail, today);
    const blockId = detail?.block.blockId;
    const targetAmount = detail?.type === 'GOAL' ? detail.targetAmount : 0;
    const dueDate = detail?.block.dueDate?.slice(0, 10) ?? null;
    const currentKey =
        blockId !== undefined && outcome
            ? `${blockId}:${outcome}:${targetAmount}:${dueDate}`
            : null;

    useFocusEffect(
        useCallback(() => {
            if (blockId === undefined || !outcome || !currentKey) return;
            const key = currentKey;
            if (checkedKey.current === key) return;
            checkedKey.current = key;

            let isCancelled = false;
            shouldShowGoalOutcome(blockId, { kind: outcome, targetAmount, dueDate }, today).then(
                (shouldShow) => {
                    if (isCancelled || !shouldShow) return;
                    setKind(outcome);
                    setOpenKey(key);
                },
            );
            return () => {
                isCancelled = true;
                // 다른 화면으로 넘어가면 돌아왔을 때 다시 확인한다. (확인을 끝냈어도)
                checkedKey.current = null;
            };
        }, [blockId, outcome, targetAmount, dueDate, today, currentKey]),
    );

    // 띄운 뒤 목표가 바뀌었거나 끝난 상태가 아니게 되면(다른 기기에서 기한을 늘림 등) 열린 시트를 닫힌 것으로 본다.
    // 종류(kind)는 닫히는 동안 내용을 그대로 그리도록 남겨 둔다.
    const isOpen = openKey !== null && openKey === currentKey;

    return { kind, isOpen, today, close: () => setOpenKey(null) };
}
