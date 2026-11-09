import { Pressable, ScrollView } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

import type { TransactionStatusFilter } from '@/features/transaction/types/transaction';

interface FilterChipProps {
    label: string;
    /** 이름 뒤에 청록 굵은 숫자로 붙는다. (예: 확인 필요 2) */
    count?: number;
    /** 누르면 고르는 시트가 열리는 칩 (▾) */
    hasPicker?: boolean;
    isSelected: boolean;
    onPress: () => void;
}

/** 필터 칩 (높이 32 · 모서리 16). 고르면 청록 바탕 흰 글씨 */
function FilterChip({ label, count, hasPicker = false, isSelected, onPress }: FilterChipProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            hitSlop={6}
            onPress={onPress}
            className={cn(
                'h-8 flex-row items-center rounded-16 border px-3 active:opacity-70',
                isSelected ? 'border-primary-700 bg-primary-700' : 'border-line bg-white',
            )}
        >
            <AppText
                className={cn('text-13', isSelected ? 'font-semibold text-white' : 'text-ink')}
            >
                {label}
                {count !== undefined && (
                    <AppText
                        className={cn(
                            'font-bold text-13',
                            isSelected ? 'text-white' : 'text-primary-700',
                        )}
                    >{` ${count}`}</AppText>
                )}
                {hasPicker && ' ▾'}
            </AppText>
        </Pressable>
    );
}

interface TransactionFilterBarProps {
    status: TransactionStatusFilter;
    counts: { needsReview: number; pending: number };
    /** 고른 블록 이름 (없으면 null) */
    blockName: string | null;
    /** 고른 계좌의 기관 이름 (없으면 null) */
    accountName: string | null;
    onChangeStatus: (status: TransactionStatusFilter) => void;
    onPressBlock: () => void;
    onPressAccount: () => void;
}

/** 전체 · 확인 필요 · 임시 · 블록 ▾ · 계좌 ▾ (건수가 0인 칩은 숨긴다) */
export function TransactionFilterBar({
    status,
    counts,
    blockName,
    accountName,
    onChangeStatus,
    onPressBlock,
    onPressAccount,
}: TransactionFilterBarProps) {
    // 이미 고른 칩을 다시 누르면 전체로 돌아간다.
    const toggle = (value: TransactionStatusFilter) =>
        onChangeStatus(status === value ? 'ALL' : value);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            // 화면 양옆 여백까지 밀어서 볼 수 있게 한다.
            className="-mx-5"
            contentContainerClassName="gap-2 px-5"
        >
            <FilterChip
                label="전체"
                isSelected={status === 'ALL'}
                onPress={() => onChangeStatus('ALL')}
            />
            {(counts.needsReview > 0 || status === 'NEEDS_REVIEW') && (
                <FilterChip
                    label="확인 필요"
                    count={counts.needsReview}
                    isSelected={status === 'NEEDS_REVIEW'}
                    onPress={() => toggle('NEEDS_REVIEW')}
                />
            )}
            {(counts.pending > 0 || status === 'PENDING') && (
                <FilterChip
                    label="임시"
                    count={counts.pending}
                    isSelected={status === 'PENDING'}
                    onPress={() => toggle('PENDING')}
                />
            )}
            <FilterChip
                label={blockName ?? '블록'}
                hasPicker
                isSelected={blockName !== null}
                onPress={onPressBlock}
            />
            <FilterChip
                label={accountName ?? '계좌'}
                hasPicker
                isSelected={accountName !== null}
                onPress={onPressAccount}
            />
        </ScrollView>
    );
}
