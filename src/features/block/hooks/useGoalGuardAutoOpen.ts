import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import type { BlockDetail } from '@/features/block/types/blockDetail';
import {
    clearGoalGuardShown,
    markGoalGuardShown,
    shouldShowGoalGuard,
} from '@/features/block/utils/goalGuardDismissal';

/**
 * 블록 상세에 들어왔을 때 목표형 블록이 늦어지는 중이면 목표 지키기(16)를 상세 위에 한 번 띄운다.
 * 띄울 때 바로 기록해서, '지금은 괜찮아요'·뒤로 가기·방법 반영 어느 쪽으로 닫아도 같은 경고는 다시 띄우지 않는다.
 */
export function useGoalGuardAutoOpen(detail: BlockDetail | null | undefined) {
    // 이 화면에서 이미 확인한 경고 (blockId + 예상일). 상세를 다시 받아도 또 띄우지 않는다.
    const checkedKey = useRef<string | null>(null);

    const blockId = detail?.block.blockId;
    const isLate =
        detail?.type === 'GOAL' &&
        detail.block.status !== 'SAFE' &&
        detail.projection?.isLate === true;
    const expectedDate = detail?.type === 'GOAL' ? detail.projection?.expectedDate : undefined;

    useEffect(() => {
        if (blockId === undefined) return;
        if (!isLate || !expectedDate) {
            // 안전으로 돌아왔으면 기록을 지운다. (다시 늦어지면 띄우도록)
            if (detail?.type === 'GOAL') {
                clearGoalGuardShown(blockId);
            }
            return;
        }
        const key = `${blockId}:${expectedDate}`;
        if (checkedKey.current === key) return;
        checkedKey.current = key;

        let isCancelled = false;
        let isDone = false;
        shouldShowGoalGuard(blockId, expectedDate).then(async (shouldShow) => {
            if (isCancelled) return;
            if (shouldShow) {
                await markGoalGuardShown(blockId, expectedDate);
                if (isCancelled) return;
                router.push({ pathname: '/goal-guard/[blockId]', params: { blockId } });
            }
            isDone = true;
        });
        return () => {
            isCancelled = true;
            // 확인을 끝내기 전에 정리되면(개발 모드 effect 두 번 실행 등) 다음 실행에서 다시 확인한다.
            if (!isDone) checkedKey.current = null;
        };
    }, [blockId, isLate, expectedDate, detail?.type]);
}
