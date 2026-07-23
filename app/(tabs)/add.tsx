import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

import { AddBillModal } from '../../src/presentation/components/AddBillModal';
import { CreateGoalModal } from '../../src/presentation/components/CreateGoalModal';
import { QuickAddModal } from '../../src/presentation/components/QuickAddModal';
import { SetBudgetModal } from '../../src/presentation/components/SetBudgetModal';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Action {
    id: string;
    label: string;
    icon: IoniconsName;
    color: string;
    desc: string;
    type?: 'income' | 'expense' | 'transfer';
}

const ACTIONS: Action[] = [
    { id: 'expense', label: 'Add Expense', icon: 'arrow-up-circle', color: COLORS.expense, desc: 'Log spending', type: 'expense' },
    { id: 'income', label: 'Add Income', icon: 'arrow-down-circle', color: COLORS.success, desc: 'Record earnings', type: 'income' },
    { id: 'transfer', label: 'Transfer', icon: 'swap-horizontal', color: COLORS.primary, desc: 'Between wallets', type: 'transfer' },
    { id: 'bill', label: 'Add Bill', icon: 'receipt-outline', color: COLORS.warning, desc: 'Schedule payment' },
    { id: 'budget', label: 'Set Budget', icon: 'pie-chart-outline', color: '#8B5CF6', desc: 'Spending limit' },
    { id: 'goal', label: 'Create Goal', icon: 'flag-outline', color: '#EC4899', desc: 'Save for a target' },
];

export default function AddScreen() {
    const router = useRouter();

    // Modal Visibility States
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | 'transfer'>('expense');

    const [isAddBillOpen, setIsAddBillOpen] = useState(false);
    const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
    const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);

    const handleActionPress = (action: Action) => {
        if (action.type) {
            setQuickAddType(action.type);
            setIsQuickAddOpen(true);
        } else if (action.id === 'bill') {
            setIsAddBillOpen(true);
        } else if (action.id === 'budget') {
            setIsSetBudgetOpen(true);
        } else if (action.id === 'goal') {
            setIsCreateGoalOpen(true);
        }
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Quick Add</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.promptText}>What would you like to do?</Text>
                    <Text style={styles.promptSub}>Select an action to record financial activity</Text>

                    <View style={styles.grid}>
                        {ACTIONS.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.gridItem}
                                activeOpacity={0.7}
                                onPress={() => handleActionPress(action)}>
                                <View style={styles.actionCard}>
                                    <View style={[styles.iconContainer, { backgroundColor: action.color + '18' }]}>
                                        <Ionicons name={action.icon} size={26} color={action.color} />
                                    </View>
                                    <Text style={styles.actionLabel}>{action.label}</Text>
                                    <Text style={styles.actionDesc}>{action.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* 1. Quick Add Modal (Income, Expense, Transfer) */}
                <QuickAddModal
                    visible={isQuickAddOpen}
                    initialType={quickAddType}
                    onClose={() => setIsQuickAddOpen(false)}
                />

                {/* 2. Schedule Bill Modal */}
                <AddBillModal
                    visible={isAddBillOpen}
                    onClose={() => setIsAddBillOpen(false)}
                />

                {/* 3. Set Budget Limit Modal */}
                <SetBudgetModal
                    visible={isSetBudgetOpen}
                    onClose={() => setIsSetBudgetOpen(false)}
                />

                {/* 4. Create Savings Goal Modal */}
                <CreateGoalModal
                    visible={isCreateGoalOpen}
                    onClose={() => setIsCreateGoalOpen(false)}
                />
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: SIZES.lg, paddingBottom: 120 },
    promptText: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginBottom: 4, marginTop: SIZES.sm },
    promptSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, marginBottom: SIZES.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: { width: '48.5%' },
    actionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', gap: 6, minHeight: 140, justifyContent: 'center' },
    iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    actionLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    actionDesc: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
});
