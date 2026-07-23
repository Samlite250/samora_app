import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import { useAppDataStore } from '../../store/useAppDataStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { CurrencySelectorModal } from './CurrencySelectorModal';

interface QuickAddModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (data: {
        type: 'income' | 'expense' | 'transfer';
        amount: number;
        currency: 'RWF' | 'USD';
        category: string;
        wallet: string;
        description: string;
        date: string;
    }) => void;
    initialType?: 'income' | 'expense' | 'transfer';
}

const CATEGORIES = {
    expense: ['Food & Dining', 'Shopping', 'Transport', 'Bills & Utilities', 'Housing', 'Entertainment', 'Healthcare', 'General'],
    income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
    transfer: ['Self Transfer', 'Friend Transfer', 'Bank Transfer', 'Mobile Money'],
};

// Exact wallet names matching mockData & useAppDataStore
const WALLETS = [
    'MTN Mobile Money',
    'BK Current Account',
    'I&M Savings Account',
    'Cash Wallet',
    'Equity Visa Card',
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
    visible,
    onClose,
    onSave,
    initialType = 'expense',
}) => {
    const [type, setType] = useState<'income' | 'expense' | 'transfer'>(initialType);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORIES.expense[0]);
    const [wallet, setWallet] = useState(WALLETS[0]);
    const [description, setDescription] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

    const { currency } = useCurrencyStore();
    const { wallets: storeWallets, addTransaction } = useAppDataStore();

    const handleSave = async () => {
        setErrorMsg('');
        const sanitizedAmount = amount.replace(/,/g, '').trim();
        const parsedAmount = parseFloat(sanitizedAmount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setErrorMsg('Please enter a valid amount greater than 0.');
            return;
        }

        // Find matching wallet object to get actual wallet_id
        const matchedWallet = storeWallets.find((w) => w.name === wallet) || storeWallets[0];

        const txData = {
            type,
            amount: parsedAmount,
            currency: currency as 'RWF' | 'USD',
            category,
            wallet: matchedWallet.name,
            description: description || `${type.toUpperCase()} - ${category}`,
            date: new Date().toISOString().split('T')[0],
        };

        // 1. Commit mutation to persistent store
        await addTransaction({
            title: txData.description,
            category: txData.category,
            amount: txData.amount,
            type: txData.type,
            date: txData.date,
            wallet_id: matchedWallet.id,
            wallet_name: matchedWallet.name,
        });

        // 2. Trigger parent callback if provided
        if (onSave) {
            onSave(txData);
        }

        // Reset form & close modal
        setAmount('');
        setDescription('');
        setErrorMsg('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>New Transaction</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                        {/* Error Banner if any */}
                        {!!errorMsg && (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={18} color={COLORS.expense} />
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            </View>
                        )}

                        {/* Transaction Type Segment */}
                        <View style={styles.segmentWrap}>
                            <TouchableOpacity
                                style={[styles.segmentBtn, type === 'expense' && styles.segmentBtnExpense]}
                                onPress={() => { setType('expense'); setCategory(CATEGORIES.expense[0]); setErrorMsg(''); }}>
                                <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentBtn, type === 'income' && styles.segmentBtnIncome]}
                                onPress={() => { setType('income'); setCategory(CATEGORIES.income[0]); setErrorMsg(''); }}>
                                <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>Income</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentBtn, type === 'transfer' && styles.segmentBtnTransfer]}
                                onPress={() => { setType('transfer'); setCategory(CATEGORIES.transfer[0]); setErrorMsg(''); }}>
                                <Text style={[styles.segmentText, type === 'transfer' && styles.segmentTextActive]}>Transfer</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount Input with Currency Badge */}
                        <Text style={styles.label}>Amount</Text>
                        <View style={styles.amountInputRow}>
                            <TouchableOpacity
                                style={styles.currencyBadge}
                                onPress={() => setIsCurrencyModalOpen(true)}>
                                <Text style={styles.currencyText}>{currency}</Text>
                                <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={(val) => { setAmount(val); setErrorMsg(''); }}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Category Selector */}
                        <Text style={styles.label}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                            {CATEGORIES[type].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.pill, category === cat && styles.pillActive]}
                                    onPress={() => setCategory(cat)}>
                                    <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Wallet Selector */}
                        <Text style={styles.label}>Wallet / Account</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                            {WALLETS.map((w) => (
                                <TouchableOpacity
                                    key={w}
                                    style={[styles.pill, wallet === w && styles.pillActive]}
                                    onPress={() => setWallet(w)}>
                                    <Text style={[styles.pillText, wallet === w && styles.pillTextActive]}>{w}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Description / Notes */}
                        <Text style={styles.label}>Note / Description</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Grocery shopping at Simba"
                            value={description}
                            onChangeText={setDescription}
                            placeholderTextColor="#9CA3AF"
                        />

                        {/* Submit Button */}
                        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>Save Transaction</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <CurrencySelectorModal
                        visible={isCurrencyModalOpen}
                        onClose={() => setIsCurrencyModalOpen(false)}
                    />
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
    segmentWrap: { flexDirection: 'row', backgroundColor: '#F4F7FB', borderRadius: 14, padding: 4, marginBottom: 8 },
    segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    segmentBtnExpense: { backgroundColor: '#FFEDED' },
    segmentBtnIncome: { backgroundColor: '#E6F4EA' },
    segmentBtnTransfer: { backgroundColor: '#E8F0FE' },
    segmentText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.secondaryText },
    segmentTextActive: { fontFamily: FONTS.bold, color: COLORS.text },
    label: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginTop: 4 },
    amountInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F7', paddingHorizontal: 12, paddingVertical: 4 },
    currencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F0FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    currencyText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.primary },
    amountInput: { flex: 1, fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, paddingHorizontal: 10 },
    pillRow: { gap: 8, paddingVertical: 4 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7' },
    pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    pillText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    pillTextActive: { color: '#FFFFFF', fontFamily: FONTS.semiBold },
    textInput: { backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F7', paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' },
});
