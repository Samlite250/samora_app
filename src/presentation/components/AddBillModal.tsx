import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import { useAppDataStore } from '../../store/useAppDataStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';

interface AddBillModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const BILL_CATEGORIES = ['Utilities', 'Internet', 'Entertainment', 'Housing', 'Health', 'Education', 'Other'];
const PROVIDERS = ['EUCL', 'WASAC', 'MTN Rwanda', 'Canal+', 'Airtel', 'Waka Fitness', 'General Provider'];

export const AddBillModal: React.FC<AddBillModalProps> = ({ visible, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(BILL_CATEGORIES[0]);
    const [provider, setProvider] = useState(PROVIDERS[0]);
    const [dueDate, setDueDate] = useState('2026-08-01');
    const [errorMsg, setErrorMsg] = useState('');

    const { currency } = useCurrencyStore();
    const { addBill } = useAppDataStore();

    const handleSave = async () => {
        setErrorMsg('');
        if (!title.trim()) {
            setErrorMsg('Please enter a bill title.');
            return;
        }

        const sanitizedAmount = amount.replace(/,/g, '').trim();
        const parsedAmount = parseFloat(sanitizedAmount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setErrorMsg('Please enter a valid bill amount.');
            return;
        }

        await addBill({
            title: title.trim(),
            amount: parsedAmount,
            due_date: dueDate,
            category,
            provider,
        });

        // Reset
        setTitle('');
        setAmount('');
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
                        <Text style={styles.title}>Schedule New Bill</Text>
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
                        <Text style={styles.label}>Bill Title</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. EUCL Electricity Token"
                            value={title}
                            onChangeText={(val) => { setTitle(val); setErrorMsg(''); }}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Amount */}
                        <Text style={styles.label}>Bill Amount ({currency})</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={(val) => { setAmount(val); setErrorMsg(''); }}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Category */}
                        <Text style={styles.label}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                            {BILL_CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.pill, category === cat && styles.pillActive]}
                                    onPress={() => setCategory(cat)}>
                                    <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Provider */}
                        <Text style={styles.label}>Provider / Service</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                            {PROVIDERS.map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.pill, provider === p && styles.pillActive]}
                                    onPress={() => setProvider(p)}>
                                    <Text style={[styles.pillText, provider === p && styles.pillTextActive]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Due Date */}
                        <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="2026-08-01"
                            value={dueDate}
                            onChangeText={setDueDate}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Submit Button */}
                        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>Save Scheduled Bill</Text>
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
    pillActive: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
    pillText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    pillTextActive: { color: '#FFFFFF', fontFamily: FONTS.semiBold },
    saveBtn: { backgroundColor: COLORS.warning, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' },
});
