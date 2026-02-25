import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { Check } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { appColors, appFonts, appTypography } from '../theme';

interface Props {
    setId: string;
    exerciseId: string;
    setNumber: number;
    weight: string;
    reps: string;
    isDone: boolean;
    onWeightChange: (val: string) => void;
    onRepsChange: (val: string) => void;
    onComplete: () => void;
    onDelete: () => void;
}

export const ActiveSetRow: React.FC<Props> = React.memo(({
    setId, setNumber, weight, reps, isDone,
    onWeightChange, onRepsChange, onComplete, onDelete
}) => {
    const repsRef = useRef<RNTextInput>(null);

    const handleCheck = () => {
        if (!isDone) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onComplete();
    };

    const handleLongPress = () => {
        if (!isDone) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onDelete();
        }
    };

    const handleRepsSubmit = () => {
        if (!isDone && reps && reps !== '0') {
            handleCheck();
        }
    };

    return (
        <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -6 }}
            transition={{ type: 'timing', duration: 250 }}
        >
            <TouchableOpacity
                onLongPress={handleLongPress}
                delayLongPress={600}
                activeOpacity={1}
                style={styles.setRow}
            >
                {/* Thin green accent bar — primary completion signal */}
                {isDone && <View style={styles.doneAccent} />}

                {/* Set number — subtle green text when done, no heavy fill */}
                <View style={[styles.setNum, isDone && styles.setNumDone]}>
                    <Text style={[styles.setNumText, isDone && styles.setNumTextDone]}>
                        {setNumber}
                    </Text>
                </View>

                {/* Weight — auto-focus reps on submit */}
                <View style={[styles.inputContainer, isDone && styles.inputDimmed]}>
                    <TextInput
                        style={styles.setInput}
                        mode="outlined"
                        dense
                        keyboardType="numeric"
                        returnKeyType="next"
                        value={weight}
                        onChangeText={onWeightChange}
                        onSubmitEditing={() => repsRef.current?.focus()}
                        placeholder="0"
                        disabled={isDone}
                        outlineStyle={styles.inputOutline}
                        outlineColor={isDone ? '#222' : appColors.border}
                        activeOutlineColor={appColors.accent}
                        textColor={isDone ? '#777' : '#fff'}
                    />
                </View>

                {/* Reps — auto-complete on submit */}
                <View style={[styles.inputContainer, isDone && styles.inputDimmed]}>
                    <TextInput
                        ref={repsRef}
                        style={styles.setInput}
                        mode="outlined"
                        dense
                        keyboardType="numeric"
                        returnKeyType="done"
                        value={reps}
                        onChangeText={onRepsChange}
                        onSubmitEditing={handleRepsSubmit}
                        placeholder="0"
                        disabled={isDone}
                        outlineStyle={styles.inputOutline}
                        outlineColor={isDone ? '#222' : appColors.border}
                        activeOutlineColor={appColors.accent}
                        textColor={isDone ? '#777' : '#fff'}
                    />
                </View>

                {/* Check icon — scale animation on completion */}
                <TouchableOpacity onPress={handleCheck} style={styles.checkBtn}>
                    <MotiView
                        animate={{
                            scale: isDone ? [1.1, 1] : 1,
                        }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    >
                        <View style={[styles.checkCircle, isDone && styles.checkCircleDone]}>
                            <Check size={14} color={isDone ? '#000' : '#444'} strokeWidth={3} />
                        </View>
                    </MotiView>
                </TouchableOpacity>
            </TouchableOpacity>
        </MotiView>
    );
});

const styles = StyleSheet.create({
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
        // No background change on complete — stays dark
    },

    // Thin green left accent — primary completion signal
    doneAccent: {
        position: 'absolute',
        left: 0,
        top: 6,
        bottom: 6,
        width: 3,
        borderRadius: 2,
        backgroundColor: appColors.accent,
    },

    // Set number
    setNum: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: appColors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumDone: {
        backgroundColor: appColors.accent + '15',  // Subtle green tint, not full fill
    },
    setNumText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#888',
    },
    setNumTextDone: {
        color: appColors.accent,  // Green text instead of heavy bg
    },

    // Inputs
    inputContainer: {
        flex: 1,
    },
    inputDimmed: {
        opacity: 0.85,  // Subtle dim, inputs feel "locked"
    },
    setInput: {
        ...appTypography.body,
        flex: 1,
        height: 56,
        textAlign: 'center',
        backgroundColor: appColors.bg,
        fontSize: 18,
        fontFamily: appFonts.bold,
    },
    inputOutline: { borderRadius: 6 },

    // Check
    checkBtn: {
        padding: 6,
    },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircleDone: {
        backgroundColor: appColors.accent,
        borderColor: appColors.accent,
    },
});
