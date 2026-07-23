import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import { useAppDataStore } from '../../store/useAppDataStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';

interface SetBudgetModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CATEGORIES = ['Food & Dining', 'Housing & Rent', 'Transport & Fuel', 'Utilities & Bills', 'Shopping & Leisure', 'Entertainment', 'Healthcare'];
const ICONS = ['restaurant-outline', 'home-outline', 'car-outline', 'flash-outline', 'bag-outline', 'game-controller-outline', 'fitness-outline'];

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({ visible, onClose, onSuccess }) => {
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [totalLimit, setTotalLimit] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [errorMsg, setErrorMsg] = useState('');

    const { currency } = useCurrencyStore();
    const { addBudget } = useAppDataStore();

    const handleSave = async () => {
        setErrorMsg('');
        const sanitizedLimit = totalLimit.replace(/,/g, '').trim();
        const parsedLimit = parseFloat(sanitizedLimit);

        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            setErrorMsg('Please enter a valid total budget limit.');
            return;
        }

        await addBudget({
            category,
            total: parsedLimit,
            icon: selectedIcon,
            color: '#8B5CF6',
        });

        setTotalLimit('');
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
                        <Text style={styles.title}>Set Budget Spending Limit</Text>
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

                        {/* Category Selector */}
                        <Text style={styles.label}>Budget Category</Text>
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

                        {/* Total Spending Limit */}
                        <Text style={styles.label}>Monthly Limit ({currency})</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. 500000"
                            keyboardType="numeric"
                            value={totalLimit}
                            onChangeText={(val) => { setTotalLimit(val); setErrorMsg(''); }}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Icon Picker */}
                        <Text style={styles.label}>Select Icon</Text>
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
                            <Text style={styles.saveBtnText}>Save Budget</Text>
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
    pillActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    pillText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    pillTextActive: { color: '#FFFFFF', fontFamily: FONTS.semiBold },
    iconGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF1F7' },
    iconBtnActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    saveBtn: { backgroundColor: '#8B5CF6', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' },
});
