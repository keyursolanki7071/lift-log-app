import React from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Text, Portal } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { appColors, appFonts, appTypography } from '../theme';

// ─── Button Types ───
export interface ModalAction {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
    disabled?: boolean;
}

interface Props {
    visible: boolean;
    onDismiss: () => void;
    title: string;
    body?: string;
    children?: React.ReactNode;       // Custom content between body & actions
    actions?: ModalAction[];
    showClose?: boolean;              // Show X close button (default: false)
}

export const AppModal: React.FC<Props> = ({
    visible, onDismiss, title, body, children, actions = [], showClose = false,
}) => {
    if (!visible) return null;

    const handleAction = (action: ModalAction) => {
        if (action.disabled) return;
        if (action.variant === 'destructive') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else if (action.variant === 'primary') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        action.onPress();
    };

    return (
        <Portal>
            <TouchableWithoutFeedback onPress={onDismiss}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <MotiView
                            from={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'timing', duration: 200 }}
                            style={styles.modal}
                        >
                            {/* ─── Header ─── */}
                            <View style={styles.header}>
                                <Text style={styles.title}>{title}</Text>
                                {showClose && (
                                    <TouchableOpacity
                                        onPress={onDismiss}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        style={styles.closeBtn}
                                    >
                                        <X size={18} color="#555" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* ─── Body ─── */}
                            {body && <Text style={styles.body}>{body}</Text>}

                            {/* ─── Custom Content ─── */}
                            {children && <View style={styles.content}>{children}</View>}

                            {/* ─── Actions (vertical stack) ─── */}
                            {actions.length > 0 && (
                                <View style={styles.actions}>
                                    {actions.map((action, i) => {
                                        const isPrimary = action.variant === 'primary';
                                        const isDestructive = action.variant === 'destructive';
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                onPress={() => handleAction(action)}
                                                disabled={action.disabled}
                                                activeOpacity={0.8}
                                                style={[
                                                    styles.btn,
                                                    isPrimary && styles.btnPrimary,
                                                    isDestructive && styles.btnDestructive,
                                                    !isPrimary && !isDestructive && styles.btnSecondary,
                                                    action.disabled && { opacity: 0.4 },
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.btnText,
                                                    isPrimary && styles.btnTextPrimary,
                                                    isDestructive && styles.btnTextDestructive,
                                                    !isPrimary && !isDestructive && styles.btnTextSecondary,
                                                ]}>
                                                    {action.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </MotiView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Portal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modal: {
        width: '88%',
        maxWidth: 380,
        borderRadius: 20,
        padding: 26,
        backgroundColor: appColors.cardBg,
        borderWidth: 1,
        borderColor: appColors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontFamily: appFonts.bold,
        color: '#fff',
        flex: 1,
    },
    closeBtn: {
        padding: 4,
        marginLeft: 12,
    },

    // Body
    body: {
        fontSize: 14,
        fontFamily: appFonts.regular,
        color: '#A0A0A0',
        lineHeight: 20,
        marginBottom: 20,
    },

    // Custom content
    content: {
        marginBottom: 20,
    },

    // Actions — vertical stack
    actions: {
        gap: 10,
        marginTop: 4,
    },

    // Button base
    btn: {
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        fontSize: 15,
        fontFamily: appFonts.bold,
    },

    // Primary
    btnPrimary: {
        backgroundColor: appColors.accent,
    },
    btnTextPrimary: {
        color: '#000',
        fontFamily: appFonts.black,
    },

    // Secondary
    btnSecondary: {
        borderWidth: 1,
        borderColor: appColors.border,
    },
    btnTextSecondary: {
        color: '#888',
    },

    // Destructive
    btnDestructive: {
        borderWidth: 1,
        borderColor: '#FF4D4D30',
    },
    btnTextDestructive: {
        color: '#FF4D4D',
    },
});
