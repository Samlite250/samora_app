import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DATES = [26, 27, 28, 29, 30, 31, 1];

const EVENTS = [
    { title: 'Electricity Bill', time: '10:00 AM', color: COLORS.expense, icon: 'flash-outline' as IoniconsName, tag: 'Due in 3 days', tagColor: COLORS.expense },
    { title: 'Project Meeting', time: '02:00 PM – 03:00 PM', color: COLORS.primary, icon: 'people-outline' as IoniconsName },
    { title: 'Gym', time: '06:00 PM – 07:00 PM', color: COLORS.success, icon: 'barbell-outline' as IoniconsName },
    { title: 'Dinner with Family', time: '08:00 PM', color: '#8B5CF6', icon: 'restaurant-outline' as IoniconsName },
];

export default function PlannerScreen() {
    const [activeDay, setActiveDay] = useState(3);
    const router = useRouter();


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Planner</Text>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Month selector */}
            <TouchableOpacity style={styles.monthHeader}>
                <Text style={styles.monthText}>May 2024</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* Calendar strip */}
            <View style={styles.calendarStrip}>
                {DAYS.map((day, idx) => {
                    const isActive = idx === activeDay;
                    const isToday = idx === 4;
                    return (
                        <TouchableOpacity key={idx} style={[styles.dayColumn, isActive && styles.dayActive]} onPress={() => setActiveDay(idx)}>
                            <Text style={[styles.dayName, isActive && styles.dayTextActive]}>{day}</Text>
                            <Text style={[styles.dayNumber, isActive && styles.dayTextActive, isToday && !isActive && { color: COLORS.primary }]}>{DATES[idx]}</Text>
                            {isToday && !isActive && <View style={styles.todayDot} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.todayRow}>
                    <Text style={styles.todayLabel}>Today • May 29, 2024</Text>
                </View>

                {EVENTS.map((evt, idx) => (
                    <TouchableOpacity key={idx} style={styles.eventCard} onPress={() => router.push('/(tabs)/bills')}>
                        <View style={[styles.eventBar, { backgroundColor: evt.color }]} />
                        <View style={[styles.eventIconBg, { backgroundColor: evt.color + '18' }]}>
                            <Ionicons name={evt.icon} size={18} color={evt.color} />
                        </View>
                        <View style={styles.eventBody}>
                            <View style={styles.eventTitleRow}>
                                <Text style={styles.eventTitle}>{evt.title}</Text>
                                {evt.tag && (
                                    <View style={[styles.eventTag, { backgroundColor: (evt.tagColor ?? COLORS.primary) + '18' }]}>
                                        <Text style={[styles.eventTagText, { color: evt.tagColor }]}>{evt.tag}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.eventTimeRow}>
                                <Ionicons name="time-outline" size={12} color={COLORS.secondaryText} />
                                <Text style={styles.eventTime}> {evt.time}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.border} />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.addEventBtn} onPress={() => router.push('/(tabs)/bills')}>
                    <Ionicons name="add" size={18} color={COLORS.primary} />
                    <Text style={styles.addEventText}>Add Event</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SIZES.lg, paddingVertical: 10, backgroundColor: '#FFFFFF' },
    monthText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    calendarStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    dayColumn: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12, minWidth: 36 },
    dayActive: { backgroundColor: COLORS.primary },
    dayName: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.secondaryText, marginBottom: 4 },
    dayNumber: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
    dayTextActive: { color: '#FFFFFF' },
    todayDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary, marginTop: 2 },
    scrollContent: { padding: SIZES.lg, paddingBottom: 120, gap: 10 },
    todayRow: { marginBottom: 4 },
    todayLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
    eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#EEF1F7', paddingRight: SIZES.md, gap: 12 },
    eventBar: { width: 4, alignSelf: 'stretch', minHeight: 60 },
    eventIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
    eventBody: { flex: 1, paddingVertical: 12, gap: 4 },
    eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    eventTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    eventTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    eventTagText: { fontFamily: FONTS.medium, fontSize: 10 },
    eventTimeRow: { flexDirection: 'row', alignItems: 'center' },
    eventTime: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    addEventBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', marginTop: 8 },
    addEventText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.primary },
});
