import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { useAppDataStore } from '../../src/store/useAppDataStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function padDate(n: number) {
    return String(n).padStart(2, '0');
}

export default function PlannerScreen() {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
    const [noteText, setNoteText] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const { plans, addPlan, deletePlan, togglePlanDone } = useAppDataStore();

    // Build calendar days for current view
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const totalDays = getDaysInMonth(viewYear, viewMonth);
        const cells: (number | null)[] = Array(firstDay).fill(null);
        for (let d = 1; d <= totalDays; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [viewYear, viewMonth]);

    // Plans indexed by date
    const plansByDate = useMemo(() => {
        const map: Record<string, typeof plans> = {};
        plans.forEach(p => {
            if (!map[p.date]) map[p.date] = [];
            map[p.date].push(p);
        });
        return map;
    }, [plans]);

    const selectedPlans = plansByDate[selectedDate] || [];

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    const handleAddPlan = async () => {
        if (!noteText.trim()) { Alert.alert('Empty Note', 'Please type something to plan.'); return; }
        await addPlan({ date: selectedDate, note: noteText.trim() });
        setNoteText('');
        setShowAddModal(false);
        Alert.alert('📅 Plan Added', `Your plan for ${selectedDate} has been saved!`);
    };

    const todayStr = today.toISOString().slice(0, 10);

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Planner</Text>
                        <Text style={styles.headerSub}>{plans.filter(p => !p.completed).length} active plans</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setShowAddModal(true)}>
                        <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    {/* Calendar Card */}
                    <View style={styles.calendarCard}>
                        {/* Month Nav */}
                        <View style={styles.monthNav}>
                            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
                            </TouchableOpacity>
                            <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
                            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Day Headers */}
                        <View style={styles.dayHeaders}>
                            {DAYS.map(d => <Text key={d} style={styles.dayHeaderText}>{d}</Text>)}
                        </View>

                        {/* Calendar Grid */}
                        <View style={styles.grid}>
                            {calendarDays.map((day, i) => {
                                if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
                                const dateStr = `${viewYear}-${padDate(viewMonth + 1)}-${padDate(day)}`;
                                const isToday = dateStr === todayStr;
                                const isSelected = dateStr === selectedDate;
                                const hasPlan = !!(plansByDate[dateStr]?.length);
                                const hasOverdue = plansByDate[dateStr]?.some(p => !p.completed && dateStr < todayStr);

                                return (
                                    <TouchableOpacity
                                        key={dateStr}
                                        style={[
                                            styles.cell,
                                            isSelected && styles.cellSelected,
                                            isToday && !isSelected && styles.cellToday,
                                        ]}
                                        onPress={() => setSelectedDate(dateStr)}>
                                        <Text style={[
                                            styles.cellText,
                                            isSelected && styles.cellTextSelected,
                                            isToday && !isSelected && { color: COLORS.primary },
                                        ]}>
                                            {day}
                                        </Text>
                                        {hasPlan && (
                                            <View style={[
                                                styles.planDot,
                                                { backgroundColor: hasOverdue ? COLORS.expense : COLORS.primary }
                                            ]} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Selected Date Plans */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {selectedDate === todayStr ? 'Today' : selectedDate}
                            </Text>
                            <TouchableOpacity style={styles.smallAddBtn} onPress={() => setShowAddModal(true)}>
                                <Ionicons name="add" size={14} color={COLORS.primary} />
                                <Text style={styles.smallAddText}>Add Plan</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedPlans.length === 0 ? (
                            <View style={styles.emptyDay}>
                                <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                                <Text style={styles.emptyDayText}>No plans for this day</Text>
                                <Text style={styles.emptyDaySub}>Tap "Add Plan" to create one</Text>
                            </View>
                        ) : (
                            selectedPlans.map(plan => {
                                const isOverdue = !plan.completed && plan.date < todayStr;
                                return (
                                    <View key={plan.id} style={[styles.planItem, plan.completed && styles.planDone, isOverdue && styles.planOverdue]}>
                                        <TouchableOpacity
                                            style={[styles.checkbox, plan.completed && styles.checkboxDone]}
                                            onPress={() => togglePlanDone(plan.id)}>
                                            {plan.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                                        </TouchableOpacity>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.planNote, plan.completed && styles.planNoteStrike]}>
                                                {plan.note}
                                            </Text>
                                            {isOverdue && <Text style={styles.overdueLabel}>⏰ Overdue</Text>}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => Alert.alert('Delete', `Remove "${plan.note}"?`, [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Delete', style: 'destructive', onPress: () => deletePlan(plan.id) }
                                            ])}>
                                            <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {/* Upcoming plans overview */}
                    {plans.filter(p => !p.completed && p.date >= todayStr).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Upcoming</Text>
                            {plans
                                .filter(p => !p.completed && p.date >= todayStr)
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .slice(0, 5)
                                .map(plan => (
                                    <View key={plan.id} style={styles.upcomingItem}>
                                        <View style={styles.upcomingDateBadge}>
                                            <Text style={styles.upcomingDateText}>{plan.date.slice(8)}</Text>
                                            <Text style={styles.upcomingMonthText}>{MONTHS[parseInt(plan.date.slice(5, 7)) - 1]}</Text>
                                        </View>
                                        <Text style={styles.upcomingNote}>{plan.note}</Text>
                                    </View>
                                ))
                            }
                        </View>
                    )}
                </ScrollView>

                {/* Add Plan Modal */}
                <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
                    <View style={styles.overlay}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Plan</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close" size={22} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalLabel}>Date</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={selectedDate}
                                onChangeText={setSelectedDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9CA3AF"
                            />

                            <Text style={styles.modalLabel}>Plan / Note</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="What do you need to do or remember?"
                                value={noteText}
                                onChangeText={setNoteText}
                                placeholderTextColor="#9CA3AF"
                            />

                            <TouchableOpacity style={styles.saveBtn} onPress={handleAddPlan}>
                                <Text style={styles.saveBtnText}>Save Plan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    headerSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    calendarCard: { margin: SIZES.lg, backgroundColor: '#FFFFFF', borderRadius: 18, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    navBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    monthLabel: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
    dayHeaders: { flexDirection: 'row', marginBottom: 8 },
    dayHeaderText: { flex: 1, textAlign: 'center', fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.secondaryText },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '14.28%' as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    cellSelected: { backgroundColor: COLORS.primary },
    cellToday: { backgroundColor: `${COLORS.primary}15` },
    cellText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
    cellTextSelected: { color: '#FFFFFF', fontFamily: FONTS.bold },
    planDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
    section: { paddingHorizontal: SIZES.lg, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
    smallAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: `${COLORS.primary}30`, backgroundColor: `${COLORS.primary}08` },
    smallAddText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.primary },
    emptyDay: { alignItems: 'center', paddingVertical: 24, gap: 6 },
    emptyDayText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    emptyDaySub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    planItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F7', marginBottom: 8, gap: 10 },
    planDone: { opacity: 0.6 },
    planOverdue: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    planNote: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, flex: 1 },
    planNoteStrike: { textDecorationLine: 'line-through', color: COLORS.secondaryText },
    overdueLabel: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.expense, marginTop: 4 },
    upcomingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEF1F7', marginBottom: 8, gap: 12 },
    upcomingDateBadge: { width: 42, height: 42, borderRadius: 10, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    upcomingDateText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.primary },
    upcomingMonthText: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.secondaryText },
    upcomingNote: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text, flex: 1 },
    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SIZES.lg, gap: 12, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    modalLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
    modalInput: { backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F7', paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' },
});
