import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

const INCOME_DATA = [22, 40, 18, 50, 30, 62, 45, 70, 55, 40, 68, 85];
const EXPENSE_DATA = [15, 28, 12, 35, 22, 42, 30, 48, 38, 28, 45, 55];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReportsScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reports</Text>
                <TouchableOpacity>
                    <Ionicons name="download-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Period Selector */}
                <TouchableOpacity style={styles.periodPill}>
                    <Text style={styles.periodText}>This Month</Text>
                    <Ionicons name="chevron-down" size={13} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* Summary Row */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Income</Text>
                        <Text style={[styles.summaryVal, { color: COLORS.success }]}>$5,850.00</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Expenses</Text>
                        <Text style={[styles.summaryVal, { color: COLORS.expense }]}>$3,240.50</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Net Cash Flow</Text>
                        <Text style={[styles.summaryVal, { color: COLORS.primary }]}>$2,609.50</Text>
                    </View>
                </View>

                {/* Income vs Expenses Chart */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Income vs Expenses</Text>
                    <View style={styles.chart}>
                        {INCOME_DATA.map((inc, i) => {
                            const exp = EXPENSE_DATA[i];
                            const maxH = 80;
                            return (
                                <View key={i} style={styles.barGroup}>
                                    <View style={styles.bars}>
                                        <View style={[styles.bar, { height: (inc / 90) * maxH, backgroundColor: COLORS.primary }]} />
                                        <View style={[styles.bar, { height: (exp / 90) * maxH, backgroundColor: '#FDA4A4' }]} />
                                    </View>
                                    <Text style={styles.monthLabel}>{i % 3 === 0 ? MONTHS[i] : ''}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={styles.legendText}>Income</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#FDA4A4' }]} />
                            <Text style={styles.legendText}>Expenses</Text>
                        </View>
                    </View>
                </View>

                {/* Export Buttons */}
                <View style={styles.exportRow}>
                    <TouchableOpacity style={styles.exportBtn}>
                        <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.exportText}>Export PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.exportBtn, { borderColor: COLORS.success }]}>
                        <Ionicons name="grid-outline" size={18} color={COLORS.success} />
                        <Text style={[styles.exportText, { color: COLORS.success }]}>Export Excel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    scroll: { padding: SIZES.lg, paddingBottom: 120, gap: SIZES.lg },
    periodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#EEF1F7', alignSelf: 'flex-start' },
    periodText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
    summaryRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7' },
    summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
    summaryLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText, textAlign: 'center' },
    summaryVal: { fontFamily: FONTS.bold, fontSize: 13 },
    summaryDivider: { width: 1, backgroundColor: '#EEF1F7' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7' },
    cardTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
    chart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, marginBottom: SIZES.sm },
    barGroup: { flex: 1, alignItems: 'center', gap: 4 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, flex: 1, justifyContent: 'center' },
    bar: { width: 7, borderRadius: 4, minHeight: 4 },
    monthLabel: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.secondaryText, height: 14 },
    legend: { flexDirection: 'row', gap: SIZES.lg, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    exportRow: { flexDirection: 'row', gap: 12 },
    exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary },
    exportText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
});
