/** 문자열 목록을 주소 값 하나로 바꾼다. (예: ['0089', '0311'] → '0089,0311') */
export const toListParam = (values: string[]) => values.join(',');

/**
 * 주소 값을 문자열 목록으로 되돌린다.
 * 같은 값이 여러 번 들어오면 배열로 오므로 둘 다 받는다. (예: ?failed=0089&failed=0311)
 */
export const fromListParam = (param: string | string[] | undefined) =>
    [param ?? []]
        .flat()
        .flatMap((value) => value.split(','))
        .filter((value) => value !== '');
