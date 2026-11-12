import { useState } from 'react';
import { View } from 'react-native';

import { formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { ImpactList } from '@/shared/components/ui/ImpactList';
import { Toggle } from '@/shared/components/ui/Toggle';

import type { ProposalSide, TransferProposalCard } from '@/features/suggestion/types/coach';
import { toProposalImpacts, withRo } from '@/features/suggestion/utils/coachText';

import { CoachUserMessage } from './CoachUserMessage';

interface ProposalPanelProps {
    text: string;
    card: TransferProposalCard;
    isAccepting: boolean;
    onAccept: () => void;
}

/** 2 명령 → 확인: 옮기기 전에 전후 잔액과 영향을 보여주고 한 번 확인받는다. */
export function ProposalPanel({ text, card, isAccepting, onAccept }: ProposalPanelProps) {
    // shortcut: 자동 되돌리기는 제안 수락 API에 없어 화면에만 있다. API가 생기면 수락 요청에 넣는다.
    const [isAutoReturn, setIsAutoReturn] = useState(true);
    const impacts = toProposalImpacts(card);
    const canAccept = card.status === 'PENDING' && !card.blocked;

    return (
        <View className="gap-3">
            <CoachUserMessage text={text} />
            <Card className="gap-3">
                <AppText className="font-bold text-17">이렇게 옮길까요?</AppText>
                <SideRow label="보내는 블록" side={card.from} tone="down" />
                <SideRow label="받는 블록" side={card.to} tone="up" />
            </Card>
            {impacts.length > 0 && <ImpactList title="옮기면 이렇게 바뀌어요" items={impacts} />}
            <Card className="flex-row items-center gap-3">
                <AppText className="flex-1 text-13 leading-[19px]">
                    {`다음 정기 입금 때 ${withRo(card.from.name)} ${formatWon(card.amount)} 자동 되돌리기`}
                </AppText>
                <Toggle
                    value={isAutoReturn}
                    onValueChange={setIsAutoReturn}
                    accessibilityLabel="다음 정기 입금 때 자동 되돌리기"
                />
            </Card>
            {card.blockedReason && (
                <AppText className="text-center text-12 text-danger-text">
                    {card.blockedReason}
                </AppText>
            )}
            <Button
                title={`${formatWon(card.amount)} 옮기기`}
                loadingTitle="옮기는 중"
                isLoading={isAccepting}
                disabled={!canAccept}
                onPress={onAccept}
            />
        </View>
    );
}

function SideRow({
    label,
    side,
    tone,
}: {
    label: string;
    side: ProposalSide;
    tone: 'up' | 'down';
}) {
    return (
        <View className="flex-row items-end justify-between">
            <View className="gap-0.5">
                <AppText className="text-12 text-ink-sub">{label}</AppText>
                <AppText className="font-bold text-17">{side.name}</AppText>
            </View>
            <View className="items-end gap-0.5">
                <AmountText
                    amount={side.balanceBefore}
                    showUnit={false}
                    className="font-regular text-12 text-ink-sub line-through"
                />
                <AmountText
                    amount={side.balanceAfter}
                    tone={tone}
                    showUnit={false}
                    className="text-17"
                />
            </View>
        </View>
    );
}
