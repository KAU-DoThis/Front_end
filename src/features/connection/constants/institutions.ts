import type { Institution, InstitutionType } from '@/features/connection/types/connection';

/**
 * 연결할 수 있는 기관 (CODEF 기관 코드 기준, 화면에 보여줄 순서)
 * TODO: 지원 기관이 자주 바뀌면 서버 목록 API로 옮긴다. 화면은 이 모양 그대로 쓴다.
 */
export const INSTITUTIONS: Record<InstitutionType, Institution[]> = {
    BANK: [
        { type: 'BANK', code: '0004', name: 'KB국민' },
        { type: 'BANK', code: '0088', name: '신한' },
        { type: 'BANK', code: '0081', name: '하나' },
        { type: 'BANK', code: '0020', name: '우리' },
        { type: 'BANK', code: '0011', name: 'NH농협' },
        { type: 'BANK', code: '0003', name: 'IBK기업' },
        { type: 'BANK', code: '0090', name: '카카오뱅크' },
        { type: 'BANK', code: '0092', name: '토스뱅크' },
        { type: 'BANK', code: '0089', name: '케이뱅크' },
    ],
    CARD: [
        { type: 'CARD', code: '0301', name: 'KB국민카드' },
        { type: 'CARD', code: '0306', name: '신한카드' },
        { type: 'CARD', code: '0303', name: '삼성카드' },
        { type: 'CARD', code: '0302', name: '현대카드' },
        { type: 'CARD', code: '0311', name: '롯데카드' },
        { type: 'CARD', code: '0313', name: '하나카드' },
        { type: 'CARD', code: '0309', name: '우리카드' },
        { type: 'CARD', code: '0304', name: 'NH농협카드' },
        { type: 'CARD', code: '0305', name: 'BC카드' },
    ],
};

/** 은행 코드와 카드사 코드는 겹치지 않아 코드만으로 기관을 찾는다. */
export const findInstitution = (code: string) =>
    [...INSTITUTIONS.BANK, ...INSTITUTIONS.CARD].find((institution) => institution.code === code);
