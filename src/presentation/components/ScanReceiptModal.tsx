import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import { useAppDataStore } from '../../store/useAppDataStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';

interface ScanReceiptModalProps {
    visible: boolean;
    onClose: () => void;
}

const RECEIPT_PRESETS = [
    { title: 'Simba Supermarket (Kigali Heights)', amount: 18500, category: 'Food & Dining', items: 'Milk, Bread, Coffee, Cheese' },
    { title: 'Kimironko Fresh Market', amount: 8200, category: 'Groceries', items: 'Fresh Vegetables, Fruits, Spices' },
    { title: 'Java House Kigali', amount: 14000, category: 'Food & Dining', items: 'Capuccino, Club Sandwich, Juice' },
    { title: 'Sawa Citi Supermarket', amount: 22500, category: 'Shopping', items: 'Household Goods, Detergent, Snacks' },
];

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({ visible, onClose }) => {
    const { formatAmount } = useCurrencyStore();
    const { wallets, addTransaction } = useAppDataStore();

    const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'parsed'>('idle');
    const [selectedPreset, setSelectedPreset] = useState(RECEIPT_PRESETS[0]);

    // Parsed / Editable form state
    const [title, setTitle] = useState(RECEIPT_PRESETS[0].title);
    const [amountStr, setAmountStr] = useState(RECEIPT_PRESETS[0].amount.toString());
    const [category, setCategory] = useState(RECEIPT_PRESETS[0].category);
    const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '1');
    const [isSaving, setIsSaving] = useState(false);

    // Laser beam animation
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setScanningState('idle');
            setSelectedPreset(RECEIPT_PRESETS[0]);
            setTitle(RECEIPT_PRESETS[0].title);
            setAmountStr(RECEIPT_PRESETS[0].amount.toString());
            setCategory(RECEIPT_PRESETS[0].category);
            if (wallets.length > 0) setSelectedWalletId(wallets[0].id);
        }
    }, [visible, wallets]);

    const startScan = (preset = selectedPreset) => {
        setSelectedPreset(preset);
        setTitle(preset.title);
        setAmountStr(preset.amount.toString());
        setCategory(preset.category);

        setScanningState('scanning');
        scanLineAnim.setValue(0);

        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, { toValue: 180, duration: 1200, useNativeDriver: true }),
                Animated.timing(scanLineAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ]),
            { iterations: 2 }
        ).start(() => {
            setScanningState('parsed');
        });
    };

    const handleConfirmAndSave = async () => {
        const parsedAmount = parseFloat(amountStr.replace(/,/g, ''));
        if (isNaN(parsedAmount) || parsedAmount <= 0) return;

        setIsSaving(true);
        const selectedWallet = wallets.find(w => w.id === selectedWalletId) || wallets[0];

        await addTransaction({
            title: title || 'Scanned Receipt',
            category: category || 'General',
            amount: parsedAmount,
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            wallet_id: selectedWallet?.id,
            wallet_name: selectedWallet?.name || 'Cash Wallet',
        });

        setIsSaving(false);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.card}>
                    {/* Modal Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={styles.iconBg}>
                                <Ionicons name="scan-outline" size={20} color="#8B5CF6" />
                            </View>
                            <Text style={styles.title}>AI Receipt Scanner</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                        {/* Camera Scanner Viewfinder */}
                        {scanningState !== 'parsed' && (
                            <View style={styles.viewfinderContainer}>
                                <View style={styles.viewfinder}>
                                    <Ionicons name="receipt-outline" size={48} color="rgba(139,92,246,0.6)" />
                                    <Text style={styles.viewfinderText}>
                                        {scanningState === 'scanning' ? 'Analyzing receipt with AI OCR...' : 'Align receipt inside frame'}
                                    </Text>
                                    <Text style={styles.viewfinderSub}>
                                        {scanningState === 'scanning' ? 'Extracting merchant, total amount & items' : 'Supports paper receipts & e-bills'}
                                    </Text>

                                    {/* Animated Laser Beam */}
                                    {scanningState === 'scanning' && (
                                        <Animated.View
                                            style={[
                                                styles.laserLine,
                                                { transform: [{ translateY: scanLineAnim }] },
                                            ]}
                                        />
                                    )}
                                </View>

                                {/* Presets / Mock Sample Receipts */}
                                <Text style={styles.presetLabel}>Select Sample Receipt to Scan:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                                    {RECEIPT_PRESETS.map((preset, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[styles.presetChip, selectedPreset.title === preset.title && styles.presetChipActive]}
                                            onPress={() => startScan(preset)}>
                                            <Ionicons name="document-text-outline" size={14} color={selectedPreset.title === preset.title ? '#FFFFFF' : COLORS.primary} />
                                            <Text style={[styles.presetText, selectedPreset.title === preset.title && styles.presetTextActive]}>
                                                {preset.title.split(' ')[0]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {scanningState === 'idle' && (
                                    <TouchableOpacity style={styles.scanActionBtn} onPress={() => startScan(selectedPreset)}>
                                        <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.scanActionText}>Capture & Scan Receipt</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Extracted Details Confirmation Form */}
                        {scanningState === 'parsed' && (
                            <View style={styles.parsedContainer}>
                                <View style={styles.successBanner}>
                                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                                    <Text style={styles.successText}>Receipt Scanned Successfully!</Text>
                                </View>

                                {/* Extracted Details Summary */}
                                <Text style={styles.sectionHeading}>Review Scanned Details</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Merchant / Title</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="Merchant Name"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Total Amount (FRw)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={amountStr}
                                        onChangeText={setAmountStr}
                                        keyboardType="numeric"
                                        placeholder="Amount"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Category</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={category}
                                        onChangeText={setCategory}
                                        placeholder="Category"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Charge to Wallet</Text>
                                    <View style={styles.walletPickerRow}>
                                        {wallets.map((w: any) => (
                                            <TouchableOpacity
                                                key={w.id}
                                                style={[styles.walletChip, selectedWalletId === w.id && styles.walletChipActive]}
                                                onPress={() => setSelectedWalletId(w.id)}>
                                                <Text style={[styles.walletChipText, selectedWalletId === w.id && styles.walletChipTextActive]}>
                                                    {w.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanningState('idle')}>
                                        <Ionicons name="refresh-outline" size={16} color={COLORS.secondaryText} />
                                        <Text style={styles.rescanText}>Rescan</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                                        onPress={handleConfirmAndSave}
                                        disabled={isSaving}>
                                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                        <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Confirm & Save Expense'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.lg, maxHeight: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    content: { paddingBottom: 20 },

    viewfinderContainer: { alignItems: 'center', gap: 14 },
    viewfinder: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: 'rgba(139,92,246,0.3)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: SIZES.md,
    },
    viewfinderText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text, marginTop: 8 },
    viewfinderSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, textAlign: 'center', marginTop: 4 },
    laserLine: {
        position: 'absolute',
        top: 10,
        left: 20,
        right: 20,
        height: 3,
        backgroundColor: '#8B5CF6',
        borderRadius: 2,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
    },

    presetLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.secondaryText, alignSelf: 'flex-start' },
    presetScroll: { flexDirection: 'row', width: '100%', marginBottom: 6 },
    presetChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: `${COLORS.primary}12`, marginRight: 8 },
    presetChipActive: { backgroundColor: COLORS.primary },
    presetText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.primary },
    presetTextActive: { color: '#FFFFFF' },

    scanActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, borderRadius: 14, backgroundColor: '#8B5CF6', marginTop: 8 },
    scanActionText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },

    parsedContainer: { gap: 14 },
    successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${COLORS.success}15`, padding: 12, borderRadius: 12 },
    successText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.success },
    sectionHeading: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },

    inputGroup: { gap: 6 },
    label: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF1F7', borderRadius: 12, paddingHorizontal: 14, height: 44, fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },

    walletPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    walletChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7' },
    walletChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    walletChipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    walletChipTextActive: { color: '#FFFFFF' },

    buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    rescanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, height: 46, borderRadius: 12, backgroundColor: '#F4F7FB' },
    rescanText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.secondaryText },
    saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 12, backgroundColor: COLORS.success },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' },
});
