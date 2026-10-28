import { View } from 'react-native';

import { formatAmount, formatMonthDay } from '@/lib/format';
import { ListRow } from '@/shared/components/ui/ListRow';
import { SuggestionCard } from '@/shared/components/ui/SuggestionCard';

import type { GoalBlockDetail } from '@/features/block/types/blockDetail';

import { BlockDetailList, InfoLine } from './BlockDetailSection';
import { BlockHeroCard } from './BlockHeroCard';
import { BlockStatRow } from './BlockStatRow';
import { GoalProjectionCard } from './GoalProjectionCard';

const won = (amount: number) => formatAmount(amount, { showUnit: false });

/** 02-1 블록 상세 · 목표형 (여행) */
export function GoalDetailContent({ detail }: { detail: GoalBlockDetail }) {
    const { block, monthly } = detail;
    const dueDate = block.dueDate;

    return (
        <View>
            <BlockHeroCard
                block={block}
                statusReason={detail.statusReason}
                amountLabel="모은 돈"
                total={detail.targetAmount}
                footerLeft={
                    dueDate
                        ? `${formatMonthDay(dueDate)}까지  ${block.fillRate}% 모음`
                        : `${block.fillRate}% 모음`
                }
                footerRight={detail.daysLeft === null ? '' : `D-${detail.daysLeft}`}
            />
            <View className="mt-3">
                <BlockStatRow
                    stats={[
                        { label: '이번 달 목표', value: won(monthly.target) },
                        { label: '이번 달 모음', value: won(monthly.saved) },
                        { label: '더 필요', value: won(monthly.remaining) },
                    ]}
                />
            </View>
            {detail.projection && dueDate && (
                <View className="mt-3">
                    <GoalProjectionCard
                        projection={detail.projection}
                        targetAmount={detail.targetAmount}
                        dueDate={dueDate}
                    />
                </View>
            )}
            {detail.explanation && (
                // 목표일 미루기(블록 수정)·절약분 넣기(⑤ 배분)는 해당 작업에서 연결한다.
                <SuggestionCard
                    className="mt-3"
                    title="왜 주의인가요?"
                    message={detail.explanation}
                    actions={[
                        { title: '목표일 미루기', variant: 'secondary' },
                        { title: '절약분 넣기', variant: 'primary' },
                    ]}
                />
            )}
            <View className="mt-4">
                <InfoLine
                    title="규칙"
                    value={[
                        `목표 ${won(detail.targetAmount)}`,
                        dueDate && formatMonthDay(dueDate),
                        block.rule?.monthly_target && `매달 ${won(block.rule.monthly_target)}`,
                    ]
                        .filter(Boolean)
                        .join('  ')}
                />
            </View>
            <BlockDetailList
                title="들어온 돈"
                moreLabel={`${block.name} 블록 기록 전체 보기`}
                moreHref="/transactions"
            >
                {detail.inflows.map((inflow, index) => (
                    <ListRow
                        key={inflow.transferId}
                        title={inflow.title}
                        subtitle={[formatMonthDay(inflow.occurredAt), inflow.note]
                            .filter(Boolean)
                            .join('  ')}
                        amount={inflow.amount}
                        amountTone="up"
                        isLast={index === detail.inflows.length - 1}
                    />
                ))}
            </BlockDetailList>
        </View>
    );
}
