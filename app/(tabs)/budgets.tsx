import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { SetBudgetModal } from '../../src/presentation/components/SetBudgetModal';
import { useAppDataStore } from '../../src/store/useAppDataStore';

import { useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function BudgetsScreen() {
    const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
    const { formatAmount } = useCurrencyStore();
    const { budgets } = useAppDataStore();

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Budgets ({budgets.length})</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setIsSetBudgetOpen(true)}>
                        <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Period Selector */}
                    <TouchableOpacity style={styles.periodPill}>
                        <Text style={styles.periodText}>July 2026</Text>
                        <Ionicons name="chevron-down" size={13} color={COLORS.secondaryText} />
                    </TouchableOpacity>

                    {budgets.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.secondaryText }}>No budgets found.</Text>
                    ) : (

                        budgets.map((b: any, i: number) => {
                            const spent = parseFloat(b.spent) || 0;
                            const total = parseFloat(b.total) || 1;
                            const pct = Math.round((spent / total) * 100);
                            const iconName = (b.icon || 'pie-chart-outline') as IoniconsName;
                            const color = b.color || COLORS.primary;

                            return (
                                <View key={b.id || i} style={styles.budgetCard}>
                                    <View style={[styles.budgetIcon, { backgroundColor: color + '15' }]}>
                                        <Ionicons name={iconName} size={20} color={color} />
                                    </View>
                                    <View style={styles.budgetBody}>
                                        <View style={styles.budgetTitleRow}>
                                            <Text style={styles.budgetLabel}>{b.category || b.label}</Text>
                                            <Text style={[styles.budgetPct, { color: pct >= 80 ? COLORS.expense : COLORS.text }]}>{pct}%</Text>
                                        </View>
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill, {
                                                width: `${Math.min(pct, 100)}%` as any,
                                                backgroundColor: pct >= 80 ? COLORS.expense : color
                                            }]} />
                                        </View>
                                        <Text style={styles.budgetAmounts}>{formatAmount(spent)} / {formatAmount(total)}</Text>
                                    </View>
                                </View>
                            );
                        })
                    )}

                    <TouchableOpacity style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All Budgets ({budgets.length}) →</Text>
                    </TouchableOpacity>
                </ScrollView>

                <SetBudgetModal
                    visible={isSetBudgetOpen}
                    onClose={() => setIsSetBudgetOpen(false)}
                />
            </View>
        </ScreenBackground>
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
