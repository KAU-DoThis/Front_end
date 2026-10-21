import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/ui/AppText';
import { colors, dimOpacity } from '@/styles/tokens';

/**
 * 시트 안에서 입력칸을 쓸 때는 RN TextInput 대신 이것을 써야 키보드에 맞춰 시트가 올라간다.
 * (@gorhom/bottom-sheet 의존을 이 파일에만 두기 위해 다시 내보낸다.)
 */
export { BottomSheetTextInput } from '@gorhom/bottom-sheet';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    hasCloseButton?: boolean;
    children: ReactNode;
}

/**
 * 공통 바텀시트 (@gorhom/bottom-sheet 모달 래퍼)
 * - 높이는 내용에 맞춰 정해진다.
 * - 배경 누르기, 아래로 끌기, 안드로이드 뒤로 가기로 닫힌다.
 */
export function BottomSheet({
    isOpen,
    onClose,
    title,
    hasCloseButton = true,
    children,
}: BottomSheetProps) {
    const sheetRef = useRef<BottomSheetModal>(null);
    // 한 번도 열지 않은 시트에 dismiss()를 부르면 gorhom이 '닫히는 중' 상태에 멈춰 다시 열리지 않는다.
    const isPresentedRef = useRef(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (isOpen) {
            sheetRef.current?.present();
            isPresentedRef.current = true;
        } else if (isPresentedRef.current) {
            sheetRef.current?.dismiss();
        }
    }, [isOpen]);

    const handleDismiss = useCallback(() => {
        isPresentedRef.current = false;
        onClose();
    }, [onClose]);

    // 모달 시트는 안드로이드 뒤로 가기를 직접 처리해야 화면 대신 시트가 닫힌다.
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
        });
        return () => subscription.remove();
    }, [isOpen, onClose]);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={dimOpacity}
                pressBehavior="close"
                style={[props.style, styles.backdrop]}
            />
        ),
        [],
    );

    const hasHeader = !!title || hasCloseButton;

    return (
        <BottomSheetModal
            ref={sheetRef}
            onDismiss={handleDismiss}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            handleStyle={styles.handle}
            handleIndicatorStyle={styles.handleIndicator}
            backgroundStyle={styles.background}
        >
            <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
                <View className="px-5">
                    {hasHeader && (
                        <View className="flex-row items-center justify-between pb-4 pt-5">
                            <AppText className="font-bold text-17">{title}</AppText>
                            {hasCloseButton && (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="닫기"
                                    className="h-5 w-5 items-center justify-center active:opacity-60"
                                    hitSlop={12}
                                    onPress={onClose}
                                >
                                    <View className="absolute h-0.5 w-5 rotate-45 rounded-full bg-ink" />
                                    <View className="absolute h-0.5 w-5 -rotate-45 rounded-full bg-ink" />
                                </Pressable>
                            )}
                        </View>
                    )}
                    {children}
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
}

// gorhom 내부 요소는 className을 받지 않아 style로 지정한다.
const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: colors.primary[900],
    },
    background: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    handle: {
        paddingTop: 12,
        paddingBottom: 0,
    },
    handleIndicator: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.line.handle,
    },
});
