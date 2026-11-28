import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { formatMonthDay, formatWon } from '@/lib/format';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';
import { ApiError } from '@/shared/types/api';

import { useApplyGoalOutcomeMutation } from '@/features/block/api/useApplyGoalOutcomeMutation';
import type { GoalBlockDetail } from '@/features/block/types/blockDetail';
import type {
    ApplyGoalOutcomeRequest,
    GoalOutcomeAction,
    GoalOutcomeKind,
} from '@/features/block/types/goalOutcome';
import { GOAL_OUTCOME_ERROR_CODE } from '@/features/block/types/goalOutcome';
import {
    remindGoalOutcomeLater,
    type GoalOutcomeTarget,
} from '@/features/block/utils/goalOutcomeDismissal';

import { GoalAchievedContent } from './GoalAchievedContent';
import { GoalOverdueContent } from './GoalOverdueContent';

interface GoalOutcomeSheetProps {
    isOpen: boolean;
    /** 띄울 시트 (17 목표 달성 · 17-1 기한 지남) */
    kind: GoalOutcomeKind;
    detail: GoalBlockDetail;
    today: string;
    /** 시트를 닫는다. (처리했거나 미뤘거나) */
    onClose: () => void;
    /** 다른 블록으로 옮기기: 이 블록에서 보내는 자금 이동 시트를 연다. */
    onMove: () => void;
}

/**
 * 17 목표 달성 · 17-1 목표 기한 지남 시트
 * 닫기(X·배경·뒤로 가기)는 '지금은 괜찮아요'로 보고 REMIND_LATER를 보낸다.
 * 기한 지남은 3일 동안 띄우지 않고, 목표 달성은 다음에 상세에 들어오면 다시 띄운다.
 */
export function GoalOutcomeSheet({
    isOpen,
    kind,
    detail,
    today,
    onClose,
    onMove,
}: GoalOutcomeSheetProps) {
    const [isRaising, setIsRaising] = useState(false);
    const { mutate, isPending } = useApplyGoalOutcomeMutation();
    const { blockId, name, balance, dueDate } = detail.block;
    const target: GoalOutcomeTarget = {
        kind,
        targetAmount: detail.targetAmount,
        dueDate: dueDate?.slice(0, 10) ?? null,
    };

    const close = () => {
        setIsRaising(false);
        onClose();
    };

    const apply = (
        action: GoalOutcomeAction,
        extra: Omit<ApplyGoalOutcomeRequest, 'action' | 'version'> = {},
        { settle, onSuccess = close }: { settle?: GoalOutcomeTarget; onSuccess?: () => void } = {},
    ) => {
        if (isPending) return;
        mutate(
            { blockId, body: { action, version: detail.version, ...extra }, settle },
            {
                onSuccess,
                onError: (error) => {
                    if (error instanceof ApiError) {
                        if (error.code === GOAL_OUTCOME_ERROR_CODE.VERSION_CONFLICT) {
                            Alert.alert(
                                '블록이 바뀌었어요',
                                '바뀐 값으로 다시 불러왔어요. 확인하고 다시 눌러 주세요',
                            );
                            return;
                        }
                        if (error.code === GOAL_OUTCOME_ERROR_CODE.NOTHING_SAVED) {
                            Alert.alert('모은 돈이 없어요', '다른 방법을 골라 주세요');
                            return;
                        }
                    }
                    Alert.alert('반영하지 못했어요', '잠시 후 다시 시도해 주세요');
                },
            },
        );
    };

    /**
     * 고르지 않고 닫기: 서버에 알린다. (실패해도 그대로 닫는다)
     * 3일 뒤에 다시 묻는 건 기한 지남(17-1)만이다. 목표 달성(17)은 다음에 상세에 들어오면 다시 띄운다.
     */
    const remindLater = () => {
        if (isPending) return;
        mutate({ blockId, body: { action: 'REMIND_LATER', version: detail.version } });
        if (kind === 'OVERDUE') remindGoalOutcomeLater(blockId, target, today);
        close();
    };

    const confirmCleanup = () => {
        Alert.alert(
            `${name} 블록을 정리할까요?`,
            balance > 0 ? `모은 ${formatWon(balance)}은 나눌 돈으로 돌아가요` : undefined,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '정리하기',
                    style: 'destructive',
                    onPress: () =>
                        apply(
                            'CLEANUP',
                            {},
                            {
                                onSuccess: () => {
                                    close();
                                    router.dismissTo('/');
                                },
                            },
                        ),
                },
            ],
        );
    };

    const compareProducts = () => {
        // TODO: 19 금융상품 비교 화면이 생기면 그 화면으로 보낸다.
        Alert.alert('준비 중이에요', '금융상품 비교는 곧 열려요');
    };

    const isOverdue = kind === 'OVERDUE' && dueDate !== null;

    return (
        <BottomSheet
            isOpen={isOpen}
            // 목표 올리기 입력 중에도 닫기(X·배경·끌어내리기)는 고르지 않고 닫은 것으로 본다. 뒤로 가기는 고르기로 돌아간다.
            onClose={remindLater}
            isDismissible={!isPending}
            hasCloseButton
            title={isRaising ? '목표 올리기' : isOverdue ? `${name} 목표일이 지났어요` : undefined}
            description={isOverdue && !isRaising ? `목표일 ${formatMonthDay(dueDate)}` : undefined}
            onBack={isRaising ? () => setIsRaising(false) : undefined}
            scrollable
        >
            {isOverdue ? (
                <GoalOverdueContent
                    detail={detail}
                    dueDate={dueDate}
                    today={today}
                    isPending={isPending}
                    onExtend={(newDueDate) => apply('EXTEND', { newDueDate })}
                    onFinish={() =>
                        // 목표를 모은 금액으로 바꿔 달성 처리하니 목표 달성 시트도 다시 띄우지 않는다.
                        apply(
                            'FINISH_AT_CURRENT',
                            {},
                            {
                                settle: {
                                    kind: 'ACHIEVED',
                                    targetAmount: balance,
                                    dueDate: target.dueDate,
                                },
                            },
                        )
                    }
                    onCleanup={confirmCleanup}
                />
            ) : (
                <GoalAchievedContent
                    detail={detail}
                    today={today}
                    isRaising={isRaising}
                    isPending={isPending}
                    onKeep={() => apply('KEEP', {}, { settle: target })}
                    onStartRaise={() => setIsRaising(true)}
                    onRaise={(newTargetAmount) => apply('RAISE_TARGET', { newTargetAmount })}
                    onMove={() => {
                        close();
                        onMove();
                    }}
                    onCompareProducts={compareProducts}
                />
            )}
        </BottomSheet>
    );
}
