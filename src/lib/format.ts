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
