/** 연결하지 못한 기관 코드를 블록 구성 화면 주소 값(failed)으로 바꾼다. (예: '0089,0311') */
export const serializeFailedCodes = (codes: string[]) => codes.join(',');

/**
 * 주소 값(failed)을 기관 코드 목록으로 되돌린다.
 * 같은 값이 여러 번 들어오면 배열로 오므로 둘 다 받는다. (예: ?failed=0089&failed=0311)
 */
export const parseFailedCodes = (param: string | string[] | undefined) =>
    [param ?? []]
        .flat()
        .flatMap((value) => value.split(','))
        .filter((code) => code !== '');
