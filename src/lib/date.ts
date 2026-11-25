const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 날짜 기준 오늘 (yyyy-MM-dd) */
export const todayInKorea = () => new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
