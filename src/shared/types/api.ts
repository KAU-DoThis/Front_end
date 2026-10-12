/**
 * 백엔드 공통 응답 래퍼 (Back_end `global/api/ApiResponse.java` 기준)
 *
 * 응답 형식이 바뀌면 이 파일과 `lib/apiClient.ts`만 수정하면 된다.
 */
export interface ApiResponse<T> {
    isSuccess: boolean;
    /** 비즈니스 코드 (예: COMMON_200, COMMON_400) */
    code: string;
    message: string;
    result: T;
}

/** 화면 분기는 message가 아니라 code 기준으로 처리한다. */
export class ApiError extends Error {
    readonly code: string;
    readonly status?: number;

    constructor(code: string, message: string, status?: number) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
    }
}
