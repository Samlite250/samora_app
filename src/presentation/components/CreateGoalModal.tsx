import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import { useAppDataStore } from '../../store/useAppDataStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';

interface CreateGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CATEGORIES = ['Savings', 'Real Estate', 'Gadgets', 'Travel', 'Investment', 'Emergency'];
const ICONS = ['shield-checkmark-outline', 'location-outline', 'laptop-outline', 'airplane-outline', 'trending-up-outline', 'star-outline'];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ visible, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('2027-01-01');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [errorMsg, setErrorMsg] = useState('');

    const { currency } = useCurrencyStore();
    const { addGoal } = useAppDataStore();

    const handleSave = async () => {
        setErrorMsg('');
        if (!title.trim()) {
            setErrorMsg('Please enter a goal title.');
            return;
        }

        const sanitizedTarget = targetAmount.replace(/,/g, '').trim();
        const parsedTarget = parseFloat(sanitizedTarget);

        if (isNaN(parsedTarget) || parsedTarget <= 0) {
            setErrorMsg('Please enter a valid target amount.');
            return;
        }

        await addGoal({
            title: title.trim(),
            target_amount: parsedTarget,
            deadline,
            category,
            icon: selectedIcon,
            color: '#EC4899',
        });

        setTitle('');
        setTargetAmount('');
        setErrorMsg('');
        if (onSuccess) onSuccess();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Savings Goal</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                        {!!errorMsg && (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={18} color={COLORS.expense} />
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            </View>
                        )}

                        {/* Title */}
                        <Text style={styles.label}>Goal Title</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Buy Plot of Land (Kigali)"
                            value={title}
                            onChangeText={(val) => { setTitle(val); setErrorMsg(''); }}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Target Amount */}
                        <Text style={styles.label}>Target Savings Amount ({currency})</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={targetAmount}
                            onChangeText={(val) => { setTargetAmount(val); setErrorMsg(''); }}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Category */}
                        <Text style={styles.label}>Goal Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.pill, category === cat && styles.pillActive]}
                                    onPress={() => setCategory(cat)}>
                                    <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Deadline */}
                        <Text style={styles.label}>Target Deadline (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="2027-01-01"
                            value={deadline}
                            onChangeText={setDeadline}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Icon Picker */}
                        <Text style={styles.label}>Icon</Text>
                        <View style={styles.iconGrid}>
                            {ICONS.map((ic) => (
                                <TouchableOpacity
                                    key={ic}
                                    style={[styles.iconBtn, selectedIcon === ic && styles.iconBtnActive]}
                                    onPress={() => setSelectedIcon(ic)}>
                                    <Ionicons name={ic as any} size={22} color={selectedIcon === ic ? '#FFFFFF' : COLORS.text} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>Save Savings Goal</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', paddingBottom: SIZES.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    title: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    body: { padding: SIZES.lg, gap: 12 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: COLORS.expense, padding: 10, borderRadius: 10 },
    errorText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.expense, flex: 1 },
    label: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginTop: 4 },
    textInput: { backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F7', paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    pillRow: { gap: 8, paddingVertical: 4 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7' },
    pillActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
    pillText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    pillTextActive: { color: '#FFFFFF', fontFamily: FONTS.semiBold },
    iconGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF1F7' },
    iconBtnActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
    saveBtn: { backgroundColor: '#EC4899', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' },
});
