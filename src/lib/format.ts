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

/**
 * 서버 날짜(yyyy-MM-dd 또는 ISO 8601 일시)를 "10월 14일"로 바꾼다.
 * 시간대 영향을 받지 않도록 앞 10글자(날짜)만 잘라 쓴다.
 */
export function formatMonthDay(date: string) {
    const [, month, day] = date.slice(0, 10).split('-').map(Number);
    return `${month}월 ${day}일`;
}

/** 서버 날짜(yyyy-MM-dd 또는 ISO 8601 일시)를 "9월"로 바꾼다. */
export function formatMonth(date: string) {
    const [, month] = date.slice(0, 10).split('-').map(Number);
    return `${month}월`;
}

/**
 * 거래 시각(ISO 8601)을 목록용으로 바꾼다.
 * 오늘 → "오늘 12:41", 어제 → "어제 23:04", 그 전 → "10월 12일"
 */
export function formatRelativeDateTime(dateTime: string, now: Date = new Date()) {
    const date = new Date(dateTime);
    const startOfDay = (value: Date) =>
        new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
    const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    if (dayDiff === 0) {
        return `오늘 ${time}`;
    }
    if (dayDiff === 1) {
        return `어제 ${time}`;
    }
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
