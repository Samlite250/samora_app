import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { CreateGoalModal } from '../../src/presentation/components/CreateGoalModal';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';


type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function GoalsScreen() {
    const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
    const { formatAmount } = useCurrencyStore();
    const { goals } = useAppDataStore();

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Goals ({goals.length})</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setIsCreateGoalOpen(true)}>
                        <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {goals.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.secondaryText }}>No goals found.</Text>
                    ) : (

                        goals.map((g: any, i: number) => {
                            const current = parseFloat(g.current) || parseFloat(g.current_amount) || 0;
                            const target = parseFloat(g.target) || parseFloat(g.target_amount) || 1;
                            const pct = Math.round((current / target) * 100);
                            const iconName = (g.icon || 'trophy-outline') as IoniconsName;
                            const color = g.color || COLORS.primary;

                            return (
                                <View key={g.id || i} style={styles.goalCard}>
                                    <View style={[styles.goalIconBg, { backgroundColor: color + '15' }]}>
                                        <Ionicons name={iconName} size={22} color={color} />
                                    </View>
                                    <View style={styles.goalBody}>
                                        <View style={styles.goalTitleRow}>
                                            <Text style={styles.goalLabel}>{g.title || g.label}</Text>
                                            <Text style={[styles.goalPct, { color }]}>{pct}%</Text>
                                        </View>
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
                                        </View>
                                        <View style={styles.goalFooter}>
                                            <Text style={styles.goalAmounts}>{formatAmount(current)} / {formatAmount(target)}</Text>
                                            <Text style={styles.goalDue}>{g.due || g.target_date || 'Target set'}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}

                    <TouchableOpacity style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All Goals ({goals.length}) →</Text>
                    </TouchableOpacity>
                </ScrollView>

                <CreateGoalModal
                    visible={isCreateGoalOpen}
                    onClose={() => setIsCreateGoalOpen(false)}
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
    scroll: { padding: SIZES.lg, paddingBottom: 120, gap: 12 },
    goalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', gap: 12, flexDirection: 'row', alignItems: 'flex-start' },
    goalIconBg: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    goalBody: { flex: 1, gap: 8 },
    goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalLabel: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
    goalPct: { fontFamily: FONTS.bold, fontSize: 14 },
    progressBg: { height: 7, backgroundColor: '#EEF1F7', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 7, borderRadius: 4 },
    goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalAmounts: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    goalDue: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.primary },
    viewAllBtn: { paddingVertical: 14, alignItems: 'center' },
    viewAllText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
});

