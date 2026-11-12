import { ActivityIndicator, View } from 'react-native';

import { useSimulateTransferQuery } from '@/features/block/api/useSimulateTransferQuery';
import { formatTime, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { ImpactList } from '@/shared/components/ui/ImpactList';
import { colors } from '@/styles/tokens';

import type { CoachMove } from '@/features/suggestion/stores/coachActivityStore';

interface UndoProposalSheetProps {
    /** null이면 닫힘 */
    move: CoachMove | null;
    isUndoing: boolean;
    onClose: () => void;
    onConfirm: (move: CoachMove) => void;
}

/** 8-1 되돌리기 확인. 영향은 반대 방향 이동 미리보기(/blocks/simulate)로 계산한다. */
export function UndoProposalSheet({ move, isUndoing, onClose, onConfirm }: UndoProposalSheetProps) {
    const result = move?.result;
    // 되돌리기 = 받은 블록에서 보낸 블록으로 같은 금액을 옮기기
    const simulation = useSimulateTransferQuery({
        fromBlockId: result?.to.blockId ?? null,
        toBlockId: result?.from.blockId ?? null,
        amount: result?.amount ?? 0,
    });

    return (
        <BottomSheet
            isOpen={move !== null}
            onClose={onClose}
            title="이 일을 되돌릴까요?"
            description={
                move && result
                    ? `오늘 ${formatTime(move.performedAt)} · ${result.from.name} → ${result.to.name} ${formatWon(result.amount)}`
                    : undefined
            }
        >
            <View className="gap-4 pb-2">
                {simulation.data ? (
                    <ImpactList title="되돌리면 이렇게 바뀌어요" items={simulation.data.items} />
                ) : simulation.isError ? (
                    <AppText className="text-13 text-ink-sub">
                        바뀌는 내용을 계산하지 못했어요. 되돌리기는 할 수 있어요.
                    </AppText>
                ) : (
                    <ActivityIndicator color={colors.primary[700]} />
                )}
                <View className="flex-row gap-2">
                    <Button
                        title="그대로 두기"
                        variant="secondary"
                        className="flex-1"
                        onPress={onClose}
                    />
                    <Button
                        title="되돌리기"
                        loadingTitle="되돌리는 중"
                        isLoading={isUndoing}
                        className="flex-1"
                        onPress={() => move && onConfirm(move)}
                    />
                </View>
            </View>
        </BottomSheet>
    );
}
