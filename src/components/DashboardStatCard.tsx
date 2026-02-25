import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiPressable } from 'moti/interactions';
import { appColors, appTypography } from '../theme';

interface Props {
    title: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    badge?: {
        text: string;
        type: 'success' | 'danger' | 'neutral';
    };
    onPress?: () => void;
}

export const DashboardStatCard: React.FC<Props> = React.memo(({
    title, value, unit, subtitle, icon, badge, onPress
}) => {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <MotiPressable
                onPress={onPress}
                animate={({ pressed }) => {
                    'worklet';
                    return { scale: pressed ? 0.98 : 1 };
                }}
                style={[styles.card, styles.shadowed]}
            >
                <View style={styles.contentRow}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.valueRow}>
                            <Text style={styles.bigValue}>{value}</Text>
                            {unit && <Text style={styles.unit}>{unit}</Text>}

                            {badge && (
                                <View style={[
                                    styles.pillBadge,
                                    { backgroundColor: (badge.type === 'success' ? appColors.success : badge.type === 'danger' ? appColors.danger : appColors.textTertiary) + '15' }
                                ]}>
                                    <Text style={[
                                        styles.pillBadgeText,
                                        { color: badge.type === 'success' ? appColors.success : badge.type === 'danger' ? appColors.danger : appColors.textTertiary }
                                    ]}>
                                        {badge.text}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                </View>
            </MotiPressable>
        </View>
    );
});

const styles = StyleSheet.create({
    section: { marginTop: 0 },
    sectionTitle: { ...appTypography.small, color: '#888', letterSpacing: 0.5, fontSize: 10, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
    card: {
        backgroundColor: appColors.cardBg,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: appColors.border,
    },
    shadowed: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    contentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    bigValue: { ...appTypography.h1, fontSize: 36, color: '#fff' },
    unit: { ...appTypography.body, color: appColors.textSecondary, fontSize: 16 },
    subtitle: { ...appTypography.body, color: appColors.accent, marginTop: 4, fontSize: 12, fontWeight: '800' },
    iconContainer: { marginLeft: 12 },
    pillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    pillBadgeText: { ...appTypography.small, fontSize: 11, fontWeight: '900' },
});
