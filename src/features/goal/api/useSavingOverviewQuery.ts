import { useQuery } from '@tanstack/react-query';

import { getSavingOverview } from './savingApi';
import { savingKeys } from './savingKeys';

/** 절약 화면 요약 (05) */
export function useSavingOverviewQuery() {
    return useQuery({ queryKey: savingKeys.overview(), queryFn: getSavingOverview });
}
