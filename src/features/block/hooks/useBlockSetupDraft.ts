import { useMemo, useState } from 'react';

import type { BlockSetupRequest, SetupBlock } from '@/features/block/types/blockSetup';
import { BLOCK_COLORS } from '@/features/block/utils/blockSetupText';
import { toSetupBlockInput } from '@/features/block/utils/setupBlockInput';

type BlockPatch = Partial<Omit<SetupBlock, 'key'>>;

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

let newBlockSeq = 0;

/**
 * 온보딩 블록 구성에서 고치는 중인 블록 목록. 확정 전에는 서버에 저장하지 않는다.
 * 고치기 전에는 AI 제안을 그대로 쓰고, 처음 고칠 때 복사해 둔다.
 */
export function useBlockSetupDraft(proposedBlocks: SetupBlock[] | undefined) {
    const [draftBlocks, setDraftBlocks] = useState<SetupBlock[] | null>(null);
    const blocks = draftBlocks ?? proposedBlocks ?? null;

    const proposedByKey = useMemo(
        () => new Map((proposedBlocks ?? []).map((block) => [block.key, block])),
        [proposedBlocks],
    );

    const update = (key: string, patch: BlockPatch) =>
        setDraftBlocks((prev) =>
            (prev ?? proposedBlocks ?? []).map((block) =>
                block.key === key ? { ...block, ...patch } : block,
            ),
        );

    const remove = (key: string) =>
        setDraftBlocks((prev) =>
            (prev ?? proposedBlocks ?? []).filter((block) => block.key !== key),
        );

    /** 직접 블록을 추가한다. 아직 안 쓴 색을 먼저 고른다. 추가한 블록의 key를 돌려준다. */
    const add = (initial: Pick<SetupBlock, 'type' | 'name'>) => {
        newBlockSeq += 1;
        const key = `user-${Date.now()}-${newBlockSeq}`;
        setDraftBlocks((prev) => {
            const current = prev ?? proposedBlocks ?? [];
            const usedColors = new Set(current.map(({ color }) => color));
            const color = BLOCK_COLORS.find((value) => !usedColors.has(value)) ?? BLOCK_COLORS[0];
            const block: SetupBlock = {
                key,
                ...initial,
                color,
                isDefault: false,
                createdBy: 'USER',
                reason: null,
                amount: null,
                targetAmount: null,
                payDay: null,
                paymentMatch: null,
                notifyShortage: initial.type === 'FIXED',
                periodStartDay: initial.type === 'SPENDING' ? 1 : null,
            };
            return [...current, block];
        });
        return key;
    };

    /** AI 제안으로 되돌리기 */
    const reset = () => setDraftBlocks(null);

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
        update,
        remove,
        add,
        reset,
        isModified,
        getProposed: (key: string) => proposedByKey.get(key) ?? null,
    };
}
