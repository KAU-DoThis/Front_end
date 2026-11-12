import { useEffect, useMemo } from 'react';

import {
    type BlockPatch,
    useBlockSetupDraftStore,
} from '@/features/block/stores/blockSetupDraftStore';
import type { BlockSetupRequest, SetupBlock } from '@/features/block/types/blockSetup';
import { toSetupBlockInput } from '@/features/block/utils/setupBlockInput';

/** 'AI 제안과 달라졌는지' 볼 때 비교하는 값 */
const EDITABLE_FIELDS = [
    'type',
    'name',
    'color',
    'amount',
    'targetAmount',
    'payDay',
    'notifyShortage',
    'periodStartDay',
] as const satisfies readonly (keyof SetupBlock)[];

const EMPTY_BLOCKS: SetupBlock[] = [];

/**
 * 온보딩 블록 구성에서 고치는 중인 블록 목록. 확정 전에는 서버에 저장하지 않는다.
 * 고친 내용은 blockSetupDraftStore에 두고, 고치기 전에는 AI 제안(서버 데이터)을 그대로 쓴다.
 */
export function useBlockSetupDraft(proposedBlocks: SetupBlock[] | undefined) {
    const draftBlocks = useBlockSetupDraftStore((state) => state.draftBlocks);
    const updateBlock = useBlockSetupDraftStore((state) => state.update);
    const removeBlock = useBlockSetupDraftStore((state) => state.remove);
    const addBlock = useBlockSetupDraftStore((state) => state.add);
    const reset = useBlockSetupDraftStore((state) => state.reset);

    // 화면을 떠나면(로그아웃·완료·연동으로 돌아가기) 초안을 비워 다음에 들어올 때 남지 않게 한다.
    useEffect(() => reset, [reset]);

    const base = proposedBlocks ?? EMPTY_BLOCKS;
    const blocks = draftBlocks ?? proposedBlocks ?? null;

    const proposedByKey = useMemo(() => new Map(base.map((block) => [block.key, block])), [base]);

    const isModified = (block: SetupBlock) => {
        const proposed = proposedByKey.get(block.key);
        if (!proposed) return false;
        return EDITABLE_FIELDS.some((field) => proposed[field] !== block[field]);
    };

    /** 미리보기·확정 요청 본문 (화면 순서 그대로). 값이 같으면 같은 객체를 돌려줘 미리보기를 다시 부르지 않는다. */
    const request = useMemo<BlockSetupRequest | null>(
        () => (blocks === null ? null : { blocks: blocks.map(toSetupBlockInput) }),
        [blocks],
    );

    return {
        blocks,
        request,
        /** 한 번이라도 고쳤는지 (되돌리기 버튼에 쓴다) */
        hasChanges: draftBlocks !== null,
        update: (key: string, patch: BlockPatch) => updateBlock(base, key, patch),
        remove: (key: string) => removeBlock(base, key),
        add: (initial: Pick<SetupBlock, 'type' | 'name'>) => addBlock(base, initial),
        reset,
        isModified,
        getProposed: (key: string) => proposedByKey.get(key) ?? null,
    };
}
