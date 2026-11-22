import { useQuery } from '@tanstack/react-query';

import { getSavingSuggestions } from './savingApi';
import { savingKeys } from './savingKeys';

/** 줄일 수 있는 지출 · 후보에서 뺀 지출 (05) */
export function useSavingSuggestionsQuery() {
    return useQuery({ queryKey: savingKeys.suggestions(), queryFn: getSavingSuggestions });
}
