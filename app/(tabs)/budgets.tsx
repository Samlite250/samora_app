import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const BUDGETS = [
    { label: 'Food & Dining', spent: 540, total: 650, icon: 'restaurant-outline' as IoniconsName, color: '#4285F4', pct: 83 },
    { label: 'Transport', spent: 180, total: 350, icon: 'car-outline' as IoniconsName, color: '#EA4335', pct: 51 },
    { label: 'Shopping', spent: 256, total: 450, icon: 'bag-outline' as IoniconsName, color: '#FBBC04', pct: 57 },
    { label: 'Bills & Utilities', spent: 440, total: 500, icon: 'flash-outline' as IoniconsName, color: '#34A853', pct: 88 },
    { label: 'Entertainment', spent: 195, total: 300, icon: 'game-controller-outline' as IoniconsName, color: '#FF6D00', pct: 65 },
    { label: 'Others', spent: 110, total: 230, icon: 'ellipsis-horizontal-outline' as IoniconsName, color: '#9C27B0', pct: 48 },
];

export default function BudgetsScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Budgets</Text>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Period Selector */}
                <TouchableOpacity style={styles.periodPill}>
                    <Text style={styles.periodText}>May 2024</Text>
                    <Ionicons name="chevron-down" size={13} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {BUDGETS.map((b, i) => (
                    <View key={i} style={styles.budgetCard}>
                        <View style={[styles.budgetIcon, { backgroundColor: b.color + '15' }]}>
                            <Ionicons name={b.icon} size={20} color={b.color} />
                        </View>
                        <View style={styles.budgetBody}>
                            <View style={styles.budgetTitleRow}>
                                <Text style={styles.budgetLabel}>{b.label}</Text>
                                <Text style={[styles.budgetPct, { color: b.pct >= 80 ? COLORS.expense : COLORS.text }]}>{b.pct}%</Text>
                            </View>
                            <View style={styles.progressBg}>
                                <View style={[styles.progressFill, {
                                    width: `${b.pct}%` as any,
                                    backgroundColor: b.pct >= 80 ? COLORS.expense : b.color
                                }]} />
                            </View>
                            <Text style={styles.budgetAmounts}>${b.spent.toLocaleString()} / ${b.total.toLocaleString()}</Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>View All Budgets →</Text>
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
    scroll: { padding: SIZES.lg, paddingBottom: 120, gap: 10 },
    periodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#EEF1F7', alignSelf: 'flex-start', marginBottom: 8 },
    periodText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
    budgetCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', alignItems: 'center', gap: 12 },
    budgetIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    budgetBody: { flex: 1, gap: 6 },
    budgetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    budgetLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    budgetPct: { fontFamily: FONTS.bold, fontSize: 13 },
    progressBg: { height: 6, backgroundColor: '#EEF1F7', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },
    budgetAmounts: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    viewAllBtn: { paddingVertical: 14, alignItems: 'center' },
    viewAllText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
});
