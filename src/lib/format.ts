/** 원 단위 정수 금액을 표시용 문자열로 변환한다. (252000 → "252,000원") */
export function formatWon(amount: number) {
    return `${amount.toLocaleString('ko-KR')}원`;
}
