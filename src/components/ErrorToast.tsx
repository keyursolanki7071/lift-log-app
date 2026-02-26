import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Portal } from 'react-native-paper';
import { MotiView } from 'moti';
import { AlertTriangle, X, WifiOff } from 'lucide-react-native';
import { appColors, appFonts } from '../theme';

interface ToastState {
    visible: boolean;
    message: string;
    type: 'error' | 'warning' | 'info';
}

interface ErrorToastContextType {
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showNetworkError: () => void;
}

const ErrorToastContext = createContext<ErrorToastContextType | undefined>(undefined);

export const ErrorToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'error' });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback((message: string, type: 'error' | 'warning' | 'info') => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast({ visible: true, message, type });
        timerRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4000);
    }, []);

    const showError = useCallback((message: string) => show(message, 'error'), [show]);
    const showWarning = useCallback((message: string) => show(message, 'warning'), [show]);
    const showNetworkError = useCallback(() => show('Network error. Check your connection and try again.', 'warning'), [show]);

    const dismiss = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast(prev => ({ ...prev, visible: false }));
    };

    const isNetwork = toast.message.includes('Network') || toast.message.includes('network') || toast.message.includes('fetch');
    const IconComp = isNetwork ? WifiOff : AlertTriangle;
    const borderColor = toast.type === 'error' ? '#FF4D4D' : toast.type === 'warning' ? '#FFA726' : appColors.accent;
    const iconColor = toast.type === 'error' ? '#FF4D4D' : toast.type === 'warning' ? '#FFA726' : appColors.accent;

    return (
        <ErrorToastContext.Provider value={{ showError, showWarning, showNetworkError }}>
            {children}
            <Portal>
                {toast.visible && (
                    <MotiView
                        from={{ opacity: 0, translateY: -40 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, translateY: -40 }}
                        transition={{ type: 'timing', duration: 250 }}
                        style={[styles.toast, { borderLeftColor: borderColor }]}
                    >
                        <IconComp size={18} color={iconColor} style={{ marginRight: 10, flexShrink: 0 }} />
                        <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
                        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <X size={16} color="#666" />
                        </TouchableOpacity>
                    </MotiView>
                )}
            </Portal>
        </ErrorToastContext.Provider>
    );
};

export const useErrorToast = () => {
    const context = useContext(ErrorToastContext);
    if (!context) throw new Error('useErrorToast must be inside ErrorToastProvider');
    return context;
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 14,
        paddingRight: 12,
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: appColors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 9999,
    },
    toastText: {
        flex: 1,
        color: '#ddd',
        fontSize: 13,
        fontFamily: appFonts.regular,
        lineHeight: 18,
    },
});
