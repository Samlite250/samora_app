import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

// Spending donut segments (approximation using bars)
const SPENDING_CATEGORIES = [
    { label: 'Food & Dining', percent: 30, color: '#4285F4', amount: '$972.00' },
    { label: 'Transport', percent: 25, color: '#EA4335', amount: '$810.00' },
    { label: 'Shopping', percent: 18, color: '#FBBC04', amount: '$583.00' },
    { label: 'Bills & Utilities', percent: 13, color: '#34A853', amount: '$421.00' },
    { label: 'Entertainment', percent: 10, color: '#FF6D00', amount: '$324.00' },
    { label: 'Others', percent: 7, color: '#9C27B0', amount: '$227.50' },
];

const CASHFLOW_POINTS = [38, 42, 30, 50, 45, 62, 55, 70, 65, 75, 68, 85];

export default function AnalyticsScreen() {
    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Analytics</Text>
                    <TouchableOpacity>
                        <Ionicons name="download-outline" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                    {/* Period Selector */}
                    <TouchableOpacity style={styles.periodPill}>
                        <Text style={styles.periodText}>This Month</Text>
                        <Ionicons name="chevron-down" size={13} color={COLORS.secondaryText} />
                    </TouchableOpacity>

                    {/* ─── Spending Overview ─── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Spending Overview</Text>
                        <View style={styles.donutRow}>
                            {/* Simplified donut chart */}
                            <View style={styles.donutWrap}>
                                <View style={styles.donutOuter}>
                                    <View style={styles.donutInner}>
                                        <Text style={styles.donutAmt}>$3,240.50</Text>
                                        <Text style={styles.donutSub}>Total Expenses</Text>
                                    </View>
                                </View>
                                {/* Colored arc segments as colored ring */}
                                {SPENDING_CATEGORIES.map((c, i) => (
                                    <View key={i} style={[styles.donutSegment, { backgroundColor: c.color, width: `${c.percent * 0.9}%`, height: 6, borderRadius: 3, marginBottom: 3 }]} />
                                ))}
                            </View>
                            <View style={styles.legendList}>
                                {SPENDING_CATEGORIES.map((c, i) => (
                                    <View key={i} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                                        <Text style={styles.legendLabel}>{c.label}</Text>
                                        <Text style={styles.legendPct}>{c.percent}%</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* ─── Cash Flow ─── */}
                    <View style={styles.card}>
                        <View style={styles.cashFlowHeader}>
                            <Text style={styles.cardTitle}>Cash Flow</Text>
                            <TouchableOpacity style={styles.periodPillSm}>
                                <Text style={styles.periodTextSm}>This Month</Text>
                                <Ionicons name="chevron-down" size={12} color={COLORS.secondaryText} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.cashFlowAmt}>$2,609.50</Text>
                        <Text style={styles.cashFlowSub}>Net Cash Flow</Text>
                        <View style={styles.cashFlowBadge}>
                            <Ionicons name="trending-up" size={13} color={COLORS.success} />
                            <Text style={styles.cashFlowBadgeText}> 12.3% from last month</Text>
                        </View>

                        {/* Line chart */}
                        <View style={styles.lineChart}>
                            <View style={styles.lineChartBars}>
                                {CASHFLOW_POINTS.map((h, i) => (
                                    <View key={i} style={styles.lineChartBarWrap}>
                                        <View style={[styles.lineChartBar, { height: h, backgroundColor: i === CASHFLOW_POINTS.length - 1 ? COLORS.primary : `${COLORS.primary}40` }]} />
                                    </View>
                                ))}
                            </View>
                            <View style={styles.lineChartLabels}>
                                {['1', '7', '14', '21', '28'].map(l => (
                                    <Text key={l} style={styles.lineChartLabel}>{l}</Text>
                                ))}
                            </View>
                        </View>
                    </View>

                </ScrollView>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    scroll: { padding: SIZES.lg, paddingBottom: 120, gap: SIZES.lg },
    periodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#EEF1F7', alignSelf: 'flex-start' },
    periodText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7' },
    cardTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text, marginBottom: 14 },
    donutRow: { flexDirection: 'row', gap: SIZES.lg },
    donutWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    donutOuter: { width: 120, height: 120, borderRadius: 60, borderWidth: 18, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    donutInner: { alignItems: 'center' },
    donutAmt: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.text, textAlign: 'center' },
    donutSub: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.secondaryText, textAlign: 'center' },
    donutSegment: { alignSelf: 'flex-start' },
    legendList: { flex: 1, gap: 7, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    legendLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.text, flex: 1 },
    legendPct: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.secondaryText },
    cashFlowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    periodPillSm: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F4F7FB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    periodTextSm: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.secondaryText },
    cashFlowAmt: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.text, letterSpacing: -0.5 },
    cashFlowSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, marginBottom: 8 },
    cashFlowBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22,163,74,0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
    cashFlowBadgeText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.success },
    lineChart: { gap: 8 },
    lineChartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 4 },
    lineChartBarWrap: { flex: 1, justifyContent: 'flex-end' },
    lineChartBar: { borderRadius: 3, minHeight: 4 },
    lineChartLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    lineChartLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
});
