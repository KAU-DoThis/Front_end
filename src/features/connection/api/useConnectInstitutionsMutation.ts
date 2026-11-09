import { useMutation } from '@tanstack/react-query';

import { connectInstitutions } from './connectionApi';

/** 고른 금융기관 연결. 결과는 기관마다 따로 확인한다. */
export function useConnectInstitutionsMutation() {
    return useMutation({ mutationFn: connectInstitutions });
}
