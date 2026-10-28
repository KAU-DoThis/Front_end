import type { BlockDetail } from '@/features/block/types/blockDetail';

import { BLOCK_HOME_MOCK } from './blockHomeMock';

/** 홈 목업과 같은 블록을 쓴다. */
function homeBlock(blockId: number) {
    const block = BLOCK_HOME_MOCK.blocks.find((item) => item.blockId === blockId);
    if (!block) {
        throw new Error(`목업에 없는 블록: ${blockId}`);
    }
    return block;
}

/** 오늘 기준 n일 전 hh:mm (로컬 시간 ISO) — '오늘 12:41', '어제 23:04'처럼 보이게 */
function daysAgo(days: number, hour: number, minute: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`;
}

/**
 * 블록 상세 목업 (시안 v2 02 · 02-1 · 02-2 값, 저축·저금통은 시안에 없어 임의 값)
 * 소진 속도 차트: 시안 숫자끼리 서로 맞지 않아(배분 1,500,000 · 사용 550,000 · 17% 빠름)
 * 계획선 끝을 1,000,000으로 두고 시안 그림 모양에 맞췄다. 실제 값은 서버가 계산해 준다.
 */
export const BLOCK_DETAIL_MOCK: Record<number, BlockDetail> = {
    1: {
        type: 'SPENDING',
        block: homeBlock(1),
        statusReason: '소진 빠름',
        explanation:
            '배달·카페 지출이 지난달 같은 기간보다 9만 원 늘었어요. 이대로면 28일쯤 생활비가 바닥나요.',
        allocatedAmount: 1_500_000,
        periodStartDate: '2026-10-01',
        periodEndDate: '2026-10-31',
        remainingDays: 18,
        today: { available: 52_700, spent: 12_300, remaining: 40_400 },
        burnRate: {
            diffPercent: 17,
            spentAmount: 550_000,
            plannedAmount: 1_000_000,
            totalDays: 31,
            actual: [
                { day: 0, amount: 0 },
                { day: 3, amount: 100_000 },
                { day: 6, amount: 225_000 },
                { day: 9, amount: 300_000 },
                { day: 12, amount: 450_000 },
                { day: 13, amount: 512_000 },
                { day: 14, amount: 550_000 },
            ],
        },
        recentTransactions: [
            {
                transactionId: 101,
                occurredAt: daysAgo(0, 12, 41),
                amount: 12_300,
                direction: 'OUT',
                merchantOrPayee: 'GS25 홍대점',
                categoryName: '편의점',
                contextTag: null,
            },
            {
                transactionId: 102,
                occurredAt: daysAgo(1, 23, 4),
                amount: 23_000,
                direction: 'OUT',
                merchantOrPayee: '배달의민족',
                categoryName: '식비',
                contextTag: '야근',
            },
            {
                transactionId: 103,
                occurredAt: daysAgo(1, 15, 20),
                amount: 5_900,
                direction: 'OUT',
                merchantOrPayee: '스타벅스 합정점',
                categoryName: '카페',
                contextTag: null,
            },
            {
                transactionId: 104,
                occurredAt: daysAgo(2, 10, 12),
                amount: 42_000,
                direction: 'OUT',
                merchantOrPayee: '쿠팡',
                categoryName: '생필품',
                contextTag: null,
            },
            {
                transactionId: 105,
                occurredAt: daysAgo(2, 12, 30),
                amount: 7_000,
                direction: 'OUT',
                merchantOrPayee: '김밥천국 홍대점',
                categoryName: '식비',
                contextTag: null,
            },
        ],
    },
    2: {
        type: 'GOAL',
        block: homeBlock(2),
        statusReason: null,
        explanation: null,
        targetAmount: 3_000_000,
        daysLeft: null,
        monthly: { target: 300_000, saved: 300_000, remaining: 0 },
        projection: null,
        inflows: [
            {
                transferId: 201,
                title: '10월 블록 배분',
                note: '월급에서',
                occurredAt: '2026-10-01',
                amount: 300_000,
            },
            {
                transferId: 202,
                title: '9월 블록 배분',
                note: '월급에서',
                occurredAt: '2026-09-01',
                amount: 300_000,
            },
        ],
    },
    3: {
        type: 'GOAL',
        block: homeBlock(3),
        statusReason: '2주 늦어짐',
        explanation:
            '이번 달에 모은 돈이 월 목표보다 80,000원 적어요. 이대로면 1월 중순에 다 모여요. 9월 절약분 50,000원을 넣으면 12월 31일에 맞출 수 있어요.',
        targetAmount: 800_000,
        daysLeft: 78,
        monthly: { target: 200_000, saved: 120_000, remaining: 80_000 },
        projection: {
            paceText: '목표보다 2주 늦음',
            isLate: true,
            expectedDate: '2027-01-15',
            expectedLabel: '1월 중순',
            startMonth: '2026-08',
            endMonth: '2027-02',
            saved: [
                { date: '2026-08-01', amount: 100_000 },
                { date: '2026-09-01', amount: 200_000 },
                { date: '2026-10-01', amount: 320_000 },
                { date: '2026-10-14', amount: 320_000 },
            ],
        },
        inflows: [
            {
                transferId: 301,
                title: '10월 블록 배분',
                note: '월급에서',
                occurredAt: '2026-10-01',
                amount: 120_000,
            },
            {
                transferId: 302,
                title: '9월 블록 배분',
                note: '월급에서',
                occurredAt: '2026-09-01',
                amount: 100_000,
            },
            {
                transferId: 303,
                title: '여행 블록 만듦',
                note: '첫 배분',
                occurredAt: '2026-08-01',
                amount: 100_000,
            },
        ],
    },
    5: {
        type: 'GOAL',
        block: homeBlock(5),
        statusReason: '목표 달성',
        explanation: null,
        targetAmount: 500_000,
        daysLeft: null,
        monthly: { target: 0, saved: 0, remaining: 0 },
        projection: null,
        inflows: [
            {
                transferId: 501,
                title: '저금통 블록 만듦',
                note: '첫 배분',
                occurredAt: '2026-06-01',
                amount: 500_000,
            },
        ],
    },
    4: {
        type: 'FIXED',
        block: homeBlock(4),
        statusReason: '납부 준비 끝',
        explanation: null,
        nextPayDate: '2026-10-25',
        payAmount: 600_000,
        shortfall: 0,
        matchRule: {
            payee: '김*수',
            amountText: '600,000원 그대로',
            dateText: '매월 25일 앞뒤 3일',
            accountLabel: '국민 ••34',
        },
        alerts: { shortageBeforePay: true, paymentConfirmed: false },
        onTimeStreak: 6,
        payments: [
            {
                transactionId: 401,
                paidAt: '2026-09-25T09:00:00',
                payee: '김*수',
                accountLabel: '국민 ••34',
                amount: 600_000,
            },
            {
                transactionId: 402,
                paidAt: '2026-08-25T09:00:00',
                payee: '김*수',
                accountLabel: '국민 ••34',
                amount: 600_000,
            },
            {
                transactionId: 403,
                paidAt: '2026-07-25T09:00:00',
                payee: '김*수',
                accountLabel: '국민 ••34',
                amount: 600_000,
            },
            {
                transactionId: 404,
                paidAt: '2026-06-25T09:00:00',
                payee: '김*수',
                accountLabel: '국민 ••34',
                amount: 600_000,
            },
        ],
    },
};
