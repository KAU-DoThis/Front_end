interface FormatAmountOptions {
    /** 양수 앞에 +를 붙인다. (증감 표시용) */
    showSign?: boolean;
    /** 뒤에 "원"을 붙인다. */
    showUnit?: boolean;
}

/**
 * 원 단위 정수 금액을 표시용 문자열로 변환한다.
 * 252000 → "252,000원", -12300 → "-12,300원", (12300, { showSign: true }) → "+12,300원"
 */
export function formatAmount(
    amount: number,
    { showSign = false, showUnit = true }: FormatAmountOptions = {},
) {
    const sign = amount < 0 ? '-' : showSign && amount > 0 ? '+' : '';
    const unit = showUnit ? '원' : '';
    return `${sign}${Math.abs(amount).toLocaleString('ko-KR')}${unit}`;
}

/** 원 단위 정수 금액을 표시용 문자열로 변환한다. (252000 → "252,000원") */
export function formatWon(amount: number) {
    return formatAmount(amount);
}

/** 서버 날짜(yyyy-MM-dd)를 "10월 14일"로 바꾼다. (시간대 영향을 받지 않도록 문자열로 자른다) */
export function formatMonthDay(date: string) {
    const [, month, day] = date.split('-').map(Number);
    return `${month}월 ${day}일`;
}

/** 서버 날짜(yyyy-MM-dd)를 "9월"로 바꾼다. */
export function formatMonth(date: string) {
    const [, month] = date.split('-').map(Number);
    return `${month}월`;
}
