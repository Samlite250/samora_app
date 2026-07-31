import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

import { AddBillModal } from '../../src/presentation/components/AddBillModal';
import { CreateGoalModal } from '../../src/presentation/components/CreateGoalModal';
import { QuickAddModal } from '../../src/presentation/components/QuickAddModal';
import { ScanReceiptModal } from '../../src/presentation/components/ScanReceiptModal';
import { SetBudgetModal } from '../../src/presentation/components/SetBudgetModal';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SIZES.lg * 2 - 12) / 2;

interface Action {
    id: string;
    label: string;
    icon: IoniconsName;
    color: string;
    bgColor: string;
    borderColor: string;
    desc: string;
    type?: 'income' | 'expense';
    tag?: string;
}

// ── Hero (primary) actions shown as large full-width banners ──
const HERO_ACTIONS: Action[] = [
    {
        id: 'expense',
        label: 'Add Expense',
        icon: 'arrow-up-circle',
        color: '#DC2626',
        bgColor: '#FFF1F2',
        borderColor: '#FECDD3',
        desc: 'Log a purchase or payment',
        type: 'expense',
    },
    {
        id: 'income',
        label: 'Add Income',
        icon: 'arrow-down-circle',
        color: '#16A34A',
        bgColor: '#F0FDF4',
        borderColor: '#BBF7D0',
        desc: 'Record money coming in',
        type: 'income',
    },
];

// ── Secondary tools shown as a 2-column grid ──
const TOOL_ACTIONS: Action[] = [
    { id: 'scan', label: 'Scan Receipt', icon: 'scan-outline', color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE', desc: 'Auto-read a receipt', tag: 'AI' },
    { id: 'budget', label: 'Set Budget', icon: 'pie-chart-outline', color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#DDD6FE', desc: 'Control your spending' },
    { id: 'bill', label: 'Add Bill', icon: 'receipt-outline', color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FDE68A', desc: 'Schedule a payment' },
    { id: 'goal', label: 'Create Goal', icon: 'flag-outline', color: '#DB2777', bgColor: '#FDF2F8', borderColor: '#FBCFE8', desc: 'Save for something' },
];

export default function AddScreen() {
    const router = useRouter();

    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState<'income' | 'expense'>('expense');
    const [isScanOpen, setIsScanOpen] = useState(false);
    const [isAddBillOpen, setIsAddBillOpen] = useState(false);
    const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
    const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);

    const handlePress = (action: Action) => {
        if (action.id === 'analytics') { router.push('/(tabs)/analytics'); return; }
        if (action.type) { setQuickAddType(action.type); setIsQuickAddOpen(true); return; }
        if (action.id === 'scan') { setIsScanOpen(true); return; }
        if (action.id === 'bill') { setIsAddBillOpen(true); return; }
        if (action.id === 'budget') { setIsSetBudgetOpen(true); return; }
        if (action.id === 'goal') { setIsCreateGoalOpen(true); return; }
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconBg}>
                            <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Quick Add</Text>
                            <Text style={styles.headerSub}>Record financial activity</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
                        <Ionicons name="close" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Hero Transaction Cards ── */}
                    <Text style={styles.sectionLabel}>TRANSACTIONS</Text>
                    <View style={styles.heroRow}>
                        {HERO_ACTIONS.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.heroCard}
                                activeOpacity={0.8}
                                onPress={() => handlePress(action)}
                            >
                                <View style={[styles.heroCardInner, { backgroundColor: action.bgColor, borderColor: action.borderColor }]}>
                                    {/* Top: Icon + Arrow */}
                                    <View style={styles.heroCardTop}>
                                        <View style={[styles.heroIconBg, { backgroundColor: action.color + '20' }]}>
                                            <Ionicons name={action.icon} size={26} color={action.color} />
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={action.color + '80'} />
                                    </View>
                                    {/* Bottom: Label + Description */}
                                    <View style={styles.heroCardBottom}>
                                        <Text style={[styles.heroLabel, { color: action.color }]}>{action.label}</Text>
                                        <Text style={styles.heroDesc}>{action.desc}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Tools Grid ── */}
                    <Text style={[styles.sectionLabel, { marginTop: SIZES.lg }]}>TOOLS & PLANNING</Text>
                    <View style={styles.toolGrid}>
                        {TOOL_ACTIONS.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.toolCard}
                                activeOpacity={0.8}
                                onPress={() => handlePress(action)}
                            >
                                <View style={[styles.toolCardInner, { backgroundColor: action.bgColor, borderColor: action.borderColor }]}>
                                    {/* AI badge */}
                                    {action.tag && (
                                        <View style={[styles.tagBadge, { backgroundColor: action.color }]}>
                                            <Text style={styles.tagText}>{action.tag}</Text>
                                        </View>
                                    )}

                                    <View style={[styles.toolIconBg, { backgroundColor: action.color + '20' }]}>
                                        <Ionicons name={action.icon} size={22} color={action.color} />
                                    </View>

                                    <Text style={[styles.toolLabel, { color: action.color }]}>{action.label}</Text>
                                    <Text style={styles.toolDesc}>{action.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Tip Footer ── */}
                    <View style={styles.tipCard}>
                        <Ionicons name="information-circle-outline" size={16} color="#0891B2" />
                        <Text style={styles.tipText}>Tap any option above to get started. All records are saved automatically.</Text>
                    </View>

                </ScrollView>

                {/* ── Modals ── */}
                <QuickAddModal visible={isQuickAddOpen} initialType={quickAddType} onClose={() => setIsQuickAddOpen(false)} />
                <ScanReceiptModal visible={isScanOpen} onClose={() => setIsScanOpen(false)} />
                <AddBillModal visible={isAddBillOpen} onClose={() => setIsAddBillOpen(false)} />
                <SetBudgetModal visible={isSetBudgetOpen} onClose={() => setIsSetBudgetOpen(false)} />
                <CreateGoalModal visible={isCreateGoalOpen} onClose={() => setIsCreateGoalOpen(false)} />
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.lg,
        paddingTop: 52,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF1F7',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: `${COLORS.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    headerSub: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText, marginTop: 1 },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F4F7FB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EEF1F7',
    },

    /* ── Scroll ── */
    scroll: { padding: SIZES.lg, paddingBottom: 110, gap: 8 },

    /* ── Section Label ── */
    sectionLabel: {
        fontFamily: FONTS.bold,
        fontSize: 11,
        color: COLORS.secondaryText,
        letterSpacing: 1.4,
        marginBottom: 10,
    },

    /* ── Hero row (Expense / Income) ── */
    heroRow: { flexDirection: 'row', gap: 12 },
    heroCard: { flex: 1 },
    heroCardInner: {
        borderRadius: 18,
        borderWidth: 1.5,
        padding: 14,
        gap: 20,
        minHeight: 140,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    heroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heroCardBottom: { gap: 3 },
    heroIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroLabel: { fontFamily: FONTS.bold, fontSize: 15 },
    heroDesc: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText, lineHeight: 15 },

    /* ── Tool grid (2-column) ── */
    toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    toolCard: { width: CARD_WIDTH },
    toolCardInner: {
        borderRadius: 18,
        borderWidth: 1.5,
        padding: 14,
        gap: 8,
        minHeight: 130,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    toolIconBg: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    toolLabel: { fontFamily: FONTS.bold, fontSize: 13 },
    toolDesc: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText, lineHeight: 15 },

    /* ── AI Tag Badge ── */
    tagBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: { fontFamily: FONTS.bold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.6 },

    /* ── Tip Footer ── */
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ECFEFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#A5F3FC',
        marginTop: 8,
    },
    tipText: { flex: 1, fontFamily: FONTS.regular, fontSize: 11, color: '#0E7490', lineHeight: 16 },
});
