import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const UPCOMING_BILLS = [
    { label: 'Electricity', due: 'Due in 4 days', amount: '$120.00', icon: 'flash-outline' as IoniconsName, color: '#FBBC04' },
    { label: 'Internet', due: 'Due in 5 days', amount: '$35.00', icon: 'wifi-outline' as IoniconsName, color: COLORS.primary },
    { label: 'Rent', due: 'Due in 7 days', amount: '$450.00', icon: 'home-outline' as IoniconsName, color: '#8B5CF6' },
    { label: 'Water', due: 'Due in 10 days', amount: '$25.00', icon: 'water-outline' as IoniconsName, color: '#0EA5E9' },
    { label: 'Netflix', due: 'Due in 12 days', amount: '$15.99', icon: 'tv-outline' as IoniconsName, color: '#EA4335' },
];

const PAID_BILLS = [
    { label: 'Electricity', paid: 'Paid Jul 3', amount: '$115.00', icon: 'flash-outline' as IoniconsName, color: '#FBBC04' },
    { label: 'Internet', paid: 'Paid Jul 5', amount: '$35.00', icon: 'wifi-outline' as IoniconsName, color: COLORS.primary },
];

export default function BillsScreen() {
    const [tab, setTab] = useState<'Upcoming' | 'Paid'>('Upcoming');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bills</Text>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
                {(['Upcoming', 'Paid'] as const).map(t => (
                    <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                        <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {(tab === 'Upcoming' ? UPCOMING_BILLS : PAID_BILLS).map((b, i) => (
                    <View key={i} style={styles.billCard}>
                        <View style={[styles.billIcon, { backgroundColor: b.color + '15' }]}>
                            <Ionicons name={b.icon} size={20} color={b.color} />
                        </View>
                        <View style={styles.billBody}>
                            <Text style={styles.billLabel}>{b.label}</Text>
                            <Text style={styles.billDue}>{tab === 'Upcoming' ? (b as any).due : (b as any).paid}</Text>
                        </View>
                        <View style={styles.billRight}>
                            <Text style={styles.billAmt}>{b.amount}</Text>
                            {tab === 'Upcoming' && (
                                <TouchableOpacity style={styles.payBtn}>
                                    <Text style={styles.payBtnText}>Pay</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>View All Bills →</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    tabsRow: { flexDirection: 'row', paddingHorizontal: SIZES.lg, paddingVertical: 12, backgroundColor: '#FFFFFF', gap: 10, borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 20, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7' },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.secondaryText },
    tabTextActive: { color: '#FFFFFF', fontFamily: FONTS.semiBold },
    scroll: { padding: SIZES.lg, paddingBottom: 120, gap: 10 },
    billCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', gap: 12 },
    billIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    billBody: { flex: 1, gap: 3 },
    billLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    billDue: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    billRight: { alignItems: 'flex-end', gap: 6 },
    billAmt: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    payBtn: { backgroundColor: `${COLORS.primary}15`, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    payBtnText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.primary },
    viewAllBtn: { paddingVertical: 14, alignItems: 'center' },
    viewAllText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
});
