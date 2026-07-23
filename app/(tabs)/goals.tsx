import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const GOALS = [
    { label: 'Buy a Laptop', current: 960, target: 1200, color: '#4285F4', icon: 'laptop-outline' as IoniconsName, due: 'Due in 3 months', pct: 80 },
    { label: 'Vacation in Dubai', current: 1330, target: 2150, color: '#FBBC04', icon: 'airplane-outline' as IoniconsName, due: 'Due in 6 months', pct: 62 },
    { label: 'Emergency Fund', current: 2360, target: 5000, color: '#34A853', icon: 'shield-checkmark-outline' as IoniconsName, due: 'Due in 12 months', pct: 47 },
    { label: 'New Car', current: 4200, target: 12000, color: '#EA4335', icon: 'car-sport-outline' as IoniconsName, due: 'Due in 2 years', pct: 35 },
];

export default function GoalsScreen() {
    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Goals</Text>
                    <TouchableOpacity style={styles.addBtn}>
                        <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {GOALS.map((g, i) => (
                        <View key={i} style={styles.goalCard}>
                            <View style={[styles.goalIconBg, { backgroundColor: g.color + '15' }]}>
                                <Ionicons name={g.icon} size={22} color={g.color} />
                            </View>
                            <View style={styles.goalBody}>
                                <View style={styles.goalTitleRow}>
                                    <Text style={styles.goalLabel}>{g.label}</Text>
                                    <Text style={[styles.goalPct, { color: g.color }]}>{g.pct}%</Text>
                                </View>
                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${g.pct}%` as any, backgroundColor: g.color }]} />
                                </View>
                                <View style={styles.goalFooter}>
                                    <Text style={styles.goalAmounts}>${g.current.toLocaleString()} / ${g.target.toLocaleString()}</Text>
                                    <Text style={styles.goalDue}>{g.due}</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All Goals →</Text>
                    </TouchableOpacity>
                </ScrollView>
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
