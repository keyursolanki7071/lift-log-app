import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { ClipboardList, Trash2, Plus, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import { useTemplates } from '../hooks/useTemplates';
import { appColors, appFonts, appTypography } from '../theme';

export const TemplateListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { templates, createTemplate, deleteTemplate } = useTemplates();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const result = await createTemplate(newName.trim());
        setShowCreate(false); setNewName('');
        if (result && !result.error && result.data) {
            navigation.navigate('TemplateBuilder', { templateId: result.data.id, templateName: result.data.name });
        }
    };

    const formatLastDone = (date: string | null | undefined) => {
        if (!date) return 'Never';
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 0) return 'Just now';
        return `${diff} days ago`;
    };

    const WorkoutCard = ({ item }: { item: any }) => {
        const [pressed, setPressed] = useState(false);

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('TemplateBuilder', { templateId: item.id, templateName: item.name });
                }}
            >
                <MotiView
                    animate={{
                        scale: pressed ? 0.97 : 1,
                        borderColor: pressed ? appColors.accent : appColors.border,
                        shadowOpacity: pressed ? 0.3 : 0,
                    }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    style={[styles.card, { shadowColor: appColors.accent, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }]}
                >
                    <View style={styles.cardRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardName}>{item.name}</Text>
                            <Text style={styles.cardSub}>
                                {item.exercise_count || 0} exercise{item.exercise_count !== 1 ? 's' : ''} • Last: {formatLastDone(item.last_session_date)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setDeleteId(item.id);
                            }}
                            style={styles.deleteBtn}
                        >
                            <Trash2 size={20} color={appColors.textTertiary} />
                        </TouchableOpacity>
                        <ChevronRight size={18} color={appColors.borderLight} style={{ marginLeft: 4 }} />
                    </View>
                </MotiView>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workouts</Text>
                <Text style={styles.headerSub}>Stay consistent. Progress weekly.</Text>
            </View>

            <FlatList
                data={templates}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <ClipboardList size={64} color={appColors.textTertiary} strokeWidth={1.5} />
                        <Text style={styles.emptyTitle}>No workouts yet</Text>
                        <Text style={styles.emptySub}>Create your first training routine</Text>
                    </View>
                }
                renderItem={({ item }) => <WorkoutCard item={item} />}
            />

            <TouchableOpacity
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowCreate(true);
                }}
                activeOpacity={0.8}
                style={styles.fabPill}
            >
                <Plus size={20} color="#000" strokeWidth={3} />
                <Text style={styles.fabText}>NEW WORKOUT</Text>
            </TouchableOpacity>

            <Portal>
                <Dialog visible={showCreate} onDismiss={() => setShowCreate(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>New Workout</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Workout name" value={newName} onChangeText={setNewName} mode="outlined" autoFocus
                            outlineColor={appColors.border} activeOutlineColor={appColors.accent}
                            style={{ backgroundColor: appColors.bg }} textColor="#fff" />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowCreate(false)} textColor={appColors.textSecondary}>Cancel</Button>
                        <Button onPress={handleCreate} disabled={!newName.trim()} textColor={appColors.accent}>Create</Button>
                    </Dialog.Actions>
                </Dialog>
                <Dialog visible={!!deleteId} onDismiss={() => setDeleteId(null)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Delete Template?</Dialog.Title>
                    <Dialog.Content><Text style={styles.dialogText}>This cannot be undone.</Text></Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteId(null)} textColor={appColors.textSecondary}>Cancel</Button>
                        <Button onPress={async () => {
                            if (deleteId) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                await deleteTemplate(deleteId);
                                setDeleteId(null);
                            }
                        }} textColor={appColors.danger}>Delete</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 26, fontFamily: appFonts.black },
    headerSub: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4, letterSpacing: 0.5 },
    list: { paddingHorizontal: 20, paddingBottom: 120 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { ...appTypography.h2, color: '#fff', marginTop: 16 },
    emptySub: { ...appTypography.body, color: appColors.textSecondary, fontSize: 14, marginTop: 6 },
    card: {
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: appColors.cardBg,
        padding: 16,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardName: { ...appTypography.h2, color: '#fff', fontSize: 20, fontFamily: appFonts.bold },
    cardSub: { ...appTypography.small, color: appColors.textSecondary, fontSize: 13, marginTop: 4 },
    deleteBtn: { padding: 4, marginLeft: 8 },
    fabPill: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 28,
        backgroundColor: appColors.accent,
        elevation: 10,
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    fabText: { ...appTypography.h2, color: '#000', fontSize: 14, marginLeft: 8, fontFamily: appFonts.black, letterSpacing: 1 },
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 16, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', marginTop: 8 },
    dialogText: { ...appTypography.body, color: appColors.textSecondary, lineHeight: 22 },
});
