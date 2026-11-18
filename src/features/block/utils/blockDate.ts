/** "2027-03-15" → "2027년 3월 15일" */
export const formatFullDate = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split('-').map(Number);
    return `${year}년 ${month}월 ${day}일`;
};

/** 기한 달에서 고를 수 있는 첫날. 서버는 오늘 전 기한을 거절해서 이번 달이면 오늘부터 고른다. */
export function firstSelectableDay(dueDate: string) {
    const today = new Date();
    const [year, month] = dueDate.slice(0, 7).split('-').map(Number);
    return year === today.getFullYear() && month === today.getMonth() + 1 ? today.getDate() : 1;
}

/** 기한 달의 말일 (일 고르기 시트의 마지막 날) */
export function lastDayOfMonth(dueDate: string) {
    return new Date(Number(dueDate.slice(0, 4)), Number(dueDate.slice(5, 7)), 0).getDate();
}
