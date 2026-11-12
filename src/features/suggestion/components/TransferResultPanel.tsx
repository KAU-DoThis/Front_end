import { View } from 'react-native';

import { formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import type { CoachMove } from '@/features/suggestion/stores/coachActivityStore';
import type { TransferResultSide } from '@/features/suggestion/types/coach';

import { ChatInput } from './ChatInput';

interface TransferResultPanelProps {
    move: CoachMove;
    onUndo: () => void;
    onOpenHome: () => void;
    onOpenHistory: () => void;
    onCommand: (text: string) => void;
}

/** 4 완료 · 8-2 되돌린 뒤: 옮긴(되돌린) 결과와 다음 할 일 */
export function TransferResultPanel({
    move,
    onUndo,
    onOpenHome,
    onOpenHistory,
    onCommand,
}: TransferResultPanelProps) {
    const isUndone = move.undoResult !== null;
    const card = move.undoResult ?? move.result;
    const sides = isUndone ? [card.to, card.from] : [card.from, card.to];
    const note =
        !isUndone && move.dailyBudget && move.dailyBudget.before !== move.dailyBudget.after
            ? `하루 쓸 수 있는 돈이 ${formatWon(move.dailyBudget.before)}에서 ${formatWon(move.dailyBudget.after)}으로 ${move.dailyBudget.after > move.dailyBudget.before ? '늘었어요' : '줄었어요'}.`
            : null;

    return (
        <View className="gap-4">
            <Card variant="neutral" className="gap-3">
                <View className="flex-row items-center gap-2">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-700">
                        <Icon name="check" size={14} color={colors.white} />
                    </View>
                    <AppText className="flex-1 font-bold text-17">
                        {`${formatWon(card.amount)} ${isUndone ? '되돌렸어요' : '옮겼어요'}`}
                    </AppText>
                    <AppText className="text-12 text-ink-sub">방금</AppText>
                </View>
                {sides.map((side) => (
                    <ResultRow key={side.blockId} side={side} />
                ))}
                {note && (
                    <AppText className="border-t border-line pt-3 text-13 leading-[19px] text-ink-sub">
                        {note}
                    </AppText>
                )}
            </Card>
            <View className="flex-row gap-2">
                {isUndone ? (
                    <>
                        <Button
                            title="기록 보기"
                            variant="secondary"
                            className="flex-1"
                            onPress={onOpenHistory}
                        />
                        <Button
                            // 시안의 '5. 주의' 화면은 시연 범위 밖이라 홈으로 보낸다.
                            title={`${card.from.name} 채울 방법 보기`}
                            className="flex-[2]"
                            onPress={onOpenHome}
                        />
                    </>
                ) : (
                    <>
                        {move.result.undoable && (
                            <Button
                                title="되돌리기"
                                variant="secondary"
                                className="flex-1"
                                onPress={onUndo}
                            />
                        )}
                        <Button title="홈에서 보기" className="flex-[2]" onPress={onOpenHome} />
                    </>
                )}
            </View>
            <ChatInput onSubmit={onCommand} />
        </View>
    );
}

function ResultRow({ side }: { side: TransferResultSide }) {
    return (
        <View className="flex-row items-center justify-between">
            <AppText className="text-15">{side.name}</AppText>
            <View className="flex-row items-baseline gap-1.5">
                <AmountText amount={side.balanceAfter} showUnit={false} className="text-15" />
                <AmountText
                    amount={side.diff}
                    showSign
                    showUnit={false}
                    tone={side.diff > 0 ? 'up' : 'down'}
                    className="font-semibold text-12"
                />
            </View>
        </View>
    );
}
