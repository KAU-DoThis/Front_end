import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { formatMonth } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { Mascot } from '@/shared/components/ui/Mascot';

interface AgentSummaryCardProps {
    /** 리포트 달 (yyyy-MM) — 버튼에는 그다음 달을 쓴다. */
    month: string;
    /** 서버(AI)가 만든 문장 */
    comment: string;
}

/** 다음 달 (yyyy-MM → yyyy-MM) */
function nextMonth(month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** 에이전트의 한 달 정리 (F-13 AI 코멘트) */
export function AgentSummaryCard({ month, comment }: AgentSummaryCardProps) {
    const { t } = useTranslation('report');

    return (
        <Card variant="tinted" className="border border-primary-100">
            <View className="flex-row items-center gap-2">
                <Mascot pose="head-basic" className="h-8 w-8" />
                <AppText className="font-semibold text-13 text-primary-700">
                    {t('agent.title')}
                </AppText>
            </View>
            <AppText className="mt-3 text-15 leading-[23px]">{comment}</AppText>
            <Pressable
                accessibilityRole="link"
                hitSlop={8}
                // TODO: 절약 후보 화면이 생기면 그쪽으로 보낸다. 지금은 절약 탭을 연다. (소비 분석과 같음)
                onPress={() => router.push('/saving')}
                className="mt-3 self-start active:opacity-60"
            >
                <AppText className="font-semibold text-13 text-primary-700">
                    {t('agent.action', { month: formatMonth(`${nextMonth(month)}-01`) })}
                </AppText>
            </Pressable>
        </Card>
    );
}
