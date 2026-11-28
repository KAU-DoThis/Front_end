import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import type { BlockDetail } from '@/features/block/types/blockDetail';
import { goalOutcomeOf, todayKst } from '@/features/block/utils/goalOutcome';
import {
    clearGoalGuardShown,
    currentMonth,
    markGoalGuardShown,
    shouldShowGoalGuard,
} from '@/features/block/utils/goalGuardDismissal';

/**
 * 블록 상세에 들어왔을 때 목표형 블록이 늦어지는 중이면 목표 지키기(16)를 상세 위에 한 번 띄운다. (기한 전에만)
 * 상세가 포커스일 때만 확인한다. 확인 중에 다른 화면으로 넘어가면 취소하고, 돌아오면 다시 확인한다.
 * 띄우면 바로 기록해서, '지금은 괜찮아요'·뒤로 가기·방법 반영 어느 쪽으로 닫아도 같은 경고는 다시 띄우지 않는다.
 */
export function useGoalGuardAutoOpen(detail: BlockDetail | null | undefined) {
    // 이 화면에서 이미 확인한 경고 (blockId + 예상일 + 달). 상세를 다시 받아도 또 띄우지 않는다.
    const checkedKey = useRef<string | null>(null);
    // 안전으로 돌아와 기록을 지우는 중이면, 다 지운 뒤에 다시 확인한다.
    const pendingClear = useRef<Promise<void> | null>(null);

    const blockId = detail?.block.blockId;
    const isGoal = detail?.type === 'GOAL';
    // 기한이 지났거나 다 모은 목표는 목표 달성(17) · 기한 지남(17-1) 시트가 맡는다.
    const isLate =
        detail?.type === 'GOAL' &&
        detail.block.status !== 'SAFE' &&
        detail.projection?.isLate === true &&
        goalOutcomeOf(detail, todayKst()) === null;
    const expectedDate = detail?.type === 'GOAL' ? detail.projection?.expectedDate : undefined;
    // 상세를 다시 받을 때 달이 바뀌었으면 다시 확인한다.
    const month = currentMonth();

    useFocusEffect(
        useCallback(() => {
            if (blockId === undefined) return;
            if (!isLate || !expectedDate) {
                // 안전으로 돌아왔으면 기록을 지운다. (다시 늦어지면 띄우도록)
                if (isGoal) {
                    checkedKey.current = null;
                    pendingClear.current = clearGoalGuardShown(blockId);
                }
                return;
            }
            const key = `${blockId}:${expectedDate}:${month}`;
            if (checkedKey.current === key) return;
            checkedKey.current = key;

            let isCancelled = false;
            let isDone = false;
            (pendingClear.current ?? Promise.resolve())
                .then(() => shouldShowGoalGuard(blockId, expectedDate))
                .then((shouldShow) => {
                    if (isCancelled) return;
                    if (shouldShow) {
                        // 화면을 띄운 뒤에 기록한다. 띄우기 전에 나가면 기록하지 않는다.
                        router.push({ pathname: '/goal-guard/[blockId]', params: { blockId } });
                        markGoalGuardShown(blockId, expectedDate);
                    }
                    isDone = true;
                });
            return () => {
                isCancelled = true;
                // 확인을 끝내기 전에 정리되면(다른 화면으로 이동, 개발 모드 effect 두 번 실행 등) 다음 실행에서 다시 확인한다.
                if (!isDone) checkedKey.current = null;
            };
        }, [blockId, isGoal, isLate, expectedDate, month]),
    );
}
