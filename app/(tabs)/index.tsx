import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_ACTIONS: { label: string; icon: IoniconsName; color: string; bg: string }[] = [
    { label: 'Add Income', icon: 'arrow-down-circle', color: COLORS.success, bg: 'rgba(22,163,74,0.1)' },
    { label: 'Add Expense', icon: 'arrow-up-circle', color: COLORS.expense, bg: 'rgba(239,68,68,0.1)' },
    { label: 'Transfer', icon: 'swap-horizontal', color: COLORS.primary, bg: 'rgba(66,133,244,0.1)' },
    { label: 'Scan Receipt', icon: 'scan-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'More', icon: 'grid-outline', color: COLORS.secondaryText, bg: 'rgba(107,114,128,0.1)' },
];

const TRANSACTIONS = [
    { title: 'Salary', sub: 'Bank Account', amount: '+$3,850.00', date: 'Today', type: 'in', icon: 'briefcase-outline' as IoniconsName },
    { title: 'Uber', sub: 'Transportation', amount: '-$12.50', date: 'Today', type: 'out', icon: 'car-outline' as IoniconsName },
    { title: 'Netflix', sub: 'Entertainment', amount: '-$15.99', date: 'Yesterday', type: 'out', icon: 'tv-outline' as IoniconsName },
    { title: 'Freelance Project', sub: 'Income', amount: '+$650.00', date: 'Jul 18', type: 'in', icon: 'code-slash-outline' as IoniconsName },
];

import { ScreenBackground } from '../../src/core/components/ScreenBackground';

// Simple sparkline-like dots for balance card
const SPARKLINE = [40, 55, 35, 65, 45, 70, 60, 80, 55, 90, 75, 95];

export default function HomeScreen() {
    const router = useRouter();

    const handleQuickAction = (label: string) => {
        if (label === 'Add Income' || label === 'Add Expense') {
            router.push('/(tabs)/add');
        } else if (label === 'Transfer' || label === 'Scan Receipt') {
            router.push('/(tabs)/transactions');
        } else if (label === 'More') {
            router.push('/(tabs)/analytics');
        }
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
                    <TouchableOpacity style={styles.notifBtn}>
                        <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                </View>

                {/* ─── Balance Card ─── */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceTopRow}>
                        <Text style={styles.balanceLabel}>Total Balance ✦</Text>
                        <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                    <Text style={styles.balanceAmount}>$12,560.50</Text>
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
                        <Text style={[styles.summaryValue, { color: COLORS.success }]}>$5,850.00</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Ionicons name="arrow-up-circle" size={16} color={COLORS.expense} />
                        </View>
                        <Text style={styles.summaryLabel}>Expenses</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.expense }]}>$3,240.50</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(66,133,244,0.1)' }]}>
                            <Ionicons name="analytics" size={16} color={COLORS.primary} />
                        </View>
                        <Text style={styles.summaryLabel}>Cash Flow</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.primary }]}>$2,609.50</Text>
                    </View>
                </View>

                {/* ─── Quick Actions ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <Text style={styles.sectionAction}>Edit</Text>
                    </View>
                    <View style={styles.quickActionsRow}>
                        {QUICK_ACTIONS.map((action, idx) => (
                            <TouchableOpacity key={idx} style={styles.quickActionBtn} onPress={() => handleQuickAction(action.label)}>
                                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                                    <Ionicons name={action.icon} size={20} color={action.color} />
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
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                            <Text style={styles.sectionAction}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    {TRANSACTIONS.map((tx, idx) => (
                        <View key={idx} style={styles.txItem}>
                            <View style={[styles.txIconBg, { backgroundColor: tx.type === 'in' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.08)' }]}>
                                <Ionicons name={tx.icon} size={20} color={tx.type === 'in' ? COLORS.success : COLORS.expense} />
                            </View>
                            <View style={styles.txDetails}>
                                <Text style={styles.txTitle}>{tx.title}</Text>
                                <Text style={styles.txSub}>{tx.sub}</Text>
                            </View>
                            <View style={styles.txAmountContainer}>
                                <Text style={[styles.txAmount, { color: tx.type === 'in' ? COLORS.success : COLORS.expense }]}>
                                    {tx.amount}
                                </Text>
                                <Text style={styles.txDate}>{tx.date}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
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
    notifBtn: { position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF1F7' },
    notifDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.expense, borderWidth: 1.5, borderColor: '#FFFFFF' },

    // Balance Card — kept as premium blue feature card
    balanceCard: { marginHorizontal: SIZES.lg, borderRadius: 24, backgroundColor: COLORS.primary, padding: SIZES.xl, marginBottom: SIZES.md, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
    balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    balanceLabel: { color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.medium, fontSize: 13, letterSpacing: 0.5 },
    balanceAmount: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 42, letterSpacing: -1.5, marginBottom: 8 },
    balanceChangeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
    balanceChange: { color: '#FFFFFF', fontFamily: FONTS.medium, fontSize: 12 },
    sparkline: { flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 3, marginTop: 4 },
    sparkBar: { flex: 1, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)', minHeight: 4 },

    // Summary
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', marginHorizontal: SIZES.lg, padding: SIZES.lg, borderRadius: 18, marginBottom: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7' },
    summaryItem: { alignItems: 'center', flex: 1, gap: 4 },
    summaryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    summaryDivider: { width: 1, backgroundColor: '#EEF1F7' },
    summaryLabel: { fontFamily: FONTS.medium, color: COLORS.secondaryText, fontSize: 11 },
    summaryValue: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.text },

    // Sections
    section: { marginBottom: SIZES.lg, paddingHorizontal: SIZES.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
    sectionAction: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.primary },

    // Quick Actions
    quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    quickActionBtn: { alignItems: 'center', flex: 1 },
    quickActionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: 1, borderColor: '#EEF1F7' },
    quickActionText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.secondaryText, textAlign: 'center' },

    // AI Card
    aiCard: { borderRadius: 18, padding: SIZES.md, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)', backgroundColor: 'rgba(22,163,74,0.06)' },
    aiHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    aiIconBg: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(22,163,74,0.12)', alignItems: 'center', justifyContent: 'center' },
    aiTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text, flex: 1 },
    aiBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    aiBadgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: FONTS.bold },
    aiBody: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, lineHeight: 20, marginBottom: 8 },
    aiLinkRow: { flexDirection: 'row', alignItems: 'center' },
    aiLink: { fontFamily: FONTS.semiBold, color: COLORS.primary, fontSize: 13 },

    // Transactions
    txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: SIZES.md, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#EEF1F7' },
    txIconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txDetails: { flex: 1 },
    txTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    txSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    txAmountContainer: { alignItems: 'flex-end' },
    txAmount: { fontFamily: FONTS.semiBold, fontSize: 14 },
    txDate: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
});
