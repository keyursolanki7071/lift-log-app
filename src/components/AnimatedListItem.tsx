import React from 'react';
import { MotiView } from 'moti';
import { ViewStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    index: number;
    style?: ViewStyle;
}

export const AnimatedListItem: React.FC<Props> = ({ children, index, style }) => {
    return (
        <MotiView
            from={{ opacity: 0, translateX: -20, scale: 0.95 }}
            animate={{ opacity: 1, translateX: 0, scale: 1 }}
            transition={{
                type: 'timing',
                duration: 400,
                delay: index * 100, // Stagger effect
            }}
            style={style}
        >
            {children}
        </MotiView>
    );
};
