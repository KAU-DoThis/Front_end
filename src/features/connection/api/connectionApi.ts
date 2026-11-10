import {
    CONNECTION_ERROR_CODE,
    type ConnectInstitutionsRequest,
    type ConnectInstitutionsResponse,
    type LinkedAccountListResponse,
} from '@/features/connection/types/connection';
import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';

/**
 * 연동 API가 아직 없어서 목업 모드(USE_MOCK)에서는 목업으로 처리한다.
 * TODO: 연동 API가 붙으면 목업과 함께 제거한다.
 */
const USE_CONNECTION_MOCK = USE_MOCK;

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

/** 연동된 계좌·카드 목록 */
export const getLinkedAccounts = () =>
    request<LinkedAccountListResponse>({ method: 'GET', url: '/linked-accounts' });

/**
 * 고른 기관을 연결한다. 기관마다 성공·실패가 따로 온다.
 * 실제 연동(POST /linked-accounts)은 기관 아이디·비밀번호·생년월일이 필요한데 앱에 아직 입력 화면이 없다.
 * 그래서 지금은 이미 연결된 기관(개발 서버 테스트 계좌 등)만 연결된 것으로 보고, 나머지는 연결할 수 없다고 알려준다.
 * TODO: 기관 인증 입력 화면(간편인증·아이디 로그인)이 나오면 연결되지 않은 기관을 POST /linked-accounts로 연동한다.
 */
export const connectInstitutions = async (
    body: ConnectInstitutionsRequest,
): Promise<ConnectInstitutionsResponse> => {
    if (USE_CONNECTION_MOCK) {
        return mockConnectInstitutions(body);
    }
    const { linkedAccounts } = await getLinkedAccounts();
    const linkedCodes = new Set(
        linkedAccounts
            .filter(({ isActive }) => isActive)
            .map(({ institutionCode }) => institutionCode),
    );
    return {
        results: body.institutions.map(({ type, institutionCode }) =>
            linkedCodes.has(institutionCode)
                ? {
                      type,
                      institutionCode,
                      status: 'CONNECTED',
                      errorCode: null,
                      institutionMessage: null,
                  }
                : {
                      type,
                      institutionCode,
                      status: 'FAILED',
                      errorCode: CONNECTION_ERROR_CODE.AUTH_INPUT_UNAVAILABLE,
                      institutionMessage: '아직 앱에서 이 기관 인증을 할 수 없어요',
                  },
        ),
    };
};
