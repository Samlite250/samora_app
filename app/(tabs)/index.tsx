import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { CurrencySelectorModal } from '../../src/presentation/components/CurrencySelectorModal';
import { QuickAddModal } from '../../src/presentation/components/QuickAddModal';
import { ScanReceiptModal } from '../../src/presentation/components/ScanReceiptModal';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { CURRENCIES, useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_ACTIONS: { id: string; label: string; icon: IoniconsName; color: string; bg: string; type?: 'income' | 'expense' }[] = [
    { id: 'income', label: 'Add Income', icon: 'arrow-down-circle', color: COLORS.success, bg: 'rgba(22,163,74,0.1)', type: 'income' },
    { id: 'expense', label: 'Add Expense', icon: 'arrow-up-circle', color: COLORS.expense, bg: 'rgba(239,68,68,0.1)', type: 'expense' },
    { id: 'analytics', label: 'Analytics', icon: 'stats-chart-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    { id: 'scan', label: 'Scan Receipt', icon: 'scan-outline', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { id: 'more', label: 'More', icon: 'grid-outline', color: COLORS.secondaryText, bg: 'rgba(107,114,128,0.1)' },
];

const SPARKLINE = [40, 55, 35, 65, 45, 70, 60, 80, 55, 90, 75, 95];

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
};

export default function HomeScreen() {
    const router = useRouter();
    const { currency, formatAmount } = useCurrencyStore();
    const { wallets, transactions, bills, goals, plans, addTransaction, getHealthScore } = useAppDataStore();
    const { profile } = useAuthStore();
    const healthScore = getHealthScore();

    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddType, setQuickAddType] = useState<'income' | 'expense'>('expense');
    const [showScanModal, setShowScanModal] = useState(false);
    const [showEditActionsModal, setShowEditActionsModal] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
    const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
    const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
    const [isAiFabMinimized, setIsAiFabMinimized] = useState(false);

    const totalBalanceRwf = wallets.reduce((sum: number, w: any) => sum + (parseFloat(w.balance) || 0), 0);

    const { totalIncome, totalExpenses, netCashFlow } = useMemo(() => {
        let income = 0; let expenses = 0;
        transactions.forEach((tx: any) => {
            const a = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') income += a;
            else if (tx.type === 'expense') expenses += a;
        });
        return { totalIncome: income, totalExpenses: expenses, netCashFlow: income - expenses };
    }, [transactions]);

    // ─── Recent Transactions: sorted by date desc, limited to 5 ───
    const recentTransactions = useMemo(() => {
        return [...transactions]
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);

    // ─── Real Notifications from store data with unique IDs and rich details ───
    const notifications = useMemo(() => {
        type NotifItem = {
            id: string;
            icon: string;
            title: string;
            body: string;
            type: 'warning' | 'danger' | 'info';
            category: string;
            amount?: number;
            dueDate?: string;
            actionLabel?: string;
            actionRoute?: string;
            extraNote?: string;
        };
        const items: NotifItem[] = [];
        const today = new Date();

        // Upcoming & overdue bills
        bills.forEach((b: any) => {
            if (b.is_paid) return;
            const due = new Date(b.due_date);
            const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                items.push({
                    id: `bill_overdue_${b.id}`,
                    icon: '🔴',
                    title: 'Overdue Bill Alert',
                    body: `${b.title} was due on ${b.due_date}. FRw ${Number(b.amount).toLocaleString()} unpaid.`,
                    type: 'danger',
                    category: b.category || 'Utilities',
                    amount: Number(b.amount),
                    dueDate: b.due_date,
                    actionLabel: 'Pay Bill Now',
                    actionRoute: '/(tabs)/planner',
                    extraNote: 'Immediate action required to avoid utility service disconnection or penalty charges.',
                });
            } else if (diffDays <= 3) {
                items.push({
                    id: `bill_due_${b.id}`,
                    icon: '🟡',
                    title: 'Bill Due Soon',
                    body: `${b.title} is due in ${diffDays} day${diffDays === 1 ? '' : 's'}. FRw ${Number(b.amount).toLocaleString()}.`,
                    type: 'warning',
                    category: b.category || 'Utilities',
                    amount: Number(b.amount),
                    dueDate: b.due_date,
                    actionLabel: 'View & Settle Bill',
                    actionRoute: '/(tabs)/planner',
                    extraNote: 'Ensure your wallet balance is sufficient before auto-debit triggers.',
                });
            }
        });

        // Goals at risk
        goals.forEach((g: any) => {
            const pct = g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0;
            const daysLeft = Math.ceil((new Date(g.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 7 && pct < 80) {
                items.push({
                    id: `goal_risk_${g.id}`,
                    icon: '🎯',
                    title: 'Savings Goal At Risk',
                    body: `"${g.title}" is ${Math.round(pct)}% funded with ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.`,
                    type: 'warning',
                    category: 'Savings Goal',
                    amount: g.target_amount - (g.current_amount || 0),
                    dueDate: g.deadline,
                    actionLabel: 'Deposit Extra Funds',
                    actionRoute: '/(tabs)/planner',
                    extraNote: `Saved: FRw ${Number(g.current_amount || 0).toLocaleString()} of FRw ${Number(g.target_amount).toLocaleString()} target.`,
                });
            }
        });

        // Overdue plans
        const todayStr = today.toISOString().slice(0, 10);
        const overduePlans = plans.filter((p: any) => !p.completed && p.date < todayStr);
        if (overduePlans.length > 0) {
            items.push({
                id: 'plans_overdue',
                icon: '⏰',
                title: 'Overdue Planner Tasks',
                body: `You have ${overduePlans.length} overdue plan${overduePlans.length > 1 ? 's' : ''} requiring attention.`,
                type: 'warning',
                category: 'Planner Schedule',
                actionLabel: 'Open Planner',
                actionRoute: '/(tabs)/planner',
                extraNote: 'Complete or reschedule your pending task list in the planner tab.',
            });
        }

        const todayPlans = plans.filter((p: any) => !p.completed && p.date === todayStr);
        if (todayPlans.length > 0) {
            items.push({
                id: 'plans_today',
                icon: '📅',
                title: 'Tasks Scheduled Today',
                body: `You have ${todayPlans.length} task${todayPlans.length > 1 ? 's' : ''} scheduled for today.`,
                type: 'info',
                category: 'Daily Planner',
                actionLabel: 'View Today Schedule',
                actionRoute: '/(tabs)/planner',
                extraNote: 'Check off finished tasks to maintain high financial health score.',
            });
        }

        return items.filter(item => !dismissedNotifIds.includes(item.id));
    }, [bills, goals, plans, dismissedNotifIds]);

    // Unread calculation
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !readNotifIds.includes(n.id)).length;
    }, [notifications, readNotifIds]);

    const markAsRead = (id: string) => {
        if (!readNotifIds.includes(id)) {
            setReadNotifIds(prev => [...prev, id]);
        }
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setReadNotifIds(allIds);
    };

    const deleteNotif = (id: string, e?: any) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        setDismissedNotifIds(prev => [...prev, id]);
    };

    const clearAllNotifs = () => {
        const allIds = notifications.map(n => n.id);
        setDismissedNotifIds(prev => [...prev, ...allIds]);
    };

    const handleNotifPress = (item: any) => {
        markAsRead(item.id);
        setExpandedNotifId(prev => (prev === item.id ? null : item.id));
    };

    const handleActionClick = (route?: string) => {
        setShowNotifModal(false);
        if (route) {
            router.push(route as any);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getTxIcon = (type: string) => {
        if (type === 'income') return 'briefcase-outline';
        if (type === 'transfer') return 'swap-horizontal';
        return 'card-outline';
    };

    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
        if (action.id === 'analytics') {
            router.push('/(tabs)/analytics');
        } else if (action.type) {
            setQuickAddType(action.type);
            setShowQuickAddModal(true);
        } else if (action.id === 'scan') {
            setShowScanModal(true);
        } else if (action.id === 'more') {
            router.push('/(tabs)/add');
        }
    };

    const handleSaveTransaction = (data: any) => {
        Alert.alert(
            'Transaction Saved',
            `Successfully added ${data.type.toUpperCase()}: ${data.currency} ${data.amount.toLocaleString()} for ${data.category}.`
        );
    };

    return (
        <ScreenBackground>
            <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ─── Header ─── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity style={styles.avatarSmall} onPress={() => router.push('/(tabs)/profile')}>
                            <Ionicons name="person" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.name}>{profile.firstName || 'Sam'} 👋</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity style={styles.currencyBadge} onPress={() => setShowCurrencyModal(true)}>
                            <Text style={styles.currencyFlag}>{CURRENCIES[currency].flag}</Text>
                            <Text style={styles.currencyText}>{currency}</Text>
                            <Ionicons name="chevron-down" size={12} color={COLORS.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifModal(true)}>
                            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
                            {unreadCount > 0 && <View style={styles.notifDot} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Premium Balance Card ─── */}
                <View style={styles.balanceCard}>
                    {/* Decorative orbs */}
                    <View style={styles.orbTopRight} />
                    <View style={styles.orbBottomLeft} />

                    {/* Top row */}
                    <View style={styles.balanceTopRow}>
                        <View style={styles.balanceLabelRow}>
                            <View style={styles.cardDot} />
                            <Text style={styles.balanceLabel}>Total Balance · {wallets.length} wallets</Text>
                        </View>
                        <TouchableOpacity onPress={() => setBalanceHidden(v => !v)} style={styles.eyeBtn}>
                            <Ionicons name={balanceHidden ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>

                    {/* Balance amount */}
                    <Text style={styles.balanceAmount}>
                        {balanceHidden ? '••••••' : formatAmount(totalBalanceRwf)}
                    </Text>

                    {/* Change badge */}
                    <View style={styles.balanceChangeRow}>
                        <Ionicons name={netCashFlow >= 0 ? 'trending-up' : 'trending-down'} size={13} color={netCashFlow >= 0 ? '#86efac' : '#fca5a5'} />
                        <Text style={styles.balanceChange}>
                            {netCashFlow >= 0 ? '+' : ''}{formatAmount(netCashFlow)} net this period
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Mini income/expense row inside card */}
                    <View style={styles.cardStatsRow}>
                        <View style={styles.cardStatItem}>
                            <View style={styles.cardStatIconIn}>
                                <Ionicons name="arrow-down" size={12} color="#86efac" />
                            </View>
                            <View>
                                <Text style={styles.cardStatLabel}>Income</Text>
                                <Text style={styles.cardStatVal}>{balanceHidden ? '•••' : formatAmount(totalIncome)}</Text>
                            </View>
                        </View>
                        <View style={styles.cardStatDivider} />
                        <View style={styles.cardStatItem}>
                            <View style={styles.cardStatIconOut}>
                                <Ionicons name="arrow-up" size={12} color="#fca5a5" />
                            </View>
                            <View>
                                <Text style={styles.cardStatLabel}>Expenses</Text>
                                <Text style={styles.cardStatVal}>{balanceHidden ? '•••' : formatAmount(totalExpenses)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Sparkline */}
                    <View style={styles.sparkline}>
                        {SPARKLINE.map((h, i) => (
                            <View
                                key={i}
                                style={[styles.sparkBar, {
                                    height: h * 0.5,
                                    opacity: i === SPARKLINE.length - 1 ? 1 : 0.3 + (i / SPARKLINE.length) * 0.6,
                                    backgroundColor: i === SPARKLINE.length - 1 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)'
                                }]}
                            />
                        ))}
                    </View>
                </View>

                {/* ─── Financial Health Score ─── */}
                <View style={[styles.summaryRow, { marginTop: 4, paddingBottom: 16 }]}>
                    <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EEF1F7', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: healthScore >= 80 ? 'rgba(22,163,74,0.1)' : healthScore >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: healthScore >= 80 ? COLORS.success : healthScore >= 50 ? '#F59E0B' : COLORS.expense }}>{healthScore}</Text>
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text }}>Financial Health</Text>
                            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText }}>
                                {healthScore >= 80 ? "You're in great shape! Keep saving." : healthScore >= 50 ? "Your budget is tight. Monitor expenses." : "Warning! You have unpaid bills and low capacity."}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ─── Financial Summary ─── */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(22,163,74,0.1)' }]}>
                            <Ionicons name="arrow-down-circle" size={16} color={COLORS.success} />
                        </View>
                        <Text style={styles.summaryLabel}>Income</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.success }]}>{formatAmount(totalIncome)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Ionicons name="arrow-up-circle" size={16} color={COLORS.expense} />
                        </View>
                        <Text style={styles.summaryLabel}>Expenses</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{formatAmount(totalExpenses)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: 'rgba(66,133,244,0.1)' }]}>
                            <Ionicons name="analytics" size={16} color={COLORS.primary} />
                        </View>
                        <Text style={styles.summaryLabel}>Cash Flow</Text>
                        <Text style={[styles.summaryValue, { color: netCashFlow >= 0 ? COLORS.success : COLORS.expense }]}>{formatAmount(Math.abs(netCashFlow))}</Text>
                    </View>
                </View>

                {/* ─── Quick Actions ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <TouchableOpacity onPress={() => setShowEditActionsModal(true)}>
                            <Text style={styles.sectionAction}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.quickActionsRow}>
                        {QUICK_ACTIONS.map((action) => (
                            <TouchableOpacity key={action.id} style={styles.quickActionBtn} onPress={() => handleQuickAction(action)}>
                                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                                    <Ionicons name={action.icon} size={22} color={action.color} />
                                </View>
                                <Text style={styles.quickActionText}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ─── AI Insight ─── */}
                <View style={styles.section}>
                    <View style={styles.aiCard}>
                        <View style={styles.aiHeaderRow}>
                            <View style={styles.aiIconBg}>
                                <Text style={{ fontSize: 14 }}>🤖</Text>
                            </View>
                            <Text style={styles.aiTitle}>AI Insight</Text>
                            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>New</Text></View>
                        </View>
                        <Text style={styles.aiBody}>
                            You spent 18% less on transportation this month. Great job! Keep it up.
                        </Text>
                        <TouchableOpacity style={styles.aiLinkRow} onPress={() => router.push('/assistant')}>
                            <Text style={styles.aiLink}>See more insights →</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Recent Transactions ─── */}
                <View style={[styles.section, { paddingBottom: 120 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions ({recentTransactions.length})</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                            <Text style={styles.sectionAction}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {recentTransactions.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.secondaryText }}>No recent transactions.</Text>
                    ) : (
                        recentTransactions.map((tx: any, idx: number) => (
                            <View key={tx.id || idx} style={styles.txItem}>
                                <View style={[styles.txIconBg, { backgroundColor: tx.type === 'income' ? 'rgba(22,163,74,0.1)' : tx.type === 'transfer' ? 'rgba(66,133,244,0.1)' : 'rgba(239,68,68,0.08)' }]}>
                                    <Ionicons name={getTxIcon(tx.type)} size={20} color={tx.type === 'income' ? COLORS.success : tx.type === 'transfer' ? COLORS.primary : COLORS.expense} />
                                </View>
                                <View style={styles.txDetails}>
                                    <Text style={styles.txTitle}>{tx.title}</Text>
                                    <Text style={styles.txSub}>{tx.wallet_name || tx.wallets?.name || 'Wallet'}</Text>
                                </View>
                                <View style={styles.txAmountContainer}>
                                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.success : tx.type === 'transfer' ? COLORS.primary : COLORS.expense }]}>
                                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatAmount(Math.abs(parseFloat(tx.amount)))}
                                    </Text>
                                    <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>

            {/* ─── Notifications Modal (Centered Floating Luxury Dialog) ─── */}
            <Modal visible={showNotifModal} animationType="fade" transparent onRequestClose={() => setShowNotifModal(false)}>
                <View style={styles.notifOverlay}>
                    <TouchableOpacity style={styles.notifBackdropClick} activeOpacity={1} onPress={() => setShowNotifModal(false)} />
                    <View style={styles.notifSheet}>
                        {/* ── Header ── */}
                        <View style={styles.notifHeader}>
                            <View style={styles.notifHeaderRow}>
                                <View style={styles.notifHeaderLeft}>
                                    <View style={styles.notifHeaderIconBg}>
                                        <Ionicons name="notifications" size={18} color="#FFFFFF" />
                                    </View>
                                    <View>
                                        <Text style={styles.notifHeaderTitle}>Notification Center</Text>
                                        <Text style={styles.notifHeaderSub}>
                                            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {notifications.length > 0 && (
                                        <TouchableOpacity onPress={clearAllNotifs} style={styles.clearAllBtn}>
                                            <Ionicons name="trash-outline" size={13} color="#FFFFFF" />
                                            <Text style={styles.clearAllText}>Clear all</Text>
                                        </TouchableOpacity>
                                    )}
                                    {unreadCount > 0 && (
                                        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                                            <Text style={styles.markAllText}>Mark read</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => setShowNotifModal(false)} style={styles.notifCloseBtn}>
                                        <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* ── Body ── */}
                        <ScrollView style={styles.notifBody} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
                            {notifications.length === 0 ? (
                                <View style={styles.notifEmptyState}>
                                    <View style={styles.notifEmptyIconBg}>
                                        <Ionicons name="checkmark-circle" size={38} color="#16A34A" />
                                    </View>
                                    <Text style={styles.notifEmptyTitle}>You're all caught up!</Text>
                                    <Text style={styles.notifEmptySub}>No upcoming bills, at-risk goals, or overdue tasks right now. Keep it up!</Text>
                                </View>
                            ) : (
                                <View style={{ gap: 10, paddingTop: 4 }}>
                                    {notifications.map((n) => {
                                        const isRead = readNotifIds.includes(n.id);
                                        const isExpanded = expandedNotifId === n.id;
                                        const dangerColor = '#EF4444';
                                        const warningColor = '#F59E0B';
                                        const infoColor = '#4285F4';
                                        const color = n.type === 'danger' ? dangerColor : n.type === 'warning' ? warningColor : infoColor;
                                        const bgColor = isRead
                                            ? '#F8FAFC'
                                            : n.type === 'danger' ? 'rgba(239,68,68,0.08)' : n.type === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(66,133,244,0.08)';

                                        return (
                                            <TouchableOpacity
                                                key={n.id}
                                                activeOpacity={0.8}
                                                onPress={() => handleNotifPress(n)}
                                                style={[
                                                    styles.notifCard,
                                                    { backgroundColor: bgColor, borderColor: isExpanded ? color : isRead ? '#EEF1F7' : `${color}40`, borderWidth: isExpanded ? 1.5 : 1 }
                                                ]}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                                                    <View style={[styles.notifCardIconRing, { borderColor: color, backgroundColor: `${color}15` }]}>
                                                        <Text style={{ fontSize: 18 }}>{n.icon}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                                                {!isRead && <View style={styles.unreadDot} />}
                                                                <Text style={[styles.notifCardTitle, { color: color, opacity: isRead ? 0.75 : 1 }]}>{n.title}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                <View style={[styles.notifSeverityPill, { backgroundColor: `${color}20` }]}>
                                                                    <Text style={[styles.notifSeverityText, { color }]}>
                                                                        {n.type === 'danger' ? 'Urgent' : n.type === 'warning' ? 'Attention' : 'Info'}
                                                                    </Text>
                                                                </View>
                                                                <TouchableOpacity onPress={(e) => deleteNotif(n.id, e)} style={styles.notifTrashBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                                                    <Ionicons name="trash-outline" size={15} color="#94A3B8" />
                                                                </TouchableOpacity>
                                                                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.secondaryText} />
                                                            </View>
                                                        </View>
                                                        <Text style={[styles.notifCardBody, { opacity: isRead ? 0.7 : 1 }]}>{n.body}</Text>

                                                        {/* Tap prompt if collapsed */}
                                                        {!isExpanded && (
                                                            <Text style={styles.tapDetailsHint}>Tap for details & actions →</Text>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* ── Expanded Details ("More Info") ── */}
                                                {isExpanded && (
                                                    <View style={styles.notifDetailBox}>
                                                        <View style={styles.detailDivider} />
                                                        <View style={styles.detailRowGrid}>
                                                            <View style={styles.detailGridItem}>
                                                                <Text style={styles.detailMetaLabel}>Category</Text>
                                                                <Text style={styles.detailMetaVal}>{n.category}</Text>
                                                            </View>
                                                            {n.amount !== undefined && (
                                                                <View style={styles.detailGridItem}>
                                                                    <Text style={styles.detailMetaLabel}>Amount</Text>
                                                                    <Text style={[styles.detailMetaVal, { color: COLORS.text }]}>FRw {n.amount.toLocaleString()}</Text>
                                                                </View>
                                                            )}
                                                            {n.dueDate && (
                                                                <View style={styles.detailGridItem}>
                                                                    <Text style={styles.detailMetaLabel}>Due Date</Text>
                                                                    <Text style={styles.detailMetaVal}>{n.dueDate}</Text>
                                                                </View>
                                                            )}
                                                        </View>

                                                        {n.extraNote && (
                                                            <Text style={styles.notifExtraNote}>{n.extraNote}</Text>
                                                        )}

                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                            {n.actionLabel && (
                                                                <TouchableOpacity
                                                                    style={[styles.notifCardActionBtn, { backgroundColor: color, flex: 1 }]}
                                                                    onPress={() => handleActionClick(n.actionRoute)}
                                                                >
                                                                    <Text style={styles.notifCardActionText}>{n.actionLabel}</Text>
                                                                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                                                                </TouchableOpacity>
                                                            )}
                                                            <TouchableOpacity
                                                                style={styles.notifExpandedDeleteBtn}
                                                                onPress={(e) => deleteNotif(n.id, e)}
                                                            >
                                                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                                                <Text style={styles.notifExpandedDeleteText}>Delete</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </ScrollView>

                        {/* ── Footer ── */}
                        <View style={styles.notifFooter}>
                            <TouchableOpacity style={styles.notifDismissBtn} onPress={() => setShowNotifModal(false)}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                <Text style={styles.notifDismissText}>Close Center</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Currency Selector Modal */}
            <CurrencySelectorModal
                visible={showCurrencyModal}
                onClose={() => setShowCurrencyModal(false)}
            />

            {/* Quick Add Modal */}
            <QuickAddModal
                visible={showQuickAddModal}
                initialType={quickAddType}
                onClose={() => setShowQuickAddModal(false)}
                onSave={handleSaveTransaction}
            />

            {/* Scan Receipt Modal */}
            <ScanReceiptModal
                visible={showScanModal}
                onClose={() => setShowScanModal(false)}
            />

            {/* Edit Quick Actions Modal */}
            <Modal visible={showEditActionsModal} animationType="fade" transparent onRequestClose={() => setShowEditActionsModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.editCard}>
                        <Text style={styles.editTitle}>Customize Quick Actions</Text>
                        <Text style={styles.editSub}>Drag or select shortcuts for your home screen</Text>
                        <View style={styles.editList}>
                            {QUICK_ACTIONS.map(act => (
                                <View key={act.id} style={styles.editItem}>
                                    <Ionicons name={act.icon} size={18} color={act.color} />
                                    <Text style={styles.editItemText}>{act.label}</Text>
                                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.editDoneBtn} onPress={() => setShowEditActionsModal(false)}>
                            <Text style={styles.editDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Floating AI Assistant Widget (Bottom Right) ── */}
            {isAiFabMinimized ? (
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.aiFabMiniContainer}
                    onPress={() => setIsAiFabMinimized(false)}
                >
                    <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                </TouchableOpacity>
            ) : (
                <View style={styles.aiFabContainer}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.aiFabMain}
                        onPress={() => router.push('/assistant')}
                    >
                        <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                        <Text style={styles.aiFabText}>Ask AI</Text>
                    </TouchableOpacity>

                    <View style={styles.aiFabDivider} />

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.aiFabCloseBtn}
                        onPress={() => setIsAiFabMinimized(true)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <Ionicons name="close" size={12} color="rgba(255,255,255,0.85)" />
                    </TouchableOpacity>
                </View>
            )}
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FB' },
    scroll: { paddingBottom: 20 },
    aiFabMiniContainer: {
        position: 'absolute',
        bottom: 85,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        zIndex: 999,
    },
    aiFabContainer: {
        position: 'absolute',
        bottom: 85,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B5CF6',
        borderRadius: 14,
        paddingLeft: 8,
        paddingRight: 4,
        paddingVertical: 4,
        elevation: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        zIndex: 999,
    },
    aiFabMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingRight: 2,
    },
    aiFabText: {
        fontFamily: FONTS.bold,
        fontSize: 11,
        color: '#FFFFFF',
        letterSpacing: 0.1,
    },
    aiFabDivider: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginHorizontal: 3,
    },
    aiFabCloseBtn: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0,0,0,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: `${COLORS.primary}30` },
    greeting: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    name: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    currencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F4F7FB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#EEF1F7' },
    currencyFlag: { fontSize: 14 },
    currencyText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.text },
    notifBtn: { position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF1F7' },
    notifDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.expense, borderWidth: 1.5, borderColor: '#FFFFFF' },

    /* ─── Premium Balance Card ─── */
    balanceCard: { marginHorizontal: SIZES.lg, borderRadius: 28, backgroundColor: '#1A56DB', padding: SIZES.xl, paddingBottom: 16, marginBottom: SIZES.md, overflow: 'hidden', shadowColor: '#1A56DB', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 14 },
    orbTopRight: { position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
    orbBottomLeft: { position: 'absolute', bottom: -60, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)' },
    balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#86efac' },
    balanceLabel: { color: 'rgba(255,255,255,0.72)', fontFamily: FONTS.medium, fontSize: 12, letterSpacing: 0.4 },
    eyeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    balanceAmount: { color: '#FFFFFF', fontFamily: FONTS.mono, fontSize: 40, letterSpacing: -1, marginBottom: 10 },
    balanceChangeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 14, gap: 4 },
    balanceChange: { color: 'rgba(255,255,255,0.95)', fontFamily: FONTS.medium, fontSize: 12 },
    cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 14 },
    cardStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 0, marginBottom: 14 },
    cardStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 12 },
    cardStatIconIn: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(134,239,172,0.18)', alignItems: 'center', justifyContent: 'center' },
    cardStatIconOut: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(252,165,165,0.18)', alignItems: 'center', justifyContent: 'center' },
    cardStatLabel: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
    cardStatVal: { fontFamily: FONTS.monoMedium, fontSize: 14, color: '#FFFFFF' },
    sparkline: { flexDirection: 'row', alignItems: 'flex-end', height: 38, gap: 3 },
    sparkBar: { flex: 1, borderRadius: 3, minHeight: 4 },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', marginHorizontal: SIZES.lg, padding: SIZES.lg, borderRadius: 20, marginBottom: SIZES.lg, borderWidth: 1, borderColor: '#EEF1F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    summaryItem: { alignItems: 'center', flex: 1, gap: 5 },
    summaryIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    summaryDivider: { width: 1, backgroundColor: '#EEF1F7' },
    summaryLabel: { fontFamily: FONTS.medium, color: COLORS.secondaryText, fontSize: 11 },
    summaryValue: { fontFamily: FONTS.monoMedium, fontSize: 12, color: COLORS.text },


    section: { marginHorizontal: SIZES.lg, marginBottom: SIZES.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
    sectionAction: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },

    quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    quickActionBtn: { alignItems: 'center', gap: 6, flex: 1 },
    quickActionIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    quickActionText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.text, textAlign: 'center' },

    aiCard: { backgroundColor: '#E6F4EA', borderRadius: 20, padding: SIZES.lg, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' },

    aiHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    aiIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    aiTitle: { fontFamily: FONTS.bold, fontSize: 15, color: '#166534' },
    aiBadge: { backgroundColor: '#166534', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    aiBadgeText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 10 },
    aiBody: { fontFamily: FONTS.regular, fontSize: 13, color: '#14532D', lineHeight: 18, marginBottom: 10 },
    aiLinkRow: { alignSelf: 'flex-start' },
    aiLink: { fontFamily: FONTS.bold, fontSize: 12, color: '#166534' },

    txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EEF1F7', gap: 12 },
    txIconBg: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    txDetails: { flex: 1 },
    txTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    txSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    txAmountContainer: { alignItems: 'flex-end' },
    txAmount: { fontFamily: FONTS.mono, fontSize: 14 },
    txDate: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText, marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', padding: SIZES.lg },
    scanCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: SIZES.lg, gap: 16 },
    scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scanTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    scanBody: { gap: 14, alignItems: 'center' },
    cameraBox: { width: '100%', height: 200, borderRadius: 18, backgroundColor: '#F5F3FF', borderWidth: 2, borderColor: '#DDD6FE', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
    scanPrompt: { fontFamily: FONTS.bold, fontSize: 15, color: '#5B21B6' },
    scanSub: { fontFamily: FONTS.regular, fontSize: 12, color: '#7C3AED' },
    scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
    scanBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 14 },

    editCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: SIZES.xl, gap: 12 },
    editTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    editSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    editList: { gap: 8, marginVertical: 8 },
    editItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#F4F7FB' },
    editItemText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
    editDoneBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
    editDoneText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 14 },

    // ── Legacy notif (keep for compatibility) ──
    notifItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
    notifItemIcon: { fontSize: 18, marginTop: 1 },
    notifItemTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: 2 },
    notifItemBody: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, lineHeight: 17 },

    // ── Premium Centered Floating Dialog Notification Styles ──
    notifOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    notifBackdropClick: { ...StyleSheet.absoluteFill },
    notifSheet: { backgroundColor: '#FFFFFF', borderRadius: 28, overflow: 'hidden', width: '100%', maxWidth: 440, maxHeight: '82%', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 32 },
    notifHeader: { backgroundColor: '#1A56DB', paddingHorizontal: 20, paddingVertical: 18 },
    notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    notifHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    notifHeaderIconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    notifHeaderTitle: { fontFamily: FONTS.bold, fontSize: 17, color: '#FFFFFF' },
    notifHeaderSub: { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
    markAllBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    markAllText: { fontFamily: FONTS.semiBold, fontSize: 11, color: '#FFFFFF' },
    clearAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    clearAllText: { fontFamily: FONTS.semiBold, fontSize: 11, color: '#FFFFFF' },
    notifBadgeCount: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    notifBadgeCountText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' },
    notifCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    notifBody: { paddingHorizontal: 18, paddingTop: 16, maxHeight: 420 },
    notifEmptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    notifEmptyIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(22,163,74,0.1)', alignItems: 'center', justifyContent: 'center' },
    notifEmptyTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
    notifEmptySub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },
    notifCard: { padding: 14, borderRadius: 18 },
    notifCardIconRing: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },
    notifCardTitle: { fontFamily: FONTS.semiBold, fontSize: 13 },
    notifSeverityPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    notifSeverityText: { fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
    notifTrashBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
    notifCardBody: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, lineHeight: 17, marginTop: 2 },
    tapDetailsHint: { fontFamily: FONTS.semiBold, fontSize: 11, color: '#4285F4', marginTop: 6 },
    notifDetailBox: { marginTop: 10, paddingTop: 10 },
    detailDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 10 },
    detailRowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    detailGridItem: { minWidth: 90 },
    detailMetaLabel: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.secondaryText, textTransform: 'uppercase' },
    detailMetaVal: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.text, marginTop: 2 },
    notifExtraNote: { fontFamily: FONTS.regular, fontSize: 11, color: '#475569', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.7)', padding: 8, borderRadius: 8, marginTop: 4, marginBottom: 10 },
    notifCardActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
    notifCardActionText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' },
    notifExpandedDeleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    notifExpandedDeleteText: { fontFamily: FONTS.bold, fontSize: 12, color: '#EF4444' },
    notifFooter: { paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EEF1F7' },
    notifDismissBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14 },
    notifDismissText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },
});
