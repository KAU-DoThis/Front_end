import { create } from 'zustand';

import type { SetupBlock } from '@/features/block/types/blockSetup';
import { BLOCK_COLORS } from '@/features/block/utils/blockSetupText';

export type BlockPatch = Partial<Omit<SetupBlock, 'key'>>;

interface BlockSetupDraftState {
    /**
     * 온보딩 블록 구성에서 사용자가 고친 블록 목록. null이면 아직 고치지 않아 AI 제안을 그대로 쓴다.
     * AI 제안(서버 데이터)은 여기에 두지 않고, 고칠 때 기준 목록(base)으로 받아 처음 고칠 때만 복사한다.
     */
    draftBlocks: SetupBlock[] | null;
    /** 직접 추가한 블록의 key를 겹치지 않게 만드는 번호 */
    newBlockSeq: number;
    update: (base: SetupBlock[], key: string, patch: BlockPatch) => void;
    remove: (base: SetupBlock[], key: string) => void;
    /** 직접 블록을 추가한다. 아직 안 쓴 색을 먼저 고른다. 추가한 블록의 key를 돌려준다. */
    add: (base: SetupBlock[], initial: Pick<SetupBlock, 'type' | 'name'>) => string;
    /** AI 제안으로 되돌리기 (블록 구성 화면을 떠날 때도 부른다) */
    reset: () => void;
}

export const useBlockSetupDraftStore = create<BlockSetupDraftState>((set, get) => ({
    draftBlocks: null,
    newBlockSeq: 0,

    update(base, key, patch) {
        set(({ draftBlocks }) => ({
            draftBlocks: (draftBlocks ?? base).map((block) =>
                block.key === key ? { ...block, ...patch } : block,
            ),
        }));
    },

    remove(base, key) {
        set(({ draftBlocks }) => ({
            draftBlocks: (draftBlocks ?? base).filter((block) => block.key !== key),
        }));
    },

    add(base, initial) {
        const newBlockSeq = get().newBlockSeq + 1;
        const key = `user-${Date.now()}-${newBlockSeq}`;
        set(({ draftBlocks }) => {
            const current = draftBlocks ?? base;
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
                dueDate: null,
                payDay: null,
                paymentMatch: null,
                notifyShortage: initial.type === 'FIXED',
                periodStartDay: initial.type === 'SPENDING' ? 1 : null,
            };
            return { draftBlocks: [...current, block], newBlockSeq };
        });
        return key;
    },

    reset() {
        set({ draftBlocks: null });
    },
}));
