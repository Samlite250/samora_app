import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { useAppDataStore } from '../../src/store/useAppDataStore';

export default function FinancialHealthScreen() {
    const router = useRouter();
    const { getHealthScore, getHealthMetrics } = useAppDataStore();
    const score = getHealthScore();
    const metrics = getHealthMetrics();

    const getScoreBadge = (s: number) => {
        if (s >= 80) return { label: 'Great Shape', color: COLORS.success, bg: 'rgba(22,163,74,0.12)', icon: 'checkmark-circle' };
        if (s >= 50) return { label: 'Fair / Monitor', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'alert-circle' };
        return { label: 'Attention Needed', color: COLORS.expense, bg: 'rgba(239,68,68,0.12)', icon: 'warning' };
    };

    const badge = getScoreBadge(score);

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Financial Health</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close-circle-outline" size={24} color={COLORS.secondaryText} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Score Circle */}
                    <View style={styles.scoreCard}>
                        <View style={[styles.scoreCircle, { borderColor: badge.color }]}>
                            <View style={styles.scoreInner}>
                                <Text style={styles.scoreNum}>{score}</Text>
                                <Text style={styles.scoreDenom}>/100</Text>
                            </View>
                        </View>
                        <View style={[styles.scoreBadge, { backgroundColor: badge.bg }]}>
                            <Ionicons name={badge.icon as any} size={16} color={badge.color} />
                            <Text style={[styles.scoreBadgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                        <Text style={styles.scoreSubtitle}>
                            {score >= 80 ? "You're in great shape! Keep saving." : score >= 50 ? "Your budget is tight. Monitor expenses." : "Action needed! High bills or expenses."}
                        </Text>
                    </View>

                    {/* Metrics */}
                    <View style={styles.metricsCard}>
                        {metrics.map((m, i) => (
                            <View key={i} style={[styles.metricRow, i < metrics.length - 1 && styles.metricBorder]}>
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

                    <TouchableOpacity style={styles.detailBtn} onPress={() => router.push('/(tabs)/analytics')}>
                        <Text style={styles.detailText}>View Analytics & Export PDF →</Text>
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
