import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { WalletRecord } from '../../src/data/mockData';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const getWalletIcon = (type: string): IoniconsName => {
    if (type === 'Mobile Money') return 'phone-portrait-outline';
    if (type === 'Cash') return 'cash-outline';
    if (type === 'Credit Card') return 'card-outline';
    return 'business-outline';
};

const ACTIVITY = [
    { day: 'Mon', income: 60, expense: 30 },
    { day: 'Tue', income: 40, expense: 50 },
    { day: 'Wed', income: 80, expense: 40 },
    { day: 'Thu', income: 50, expense: 70 },
    { day: 'Fri', income: 70, expense: 35 },
    { day: 'Sat', income: 30, expense: 20 },
    { day: 'Sun', income: 90, expense: 55 },
];

const WALLET_TYPES = ['Bank Account', 'Mobile Money', 'Savings', 'Cash', 'Credit Card'];

export default function WalletScreen() {
    const router = useRouter();
    const { formatAmount } = useCurrencyStore();
    const { wallets, addWallet, deleteWallet, editWallet } = useAppDataStore();

    // Modals state
    const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null);
    const [editBalance, setEditBalance] = useState('');
    const [editName, setEditName] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('Mobile Money');
    const [newBalance, setNewBalance] = useState('');

    const handleOpenEdit = (w: WalletRecord) => {
        setSelectedWallet(w);
        setEditName(w.name);
        setEditBalance(String(w.balance));
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedWallet) return;
        const balNum = parseFloat(editBalance) || 0;
        await editWallet(selectedWallet.id, { name: editName, balance: balNum });
        Alert.alert('Updated', `Wallet "${editName}" balance updated to ${formatAmount(balNum)}.`);
        setShowEditModal(false);
    };

    const handleDeleteWallet = (w: WalletRecord) => {
        Alert.alert(
            'Delete Wallet',
            `Are you sure you want to delete "${w.name}"? All associated transaction history for this wallet will be removed.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteWallet(w.id);
                        if (showEditModal) setShowEditModal(false);
                        Alert.alert('Deleted', `Wallet "${w.name}" deleted successfully.`);
                    },
                },
            ]
        );
    };

    const handleAddWallet = async () => {
        if (!newName.trim()) {
            Alert.alert('Error', 'Please enter a wallet name.');
            return;
        }
        const balNum = parseFloat(newBalance) || 0;
        await addWallet({
            name: newName,
            type: newType as any,
            balance: balNum,
            color: newType === 'Mobile Money' ? '#F59E0B' : newType === 'Savings' ? '#16A34A' : '#4285F4',
            icon: getWalletIcon(newType),
        });
        Alert.alert('Created', `Wallet "${newName}" created with balance ${formatAmount(balNum)}.`);
        setNewName('');
        setNewBalance('');
        setShowAddModal(false);
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Wallets ({wallets.length})</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                        <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* ─── Activity Summary ─── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Activity Summary</Text>
                        <View style={styles.periodPill}>
                            <Text style={styles.periodText}>This Week</Text>
                            <Ionicons name="chevron-down" size={12} color={COLORS.secondaryText} />
                        </View>
                    </View>

                    <View style={styles.activityCard}>
                        <View style={styles.activityStatsRow}>
                            <View style={styles.statItem}>
                                <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
                                <Text style={styles.statLabel}>Income</Text>
                                <Text style={[styles.statValue, { color: COLORS.success }]}>{formatAmount(2850000)}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <View style={[styles.statDot, { backgroundColor: COLORS.expense }]} />
                                <Text style={styles.statLabel}>Expenses</Text>
                                <Text style={[styles.statValue, { color: COLORS.expense }]}>{formatAmount(533500)}</Text>
                            </View>
                        </View>

                        {/* Bar Chart */}
                        <View style={styles.chart}>
                            {ACTIVITY.map((d, i) => (
                                <View key={i} style={styles.barGroup}>
                                    <View style={styles.bars}>
                                        <View style={[styles.bar, { height: d.income * 0.8, backgroundColor: COLORS.primary }]} />
                                        <View style={[styles.bar, { height: d.expense * 0.8, backgroundColor: '#F9A8A8' }]} />
                                    </View>
                                    <Text style={styles.barLabel}>{d.day}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                                <Text style={styles.legendText}>Income</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#F9A8A8' }]} />
                                <Text style={styles.legendText}>Expenses</Text>
                            </View>
                        </View>
                    </View>

                    {/* ─── My Wallets List ─── */}
                    <View style={[styles.sectionHeader, { marginTop: SIZES.lg }]}>
                        <Text style={styles.sectionTitle}>My Wallets ({wallets.length})</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(true)}>
                            <Text style={styles.seeAll}>+ Add New</Text>
                        </TouchableOpacity>
                    </View>

                    {wallets.length === 0 ? (
                        <View style={{ alignItems: 'center', marginVertical: 30 }}>
                            <Ionicons name="wallet-outline" size={48} color={COLORS.secondaryText} />
                            <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.secondaryText }}>No wallets found. Tap + to add one.</Text>
                        </View>
                    ) : (
                        wallets.map((w: WalletRecord) => {
                            const balance = parseFloat(String(w.balance)) || 0;
                            const isNegative = balance < 0;
                            return (
                                <View key={w.id} style={styles.walletCard}>
                                    <TouchableOpacity style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }} onPress={() => handleOpenEdit(w)}>
                                        <View style={[styles.walletIconBg, { backgroundColor: (w.color || COLORS.primary) + '18' }]}>
                                            <Ionicons name={getWalletIcon(w.type)} size={20} color={w.color || COLORS.primary} />
                                        </View>
                                        <View style={styles.walletDetails}>
                                            <Text style={styles.walletName}>{w.name}</Text>
                                            <Text style={styles.walletAcc}>{w.type}</Text>
                                        </View>
                                        <View style={styles.walletRight}>
                                            <Text style={[styles.walletAmount, { color: isNegative ? COLORS.expense : COLORS.text }]}>
                                                {isNegative ? '-' : ''}{formatAmount(Math.abs(balance))}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Action icons */}
                                    <View style={{ flexDirection: 'row', gap: 10, marginLeft: 12 }}>
                                        <TouchableOpacity onPress={() => handleOpenEdit(w)}>
                                            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteWallet(w)}>
                                            <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}

                </ScrollView>
            </View>

            {/* ─── Edit / Delete Wallet Modal ─── */}
            <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage Wallet</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Wallet Name</Text>
                        <TextInput style={styles.textInput} value={editName} onChangeText={setEditName} placeholder="Wallet Name" />

                        <Text style={styles.inputLabel}>Current Balance (FRw)</Text>
                        <TextInput style={styles.textInput} value={editBalance} onChangeText={setEditBalance} keyboardType="numeric" placeholder="0" />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </TouchableOpacity>

                        {selectedWallet && (
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteWallet(selectedWallet)}>
                                <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                                <Text style={styles.deleteBtnText}>Delete Wallet</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ─── Add Wallet Modal ─── */}
            <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Wallet</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Wallet Name</Text>
                        <TextInput style={styles.textInput} value={newName} onChangeText={setNewName} placeholder="e.g. MoMo Business Account" />

                        <Text style={styles.inputLabel}>Wallet Type</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                            {WALLET_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typePill, newType === t && styles.typePillActive]}
                                    onPress={() => setNewType(t)}>
                                    <Text style={[styles.typeText, newType === t && styles.typeTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Initial Balance (FRw)</Text>
                        <TextInput style={styles.textInput} value={newBalance} onChangeText={setNewBalance} keyboardType="numeric" placeholder="0" />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddWallet}>
                            <Text style={styles.saveBtnText}>Create Wallet</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: SIZES.lg, paddingBottom: 120 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
    seeAll: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.primary },
    walletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: SIZES.md, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#EEF1F7' },
    walletIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    walletDetails: { flex: 1 },
    walletName: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    walletAcc: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    walletRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    walletAmount: { fontFamily: FONTS.mono, fontSize: 14, color: COLORS.text },
    periodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#EEF1F7' },
    periodText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    activityCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7' },
    activityStatsRow: { flexDirection: 'row', marginBottom: SIZES.lg },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    statLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    statValue: { fontFamily: FONTS.monoMedium, fontSize: 15 },
    statDivider: { width: 1, backgroundColor: '#EEF1F7' },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, marginBottom: 12 },
    barGroup: { flex: 1, alignItems: 'center', gap: 4 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, flex: 1, justifyContent: 'center' },
    bar: { width: 8, borderRadius: 4, minHeight: 4 },
    barLabel: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.secondaryText },
    chartLegend: { flexDirection: 'row', gap: SIZES.lg, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    /* Modals */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.lg, gap: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    inputLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginTop: 4 },
    textInput: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#EEF1F7', paddingHorizontal: 14, paddingVertical: 11, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    typePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7' },
    typePillActive: { backgroundColor: `${COLORS.primary}15`, borderColor: COLORS.primary },
    typeText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    typeTextActive: { color: COLORS.primary, fontFamily: FONTS.semiBold },
    saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)', marginTop: 4 },
    deleteBtnText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.expense },
});


