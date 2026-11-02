import { View } from 'react-native';

import { formatAmount, formatMonthDay, formatRelativeDateTime } from '@/lib/format';
import { ListRow } from '@/shared/components/ui/ListRow';
import { SuggestionCard } from '@/shared/components/ui/SuggestionCard';

import type { SpendingBlockDetail } from '@/features/block/types/blockDetail';

import { BlockDetailList, InfoLine } from './BlockDetailSection';
import { BlockHeroCard } from './BlockHeroCard';
import { BlockStatRow } from './BlockStatRow';
import { BurnRateCard } from './BurnRateCard';

/** "10월 1일 ~ 31일" — 같은 달이면 뒤쪽 월을 뺀다. */
function formatPeriod(startDate: string, endDate: string) {
    const isSameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
    const end = isSameMonth ? `${Number(endDate.slice(8, 10))}일` : formatMonthDay(endDate);
    return `${formatMonthDay(startDate)} ~ ${end}`;
}

const won = (amount: number) => formatAmount(amount, { showUnit: false });

/** 02 블록 상세 · 사용형 (생활비) */
export function SpendingDetailContent({ detail }: { detail: SpendingBlockDetail }) {
    const { block, today } = detail;

    return (
        <View>
            <BlockHeroCard
                block={block}
                statusReason={detail.statusReason}
                amountLabel="남은 금액"
                total={detail.allocatedAmount}
                footerLeft={`${formatPeriod(detail.periodStartDate, detail.periodEndDate)}  ${block.fillRate}% 남음`}
                footerRight={`${detail.remainingDays}일 남음`}
            />
            <View className="mt-3">
                <BlockStatRow
                    stats={[
                        { label: '오늘 가능', value: won(today.available) },
                        { label: '오늘 씀', value: won(today.spent) },
                        { label: '오늘 남음', value: won(today.remaining) },
                    ]}
                />
            </View>
            <View className="mt-3">
                <BurnRateCard burnRate={detail.burnRate} />
            </View>
            {detail.explanation && (
                // 절약 제안(⑤)·다른 블록에서 채우기(③ 자금 이동)는 해당 작업에서 연결한다.
                <SuggestionCard
                    className="mt-3"
                    title="왜 주의인가요?"
                    message={detail.explanation}
                    actions={[
                        { title: '절약 제안 보기', variant: 'secondary' },
                        { title: '다른 블록에서 채우기', variant: 'primary' },
                    ]}
                />
            )}
            <View className="mt-4">
                <InfoLine
                    title="규칙"
                    value={`월 ${formatAmount(detail.allocatedAmount)}  매월 ${Number(detail.periodStartDate.slice(8, 10))}일 시작`}
                />
            </View>
            <BlockDetailList
                title="최근 거래"
                moreLabel={`${block.name} 거래 전체 보기`}
                moreHref="/transactions"
            >
                {detail.recentTransactions.map((transaction, index) => (
                    <ListRow
                        key={transaction.transactionId}
                        title={transaction.merchantOrPayee ?? '알 수 없는 거래'}
                        subtitle={[
                            transaction.categoryName,
                            formatRelativeDateTime(transaction.occurredAt),
                        ]
                            .filter(Boolean)
                            .join('  ')}
                        tag={transaction.contextTag ?? undefined}
                        amount={
                            transaction.direction === 'OUT'
                                ? -transaction.amount
                                : transaction.amount
                        }
                        amountTone={transaction.direction === 'IN' ? 'up' : 'default'}
                        isLast={index === detail.recentTransactions.length - 1}
                    />
                ))}
            </BlockDetailList>
        </View>
    );
}
