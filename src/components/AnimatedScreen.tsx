import React from 'react';
import { MotiView } from 'moti';
import { StyleSheet, ViewStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: ViewStyle;
    delay?: number;
}

export const AnimatedScreen: React.FC<Props> = ({ children, style, delay = 0 }) => {
    return (
        <MotiView
            from={{ opacity: 0, scale: 0.98, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay }}
            style={[styles.container, style]}
        >
            {children}
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
