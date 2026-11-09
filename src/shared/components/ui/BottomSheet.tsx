import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
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
    /** 제목 아래 한 줄 설명 (예: 현금처럼 자동으로 안 잡히는 지출을 적어요) */
    description?: string;
    hasCloseButton?: boolean;
    /** 있으면 제목 왼쪽에 뒤로 가기(<)를 보여준다. 시트 안에서 한 단계 들어간 화면용 (예: 블록 고르기) */
    onBack?: () => void;
    /**
     * 내용이 길어질 수 있으면 true. 시트가 화면 높이를 넘지 않고 안쪽이 스크롤된다.
     * (작은 화면 · 큰 글씨 · 키보드가 열렸을 때도 아래 버튼까지 닿게 한다)
     */
    scrollable?: boolean;
    children: ReactNode;
}

/**
 * 공통 바텀시트 (@gorhom/bottom-sheet 모달 래퍼)
 * - 높이는 내용에 맞춰 정해지고, 상태 표시줄 아래까지만 올라온다. 넘치는 내용은 scrollable로 스크롤한다.
 * - 배경 누르기, 아래로 끌기, 안드로이드 뒤로 가기로 닫힌다.
 */
export function BottomSheet({
    isOpen,
    onClose,
    title,
    description,
    hasCloseButton = true,
    onBack,
    scrollable = false,
    children,
}: BottomSheetProps) {
    const sheetRef = useRef<BottomSheetModal>(null);
    // 시트가 실제로 올라오기 시작했는지. present()는 다음 프레임에 마운트하므로 그 전에 dismiss()를 부르면
    // gorhom이 '닫히는 중' 상태에 멈춰 다시 열리지 않는다. 그래서 열림 애니메이션이 시작된 뒤에만 true로 둔다.
    const isPresentedRef = useRef(false);
    // onDismiss·onAnimate는 비동기로 불리므로 최신 isOpen을 ref로 본다.
    const isOpenRef = useRef(isOpen);
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();

    useEffect(() => {
        isOpenRef.current = isOpen;
        if (isOpen) {
            sheetRef.current?.present();
        } else if (isPresentedRef.current) {
            sheetRef.current?.dismiss();
        }
    }, [isOpen]);

    const handleAnimate = useCallback((_fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || isPresentedRef.current) {
            return;
        }
        isPresentedRef.current = true;
        // 올라오기 전에 닫기 요청이 들어왔다면 이제 닫는다.
        if (!isOpenRef.current) {
            sheetRef.current?.dismiss();
        }
    }, []);

    const handleDismiss = useCallback(() => {
        isPresentedRef.current = false;
        // 닫기 버튼·뒤로 가기로 닫힌 경우엔 이미 onClose가 불려 isOpen이 false다. 배경·끌어내리기로 닫힌 경우만 알린다.
        if (isOpenRef.current) {
            onClose();
        }
    }, [onClose]);

    // 모달 시트는 안드로이드 뒤로 가기를 직접 처리해야 화면 대신 시트가 닫힌다.
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        // 시트 안에서 한 단계 들어간 화면(onBack)이면 화면의 < 버튼과 똑같이 이전 화면으로 돌아간다.
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            if (onBack) {
                onBack();
            } else {
                onClose();
            }
            return true;
        });
        return () => subscription.remove();
    }, [isOpen, onBack, onClose]);

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
    const Container = scrollable ? BottomSheetScrollView : BottomSheetView;
    const containerProps = scrollable
        ? { contentContainerStyle: { paddingBottom: insets.bottom + 16 } }
        : { style: { paddingBottom: insets.bottom + 16 } };

    return (
        <BottomSheetModal
            ref={sheetRef}
            onAnimate={handleAnimate}
            onDismiss={handleDismiss}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            handleStyle={styles.handle}
            handleIndicatorStyle={styles.handleIndicator}
            backgroundStyle={styles.background}
            maxDynamicContentSize={windowHeight - insets.top}
        >
            <Container {...containerProps} keyboardShouldPersistTaps="handled">
                <View className="px-5">
                    {hasHeader && (
                        <View className="flex-row items-center justify-between pb-4 pt-5">
                            <View className="flex-1 flex-row items-center gap-2">
                                {onBack && (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="뒤로 가기"
                                        className="active:opacity-60"
                                        hitSlop={12}
                                        onPress={onBack}
                                    >
                                        <Icon name="chevron-left" size={20} />
                                    </Pressable>
                                )}
                                <View className="flex-1 gap-0.5">
                                    <AppText className="font-bold text-17">{title}</AppText>
                                    {description && (
                                        <AppText className="text-12 text-ink-sub">
                                            {description}
                                        </AppText>
                                    )}
                                </View>
                            </View>
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
            </Container>
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
