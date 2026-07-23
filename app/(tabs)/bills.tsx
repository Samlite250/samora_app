import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { useBills } from '../../src/data/hooks/useAppQueries';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function BillsScreen() {
    const [tab, setTab] = useState<'Upcoming' | 'Paid'>('Upcoming');
    const { user } = useAuthStore();
    const { formatAmount } = useCurrencyStore();
    const { data: bills = [], isLoading } = useBills(user?.id);

    const filteredBills = bills.filter((b: any) => tab === 'Paid' ? b.is_paid : !b.is_paid);

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Bills ({bills.length})</Text>
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
                    {isLoading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
                    ) : filteredBills.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.secondaryText }}>No {tab.toLowerCase()} bills found.</Text>
                    ) : (
                        filteredBills.map((b: any, i: number) => {
                            const iconName = (b.icon || 'flash-outline') as IoniconsName;
                            const color = b.color || COLORS.primary;
                            const amountRwf = parseFloat(b.amount) || 0;

                            return (
                                <View key={b.id || i} style={styles.billCard}>
                                    <View style={[styles.billIcon, { backgroundColor: color + '15' }]}>
                                        <Ionicons name={iconName} size={20} color={color} />
                                    </View>
                                    <View style={styles.billBody}>
                                        <Text style={styles.billLabel}>{b.title || b.label}</Text>
                                        <Text style={styles.billDue}>{tab === 'Upcoming' ? `Due ${b.due_date || b.due}` : `Paid ${b.due_date || b.paid}`}</Text>
                                    </View>
                                    <View style={styles.billRight}>
                                        <Text style={styles.billAmt}>{formatAmount(amountRwf)}</Text>
                                        {tab === 'Upcoming' && (
                                            <TouchableOpacity style={styles.payBtn}>
                                                <Text style={styles.payBtnText}>Pay</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}

                    <TouchableOpacity style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All Bills ({bills.length}) →</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </ScreenBackground>
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

