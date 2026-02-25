import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Dumbbell, MoreVertical, Trash2, Pencil } from 'lucide-react-native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import * as Haptics from 'expo-haptics';
import { appColors, appFonts, appTypography } from '../theme';

interface Props {
    item: any;
    index: number;
    onPress: (item: any) => void;
    onDelete: (id: string) => void;
}

export const ExerciseItem: React.FC<Props> = React.memo(({ item, index, onPress, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: index * 50 }}
        >
            <MotiPressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress(item);
                }}
                animate={({ pressed }) => {
                    'worklet';
                    return { scale: pressed ? 0.97 : 1 };
                }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                style={styles.card}
            >
                <View style={styles.cardRow}>
                    {/* Icon */}
                    <View style={styles.iconBox}>
                        <Dumbbell size={18} color={appColors.accent} />
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.muscleBadge}>
                                <Text style={styles.muscleText}>{item.muscle_group}</Text>
                            </View>
                            <View style={styles.setsBadge}>
                                <Text style={styles.setsText}>{item.default_sets} Sets</Text>
                            </View>
                        </View>
                    </View>

                    {/* Menu */}
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setMenuOpen(!menuOpen);
                        }}
                        style={styles.menuBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MoreVertical size={16} color={appColors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Expandable actions */}
                {menuOpen && (
                    <MotiView
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 44 }}
                        transition={{ type: 'timing', duration: 180 }}
                        style={styles.menuOverlay}
                    >
                        <View style={styles.menuRow}>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setMenuOpen(false);
                                    onPress(item);
                                }}
                                style={styles.menuAction}
                            >
                                <Pencil size={13} color={appColors.textSecondary} />
                                <Text style={styles.menuActionText}>Edit</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setMenuOpen(false);
                                    onDelete(item.id);
                                }}
                                style={styles.menuAction}
                            >
                                <Trash2 size={13} color={appColors.danger} />
                                <Text style={styles.menuActionDeleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </MotiView>
                )}
            </MotiPressable>
        </MotiView>
    );
});

const styles = StyleSheet.create({
    card: {
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: appColors.cardBg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: appColors.accent + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: appColors.accent + '15',
    },
    exerciseName: { ...appTypography.h2, color: '#fff', fontSize: 17, fontFamily: appFonts.bold, marginBottom: 6 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    muscleBadge: {
        backgroundColor: appColors.accent + '18',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    muscleText: { ...appTypography.small, color: appColors.accent, fontSize: 11, fontFamily: appFonts.bold, textTransform: 'uppercase' },
    setsBadge: {
        backgroundColor: appColors.border,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    setsText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 11, fontFamily: appFonts.bold },
    menuBtn: { padding: 6 },
    menuOverlay: {
        borderTopWidth: 1,
        borderTopColor: appColors.border,
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    menuAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 11,
        paddingHorizontal: 4,
    },
    menuActionText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 12, fontFamily: appFonts.bold },
    menuActionDeleteText: { ...appTypography.small, color: appColors.danger, fontSize: 12, fontFamily: appFonts.bold },
    menuDivider: { width: 1, height: 16, backgroundColor: appColors.border, marginHorizontal: 12 },
});
