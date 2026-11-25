import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatMonth } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { CompareBar } from '@/shared/components/ui/CompareBar';
import { DeltaBadge } from '@/shared/components/ui/DeltaBadge';
import { colors } from '@/styles/tokens';

import type { MonthlyReport } from '@/features/report/types/monthlyReport';

interface CategoryChangeCardProps {
    month: string;
    previousMonth: string;
    changes: MonthlyReport['topChanges'];
}

/** 주요 소비 변화 — 분류마다 지난달 · 이번 달 비교 막대 */
export function CategoryChangeCard({ month, previousMonth, changes }: CategoryChangeCardProps) {
    const { t } = useTranslation('report');
    const monthLabel = formatMonth(`${month}-01`);
    const previousLabel = formatMonth(`${previousMonth}-01`);

    return (
        <Card>
            <AppText className="font-bold text-15">{t('changes.title')}</AppText>
            <AppText className="mt-0.5 text-12 text-ink-sub">
                {t('changes.caption', { month: previousLabel })}
            </AppText>
            <View className="mt-3">
                {changes.map((change, index) => {
                    const maxAmount = Math.max(change.previousAmount, change.currentAmount);
                    return (
                        <View
                            key={change.categoryName}
                            className={cn('py-4', index > 0 && 'border-t border-line-soft')}
                        >
                            <View className="flex-row items-center justify-between">
                                <AppText className="font-bold text-15">
                                    {change.categoryName}
                                </AppText>
                                {change.diffAmount !== 0 && (
                                    <DeltaBadge
                                        diffAmount={change.diffAmount}
                                        label={t(
                                            change.diffAmount > 0
                                                ? 'delta.increased'
                                                : 'delta.decreased',
                                        )}
                                    />
                                )}
                            </View>
                            <View className="mt-3 gap-2">
                                <CompareBar
                                    label={previousLabel}
                                    amount={change.previousAmount}
                                    maxAmount={maxAmount}
                                    isCurrent={false}
                                    previousColor={colors.primary[100]}
                                />
                                <CompareBar
                                    label={monthLabel}
                                    amount={change.currentAmount}
                                    maxAmount={maxAmount}
                                    isCurrent
                                />
                            </View>
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}
