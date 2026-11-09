import type {
    ConnectInstitutionsRequest,
    ConnectInstitutionsResponse,
} from '@/features/connection/types/connection';
import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';

/**
 * 연동 API가 아직 없어서 목업 모드(USE_MOCK)에서는 목업으로 처리한다.
 * TODO: 연동 API가 붙으면 목업과 함께 제거한다.
 */
const USE_CONNECTION_MOCK = USE_MOCK;

/** CODEF는 기관 응답이 느려 기본 타임아웃(10초)보다 길게 기다린다. */
const CONNECT_TIMEOUT_MS = 60_000;

/**
 * 목업 모드 전용: 항상 연결에 실패하는 기관 (케이뱅크 · 롯데카드)
 * - 다른 기관과 같이 고르면: 일부 실패 → 성공한 곳만으로 블록 구성으로 넘어가고 빠진 기관 안내가 보인다.
 * - 이 기관만 고르면: 전부 실패 → 연결 화면에 남아 실패 안내가 보인다.
 */
export const DEV_MOCK_FAILING_INSTITUTION_CODES = new Set(['0089', '0311']);

/** 목업 모드 전용: DEV_MOCK_FAILING_INSTITUTION_CODES만 실패하고 나머지는 연결된 것으로 응답한다. */
function mockConnectInstitutions(
    body: ConnectInstitutionsRequest,
): Promise<ConnectInstitutionsResponse> {
    return new Promise((resolve) => {
        // 로딩 상태도 확인할 수 있게 약간 지연한다.
        setTimeout(() => {
            resolve({
                results: body.institutions.map(({ type, institutionCode }) =>
                    DEV_MOCK_FAILING_INSTITUTION_CODES.has(institutionCode)
                        ? {
                              type,
                              institutionCode,
                              status: 'FAILED',
                              errorCode: 'DEV_MOCK_FAILED',
                              institutionMessage: '시스템 점검 중입니다. 잠시 후 이용해 주세요.',
                          }
                        : {
                              type,
                              institutionCode,
                              status: 'CONNECTED',
                              errorCode: null,
                              institutionMessage: null,
                          },
                ),
            });
        }, 1_000);
    });
}

// TODO: 연동 URL이 명세에 나오면 맞춘다. (지금은 가정값)
/**
 * 고른 기관을 CODEF로 연결한다. 기관마다 성공·실패가 따로 온다.
 * TODO: 간편인증(인증 수단 선택 · 본인 정보 입력 · 앱 승인 대기) 단계는 시안과 명세가 나오면 이 요청 앞뒤에 붙인다.
 */
export const connectInstitutions = (body: ConnectInstitutionsRequest) => {
    if (USE_CONNECTION_MOCK) {
        return mockConnectInstitutions(body);
    }
    return request<ConnectInstitutionsResponse>({
        method: 'POST',
        url: '/connections',
        data: body,
        timeout: CONNECT_TIMEOUT_MS,
    });
};
