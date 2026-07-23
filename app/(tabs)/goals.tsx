import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { CreateGoalModal } from '../../src/presentation/components/CreateGoalModal';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type Tab = 'active' | 'achieved';

export default function GoalsScreen() {
    const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('active');
    const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const { formatAmount } = useCurrencyStore();
    const { goals, depositGoal, deleteGoal } = useAppDataStore();

    const activeGoals = goals.filter(g => (g.current_amount || 0) < (g.target_amount || 1));
    const achievedGoals = goals.filter(g => (g.current_amount || 0) >= (g.target_amount || 1));
    const displayed = activeTab === 'active' ? activeGoals : achievedGoals;

    const handleDeposit = async () => {
        const amt = parseFloat(depositAmount.replace(/,/g, ''));
        if (!depositGoalId || isNaN(amt) || amt <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid deposit amount.');
            return;
        }
        await depositGoal(depositGoalId, amt);
        Alert.alert('✅ Funds Added', `${formatAmount(amt)} added successfully to your goal!`);
        setDepositGoalId(null);
        setDepositAmount('');
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>My Goals</Text>
                        <Text style={styles.headerSub}>{activeGoals.length} active · {achievedGoals.length} achieved</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setIsCreateGoalOpen(true)}>
                        <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Segmented Tabs */}
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'active' && styles.tabActive]}
                        onPress={() => setActiveTab('active')}>
                        <Ionicons name="time-outline" size={14} color={activeTab === 'active' ? '#fff' : COLORS.secondaryText} />
                        <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>In Progress ({activeGoals.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'achieved' && styles.tabActive, activeTab === 'achieved' && { backgroundColor: COLORS.success }]}
                        onPress={() => setActiveTab('achieved')}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={activeTab === 'achieved' ? '#fff' : COLORS.secondaryText} />
                        <Text style={[styles.tabText, activeTab === 'achieved' && styles.tabTextActive]}>Achieved ({achievedGoals.length})</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {displayed.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name={activeTab === 'active' ? 'flag-outline' : 'trophy-outline'} size={48} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>{activeTab === 'active' ? 'No active goals' : 'No achieved goals yet'}</Text>
                            <Text style={styles.emptySubtitle}>{activeTab === 'active' ? 'Tap + to create your first savings goal.' : 'Keep saving — achievements will appear here!'}</Text>
                        </View>
                    ) : (
                        displayed.map((g: any) => {
                            const current = parseFloat(g.current_amount) || 0;
                            const target = parseFloat(g.target_amount) || 1;
                            const pct = Math.min(Math.round((current / target) * 100), 100);
                            const iconName = (g.icon || 'trophy-outline') as IoniconsName;
                            const color = g.color || COLORS.primary;
                            const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);

                            return (
                                <View key={g.id} style={styles.goalCard}>
                                    {/* Achieved Badge */}
                                    {activeTab === 'achieved' && (
                                        <View style={styles.achievedBadge}>
                                            <Ionicons name="trophy" size={11} color="#fff" />
                                            <Text style={styles.achievedText}>Achieved!</Text>
                                        </View>
                                    )}

                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                                        <View style={[styles.goalIconBg, { backgroundColor: color + '18' }]}>
                                            <Ionicons name={iconName} size={22} color={color} />
                                        </View>
                                        <View style={styles.goalBody}>
                                            <View style={styles.goalTitleRow}>
                                                <Text style={styles.goalLabel}>{g.title}</Text>
                                                <Text style={[styles.goalPct, { color }]}>{pct}%</Text>
                                            </View>
                                            {/* Progress Bar */}
                                            <View style={styles.progressBg}>
                                                <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                                            </View>
                                            <View style={styles.goalFooter}>
                                                <Text style={styles.goalAmounts}>{formatAmount(current)} / {formatAmount(target)}</Text>
                                                <Text style={[styles.goalDue, daysLeft < 0 ? { color: COLORS.expense } : {}]}>
                                                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                                                </Text>
                                            </View>
                                            <Text style={styles.goalCategory}>{g.category}</Text>

                                            {/* Action Buttons */}
                                            {activeTab === 'active' && (
                                                <View style={styles.actionRow}>
                                                    <TouchableOpacity
                                                        style={styles.fundBtn}
                                                        onPress={() => { setDepositGoalId(g.id); setDepositAmount(''); }}>
                                                        <Ionicons name="add-circle-outline" size={14} color="#fff" />
                                                        <Text style={styles.fundBtnText}>Add Funds</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.deleteBtn}
                                                        onPress={() => Alert.alert('Delete Goal', `Delete "${g.title}"?`, [
                                                            { text: 'Cancel', style: 'cancel' },
                                                            { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(g.id) }
                                                        ])}>
                                                        <Ionicons name="trash-outline" size={14} color={COLORS.expense} />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* Create Goal Modal */}
                <CreateGoalModal
                    visible={isCreateGoalOpen}
                    onClose={() => setIsCreateGoalOpen(false)}
                    onSuccess={() => Alert.alert('🎯 Goal Created', 'Your savings goal has been set. Good luck!')}
                />

                {/* Deposit Funds Modal */}
                <Modal visible={!!depositGoalId} transparent animationType="slide" onRequestClose={() => setDepositGoalId(null)}>
                    <View style={styles.overlay}>
                        <View style={styles.depositCard}>
                            <Text style={styles.depositTitle}>Add Funds to Goal</Text>
                            <Text style={styles.depositSubtitle}>Enter the amount you want to save toward this goal.</Text>
                            <TextInput
                                style={styles.depositInput}
                                placeholder="Amount (RWF)"
                                keyboardType="numeric"
                                value={depositAmount}
                                onChangeText={setDepositAmount}
                                placeholderTextColor="#9CA3AF"
                                autoFocus
                            />
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setDepositGoalId(null)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={handleDeposit}>
                                    <Text style={styles.confirmBtnText}>Deposit</Text>
                                </TouchableOpacity>
                            </View>
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
    tabRow: { flexDirection: 'row', margin: SIZES.lg, gap: 10 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7' },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.secondaryText },
    tabTextActive: { color: '#FFFFFF' },
    scroll: { paddingHorizontal: SIZES.lg, paddingBottom: 120, gap: 14 },
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
    emptySubtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, textAlign: 'center' },
    goalCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    achievedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
    achievedText: { fontFamily: FONTS.semiBold, fontSize: 11, color: '#fff' },
    goalIconBg: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    goalBody: { flex: 1, gap: 7 },
    goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalLabel: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text, flex: 1, marginRight: 8 },
    goalPct: { fontFamily: FONTS.bold, fontSize: 14 },
    progressBg: { height: 7, backgroundColor: '#EEF1F7', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 7, borderRadius: 4 },
    goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalAmounts: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    goalDue: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.primary },
    goalCategory: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    fundBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: 8, borderRadius: 10 },
    fundBtnText: { fontFamily: FONTS.semiBold, fontSize: 13, color: '#fff' },
    deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FCA5A5' },
    // Deposit Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    depositCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SIZES.lg, gap: 14, paddingBottom: 40 },
    depositTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    depositSubtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText },
    depositInput: { backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F7', paddingHorizontal: 14, paddingVertical: 14, fontFamily: FONTS.medium, fontSize: 16, color: COLORS.text },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F4F7FB', alignItems: 'center' },
    cancelBtnText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.secondaryText },
    confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
    confirmBtnText: { fontFamily: FONTS.semiBold, fontSize: 15, color: '#fff' },
});
