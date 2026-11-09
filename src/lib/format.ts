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

/**
 * 원 단위 정수 금액을 표시용 문자열로 변환한다. (252000 → "252,000원")
 * "원"을 따로 보여주는 곳(금액 입력칸 등)은 { showUnit: false }로 숫자만 받는다.
 */
export function formatWon(amount: number, options?: FormatAmountOptions) {
    return formatAmount(amount, options);
}

/**
 * 서버 날짜(yyyy-MM-dd 또는 ISO 8601 일시)를 "10월 14일"로 바꾼다.
 * 시간대 영향을 받지 않도록 앞 10글자(날짜)만 잘라 쓴다.
 */
export function formatMonthDay(date: string) {
    const [, month, day] = date.slice(0, 10).split('-').map(Number);
    return `${month}월 ${day}일`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 서버 날짜(yyyy-MM-dd 또는 ISO 8601 일시)를 "10월 14일 수"로 바꾼다. */
export function formatMonthDayWeekday(date: string) {
    const [year, month, day] = date.slice(0, 10).split('-').map(Number);
    // 시간대 영향을 받지 않도록 UTC 기준으로 요일만 구한다.
    const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    return `${month}월 ${day}일 ${weekday}`;
}

/**
 * 거래 목록 날짜 머리글. today는 서버가 준 오늘 날짜(yyyy-MM-dd)다.
 * 오늘 → "오늘  10월 14일 수", 어제 → "어제  10월 13일 화", 그 전 → "10월 12일 월"
 */
export function formatDayHeader(date: string, today: string) {
    const label = formatMonthDayWeekday(date);
    const toDay = (value: string) => {
        const [year, month, day] = value.slice(0, 10).split('-').map(Number);
        return Date.UTC(year, month - 1, day) / 86_400_000;
    };
    const dayDiff = toDay(today) - toDay(date);
    if (dayDiff === 0) return `오늘  ${label}`;
    if (dayDiff === 1) return `어제  ${label}`;
    return label;
}

/**
 * 서버 일시는 한국 시간이고 오프셋 없이 온다. (예: 2026-11-07T19:00:00)
 * new Date()로 읽으면 휴대폰 시간대에 따라 달라지므로 문자열을 그대로 잘라 쓴다.
 */
const toDateTimeParts = (dateTime: string) => {
    const [year, month, day] = dateTime.slice(0, 10).split('-').map(Number);
    return { dayNumber: Date.UTC(year, month - 1, day) / 86_400_000, month, day };
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 지금 시각을 한국 날짜 기준 일 번호로 바꾼다. (서버 날짜와 비교할 때 쓴다) */
const toKstDayNumber = (now: Date) => Math.floor((now.getTime() + KST_OFFSET_MS) / 86_400_000);

/** 거래 시각(2026-11-07T12:41:00)을 "12:41"로 바꾼다. */
export function formatTime(dateTime: string) {
    return dateTime.slice(11, 16);
}

/** 서버 날짜(yyyy-MM-dd 또는 ISO 8601 일시)를 "9월"로 바꾼다. */
export function formatMonth(date: string) {
    const [, month] = date.slice(0, 10).split('-').map(Number);
    return `${month}월`;
}

/**
 * 거래 시각(2026-11-07T12:41:00)을 목록용으로 바꾼다. 오늘·어제는 한국 날짜 기준이다.
 * 오늘 → "오늘 12:41", 어제 → "어제 23:04", 그 전 → "10월 12일"
 */
export function formatRelativeDateTime(dateTime: string, now: Date = new Date()) {
    const { dayNumber, month, day } = toDateTimeParts(dateTime);
    const dayDiff = toKstDayNumber(now) - dayNumber;
    const time = formatTime(dateTime);

    if (dayDiff === 0) {
        return `오늘 ${time}`;
    }
    if (dayDiff === 1) {
        return `어제 ${time}`;
    }
    return `${month}월 ${day}일`;
}

/**
 * 날짜만 상대 표시로 바꾼다. (초불이가 한 일) 오늘·어제는 한국 날짜 기준이다.
 * 오늘 → "오늘", 어제 → "어제", 그 전 → "10월 12일"
 */
export function formatRelativeDay(dateTime: string, now: Date = new Date()) {
    const { dayNumber, month, day } = toDateTimeParts(dateTime);
    const dayDiff = toKstDayNumber(now) - dayNumber;

    if (dayDiff === 0) {
        return '오늘';
    }
    if (dayDiff === 1) {
        return '어제';
    }
    return `${month}월 ${day}일`;
}
