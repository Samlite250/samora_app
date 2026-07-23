import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { QuickAddModal } from '../../src/presentation/components/QuickAddModal';

import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { useAppDataStore } from '../../src/store/useAppDataStore';
import { useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FILTERS = ['All', 'Income', 'Expense', 'Transfer'];

const getTxIcon = (type: string) => {
    if (type === 'income') return 'briefcase-outline';
    if (type === 'transfer') return 'swap-horizontal';
    return 'card-outline';
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function TransactionsScreen() {
    const [activeFilter, setActiveFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { formatAmount } = useCurrencyStore();
    const { transactions: allTransactions, deleteTransaction } = useAppDataStore();

    const filteredTransactions = allTransactions.filter((tx: any) => {
        const matchesFilter = activeFilter === 'All' || tx.type.toLowerCase() === activeFilter.toLowerCase();
        const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase()) ||
            (tx.notes && tx.notes.toLowerCase().includes(search.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Transactions ({allTransactions.length})</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
                        <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>


                {/* Search Bar */}
                <View style={styles.searchWrap}>
                    <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginLeft: 12 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search transactions..."
                        placeholderTextColor={COLORS.secondaryText}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filter tabs */}
                <View style={styles.filterRow}>
                    {FILTERS.map(f => (
                        <TouchableOpacity key={f} style={[styles.filterTab, activeFilter === f && styles.filterTabActive]} onPress={() => setActiveFilter(f)}>
                            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {filteredTransactions.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 30, color: COLORS.secondaryText }}>No transactions found.</Text>
                    ) : (
                        filteredTransactions.map((tx: any, idx: number) => {
                            const isExpense = tx.type === 'expense';
                            const isIncome = tx.type === 'income';
                            const color = isIncome ? COLORS.success : isExpense ? COLORS.expense : COLORS.primary;
                            const prefix = isIncome ? '+' : isExpense ? '-' : '';
                            const amountRwf = parseFloat(tx.amount) || 0;

                            return (
                                <View key={tx.id || idx} style={styles.txItem}>
                                    <View style={[styles.txIcon, { backgroundColor: color + '18' }]}>
                                        <Ionicons name={getTxIcon(tx.type)} size={20} color={color} />
                                    </View>
                                    <View style={styles.txDetails}>
                                        <Text style={styles.txTitle}>{tx.title}</Text>
                                        <Text style={styles.txSub}>{tx.wallet_name || tx.wallets?.name || 'Wallet'} • {formatDate(tx.date)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                                        <Text style={[styles.txAmount, { color }]}>
                                            {prefix}{formatAmount(Math.abs(amountRwf))}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => deleteTransaction(tx.id)}
                                            style={{ padding: 4 }}
                                        >
                                            <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                <QuickAddModal
                    visible={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                />
            </View>
        </ScreenBackground>
    );
}



const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: SIZES.lg, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EEF1F7', height: 44 },
    searchInput: { flex: 1, paddingHorizontal: 10, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
    filterRow: { flexDirection: 'row', paddingHorizontal: SIZES.lg, marginBottom: SIZES.md, gap: 8 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF1F7' },
    filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.secondaryText },
    filterTextActive: { color: '#FFFFFF' },
    scroll: { paddingHorizontal: SIZES.lg, paddingBottom: 120 },
    groupLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.secondaryText, marginBottom: 8, marginTop: 8 },
    txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: SIZES.md, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EEF1F7' },
    txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txDetails: { flex: 1 },
    txTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    txSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    txAmount: { fontFamily: FONTS.mono, fontSize: 14 },
    viewAllBtn: { paddingVertical: 14, alignItems: 'center' },
    viewAllText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
});
