import { View } from 'react-native';

import { formatAmount, formatMonthDay } from '@/lib/format';
import { Icon } from '@/shared/components/ui/Icon';
import { ListRow } from '@/shared/components/ui/ListRow';
import { colors } from '@/styles/tokens';

import type { FixedBlockDetail } from '@/features/block/types/blockDetail';

import { BlockDetailList } from './BlockDetailSection';
import { BlockHeroCard } from './BlockHeroCard';
import { BlockStatRow } from './BlockStatRow';
import { PaymentAlertCard, PaymentRuleCard } from './FixedPaymentCards';

const won = (amount: number) => formatAmount(amount, { showUnit: false });

/** 02-2 블록 상세 · 고정지출형 (월세) */
export function FixedDetailContent({ detail }: { detail: FixedBlockDetail }) {
    const { block } = detail;
    const payDay = block.rule?.pay_day;

    return (
        <View>
            <BlockHeroCard
                block={block}
                statusReason={detail.statusReason}
                amountLabel="확보한 돈"
                total={detail.payAmount}
                footerLeft={[payDay && `매월 ${payDay}일 납부`, `${block.fillRate}% 확보`]
                    .filter(Boolean)
                    .join('  ')}
                footerRight={block.daysUntilPay === null ? '' : `D-${block.daysUntilPay}`}
            />
            <View className="mt-3">
                <BlockStatRow
                    stats={[
                        { label: '다음 납부', value: formatMonthDay(detail.nextPayDate) },
                        { label: '납부 금액', value: won(detail.payAmount) },
                        { label: '모자란 돈', value: won(detail.shortfall) },
                    ]}
                />
            </View>
            <View className="mt-3">
                <PaymentRuleCard rule={detail.matchRule} />
            </View>
            <View className="mt-3">
                <PaymentAlertCard alerts={detail.alerts} />
            </View>
            <BlockDetailList
                title="납부 기록"
                titleValue={
                    detail.onTimeStreak > 0
                        ? `${detail.onTimeStreak}달 연속 제때 냈어요`
                        : undefined
                }
                moreLabel="납부 기록 전체 보기"
                moreHref="/transactions"
            >
                {detail.payments.map((payment, index) => (
                    <ListRow
                        key={payment.transactionId}
                        leading={
                            <View className="h-7 w-7 items-center justify-center rounded-12 bg-surface-neutral">
                                <Icon name="check" size={14} color={colors.primary[700]} />
                            </View>
                        }
                        title={formatMonthDay(payment.paidAt)}
                        subtitle={`${payment.payee}  ${payment.accountLabel}`}
                        amount={-payment.amount}
                        isLast={index === detail.payments.length - 1}
                    />
                ))}
            </BlockDetailList>
        </View>
    );
}
