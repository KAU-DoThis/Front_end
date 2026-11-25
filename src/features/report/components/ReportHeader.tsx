import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { formatMonth } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { MonthNavigator } from '@/shared/components/ui/MonthNavigator';
import { colors } from '@/styles/tokens';

interface ReportHeaderProps {
    /** yyyy-MM */
    month: string;
    canGoNext: boolean;
    onChangeMonth: (month: string) => void;
}

/** ‹ 9월 리포트 › + PDF 버튼 */
export function ReportHeader({ month, canGoNext, onChangeMonth }: ReportHeaderProps) {
    const { t } = useTranslation('report');

    return (
        <View className="flex-row items-center pr-5 pt-4">
            <View className="flex-1">
                <MonthNavigator
                    month={month}
                    canGoNext={canGoNext}
                    onChange={onChangeMonth}
                    label={t('header.title', { month: formatMonth(`${month}-01`) })}
                />
            </View>
            {/* TODO: PDF 저장은 프리미엄 여부가 정해지면 연결한다. 지금은 눌러도 아무 일도 없다. */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('header.pdf')}
                className="h-9 flex-row items-center gap-1 rounded-12 border border-line-control px-3 active:bg-surface-neutral"
            >
                <Icon name="download" size={16} color={colors.ink.DEFAULT} />
                <AppText className="font-semibold text-13">{t('header.pdf')}</AppText>
            </Pressable>
        </View>
    );
}
