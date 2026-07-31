import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { CurrencyConverterModal } from '../../src/presentation/components/CurrencyConverterModal';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';

type TimeframeOption = '7D' | '1M' | '3M' | '1Y' | 'ALL';

const TIMEFRAMES: { id: TimeframeOption; label: string; days: number }[] = [
    { id: '7D', label: '7 Days', days: 7 },
    { id: '1M', label: '1 Month', days: 30 },
    { id: '3M', label: '3 Months', days: 90 },
    { id: '1Y', label: '1 Year', days: 365 },
    { id: 'ALL', label: 'All Time', days: 9999 },
];

const CATEGORY_COLORS: Record<string, string> = {
    'Food & Dining': '#EF4444',
    'Shopping': '#F59E0B',
    'Housing': '#3B82F6',
    'Transportation': '#8B5CF6',
    'Entertainment': '#EC4899',
    'Utilities': '#14B8A6',
    'Salary': '#16A34A',
    'Freelance': '#10B981',
    'Investments': '#6366F1',
    'Health': '#06B6D4',
    'Education': '#F97316',
    'Others': '#64748B',
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Food & Dining': 'restaurant-outline',
    'Shopping': 'cart-outline',
    'Housing': 'home-outline',
    'Transportation': 'car-outline',
    'Entertainment': 'film-outline',
    'Utilities': 'flash-outline',
    'Salary': 'cash-outline',
    'Freelance': 'laptop-outline',
    'Investments': 'trending-up-outline',
    'Health': 'medical-outline',
    'Education': 'school-outline',
    'Others': 'options-outline',
};

const DEFAULT_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AnalyticsScreen() {
    const { transactions, wallets, budgets, goals, bills } = useAppDataStore();
    const { formatAmount } = useCurrencyStore();
    const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1M');
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [selectedCategoryForDrilldown, setSelectedCategoryForDrilldown] = useState<any | null>(null);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');

    // ─── Filtered Transactions by selected timeframe ───
    const filteredTransactions = useMemo(() => {
        const option = TIMEFRAMES.find(t => t.id === selectedTimeframe);
        if (!option || option.id === 'ALL') return transactions;

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - option.days);
        const cutoffStr = cutoff.toISOString().slice(0, 10);

        return transactions.filter((tx: any) => {
            const d = tx.date?.slice(0, 10);
            return d >= cutoffStr;
        });
    }, [transactions, selectedTimeframe]);

    // ─── Key Analytics & Category Breakdown ───
    const {
        totalIncome,
        totalExpenses,
        netCashFlow,
        savingsRate,
        avgDailyExpense,
        spendingByCategory,
        topCategory,
        walletBalanceSum,
        budgetLimitSum,
        budgetSpentSum,
        budgetPct,
        unpaidBillsCount,
        unpaidBillsSum,
        activeGoalsCount,
        fundedGoalsCount,
    } = useMemo(() => {
        let income = 0;
        let expenses = 0;
        const catMap: Record<string, number> = {};

        filteredTransactions.forEach((tx: any) => {
            const amt = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') {
                income += amt;
            } else if (tx.type === 'expense') {
                expenses += amt;
                const cat = tx.category || 'Others';
                catMap[cat] = (catMap[cat] || 0) + amt;
            }
        });

        const net = income - expenses;
        const sRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

        const tf = TIMEFRAMES.find(t => t.id === selectedTimeframe);
        const activeDays = tf && tf.id !== 'ALL' ? tf.days : Math.max(1, Math.ceil(filteredTransactions.length / 2));
        const avgDaily = expenses > 0 ? Math.round(expenses / Math.max(1, activeDays)) : 0;

        const categories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .map(([label, amount], i) => ({
                label,
                amount,
                percent: expenses > 0 ? Math.round((amount / expenses) * 100) : 0,
                color: CATEGORY_COLORS[label] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                icon: CATEGORY_ICONS[label] || 'ellipse-outline',
            }));

        const topCat = categories.length > 0 ? categories[0] : null;

        // System Component Connections
        const walletBalanceSum = wallets.reduce((sum, w) => sum + (parseFloat(String(w.balance)) || 0), 0);
        const budgetLimitSum = budgets.reduce((sum, b) => sum + (b.total || 0), 0);
        const budgetSpentSum = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
        const budgetPct = budgetLimitSum > 0 ? Math.min(100, Math.round((budgetSpentSum / budgetLimitSum) * 100)) : 0;
        const unpaidBills = bills.filter(b => !b.is_paid);
        const unpaidBillsSum = unpaidBills.reduce((sum, b) => sum + (parseFloat(String(b.amount)) || 0), 0);
        const activeGoalsCount = goals.length;
        const fundedGoalsCount = goals.filter(g => (g.current_amount || 0) >= g.target_amount).length;

        return {
            totalIncome: income,
            totalExpenses: expenses,
            netCashFlow: net,
            savingsRate: sRate,
            avgDailyExpense: avgDaily,
            spendingByCategory: categories,
            topCategory: topCat,
            walletBalanceSum,
            budgetLimitSum,
            budgetSpentSum,
            budgetPct,
            unpaidBillsCount: unpaidBills.length,
            unpaidBillsSum,
            activeGoalsCount,
            fundedGoalsCount,
        };
    }, [filteredTransactions, selectedTimeframe, wallets, budgets, goals, bills]);

    // ─── Chart Data (Income vs Expense Bars) ───
    const chartBars = useMemo(() => {
        const dateMap: Record<string, { income: number; expense: number }> = {};

        filteredTransactions.forEach((tx: any) => {
            const dateKey = tx.date?.slice(0, 10) || 'Unknown';
            if (!dateMap[dateKey]) dateMap[dateKey] = { income: 0, expense: 0 };
            const amt = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') dateMap[dateKey].income += amt;
            else if (tx.type === 'expense') dateMap[dateKey].expense += amt;
        });

        const sortedDates = Object.keys(dateMap).sort().slice(-10);
        const maxVal = Math.max(
            ...sortedDates.flatMap(d => [dateMap[d].income, dateMap[d].expense]),
            1
        );

        return sortedDates.map(d => {
            const dateObj = new Date(d);
            const label = isNaN(dateObj.getTime()) ? d.slice(5) : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            const inc = dateMap[d].income;
            const exp = dateMap[d].expense;
            return {
                date: label,
                incomeHeight: Math.max(4, Math.round((inc / maxVal) * 90)),
                expenseHeight: Math.max(4, Math.round((exp / maxVal) * 90)),
                rawIncome: inc,
                rawExpense: exp,
            };
        });
    }, [filteredTransactions]);

    // ─── PDF Report Generation ───
    const generatePDF = async () => {
        try {
            const timeframeLabel = TIMEFRAMES.find(t => t.id === selectedTimeframe)?.label || 'Selected Period';
            const isPositive = netCashFlow >= 0;

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Digital+ Financial Analytics Report</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #1E293B; background: #FFFFFF; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 30px; }
                        .brand { font-size: 28px; font-weight: 800; color: #1A56DB; letter-spacing: -0.5px; }
                        .brand span { color: #8B5CF6; }
                        .report-meta { text-align: right; color: #64748B; font-size: 13px; }
                        .section-title { font-size: 18px; font-weight: 700; color: #0F172A; margin-top: 30px; margin-bottom: 14px; }
                        
                        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
                        .kpi-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
                        .kpi-label { font-size: 12px; color: #64748B; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; }
                        .kpi-val { font-size: 20px; font-weight: 800; }
                        
                        .income { color: #16A34A; }
                        .expense { color: #DC2626; }
                        .primary { color: #1A56DB; }
                        
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
                        th { background-color: #F1F5F9; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
                        tr:nth-child(even) { background-color: #FAFAFA; }
                        
                        .footer { margin-top: 50px; border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: center; font-size: 12px; color: #94A3B8; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="brand">Digital<span>+</span></div>
                            <div style="color: #64748B; font-size: 14px; margin-top: 4px;">Executive Financial Analytics Statement</div>
                        </div>
                        <div class="report-meta">
                            <p style="margin: 0;"><strong>Timeframe:</strong> ${timeframeLabel}</p>
                            <p style="margin: 4px 0 0 0;"><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                    </div>

                    <div class="kpi-grid">
                        <div class="kpi-card">
                            <div class="kpi-label">Total Income</div>
                            <div class="kpi-val income">${formatAmount(totalIncome)}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Total Expenses</div>
                            <div class="kpi-val expense">${formatAmount(totalExpenses)}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Net Cash Flow</div>
                            <div class="kpi-val ${isPositive ? 'income' : 'expense'}">${isPositive ? '+' : ''}${formatAmount(netCashFlow)}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Savings Rate</div>
                            <div class="kpi-val primary">${savingsRate}%</div>
                        </div>
                    </div>

                    <div class="section-title">Spending by Category</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Share (%)</th>
                                <th style="text-align: right;">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${spendingByCategory.map(cat => `
                                <tr>
                                    <td><strong>${cat.label}</strong></td>
                                    <td>${cat.percent}%</td>
                                    <td style="text-align: right; font-weight: 700; color: #DC2626;">${formatAmount(cat.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="section-title">Transaction Ledger (${filteredTransactions.length})</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTransactions.map((tx: any) => `
                                <tr>
                                    <td>${tx.date?.slice(0, 10) || ''}</td>
                                    <td><strong>${tx.title || 'Untitled'}</strong></td>
                                    <td>${tx.category || 'General'}</td>
                                    <td><span style="text-transform: capitalize; font-weight: 600; color: ${tx.type === 'income' ? '#16A34A' : '#DC2626'};">${tx.type}</span></td>
                                    <td style="text-align: right; font-weight: 700;" class="${tx.type === 'income' ? 'income' : 'expense'}">
                                        ${tx.type === 'income' ? '+' : '-'}${formatAmount(parseFloat(tx.amount) || 0)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        Generated automatically by Digital+ SAMORA Financial Intelligence Platform · Page 1 of 1
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert('Export Ready', `PDF generated successfully at: ${uri}`);
            }
        } catch (error) {
            Alert.alert('Export Error', 'Could not generate PDF statement. Please try again.');
        }
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle} numberOfLines={1}>Analytics</Text>
                        <Text style={styles.headerSub}>Real-time performance & insights</Text>
                    </View>
                    <View style={styles.headerBtnGroup}>
                        <TouchableOpacity style={styles.fxBtn} onPress={() => setIsCurrencyModalOpen(true)} activeOpacity={0.8}>
                            <Ionicons name="calculator-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.fxText}>Convert</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.exportBtn} onPress={generatePDF} activeOpacity={0.8}>
                            <Ionicons name="document-text-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.exportText}>Export PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                    {/* ── Timeframe Selector ── */}
                    <View style={styles.timeframeRow}>
                        {TIMEFRAMES.map((tf) => {
                            const active = selectedTimeframe === tf.id;
                            return (
                                <TouchableOpacity
                                    key={tf.id}
                                    style={[styles.tfPill, active && styles.tfPillActive]}
                                    onPress={() => setSelectedTimeframe(tf.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.tfText, active && styles.tfTextActive]}>
                                        {tf.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ── Primary Executive Net Cash Flow Card ── */}
                    <View style={styles.heroCard}>
                        <View style={styles.heroCardOrb} />
                        <Text style={styles.heroLabel}>Net Cash Flow</Text>
                        <Text style={styles.heroAmount}>{formatAmount(netCashFlow)}</Text>
                        <View style={styles.heroRow}>
                            <View style={[styles.badge, { backgroundColor: netCashFlow >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                                <Ionicons name={netCashFlow >= 0 ? 'trending-up' : 'trending-down'} size={14} color={netCashFlow >= 0 ? '#4ADE80' : '#F87171'} />
                                <Text style={[styles.badgeText, { color: netCashFlow >= 0 ? '#4ADE80' : '#F87171' }]}>
                                    {netCashFlow >= 0 ? 'Good' : 'Overspent'}
                                </Text>
                            </View>

                            <View style={styles.savingsTag}>
                                <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                                <Text style={styles.savingsTagText}>Savings Rate: {savingsRate}%</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Financial Health Key Performance Indicators ── */}
                    <View style={styles.kpiGrid}>
                        <View style={styles.kpiItem}>
                            <View style={[styles.kpiIconBg, { backgroundColor: `${COLORS.success}15` }]}>
                                <Ionicons name="arrow-down-circle" size={18} color={COLORS.success} />
                            </View>
                            <Text style={styles.kpiTitle}>Total Income</Text>
                            <Text style={[styles.kpiValue, { color: COLORS.success }]}>{formatAmount(totalIncome)}</Text>
                        </View>

                        <View style={styles.kpiItem}>
                            <View style={[styles.kpiIconBg, { backgroundColor: `${COLORS.expense}15` }]}>
                                <Ionicons name="arrow-up-circle" size={18} color={COLORS.expense} />
                            </View>
                            <Text style={styles.kpiTitle}>Total Expenses</Text>
                            <Text style={[styles.kpiValue, { color: COLORS.expense }]}>{formatAmount(totalExpenses)}</Text>
                        </View>

                        <View style={styles.kpiItem}>
                            <View style={[styles.kpiIconBg, { backgroundColor: `${COLORS.primary}15` }]}>
                                <Ionicons name="time" size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.kpiTitle}>Daily Spending</Text>
                            <Text style={[styles.kpiValue, { color: COLORS.text }]}>{formatAmount(avgDailyExpense)}</Text>
                        </View>

                        <View style={styles.kpiItem}>
                            <View style={[styles.kpiIconBg, { backgroundColor: '#F59E0B15' }]}>
                                <Ionicons name="flame" size={18} color="#F59E0B" />
                            </View>
                            <Text style={styles.kpiTitle}>Top Category</Text>
                            <Text style={[styles.kpiValue, { color: COLORS.text }]} numberOfLines={1}>
                                {topCategory ? topCategory.label : 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {/* ── Income vs Expense Ratio Comparison Bar ── */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Income vs Spending</Text>
                            <Text style={styles.cardSubTitle}>Savings Goal Track</Text>
                        </View>

                        <View style={styles.ratioBarContainer}>
                            <View style={[styles.ratioSegmentIncome, { flex: Math.max(1, totalIncome) }]} />
                            <View style={[styles.ratioSegmentExpense, { flex: Math.max(1, totalExpenses) }]} />
                        </View>

                        <View style={styles.ratioLegendRow}>
                            <View style={styles.ratioLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                                <Text style={styles.ratioLegendLabel}>Income</Text>
                                <Text style={[styles.ratioLegendVal, { color: COLORS.success }]}>{formatAmount(totalIncome)}</Text>
                            </View>

                            <View style={styles.ratioLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.expense }]} />
                                <Text style={styles.ratioLegendLabel}>Expense</Text>
                                <Text style={[styles.ratioLegendVal, { color: COLORS.expense }]}>{formatAmount(totalExpenses)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Category Spending Breakdown ── */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Category Spending</Text>
                            <Text style={styles.cardSubTitle}>Tap any row to see details</Text>
                        </View>

                        {spendingByCategory.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Ionicons name="pie-chart-outline" size={36} color="#94A3B8" />
                                <Text style={styles.emptyText}>No spending recorded yet for this period.</Text>
                            </View>
                        ) : (
                            <>
                                {/* Segmented Bar */}
                                <View style={styles.categoryMultiBar}>
                                    {spendingByCategory.map((c, i) => (
                                        <View
                                            key={i}
                                            style={[styles.categoryBarSegment, {
                                                flex: Math.max(1, c.percent),
                                                backgroundColor: c.color,
                                            }]}
                                        />
                                    ))}
                                </View>

                                {/* Interactive List of Categories */}
                                <View style={styles.catList}>
                                    {spendingByCategory.map((c, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={styles.catRow}
                                            onPress={() => {
                                                setSelectedCategoryForDrilldown(c);
                                                setCategorySearchQuery('');
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.catIconBg, { backgroundColor: `${c.color}15` }]}>
                                                <Ionicons name={c.icon} size={18} color={c.color} />
                                            </View>

                                            <View style={styles.catMain}>
                                                <View style={styles.catTopRow}>
                                                    <Text style={styles.catLabel}>{c.label}</Text>
                                                    <Text style={styles.catAmount}>{formatAmount(c.amount)}</Text>
                                                </View>

                                                <View style={styles.catProgressTrack}>
                                                    <View
                                                        style={[styles.catProgressFill, {
                                                            width: `${Math.min(100, c.percent)}%`,
                                                            backgroundColor: c.color,
                                                        }]}
                                                    />
                                                </View>
                                            </View>

                                            <View style={[styles.pctBadge, { backgroundColor: `${c.color}15` }]}>
                                                <Text style={[styles.pctBadgeText, { color: c.color }]}>{c.percent}%</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>

                    {/* ── Cash Flow Activity Bar Chart ── */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.cardTitle}>Daily Money Flow</Text>
                                <Text style={styles.cardSubTitle}>Income vs spending per day</Text>
                            </View>
                            <View style={styles.chartLegendGroup}>
                                <View style={styles.chartLegendDotWrap}>
                                    <View style={[styles.miniDot, { backgroundColor: COLORS.success }]} />
                                    <Text style={styles.miniLegendText}>Income</Text>
                                </View>
                                <View style={styles.chartLegendDotWrap}>
                                    <View style={[styles.miniDot, { backgroundColor: COLORS.expense }]} />
                                    <Text style={styles.miniLegendText}>Expense</Text>
                                </View>
                            </View>
                        </View>

                        {chartBars.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Ionicons name="bar-chart-outline" size={36} color="#94A3B8" />
                                <Text style={styles.emptyText}>No transactions recorded yet.</Text>
                            </View>
                        ) : (
                            <View style={styles.chartContainer}>
                                {/* Grid reference lines */}
                                <View style={styles.chartGridLines}>
                                    <View style={styles.gridLine} />
                                    <View style={styles.gridLine} />
                                    <View style={styles.gridLine} />
                                </View>

                                <View style={styles.barsGroupRow}>
                                    {chartBars.map((bar, i) => (
                                        <View key={i} style={styles.barGroup}>
                                            <View style={styles.barsPair}>
                                                <View style={styles.barTrack}>
                                                    <View style={[styles.barSingle, { height: Math.max(6, bar.incomeHeight), backgroundColor: COLORS.success }]} />
                                                </View>
                                                <View style={styles.barTrack}>
                                                    <View style={[styles.barSingle, { height: Math.max(6, bar.expenseHeight), backgroundColor: COLORS.expense }]} />
                                                </View>
                                            </View>
                                            <Text style={styles.barLabel}>{bar.date}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── System Ecosystem Overview (2x2 Executive Tile Grid) ── */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.cardTitle}>Your Financial Summary</Text>
                                <Text style={styles.cardSubTitle}>All accounts at a glance</Text>
                            </View>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveBadgeText}>Live</Text>
                            </View>
                        </View>

                        <View style={styles.ecosystemGrid}>
                            {/* Card 1: Wallet Liquidity */}
                            <View style={[styles.ecoCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                                <View style={styles.ecoCardHeader}>
                                    <View style={[styles.ecoIconBg, { backgroundColor: '#DBEAFE' }]}>
                                        <Ionicons name="wallet-outline" size={18} color="#2563EB" />
                                    </View>
                                    <View style={styles.ecoCountBadge}>
                                        <Text style={styles.ecoCountText}>{wallets.length} Wallets</Text>
                                    </View>
                                </View>
                                <Text style={styles.ecoLabel}>Total Balance</Text>
                                <Text style={styles.ecoVal}>{formatAmount(walletBalanceSum)}</Text>
                            </View>

                            {/* Card 2: Budget Utilization */}
                            <View style={[styles.ecoCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
                                <View style={styles.ecoCardHeader}>
                                    <View style={[styles.ecoIconBg, { backgroundColor: '#EDE9FE' }]}>
                                        <Ionicons name="pie-chart-outline" size={18} color="#7C3AED" />
                                    </View>
                                    <View style={[styles.ecoCountBadge, { backgroundColor: '#DDD6FE' }]}>
                                        <Text style={[styles.ecoCountText, { color: '#6D28D9' }]}>{budgetPct}% Used</Text>
                                    </View>
                                </View>
                                <Text style={styles.ecoLabel}>Budget Used</Text>
                                <Text style={styles.ecoVal}>{formatAmount(budgetSpentSum)}</Text>
                                <View style={styles.ecoMiniProgress}>
                                    <View style={[styles.ecoMiniFill, { width: `${budgetPct}%`, backgroundColor: '#7C3AED' }]} />
                                </View>
                            </View>

                            {/* Card 3: Unpaid Bills */}
                            <View style={[styles.ecoCard, { backgroundColor: unpaidBillsCount > 0 ? '#FFF1F2' : '#F0FDF4', borderColor: unpaidBillsCount > 0 ? '#FECDD3' : '#BBF7D0' }]}>
                                <View style={styles.ecoCardHeader}>
                                    <View style={[styles.ecoIconBg, { backgroundColor: unpaidBillsCount > 0 ? '#FFE4E6' : '#DCFCE7' }]}>
                                        <Ionicons name="receipt-outline" size={18} color={unpaidBillsCount > 0 ? '#E11D48' : '#16A34A'} />
                                    </View>
                                    <View style={[styles.ecoCountBadge, { backgroundColor: unpaidBillsCount > 0 ? '#FECDD3' : '#BBF7D0' }]}>
                                        <Text style={[styles.ecoCountText, { color: unpaidBillsCount > 0 ? '#9F1239' : '#15803D' }]}>
                                            {unpaidBillsCount > 0 ? `${unpaidBillsCount} Pending` : 'All Paid'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.ecoLabel}>Unpaid Bills</Text>
                                <Text style={[styles.ecoVal, { color: unpaidBillsCount > 0 ? '#E11D48' : '#16A34A' }]}>
                                    {formatAmount(unpaidBillsSum)}
                                </Text>
                            </View>

                            {/* Card 4: Savings Goals */}
                            <View style={[styles.ecoCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                                <View style={styles.ecoCardHeader}>
                                    <View style={[styles.ecoIconBg, { backgroundColor: '#D1FAE5' }]}>
                                        <Ionicons name="flag-outline" size={18} color="#059669" />
                                    </View>
                                    <View style={[styles.ecoCountBadge, { backgroundColor: '#A7F3D0' }]}>
                                        <Text style={[styles.ecoCountText, { color: '#047857' }]}>{fundedGoalsCount}/{activeGoalsCount} Funded</Text>
                                    </View>
                                </View>
                                <Text style={styles.ecoLabel}>Savings Goals</Text>
                                <Text style={[styles.ecoVal, { color: '#059669' }]}>
                                    {activeGoalsCount > 0 ? `${Math.round((fundedGoalsCount / activeGoalsCount) * 100)}% Funded` : '0 Active'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Dynamic AI Insights Card ── */}
                    <View style={styles.aiCard}>
                        <View style={styles.aiCardHeader}>
                            <View style={styles.aiIconBg}>
                                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                            </View>
                            <Text style={styles.aiCardTitle}>Tips & Insights</Text>
                        </View>

                        <View style={styles.aiBulletList}>
                            <View style={styles.aiBulletRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                                <Text style={styles.aiBulletText}>
                                    You have <Text style={{ fontFamily: FONTS.bold, color: netCashFlow >= 0 ? COLORS.success : COLORS.expense }}>{formatAmount(netCashFlow)}</Text> left after all spending this period.
                                </Text>
                            </View>

                            {topCategory && (
                                <View style={styles.aiBulletRow}>
                                    <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                                    <Text style={styles.aiBulletText}>
                                        You spend the most on <Text style={{ fontFamily: FONTS.bold, color: COLORS.text }}>{topCategory.label}</Text> — {topCategory.percent}% of your total spending.
                                    </Text>
                                </View>
                            )}

                            <View style={styles.aiBulletRow}>
                                <Ionicons name="stats-chart" size={16} color="#3B82F6" />
                                <Text style={styles.aiBulletText}>
                                    You are saving <Text style={{ fontFamily: FONTS.bold, color: COLORS.primary }}>{savingsRate}%</Text> of your income. You spend about {formatAmount(avgDailyExpense)} per day.
                                </Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* ── Category Drill-Down Modal ── */}
                <Modal
                    visible={!!selectedCategoryForDrilldown}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setSelectedCategoryForDrilldown(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {/* Modal Header */}
                            {selectedCategoryForDrilldown && (
                                <View style={styles.modalHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={[styles.catIconBg, { backgroundColor: `${selectedCategoryForDrilldown.color}15` }]}>
                                            <Ionicons name={selectedCategoryForDrilldown.icon} size={20} color={selectedCategoryForDrilldown.color} />
                                        </View>
                                        <View>
                                            <Text style={styles.modalTitle}>{selectedCategoryForDrilldown.label}</Text>
                                            <Text style={styles.modalSub}>{formatAmount(selectedCategoryForDrilldown.amount)} ({selectedCategoryForDrilldown.percent}% of expenses)</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.closeBtnModal} onPress={() => setSelectedCategoryForDrilldown(null)}>
                                        <Ionicons name="close" size={20} color={COLORS.text} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Search Filter input */}
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={16} color={COLORS.secondaryText} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Filter category transactions..."
                                    placeholderTextColor={COLORS.secondaryText}
                                    value={categorySearchQuery}
                                    onChangeText={setCategorySearchQuery}
                                />
                                {categorySearchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                                        <Ionicons name="close-circle" size={16} color={COLORS.secondaryText} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Matching Transactions List */}
                            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                                {(() => {
                                    if (!selectedCategoryForDrilldown) return null;
                                    const matchingTx = filteredTransactions.filter((tx: any) => {
                                        const matchesCat = (tx.category || 'Others') === selectedCategoryForDrilldown.label && tx.type === 'expense';
                                        const matchesSearch = !categorySearchQuery || (tx.title || '').toLowerCase().includes(categorySearchQuery.toLowerCase());
                                        return matchesCat && matchesSearch;
                                    });

                                    if (matchingTx.length === 0) {
                                        return (
                                            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                                                <Text style={{ fontFamily: FONTS.regular, color: COLORS.secondaryText, fontSize: 13 }}>No matching transactions found for this category.</Text>
                                            </View>
                                        );
                                    }

                                    return matchingTx.map((tx: any, idx: number) => (
                                        <View key={tx.id || idx} style={styles.txDrillRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text }}>{tx.title || tx.category}</Text>
                                                <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText }}>{tx.date?.slice(0, 10)} • {tx.wallet_name || 'Wallet'}</Text>
                                            </View>
                                            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.expense }}>-{formatAmount(parseFloat(tx.amount) || 0)}</Text>
                                        </View>
                                    ));
                                })()}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* ── Currency Converter Modal ── */}
                <CurrencyConverterModal
                    visible={isCurrencyModalOpen}
                    onClose={() => setIsCurrencyModalOpen(false)}
                />
            </View >
        </ScreenBackground >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.lg,
        paddingTop: 52,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF1F7',
    },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    headerSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    exportText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' },

    scroll: { padding: SIZES.lg, paddingBottom: 120, gap: 14 },

    /* Timeframe Selector */
    timeframeRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: '#EEF1F7',
    },
    tfPill: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    tfPillActive: {
        backgroundColor: COLORS.primary,
    },
    tfText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    tfTextActive: { fontFamily: FONTS.bold, color: '#FFFFFF' },

    /* System Integration Grid */
    sysGrid: { gap: 8, paddingTop: 4 },
    sysItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    sysLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
    sysVal: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.text },
    sysSub: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.secondaryText },

    /* Executive Hero Balance Card */
    heroCard: {
        backgroundColor: '#1A56DB',
        borderRadius: 22,
        padding: SIZES.lg,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#1A56DB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    heroCardOrb: {
        position: 'absolute',
        top: -40,
        right: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroLabel: { fontFamily: FONTS.medium, fontSize: 12, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },
    heroAmount: { fontFamily: FONTS.mono, fontSize: 34, color: '#FFFFFF', marginVertical: 6, letterSpacing: -0.5 },
    heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontFamily: FONTS.bold, fontSize: 11 },
    savingsTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    savingsTagText: { fontFamily: FONTS.bold, fontSize: 11, color: '#FFFFFF' },

    /* KPI Grid */
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    kpiItem: {
        width: '48.5%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: SIZES.md,
        borderWidth: 1,
        borderColor: '#EEF1F7',
        gap: 4,
    },
    kpiIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    kpiTitle: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
    kpiValue: { fontFamily: FONTS.bold, fontSize: 16 },

    /* Generic Card */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: SIZES.lg,
        borderWidth: 1,
        borderColor: '#EEF1F7',
        gap: 12,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
    cardSubTitle: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },

    /* Ratio Bar */
    ratioBarContainer: {
        flexDirection: 'row',
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#EEF1F7',
    },
    ratioSegmentIncome: { backgroundColor: COLORS.success },
    ratioSegmentExpense: { backgroundColor: COLORS.expense },
    ratioLegendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2 },
    ratioLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    ratioLegendLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    ratioLegendVal: { fontFamily: FONTS.bold, fontSize: 13 },

    /* Category Spending Breakdown */
    categoryMultiBar: {
        flexDirection: 'row',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
        gap: 2,
    },
    categoryBarSegment: { height: '100%' },
    catList: { gap: 12, paddingTop: 4 },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    catIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    catMain: { flex: 1, gap: 4 },
    catTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    catLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
    catAmount: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.text },
    catProgressTrack: { height: 5, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' },
    catProgressFill: { height: '100%', borderRadius: 3 },
    pctBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    pctBadgeText: { fontFamily: FONTS.bold, fontSize: 11 },

    /* Header */
    headerTitleWrap: { flex: 1, marginRight: 8, justifyContent: 'center' },
    headerBtnGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },

    /* Chart */
    chartLegendGroup: { flexDirection: 'row', gap: 10 },
    chartLegendDotWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    miniDot: { width: 7, height: 7, borderRadius: 4 },
    miniLegendText: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
    chartContainer: { height: 130, justifyContent: 'flex-end', paddingTop: 10, position: 'relative' },
    chartGridLines: { position: 'absolute', top: 15, left: 0, right: 0, bottom: 25, justifyContent: 'space-between' },
    gridLine: { height: 1, backgroundColor: '#F1F5F9', width: '100%' },
    barsGroupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, zIndex: 2 },
    barGroup: { alignItems: 'center', gap: 6, flex: 1 },
    barsPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    barTrack: { width: 10, height: 80, backgroundColor: '#F8FAFC', borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden' },
    barSingle: { width: '100%', borderRadius: 5, minHeight: 4 },
    barLabel: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.secondaryText },

    /* Ecosystem Grid (2x2 Executive Cards) */
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
    liveBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: '#15803D' },
    ecosystemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 4 },
    ecoCard: { width: '48%', borderRadius: 16, padding: SIZES.md, borderWidth: 1, gap: 6, justifyContent: 'space-between' },
    ecoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ecoIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    ecoCountBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: '#DBEAFE' },
    ecoCountText: { fontFamily: FONTS.bold, fontSize: 10, color: '#1E40AF' },
    ecoLabel: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.secondaryText },
    ecoVal: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    ecoMiniProgress: { height: 4, backgroundColor: '#E0E7FF', borderRadius: 2, overflow: 'hidden', marginTop: 4 },
    ecoMiniFill: { height: '100%', borderRadius: 2 },

    /* Empty Box */
    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
    emptyText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, textAlign: 'center' },

    /* AI Insight Card */
    aiCard: {
        backgroundColor: '#F3F0FF',
        borderRadius: 18,
        padding: SIZES.lg,
        borderWidth: 1,
        borderColor: '#E9D5FF',
        gap: 12,
    },
    aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiIconBg: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
    aiCardTitle: { fontFamily: FONTS.bold, fontSize: 15, color: '#5B21B6' },
    aiBulletList: { gap: 10 },
    aiBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    aiBulletText: { flex: 1, fontFamily: FONTS.regular, fontSize: 12, color: '#4C1D95', lineHeight: 18 },

    /* Header FX Button */
    fxBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${COLORS.primary}12`,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: `${COLORS.primary}25`,
    },
    fxText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.primary },

    /* Drill-down Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.lg, gap: 14, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
    modalSub: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    closeBtnModal: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, padding: 0 },
    txDrillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
});
