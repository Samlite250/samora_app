import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface WalletItem {
    name: string;
    acc: string;
    amount: string;
    color: string;
    icon: IoniconsName;
    type: 'positive' | 'negative';
}

const WALLETS: WalletItem[] = [
    { name: 'Bank Account', acc: '**** 4567', amount: '$5,650.00', color: COLORS.primary, icon: 'business-outline', type: 'positive' },
    { name: 'Mobile Money', acc: 'MTN - 1234', amount: '$2,350.00', color: COLORS.warning, icon: 'phone-portrait-outline', type: 'positive' },
    { name: 'Cash Wallet', acc: 'Cash', amount: '$1,250.00', color: COLORS.success, icon: 'cash-outline', type: 'positive' },
    { name: 'Credit Card', acc: '**** 7890', amount: '-$1,240.00', color: COLORS.expense, icon: 'card-outline', type: 'negative' },
    { name: 'Savings Account', acc: '**** 2345', amount: '$4,550.00', color: '#8B5CF6', icon: 'save-outline', type: 'positive' },
];

// Bar chart data for Activity Summary (Mon-Sun)
const ACTIVITY = [
    { day: 'Mon', income: 60, expense: 30 },
    { day: 'Tue', income: 40, expense: 50 },
    { day: 'Wed', income: 80, expense: 40 },
    { day: 'Thu', income: 50, expense: 70 },
    { day: 'Fri', income: 70, expense: 35 },
    { day: 'Sat', income: 30, expense: 20 },
    { day: 'Sun', income: 90, expense: 55 },
];

export default function WalletScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Wallet</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/add')}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ─── My Wallets ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Wallets</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>

                {WALLETS.map((w, i) => (
                    <TouchableOpacity key={i} style={styles.walletCard} onPress={() => router.push('/(tabs)/transactions')}>
                        <View style={[styles.walletIconBg, { backgroundColor: w.color + '18' }]}>
                            <Ionicons name={w.icon} size={20} color={w.color} />
                        </View>
                        <View style={styles.walletDetails}>
                            <Text style={styles.walletName}>{w.name}</Text>
                            <Text style={styles.walletAcc}>{w.acc}</Text>
                        </View>
                        <View style={styles.walletRight}>
                            <Text style={[styles.walletAmount, { color: w.type === 'negative' ? COLORS.expense : COLORS.text }]}>
                                {w.amount}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color={COLORS.secondaryText} />
                        </View>
                    </TouchableOpacity>
                ))}

                {/* ─── Activity Summary ─── */}
                <View style={[styles.sectionHeader, { marginTop: SIZES.lg }]}>
                    <Text style={styles.sectionTitle}>Activity Summary</Text>
                    <View style={styles.periodPill}>
                        <Text style={styles.periodText}>This Week</Text>
                        <Ionicons name="chevron-down" size={12} color={COLORS.secondaryText} />
                    </View>
                </View>

                <View style={styles.activityCard}>
                    {/* Stats row */}
                    <View style={styles.activityStatsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
                            <Text style={styles.statLabel}>Income</Text>
                            <Text style={[styles.statValue, { color: COLORS.success }]}>$1,850.00</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: COLORS.expense }]} />
                            <Text style={styles.statLabel}>Expenses</Text>
                            <Text style={[styles.statValue, { color: COLORS.expense }]}>$980.50</Text>
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

                    {/* Legend */}
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

            </ScrollView>
        </View>
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
    walletAmount: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    periodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#EEF1F7' },
    periodText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    activityCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7' },
    activityStatsRow: { flexDirection: 'row', marginBottom: SIZES.lg },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    statLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    statValue: { fontFamily: FONTS.bold, fontSize: 16 },
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
});

