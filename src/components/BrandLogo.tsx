import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { appColors } from '../theme';

interface BrandLogoProps {
    size?: number;
    containerStyle?: ViewStyle;
    iconColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
    size = 56,
    containerStyle,
    iconColor = appColors.accent
}) => {
    return (
        <View style={[styles.container, { width: size * 1.6, height: size * 1.6 }, containerStyle]}>
            <Dumbbell size={size} color={iconColor} strokeWidth={2.5} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#161616',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        // Subtle glow effect
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
});
