import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

const METRICS = [
    { label: 'Savings Rate', value: '82', max: 100, color: COLORS.success, icon: 'trending-up-outline' },
    { label: 'Debt Ratio', value: '70', max: 100, color: COLORS.warning, icon: 'card-outline' },
    { label: 'Budget Discipline', value: '85', max: 100, color: COLORS.primary, icon: 'checkmark-circle-outline' },
    { label: 'Bill Payments', value: '92', max: 100, color: COLORS.success, icon: 'receipt-outline' },
    { label: 'Emergency Fund', value: '65', max: 100, color: '#8B5CF6', icon: 'shield-outline' },
];

export default function FinancialHealthScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Financial Health</Text>
                <TouchableOpacity>
                    <Ionicons name="information-circle-outline" size={22} color={COLORS.secondaryText} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Score Circle */}
                <View style={styles.scoreCard}>
                    <View style={styles.scoreCircle}>
                        <View style={styles.scoreInner}>
                            <Text style={styles.scoreNum}>78</Text>
                            <Text style={styles.scoreDenom}>/100</Text>
                        </View>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: 'rgba(22,163,74,0.12)' }]}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                        <Text style={[styles.scoreBadgeText, { color: COLORS.success }]}>Good</Text>
                    </View>
                    <Text style={styles.scoreSubtitle}>You are on the right track!</Text>
                </View>

                {/* Metrics */}
                <View style={styles.metricsCard}>
                    {METRICS.map((m, i) => (
                        <View key={i} style={[styles.metricRow, i < METRICS.length - 1 && styles.metricBorder]}>
                            <Ionicons name={m.icon as any} size={18} color={m.color} />
                            <View style={styles.metricBody}>
                                <View style={styles.metricTitleRow}>
                                    <Text style={styles.metricLabel}>{m.label}</Text>
                                    <Text style={[styles.metricVal, { color: m.color }]}>{m.value}/100</Text>
                                </View>
                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${m.value}%` as any, backgroundColor: m.color }]} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.detailBtn}>
                    <Text style={styles.detailText}>View Detailed Report →</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    scroll: { padding: SIZES.lg, paddingBottom: 120, alignItems: 'center', gap: SIZES.lg },
    scoreCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: SIZES.xl, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#EEF1F7', gap: 12 },
    scoreCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 14, borderColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
    scoreInner: { flexDirection: 'row', alignItems: 'baseline' },
    scoreNum: { fontFamily: FONTS.bold, fontSize: 46, color: COLORS.text },
    scoreDenom: { fontFamily: FONTS.medium, fontSize: 18, color: COLORS.secondaryText },
    scoreBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6 },
    scoreBadgeText: { fontFamily: FONTS.semiBold, fontSize: 14 },
    scoreSubtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.secondaryText },
    metricsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.md, width: '100%', borderWidth: 1, borderColor: '#EEF1F7' },
    metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    metricBorder: { borderBottomWidth: 1, borderBottomColor: '#F4F7FB' },
    metricBody: { flex: 1, gap: 6 },
    metricTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
    metricLabel: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    metricVal: { fontFamily: FONTS.bold, fontSize: 13 },
    progressBg: { height: 6, backgroundColor: '#EEF1F7', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },
    detailBtn: { paddingVertical: 14, alignItems: 'center' },
    detailText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
});
