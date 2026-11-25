import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useSpendingAnalysisQuery } from '@/shared/api/spendingAnalysis/useSpendingAnalysisQuery';
import { Screen } from '@/shared/components/layout/Screen';
import { ScreenState } from '@/shared/components/ui/ScreenState';

import { useMonthlyReportQuery } from '@/features/report/api/useMonthlyReportQuery';
import { AgentSummaryCard } from '@/features/report/components/AgentSummaryCard';
import { CategoryChangeCard } from '@/features/report/components/CategoryChangeCard';
import { ReportHeader } from '@/features/report/components/ReportHeader';
import { ReportSummaryRow } from '@/features/report/components/ReportSummaryRow';
import { ScoreCard } from '@/features/report/components/ScoreCard';
import { SpendingTrendCard } from '@/features/report/components/SpendingTrendCard';
import type { MonthlyReport } from '@/features/report/types/monthlyReport';

/** 리포트 본문. 지출 합계는 소비 분석(④)과 같은 데이터를 쓴다. */
function ReportContent({ report }: { report: MonthlyReport }) {
    const { t } = useTranslation('report');
    const { t: tCommon } = useTranslation();
    const analysis = useSpendingAnalysisQuery(report.month);

    if (analysis.isPending) {
        return <ScreenState variant="loading" title={t('state.loading')} />;
    }
    if (analysis.isError) {
        return (
            <ScreenState
                variant="error"
                title={t('state.error')}
                description={tCommon('error.tryAgainLater')}
                actionTitle={tCommon('action.retry')}
                onPressAction={() => analysis.refetch()}
            />
        );
    }

    const { spent } = analysis.data;

    return (
        <ScrollView contentContainerClassName="gap-3 px-5 pb-8 pt-4">
            {report.score && <ScoreCard score={report.score} />}
            <ReportSummaryRow spent={spent} saving={report.saving} allocation={report.allocation} />
            <SpendingTrendCard
                month={report.month}
                previousMonth={report.previousMonth}
                spent={spent}
                dailySpending={report.dailySpending}
            />
            {report.topChanges.length > 0 && (
                <CategoryChangeCard
                    month={report.month}
                    previousMonth={report.previousMonth}
                    changes={report.topChanges}
                />
            )}
            {/* 문장 생성에 실패하면 숫자 요약만 보여준다. (F-12) */}
            {report.agentComment && (
                <AgentSummaryCard month={report.month} comment={report.agentComment} />
            )}
        </ScrollView>
    );
}

/** 08 월간 리포트 (지난달까지만 있고, 이번 달 리포트는 없다) */
export function ReportScreen() {
    const { t } = useTranslation('report');
    const { t: tCommon } = useTranslation();
    // null이면 가장 최근 리포트
    const [month, setMonth] = useState<string | null>(null);
    const { data: page, isPending, isError, refetch } = useMonthlyReportQuery(month);

    if (isPending) {
        return (
            <Screen edges={['top']}>
                <ScreenState variant="loading" title={t('state.loading')} />
            </Screen>
        );
    }

    if (isError) {
        return (
            <Screen edges={['top']}>
                <ScreenState
                    variant="error"
                    title={t('state.error')}
                    description={tCommon('error.tryAgainLater')}
                    actionTitle={tCommon('action.retry')}
                    onPressAction={() => refetch()}
                />
            </Screen>
        );
    }

    return (
        <Screen edges={['top']}>
            <ReportHeader
                month={page.month}
                canGoNext={page.month < page.latestMonth}
                onChangeMonth={setMonth}
            />
            {page.report ? (
                <ReportContent report={page.report} />
            ) : (
                <View className="flex-1">
                    <ScreenState
                        variant="empty"
                        title={t('state.empty')}
                        description={t('state.emptyDescription')}
                    />
                </View>
            )}
        </Screen>
    );
}
