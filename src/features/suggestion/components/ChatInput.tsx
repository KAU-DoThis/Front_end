import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { cn } from '@/lib/cn';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

interface ChatInputProps {
    onSubmit: (text: string) => void;
}

/** 하단 채팅바: 초불이에게 할 일을 말로 시킨다. */
export function ChatInput({ onSubmit }: ChatInputProps) {
    const [text, setText] = useState('');
    const trimmed = text.trim();
    const canSend = trimmed.length > 0;

    const handleSubmit = () => {
        if (!canSend) {
            return;
        }
        onSubmit(trimmed);
        setText('');
    };

    return (
        <View className="flex-row items-center gap-2">
            <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={handleSubmit}
                placeholder="초불이에게 시키기"
                placeholderTextColor={colors.ink.disabled}
                returnKeyType="send"
                accessibilityLabel="초불이에게 시킬 일"
                className="h-13.5 min-w-0 flex-1 rounded-full border border-line-control bg-white px-5 font-regular text-15 text-ink"
            />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="보내기"
                accessibilityState={{ disabled: !canSend }}
                disabled={!canSend}
                onPress={handleSubmit}
                className={cn(
                    'h-13.5 w-13.5 items-center justify-center rounded-full',
                    canSend ? 'bg-primary-700 active:bg-primary-800' : 'bg-surface-disabled',
                )}
            >
                <Icon
                    name="arrow-up"
                    size={22}
                    color={canSend ? colors.white : colors.line.control}
                />
            </Pressable>
        </View>
    );
}
