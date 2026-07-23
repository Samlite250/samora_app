import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { AddBillModal } from '../../src/presentation/components/AddBillModal';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PlannerScreen() {
    const router = useRouter();
    const { formatAmount } = useCurrencyStore();
    const { bills, markBillPaid, deleteBill } = useAppDataStore();
    const [isAddBillOpen, setIsAddBillOpen] = useState(false);


    // Dynamic Calendar State (Default to July 2026 as per app context, or real date)
    const [currentYear, setCurrentYear] = useState(2026);
    const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed: 6 = July
    const [selectedDate, setSelectedDate] = useState<number | null>(23); // Default July 23
    const [calendarMode, setCalendarMode] = useState<'grid' | 'strip'>('grid');

    // Calendar Math: Generate grid cells for selected month
    const calendarCells = useMemo(() => {
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

        const cells = [];

        // Previous month padding
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            cells.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                fullDateStr: null,
            });
        }

        // Current month days
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const monthStr = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

            cells.push({
                day,
                isCurrentMonth: true,
                fullDateStr: dateStr,
            });
        }

        // Next month padding to fill grid
        const remainingCells = 35 - cells.length;
        if (remainingCells > 0) {
            for (let day = 1; day <= remainingCells; day++) {
                cells.push({
                    day,
                    isCurrentMonth: false,
                    fullDateStr: null,
                });
            }
        }

        return cells;
    }, [currentYear, currentMonth]);

    // Map bills to dates for indicator dots
    const billsByDateMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        bills.forEach((bill: any) => {
            const dateKey = bill.due_date; // format YYYY-MM-DD
            if (dateKey) {
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(bill);
            }
        });
        return map;
    }, [bills]);

    // Navigate Months
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
        setSelectedDate(null);
    };

    // Filter bills based on selected date or show all for month
    const selectedDateStr = selectedDate
        ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
        : null;

    const displayedBills = useMemo(() => {
        if (selectedDateStr) {
            const directMatches = bills.filter((b: any) => b.due_date === selectedDateStr);
            if (directMatches.length > 0) return directMatches;
        }
        return bills;
    }, [bills, selectedDateStr]);

    const getDaysDiff = (dateStr: string) => {
        if (!dateStr) return 0;
        const diffTime = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Planner</Text>
                        <Text style={styles.headerSubtitle}>{bills.length} total scheduled items</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.modeToggleBtn}
                            onPress={() => setCalendarMode(m => m === 'grid' ? 'strip' : 'grid')}
                        >
                            <Ionicons
                                name={calendarMode === 'grid' ? 'list-outline' : 'grid-outline'}
                                size={18}
                                color={COLORS.primary}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/bills')}>
                            <Ionicons name="add" size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ─── Real Calendar Card ─── */}
                    <View style={styles.calendarCard}>

                        {/* Month Navigation Header */}
                        <View style={styles.monthNavRow}>
                            <TouchableOpacity style={styles.navArrow} onPress={handlePrevMonth}>
                                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
                            </TouchableOpacity>

                            <View style={styles.monthYearTitleRow}>
                                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                                <Text style={styles.monthYearText}>
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.navArrow} onPress={handleNextMonth}>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Weekday Labels Header */}
                        <View style={styles.weekdaysRow}>
                            {WEEKDAYS.map((day, idx) => (
                                <Text key={idx} style={[styles.weekdayLabel, (idx === 0 || idx === 6) && styles.weekendLabel]}>
                                    {day}
                                </Text>
                            ))}
                        </View>

                        {/* Calendar Grid View */}
                        {calendarMode === 'grid' ? (
                            <View style={styles.gridContainer}>
                                {calendarCells.map((cell, idx) => {
                                    const isSelected = cell.isCurrentMonth && selectedDate === cell.day;
                                    const isToday = cell.isCurrentMonth && currentYear === 2026 && currentMonth === 6 && cell.day === 23;
                                    const dayBills = cell.fullDateStr ? billsByDateMap[cell.fullDateStr] || [] : [];
                                    const hasBills = dayBills.length > 0;
                                    const hasUnpaid = dayBills.some(b => !b.is_paid);

                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            disabled={!cell.isCurrentMonth}
                                            style={[
                                                styles.gridCell,
                                                isSelected && styles.cellSelected,
                                                isToday && !isSelected && styles.cellToday,
                                            ]}
                                            onPress={() => setSelectedDate(cell.day)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    !cell.isCurrentMonth && styles.dayTextMuted,
                                                    isSelected && styles.dayTextSelected,
                                                    isToday && !isSelected && styles.dayTextToday,
                                                ]}
                                            >
                                                {cell.day}
                                            </Text>

                                            {/* Event indicator dot */}
                                            {hasBills && (
                                                <View
                                                    style={[
                                                        styles.indicatorDot,
                                                        hasUnpaid ? styles.dotUnpaid : styles.dotPaid,
                                                        isSelected && styles.dotSelected,
                                                    ]}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            /* Compact Week Strip View */
                            <View style={styles.stripContainer}>
                                {calendarCells.filter(c => c.isCurrentMonth).slice(0, 7).map((cell, idx) => {
                                    const isSelected = selectedDate === cell.day;
                                    const dayBills = cell.fullDateStr ? billsByDateMap[cell.fullDateStr] || [] : [];
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[styles.stripCell, isSelected && styles.cellSelected]}
                                            onPress={() => setSelectedDate(cell.day)}
                                        >
                                            <Text style={[styles.stripDayName, isSelected && styles.dayTextSelected]}>
                                                {WEEKDAYS[idx % 7]}
                                            </Text>
                                            <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                                                {cell.day}
                                            </Text>
                                            {dayBills.length > 0 && (
                                                <View style={[styles.indicatorDot, styles.dotUnpaid, isSelected && styles.dotSelected]} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* Filter Status Reset */}
                        {selectedDate && (
                            <View style={styles.filterResetRow}>
                                <Text style={styles.filterResetText}>
                                    Showing bills for {MONTH_NAMES[currentMonth]} {selectedDate}, {currentYear}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearFilterBtn}>
                                    <Text style={styles.clearFilterText}>Show All</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* ─── Upcoming Events & Bills List ─── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {selectedDate ? `Bills Due on ${MONTH_NAMES[currentMonth]} ${selectedDate}` : 'All Scheduled Bills & Events'}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/bills')}>
                            <Text style={styles.seeAllText}>Manage Bills</Text>
                        </TouchableOpacity>
                    </View>

                    {displayedBills.length === 0 ? (

                        <View style={styles.emptyCard}>
                            <Ionicons name="checkmark-circle-outline" size={36} color={COLORS.success} />
                            <Text style={styles.emptyTitle}>No bills due for this date</Text>
                            <Text style={styles.emptySub}>You are all caught up for {MONTH_NAMES[currentMonth]} {selectedDate}!</Text>
                        </View>
                    ) : (
                        displayedBills.map((evt: any, idx: number) => {
                            const daysDiff = getDaysDiff(evt.due_date);
                            const isPast = daysDiff < 0 && !evt.is_paid;
                            const color = evt.is_paid ? COLORS.success : isPast ? COLORS.expense : COLORS.warning;
                            const tagText = evt.is_paid ? 'Paid' : isPast ? 'Overdue' : daysDiff === 0 ? 'Due Today' : `Due in ${daysDiff} days`;
                            const amountRwf = parseFloat(evt.amount) || 0;

                            return (
                                <View key={evt.id || idx} style={styles.eventCard}>
                                    <View style={[styles.eventBar, { backgroundColor: color }]} />
                                    <View style={[styles.eventIconBg, { backgroundColor: color + '15' }]}>
                                        <Ionicons name={evt.is_paid ? 'checkmark-circle' : 'flash-outline'} size={18} color={color} />
                                    </View>
                                    <View style={styles.eventBody}>
                                        <View style={styles.eventTitleRow}>
                                            <Text style={styles.eventTitle}>{evt.title}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <View style={[styles.eventTag, { backgroundColor: color + '15' }]}>
                                                    <Text style={[styles.eventTagText, { color }]}>{tagText}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => deleteBill(evt.id)} style={{ padding: 4 }}>
                                                    <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={styles.eventTimeRow}>
                                            <Ionicons name="time-outline" size={12} color={COLORS.secondaryText} />
                                            <Text style={styles.eventTime}> Due: {evt.due_date} • {formatAmount(amountRwf)}</Text>
                                        </View>
                                        {!evt.is_paid && (
                                            <TouchableOpacity
                                                style={styles.payBtn}
                                                onPress={() => markBillPaid(evt.id)}>
                                                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                                                <Text style={styles.payBtnText}>Mark as Paid</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}

                    <TouchableOpacity style={styles.addEventBtn} onPress={() => setIsAddBillOpen(true)}>
                        <Ionicons name="add" size={18} color={COLORS.primary} />
                        <Text style={styles.addEventText}>Add New Scheduled Bill</Text>
                    </TouchableOpacity>

                </ScrollView>

                <AddBillModal visible={isAddBillOpen} onClose={() => setIsAddBillOpen(false)} />

            </View>
        </ScreenBackground>
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
        borderBottomColor: '#EEF1F7'
    },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
    headerSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modeToggleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: SIZES.lg, paddingBottom: 130, gap: 14 },

    // Calendar Card
    calendarCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: SIZES.md,
        borderWidth: 1,
        borderColor: '#EEF1F7',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    monthNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingHorizontal: 4,
    },
    monthYearTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    monthYearText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.text,
    },
    navArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F4F7FB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F7FB',
        paddingBottom: 8,
    },
    weekdayLabel: {
        width: 40,
        textAlign: 'center',
        fontFamily: FONTS.semiBold,
        fontSize: 12,
        color: COLORS.secondaryText,
    },
    weekendLabel: {
        color: COLORS.primary,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    gridCell: {
        width: '14.28%',
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginVertical: 2,
        position: 'relative',
    },
    stripContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stripCell: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    stripDayName: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: COLORS.secondaryText,
        marginBottom: 4,
    },
    cellSelected: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cellToday: {
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    dayText: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
        color: COLORS.text,
    },
    dayTextMuted: {
        color: '#D1D5DB',
        fontFamily: FONTS.regular,
    },
    dayTextToday: {
        color: COLORS.primary,
        fontFamily: FONTS.bold,
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontFamily: FONTS.bold,
    },
    indicatorDot: {
        position: 'absolute',
        bottom: 4,
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    dotUnpaid: {
        backgroundColor: COLORS.expense,
    },
    dotPaid: {
        backgroundColor: COLORS.success,
    },
    dotSelected: {
        backgroundColor: '#FFFFFF',
    },
    filterResetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F4F7FB',
    },
    filterResetText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.secondaryText,
        flex: 1,
    },
    clearFilterBtn: {
        backgroundColor: `${COLORS.primary}12`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    clearFilterText: {
        fontFamily: FONTS.bold,
        fontSize: 11,
        color: COLORS.primary,
    },

    // Events section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
    seeAllText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: SIZES.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EEF1F7',
        gap: 6,
    },
    emptyTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
    emptySub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, textAlign: 'center' },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEF1F7',
        paddingRight: SIZES.md,
        gap: 12,
    },
    eventBar: { width: 4.5, alignSelf: 'stretch', minHeight: 64 },
    eventIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
    eventBody: { flex: 1, paddingVertical: 12, gap: 4 },
    eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    eventTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    eventTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    eventTagText: { fontFamily: FONTS.semiBold, fontSize: 10 },
    eventTimeRow: { flexDirection: 'row', alignItems: 'center' },
    eventTime: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    addEventBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        marginTop: 6,
    },
    addEventText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.primary },
    payBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 6 },
    payBtnText: { fontFamily: FONTS.semiBold, fontSize: 12, color: '#FFFFFF' },
});
