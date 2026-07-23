import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { CurrencySelectorModal } from '../../src/presentation/components/CurrencySelectorModal';
import { QuickAddModal } from '../../src/presentation/components/QuickAddModal';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { CURRENCIES, useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_ACTIONS: { id: string; label: string; icon: IoniconsName; color: string; bg: string; type?: 'income' | 'expense' | 'transfer' }[] = [
    { id: 'income', label: 'Add Income', icon: 'arrow-down-circle', color: COLORS.success, bg: 'rgba(22,163,74,0.1)', type: 'income' },
    { id: 'expense', label: 'Add Expense', icon: 'arrow-up-circle', color: COLORS.expense, bg: 'rgba(239,68,68,0.1)', type: 'expense' },
    { id: 'transfer', label: 'Transfer', icon: 'swap-horizontal', color: COLORS.primary, bg: 'rgba(66,133,244,0.1)', type: 'transfer' },
    { id: 'scan', label: 'Scan Receipt', icon: 'scan-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    { id: 'more', label: 'More', icon: 'grid-outline', color: COLORS.secondaryText, bg: 'rgba(107,114,128,0.1)' },
];

const SPARKLINE = [40, 55, 35, 65, 45, 70, 60, 80, 55, 90, 75, 95];

export default function HomeScreen() {
    const router = useRouter();
    const { currency, formatAmount } = useCurrencyStore();
    const { wallets, transactions, addTransaction } = useAppDataStore();

    // Modals state
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | 'transfer'>('expense');
    const [showScanModal, setShowScanModal] = useState(false);
    const [showEditActionsModal, setShowEditActionsModal] = useState(false);

    const totalBalanceRwf = wallets.reduce((sum: number, w: any) => sum + (parseFloat(w.balance) || 0), 0);


    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getTxIcon = (type: string) => {
        if (type === 'income') return 'briefcase-outline';
        if (type === 'transfer') return 'swap-horizontal';
        return 'card-outline';
    };

    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
        if (action.type) {
            setQuickAddType(action.type);
            setShowQuickAddModal(true);
        } else if (action.id === 'scan') {
            setShowScanModal(true);
        } else if (action.id === 'more') {
            router.push('/(tabs)/add');
        }
    };

    const handleSaveTransaction = (data: any) => {
        Alert.alert(
            'Transaction Saved',
            `Successfully added ${data.type.toUpperCase()}: ${data.currency} ${data.amount.toLocaleString()} for ${data.category}.`
        );
    };

    return (
        <ScreenBackground>
            <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ─── Header ─── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarSmall}>
                            <Ionicons name="person" size={18} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.greeting}>Good morning,</Text>
                            <Text style={styles.name}>Sam 👋</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Currency selector badge */}
                        <TouchableOpacity style={styles.currencyBadge} onPress={() => setShowCurrencyModal(true)}>
                            <Text style={styles.currencyFlag}>{CURRENCIES[currency].flag}</Text>
                            <Text style={styles.currencyText}>{currency}</Text>
                            <Ionicons name="chevron-down" size={12} color={COLORS.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => Alert.alert('Notifications', 'You have no new unread notifications.')}>
                            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Balance Card ─── */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceTopRow}>
                        <Text style={styles.balanceLabel}>Total Balance ({currency}) ✦</Text>
                        <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                    <Text style={styles.balanceAmount}>{formatAmount(totalBalanceRwf)}</Text>

                    <View style={styles.balanceChangeRow}>
                        <Ionicons name="trending-up" size={13} color={COLORS.success} />
                        <Text style={styles.balanceChange}> 12.5% from last month</Text>
                    </View>
                    {/* Sparkline */}
                    <View style={styles.sparkline}>
                        {SPARKLINE.map((h, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.sparkBar,
                                    { height: h * 0.55, opacity: i === SPARKLINE.length - 1 ? 1 : 0.4 + (i / SPARKLINE.length) * 0.5 }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* ─── Financial Summary ─── */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(22,163,74,0.1)' }]}>
                            <Ionicons name="arrow-down-circle" size={16} color={COLORS.success} />
                        </View>
                        <Text style={styles.summaryLabel}>Income</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.success }]}>{formatAmount(2850000)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Ionicons name="arrow-up-circle" size={16} color={COLORS.expense} />
                        </View>
                        <Text style={styles.summaryLabel}>Expenses</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{formatAmount(533500)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(66,133,244,0.1)' }]}>
                            <Ionicons name="analytics" size={16} color={COLORS.primary} />
                        </View>
                        <Text style={styles.summaryLabel}>Cash Flow</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{formatAmount(2316500)}</Text>
                    </View>
                </View>

                {/* ─── Quick Actions ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <TouchableOpacity onPress={() => setShowEditActionsModal(true)}>
                            <Text style={styles.sectionAction}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.quickActionsRow}>
                        {QUICK_ACTIONS.map((action) => (
                            <TouchableOpacity key={action.id} style={styles.quickActionBtn} onPress={() => handleQuickAction(action)}>
                                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                                    <Ionicons name={action.icon} size={22} color={action.color} />
                                </View>
                                <Text style={styles.quickActionText}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ─── AI Insight ─── */}
                <View style={styles.section}>
                    <View style={styles.aiCard}>
                        <View style={styles.aiHeaderRow}>
                            <View style={styles.aiIconBg}>
                                <Text style={{ fontSize: 14 }}>🤖</Text>
                            </View>
                            <Text style={styles.aiTitle}>AI Insight</Text>
                            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>New</Text></View>
                        </View>
                        <Text style={styles.aiBody}>
                            You spent 18% less on transportation this month. Great job! Keep it up.
                        </Text>
                        <TouchableOpacity style={styles.aiLinkRow} onPress={() => router.push('/assistant')}>
                            <Text style={styles.aiLink}>See more insights →</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Recent Transactions ─── */}
                <View style={[styles.section, { paddingBottom: 120 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions (5)</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                            <Text style={styles.sectionAction}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.length === 0 ? (

                        <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.secondaryText }}>No recent transactions.</Text>
                    ) : (
                        transactions.map((tx: any, idx: number) => (
                            <View key={tx.id || idx} style={styles.txItem}>
                                <View style={[styles.txIconBg, { backgroundColor: tx.type === 'income' ? 'rgba(22,163,74,0.1)' : tx.type === 'transfer' ? 'rgba(66,133,244,0.1)' : 'rgba(239,68,68,0.08)' }]}>
                                    <Ionicons name={getTxIcon(tx.type)} size={20} color={tx.type === 'income' ? COLORS.success : tx.type === 'transfer' ? COLORS.primary : COLORS.expense} />
                                </View>
                                <View style={styles.txDetails}>
                                    <Text style={styles.txTitle}>{tx.title}</Text>
                                    <Text style={styles.txSub}>{tx.wallet_name || tx.wallets?.name || 'Wallet'}</Text>
                                </View>
                                <View style={styles.txAmountContainer}>
                                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.success : tx.type === 'transfer' ? COLORS.primary : COLORS.expense }]}>
                                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatAmount(Math.abs(parseFloat(tx.amount)))}
                                    </Text>
                                    <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>

            {/* Currency Selector Modal */}
            <CurrencySelectorModal
                visible={showCurrencyModal}
                onClose={() => setShowCurrencyModal(false)}
            />

            {/* Quick Add Modal */}
            <QuickAddModal
                visible={showQuickAddModal}
                initialType={quickAddType}
                onClose={() => setShowQuickAddModal(false)}
                onSave={handleSaveTransaction}
            />

            {/* Scan Receipt Modal */}
            <Modal visible={showScanModal} animationType="slide" transparent onRequestClose={() => setShowScanModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.scanCard}>
                        <View style={styles.scanHeader}>
                            <Text style={styles.scanTitle}>Receipt Scanner</Text>
                            <TouchableOpacity onPress={() => setShowScanModal(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.scanBody}>
                            <View style={styles.cameraBox}>
                                <Ionicons name="scan-outline" size={64} color="#8B5CF6" />
                                <Text style={styles.scanPrompt}>Position receipt within frame</Text>
                                <Text style={styles.scanSub}>Auto-detects total amount & merchant</Text>
                            </View>
                            <TouchableOpacity style={styles.scanBtn} onPress={() => { setShowScanModal(false); Alert.alert('Receipt Scanned', 'Captured receipt: Simba Supermarket (FRw 14,500).'); }}>
                                <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.scanBtnText}>Capture & Parse</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Quick Actions Modal */}
            <Modal visible={showEditActionsModal} animationType="fade" transparent onRequestClose={() => setShowEditActionsModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.editCard}>
                        <Text style={styles.editTitle}>Customize Quick Actions</Text>
                        <Text style={styles.editSub}>Drag or select shortcuts for your home screen</Text>
                        <View style={styles.editList}>
                            {QUICK_ACTIONS.map(act => (
                                <View key={act.id} style={styles.editItem}>
                                    <Ionicons name={act.icon} size={18} color={act.color} />
                                    <Text style={styles.editItemText}>{act.label}</Text>
                                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.editDoneBtn} onPress={() => setShowEditActionsModal(false)}>
                            <Text style={styles.editDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FB' },
    scroll: { paddingBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: `${COLORS.primary}30` },
    greeting: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    name: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    currencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F4F7FB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#EEF1F7' },
    currencyFlag: { fontSize: 14 },
    currencyText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.text },
    notifBtn: { position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF1F7' },
    notifDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.expense, borderWidth: 1.5, borderColor: '#FFFFFF' },

    balanceCard: { marginHorizontal: SIZES.lg, borderRadius: 24, backgroundColor: COLORS.primary, padding: SIZES.xl, marginBottom: SIZES.md, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
    balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    balanceLabel: { color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.medium, fontSize: 13, letterSpacing: 0.5 },
    balanceAmount: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 42, letterSpacing: -1.5, marginBottom: 8 },
    balanceChangeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
    balanceChange: { color: '#FFFFFF', fontFamily: FONTS.medium, fontSize: 12 },
    sparkline: { flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 3, marginTop: 4 },
    sparkBar: { flex: 1, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)', minHeight: 4 },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', marginHorizontal: SIZES.lg, padding: SIZES.lg, borderRadius: 18, marginBottom: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7' },
    summaryItem: { alignItems: 'center', flex: 1, gap: 4 },
    summaryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    summaryDivider: { width: 1, backgroundColor: '#EEF1F7' },
    summaryLabel: { fontFamily: FONTS.medium, color: COLORS.secondaryText, fontSize: 11 },
    summaryValue: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.text },

    section: { marginHorizontal: SIZES.lg, marginBottom: SIZES.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
    sectionAction: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },

    quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    quickActionBtn: { alignItems: 'center', gap: 6, flex: 1 },
    quickActionIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    quickActionText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.text, textAlign: 'center' },

    aiCard: { backgroundColor: '#E6F4EA', borderRadius: 20, padding: SIZES.lg, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' },

    aiHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    aiIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    aiTitle: { fontFamily: FONTS.bold, fontSize: 15, color: '#166534' },
    aiBadge: { backgroundColor: '#166534', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    aiBadgeText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 10 },
    aiBody: { fontFamily: FONTS.regular, fontSize: 13, color: '#14532D', lineHeight: 18, marginBottom: 10 },
    aiLinkRow: { alignSelf: 'flex-start' },
    aiLink: { fontFamily: FONTS.bold, fontSize: 12, color: '#166534' },

    txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EEF1F7', gap: 12 },
    txIconBg: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    txDetails: { flex: 1 },
    txTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    txSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    txAmountContainer: { alignItems: 'flex-end' },
    txAmount: { fontFamily: FONTS.bold, fontSize: 14 },
    txDate: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText, marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', padding: SIZES.lg },
    scanCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: SIZES.lg, gap: 16 },
    scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scanTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    scanBody: { gap: 14, alignItems: 'center' },
    cameraBox: { width: '100%', height: 200, borderRadius: 18, backgroundColor: '#F5F3FF', borderWidth: 2, borderColor: '#DDD6FE', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
    scanPrompt: { fontFamily: FONTS.bold, fontSize: 15, color: '#5B21B6' },
    scanSub: { fontFamily: FONTS.regular, fontSize: 12, color: '#7C3AED' },
    scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
    scanBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 14 },

    editCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: SIZES.xl, gap: 12 },
    editTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    editSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    editList: { gap: 8, marginVertical: 8 },
    editItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#F4F7FB' },
    editItemText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
    editDoneBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
    editDoneText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 14 },
});
