import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';

const CHART_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#FF6D00', '#9C27B0'];

export default function AnalyticsScreen() {
    const { transactions } = useAppDataStore();
    const { formatAmount } = useCurrencyStore();

    // Compute live totals from real transactions
    const { totalIncome, totalExpenses, netCashFlow, spendingByCategory } = useMemo(() => {
        let income = 0;
        let expenses = 0;
        const catMap: Record<string, number> = {};

        transactions.forEach((tx: any) => {
            const amt = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') income += amt;
            else if (tx.type === 'expense') {
                expenses += amt;
                const cat = tx.category || 'Others';
                catMap[cat] = (catMap[cat] || 0) + amt;
            }
        });

        const categories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .map(([label, amount], i) => ({
                label,
                amount,
                percent: expenses > 0 ? Math.round((amount / expenses) * 100) : 0,
                color: CHART_COLORS[i % CHART_COLORS.length],
            }));

        return {
            totalIncome: income,
            totalExpenses: expenses,
            netCashFlow: income - expenses,
            spendingByCategory: categories,
        };
    }, [transactions]);

    // Build mini bar-chart heights from last 12 days of net cashflow
    const barHeights = useMemo(() => {
        const map: Record<string, number> = {};
        transactions.forEach((tx: any) => {
            const d = tx.date?.slice(0, 10) || '';
            const amt = parseFloat(tx.amount) || 0;
            const sign = tx.type === 'income' ? 1 : -1;
            map[d] = (map[d] || 0) + sign * amt;
        });

        const days = Object.keys(map).sort().slice(-12);
        const vals = days.map(d => map[d]);
        const max = Math.max(...vals.map(Math.abs), 1);
        return vals.map(v => Math.max(Math.round((Math.abs(v) / max) * 80), 4));
    }, [transactions]);

    const isPositive = netCashFlow >= 0;

    const generatePDF = async () => {
        try {
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
                        h1 { color: #2563eb; font-size: 28px; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                        .summary { display: flex; gap: 40px; margin-bottom: 40px; }
                        .summary-box { background: #f8fafc; padding: 20px; border-radius: 12px; flex: 1; }
                        .box-title { font-size: 14px; color: #64748b; margin-bottom: 5px; }
                        .box-amount { font-size: 24px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { text-align: left; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }
                        th { background-color: #f8fafc; font-weight: bold; color: #64748b; font-size: 14px; }
                        .income { color: #16a34a; }
                        .expense { color: #ef4444; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Samora Fintech</h1>
                        <div style="text-align:right; color:#64748b;">
                            <p><strong>Financial Report</strong></p>
                            <p>${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div class="summary">
                        <div class="summary-box">
                            <div class="box-title">Total Income</div>
                            <div class="box-amount income">${formatAmount(totalIncome)}</div>
                        </div>
                        <div class="summary-box">
                            <div class="box-title">Total Expenses</div>
                            <div class="box-amount expense">${formatAmount(totalExpenses)}</div>
                        </div>
                        <div class="summary-box">
                            <div class="box-title">Net Cash Flow</div>
                            <div class="box-amount ${isPositive ? 'income' : 'expense'}">${formatAmount(netCashFlow)}</div>
                        </div>
                    </div>

                    <h2>Transaction History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map((t: any) => `
                                <tr>
                                    <td>${t.date}</td>
                                    <td>${t.title}</td>
                                    <td>${t.category}</td>
                                    <td class="${t.type === 'income' ? 'income' : 'expense'}">
                                        ${t.type === 'income' ? '+' : '-'}${formatAmount(t.amount)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to generate PDF report.');
        }
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Analytics</Text>
                    <TouchableOpacity onPress={generatePDF}>
                        <Ionicons name="download-outline" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                    {/* ─── Summary Cards ─── */}
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
                            <Text style={styles.summaryLabel}>Total Income</Text>
                            <Text style={[styles.summaryVal, { color: COLORS.success }]}>{formatAmount(totalIncome)}</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.expense }]}>
                            <Text style={styles.summaryLabel}>Total Expenses</Text>
                            <Text style={[styles.summaryVal, { color: COLORS.expense }]}>{formatAmount(totalExpenses)}</Text>
                        </View>
                    </View>

                    {/* ─── Spending Overview ─── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Spending by Category</Text>
                        {spendingByCategory.length === 0 ? (
                            <Text style={styles.emptyNote}>No expense transactions yet. Add expenses to see your spending breakdown.</Text>
                        ) : (
                            <>
                                <View style={styles.donutOuter}>
                                    <View style={styles.donutInner}>
                                        <Text style={styles.donutAmt}>{formatAmount(totalExpenses)}</Text>
                                        <Text style={styles.donutSub}>Total Expenses</Text>
                                    </View>
                                </View>
                                <View style={styles.legendList}>
                                    {spendingByCategory.map((c, i) => (
                                        <View key={i} style={styles.legendItem}>
                                            <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                                            <Text style={styles.legendLabel}>{c.label}</Text>
                                            <Text style={styles.legendPct}>{c.percent}%</Text>
                                            <Text style={styles.legendAmt}>{formatAmount(c.amount)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>

                    {/* ─── Cash Flow ─── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Cash Flow</Text>
                        <Text style={[styles.cashFlowAmt, { color: isPositive ? COLORS.success : COLORS.expense }]}>
                            {isPositive ? '+' : '-'}{formatAmount(Math.abs(netCashFlow))}
                        </Text>
                        <Text style={styles.cashFlowSub}>Net Cash Flow</Text>
                        <View style={[styles.cashFlowBadge, { backgroundColor: isPositive ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                            <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={13} color={isPositive ? COLORS.success : COLORS.expense} />
                            <Text style={[styles.cashFlowBadgeText, { color: isPositive ? COLORS.success : COLORS.expense }]}>
                                {' '}{isPositive ? 'Positive' : 'Negative'} cash flow this period
                            </Text>
                        </View>

                        {/* Bar chart from live data */}
                        {barHeights.length > 0 ? (
                            <View style={styles.lineChart}>
                                <View style={styles.lineChartBars}>
                                    {barHeights.map((h, i) => (
                                        <View key={i} style={styles.lineChartBarWrap}>
                                            <View style={[styles.lineChartBar, {
                                                height: h,
                                                backgroundColor: i === barHeights.length - 1 ? COLORS.primary : `${COLORS.primary}40`
                                            }]} />
                                        </View>
                                    ))}
                                </View>
                                <Text style={styles.chartNote}>Last {barHeights.length} active days</Text>
                            </View>
                        ) : (
                            <Text style={styles.emptyNote}>No transaction data yet.</Text>
                        )}
                    </View>

                    {/* ─── Income vs Expenses ─── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Income vs Expenses</Text>
                        <View style={styles.compareRow}>
                            <View style={styles.compareItem}>
                                <View style={[styles.compareDot, { backgroundColor: COLORS.success }]} />
                                <Text style={styles.compareLabel}>Income</Text>
                                <Text style={[styles.compareVal, { color: COLORS.success }]}>{formatAmount(totalIncome)}</Text>
                            </View>
                            <View style={styles.compareItem}>
                                <View style={[styles.compareDot, { backgroundColor: COLORS.expense }]} />
                                <Text style={styles.compareLabel}>Expenses</Text>
                                <Text style={[styles.compareVal, { color: COLORS.expense }]}>{formatAmount(totalExpenses)}</Text>
                            </View>
                        </View>
                        {/* Ratio bars */}
                        <View style={styles.ratioBg}>
                            <View style={[styles.ratioIncome, {
                                flex: totalIncome > 0 ? totalIncome : 1,
                            }]} />
                            <View style={[styles.ratioExpense, {
                                flex: totalExpenses > 0 ? totalExpenses : 0,
                            }]} />
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
    summaryRow: { flexDirection: 'row', gap: 12 },
    summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', borderLeftWidth: 4, gap: 4 },
    summaryLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    summaryVal: { fontFamily: FONTS.bold, fontSize: 16 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7', gap: 12 },
    cardTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
    emptyNote: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, textAlign: 'center', paddingVertical: 16 },
    donutOuter: { width: 110, height: 110, borderRadius: 55, borderWidth: 18, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
    donutInner: { alignItems: 'center' },
    donutAmt: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.text, textAlign: 'center' },
    donutSub: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.secondaryText, textAlign: 'center' },
    legendList: { gap: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    legendLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text, flex: 1 },
    legendPct: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.secondaryText, width: 36, textAlign: 'right' },
    legendAmt: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.text, width: 80, textAlign: 'right' },
    cashFlowAmt: { fontFamily: FONTS.bold, fontSize: 28, letterSpacing: -0.5 },
    cashFlowSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText },
    cashFlowBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    cashFlowBadgeText: { fontFamily: FONTS.medium, fontSize: 12 },
    lineChart: { gap: 6 },
    lineChartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 4 },
    lineChartBarWrap: { flex: 1, justifyContent: 'flex-end' },
    lineChartBar: { borderRadius: 3, minHeight: 4 },
    chartNote: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText, textAlign: 'center' },
    compareRow: { flexDirection: 'row', gap: 12 },
    compareItem: { flex: 1, gap: 4 },
    compareDot: { width: 10, height: 10, borderRadius: 5 },
    compareLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    compareVal: { fontFamily: FONTS.bold, fontSize: 15 },
    ratioBg: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#EEF1F7' },
    ratioIncome: { backgroundColor: COLORS.success },
    ratioExpense: { backgroundColor: COLORS.expense },
});
