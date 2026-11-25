import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

import type { MonthlyReport } from '@/features/report/types/monthlyReport';

const RING_SIZE = 96;
const RING_STROKE = 10;
/** 어두운 카드 위 링 바탕 (시안 08 점수 링) */
const RING_TRACK_COLOR = 'rgba(255, 255, 255, 0.16)';

/** 점수 링. 12시 방향부터 시계 방향으로 점수만큼 채운다. */
function ScoreRing({ value }: { value: number }) {
    const radius = (RING_SIZE - RING_STROKE) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = Math.min(Math.max(value, 0), 100) / 100;
    const center = RING_SIZE / 2;

    return (
        <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={RING_TRACK_COLOR}
                strokeWidth={RING_STROKE}
                fill="none"
            />
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.primary[300]}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={[circumference * ratio, circumference]}
                fill="none"
                transform={`rotate(-90 ${center} ${center})`}
            />
        </Svg>
    );
}

interface ScoreCardProps {
    score: NonNullable<MonthlyReport['score']>;
}

/** 금융관리 점수 카드 (F-14) */
export function ScoreCard({ score }: ScoreCardProps) {
    const { t } = useTranslation('report');
    const diffText =
        score.diff === null
            ? null
            : t('score.diff', { value: score.diff > 0 ? `+${score.diff}` : `${score.diff}` });

    return (
        <View className="flex-row items-center gap-5 rounded-24 bg-primary-900 px-5 py-4">
            <View
                accessible
                accessibilityLabel={t('score.a11y', { score: score.value })}
                className="items-center justify-center"
            >
                <ScoreRing value={score.value} />
                <View className="absolute items-center">
                    <AppText className="font-bold text-30 text-white">{score.value}</AppText>
                    <AppText className="text-12 text-primary-100">{t('score.outOf')}</AppText>
                </View>
            </View>
            <View className="flex-1">
                <AppText className="text-13 text-primary-100">{t('score.title')}</AppText>
                {diffText && (
                    <AppText className="mt-1 font-bold text-17 text-white">
                        {`${t('score.compare')} `}
                        <AppText className="font-bold text-17 text-primary-300">{diffText}</AppText>
                    </AppText>
                )}
                <View className="mt-2 flex-row flex-wrap gap-x-2 gap-y-1">
                    {score.items.map((item) => (
                        <AppText key={item.code} className="text-12 text-primary-100">
                            {t('score.item', {
                                label: t(`score.items.${item.code}`),
                                percent: item.percent,
                            })}
                        </AppText>
                    ))}
                </View>
            </View>
        </View>
    );
}
