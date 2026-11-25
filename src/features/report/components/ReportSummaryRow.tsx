import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import type { SpendingAnalysis } from '@/shared/types/spendingAnalysis';

import type { MonthlyReport } from '@/features/report/types/monthlyReport';

interface SummaryBoxProps {
    label: string;
    amount: number;
    footer: ReactNode;
}

function SummaryBox({ label, amount, footer }: SummaryBoxProps) {
    return (
        <View className="flex-1 rounded-12 border border-line bg-white px-3 py-3">
            <AppText className="text-12 text-ink-sub">{label}</AppText>
            <AmountText amount={amount} showUnit={false} className="mt-1 text-15" />
            <View className="mt-0.5">{footer}</View>
        </View>
    );
}

interface ReportSummaryRowProps {
    spent: SpendingAnalysis['spent'];
    saving: MonthlyReport['saving'];
    allocation: MonthlyReport['allocation'];
}

/** 총 지출 · 절약 · 블록 배분 3칸 */
export function ReportSummaryRow({ spent, saving, allocation }: ReportSummaryRowProps) {
    const { t } = useTranslation('report');
    const [firstBlock, ...restBlocks] = allocation.blockNames;

    return (
        <View className="flex-row gap-2">
            <SummaryBox
                label={t('summary.spent')}
                amount={spent.amount}
                footer={
                    spent.diffPercent !== undefined && spent.diffPercent !== 0 ? (
                        // 지출이 줄면 파랑, 늘면 빨강 (증감 색 규칙)
                        <AppText
                            className={cn(
                                'font-semibold text-12',
                                spent.diffPercent < 0 ? 'text-delta-up' : 'text-delta-down',
                            )}
                        >
                            {t('summary.percent', {
                                value:
                                    spent.diffPercent > 0
                                        ? `+${spent.diffPercent}`
                                        : `${spent.diffPercent}`,
                            })}
                        </AppText>
                    ) : null
                }
            />
            <SummaryBox
                label={t('summary.saving')}
                amount={saving.amount}
                footer={
                    saving.targetAmount !== null ? (
                        <AppText className="text-12 text-ink-sub">
                            {t('summary.savingTarget', {
                                amount: formatWon(saving.targetAmount, { showUnit: false }),
                            })}
                        </AppText>
                    ) : null
                }
            />
            <SummaryBox
                label={t('summary.allocation')}
                amount={allocation.amount}
                footer={
                    firstBlock ? (
                        <AppText numberOfLines={1} className="text-12 text-ink-sub">
                            {restBlocks.length > 0
                                ? t('summary.allocationMore', {
                                      name: firstBlock,
                                      extra: restBlocks.length,
                                  })
                                : firstBlock}
                        </AppText>
                    ) : null
                }
            />
        </View>
    );
}
