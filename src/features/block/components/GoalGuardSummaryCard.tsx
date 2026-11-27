import { useState } from 'react';
import { View } from 'react-native';

import { formatAmount, formatMonthDay } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { MiniBeaker } from '@/shared/components/ui/MiniBeaker';
import { StatusTag } from '@/shared/components/ui/StatusTag';
import { colors } from '@/styles/tokens';

import type { GoalGuard } from '@/features/block/types/goalGuard';

const STATUS_KEY = { SAFE: 'safe', CAUTION: 'caution', DANGER: 'danger' } as const;
/** 예상일 표시 위치 (막대 끝에서 조금 안쪽, 시안 16) */
const EXPECTED_POSITION = 0.93;
/** 두 날짜 글자 사이 최소 간격 (px) */
const LABEL_GAP = 8;

const toTime = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split('-').map(Number);
    return Date.UTC(year, month - 1, day);
};

/** 시작일 ~ 예상일 사이에서 목표일이 놓일 위치 (0~1) */
function duePosition(startDate: string, dueDate: string, expectedDate: string) {
    const span = toTime(expectedDate) - toTime(startDate);
    if (span <= 0) return EXPECTED_POSITION;
    const ratio = (toTime(dueDate) - toTime(startDate)) / span;
    return Math.min(EXPECTED_POSITION, Math.max(0, ratio * EXPECTED_POSITION));
}

interface GoalGuardSummaryCardProps {
    guard: GoalGuard;
}

/** 블록 요약: 모은 돈 / 목표 + 목표일 · 예상일 표시 (시안 16 상단 카드) */
export function GoalGuardSummaryCard({ guard }: GoalGuardSummaryCardProps) {
    const { block, targetAmount, dueDate, expectedDate, expectedLabel } = guard;
    const fillColor = colors.block[block.color][STATUS_KEY[block.status]];
    const due = duePosition(block.startDate, dueDate, expectedDate);
    const dueLabel = `목표 ${formatMonthDay(dueDate)}`;
    const expectedText = `예상 ${expectedLabel}`;

    // 글자 폭을 재서 목표 글자가 예상 글자와 겹치면 막대 위로 올린다.
    const [trackWidth, setTrackWidth] = useState(0);
    const [dueWidth, setDueWidth] = useState(0);
    const [expectedWidth, setExpectedWidth] = useState(0);
    const isMeasured = trackWidth > 0 && dueWidth > 0 && expectedWidth > 0;
    // 목표 표시 왼쪽에 붙이되, 막대 왼쪽 밖으로 나가지 않게 한다.
    const dueLeft = Math.max(0, due * trackWidth - dueWidth);
    const isDueAbove = dueLeft + dueWidth + LABEL_GAP > trackWidth - expectedWidth;

    const dueText = (
        <AppText
            className="absolute font-bold text-12"
            style={{ left: dueLeft, opacity: isMeasured ? 1 : 0 }}
            onLayout={(event) => setDueWidth(event.nativeEvent.layout.width)}
        >
            {dueLabel}
        </AppText>
    );

    return (
        <Card>
            <View className="flex-row items-center gap-3">
                <MiniBeaker color={block.color} status={block.status} fillRate={block.fillRate} />
                <View className="flex-1">
                    <AppText className="font-bold text-15">{block.name}</AppText>
                    <AppText className="mt-0.5 text-13 text-ink-sub">
                        <AppText className="font-bold text-13">
                            {formatAmount(block.balance, { showUnit: false })}
                        </AppText>
                        {` / ${formatAmount(targetAmount, { showUnit: false })}원`}
                    </AppText>
                </View>
                <StatusTag status={block.status} />
            </View>

            <View
                className="mt-7"
                accessible
                accessibilityLabel={`${dueLabel}, ${expectedText}`}
                onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            >
                {isDueAbove && <View className="mb-1 h-4">{dueText}</View>}
                <View className="h-4.5 justify-center">
                    <View className="h-1.5 overflow-hidden rounded-full bg-line">
                        <View
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.min(100, Math.max(0, block.fillRate))}%`,
                                backgroundColor: fillColor,
                            }}
                        />
                    </View>
                    {/* 목표일: 진한 실선 · 예상일: 점선 */}
                    <View
                        className="absolute h-4.5 w-0.5 rounded-full bg-ink"
                        style={{ left: `${due * 100}%` }}
                    />
                    <View
                        className="absolute h-4.5 border-l-2 border-dashed border-ink-sub"
                        style={{ left: `${EXPECTED_POSITION * 100}%` }}
                    />
                </View>
                <View className="mt-1 h-4">
                    {!isDueAbove && dueText}
                    <AppText
                        className="absolute right-0 text-12 text-ink-sub"
                        style={{ opacity: isMeasured ? 1 : 0 }}
                        onLayout={(event) => setExpectedWidth(event.nativeEvent.layout.width)}
                    >
                        {expectedText}
                    </AppText>
                </View>
            </View>
        </Card>
    );
}
