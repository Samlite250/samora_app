import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import {
    CURRENCIES,
    CurrencyCode,
    useCurrencyStore,
} from '../../store/useCurrencyStore';

interface CurrencyConverterModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
    visible,
    onClose,
}) => {
    const { currency, exchangeRates, isFetchingRates, fetchLiveRates, setCurrency } =
        useCurrencyStore();

    const [inputAmount, setInputAmount] = useState<string>('10000');
    const [sourceCurrency, setSourceCurrency] = useState<CurrencyCode>('RWF');

    const numericAmount = parseFloat(inputAmount) || 0;

    // Convert input amount to RWF first
    const amountInRwf =
        sourceCurrency === 'RWF'
            ? numericAmount
            : numericAmount * (exchangeRates[sourceCurrency] || 1);

    const currencyCodes = Object.keys(CURRENCIES) as CurrencyCode[];

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <Ionicons name="calculator-outline" size={22} color={COLORS.primary} />
                            <Text style={styles.title}>Live FX Currency Converter</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
                        {/* Input & Source Currency Picker */}
                        <View style={styles.inputCard}>
                            <Text style={styles.inputLabel}>Enter Amount to Convert</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.textInput}
                                    keyboardType="numeric"
                                    value={inputAmount}
                                    onChangeText={setInputAmount}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.secondaryText}
                                />
                                <View style={styles.sourceSelector}>
                                    {currencyCodes.map((code) => {
                                        const isSelected = sourceCurrency === code;
                                        return (
                                            <TouchableOpacity
                                                key={code}
                                                style={[
                                                    styles.sourceChip,
                                                    isSelected && styles.sourceChipActive,
                                                ]}
                                                onPress={() => setSourceCurrency(code)}
                                            >
                                                <Text style={styles.flagText}>
                                                    {CURRENCIES[code].flag}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        isSelected && styles.chipTextActive,
                                                    ]}
                                                >
                                                    {code}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        {/* Live Rates Status */}
                        <View style={styles.ratesHeaderRow}>
                            <Text style={styles.sectionTitle}>Converted Equivalent Amounts</Text>
                            <TouchableOpacity
                                style={styles.refreshBtn}
                                onPress={fetchLiveRates}
                                disabled={isFetchingRates}
                            >
                                {isFetchingRates ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="refresh" size={14} color={COLORS.primary} />
                                        <Text style={styles.refreshText}>Live Rates</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Conversions Output List */}
                        <View style={styles.conversionsList}>
                            {currencyCodes.map((code) => {
                                const conf = CURRENCIES[code];
                                const isCurrentAppCurrency = currency === code;
                                const rate = exchangeRates[code] || 1;

                                const convertedVal =
                                    code === 'RWF' ? amountInRwf : amountInRwf / rate;

                                return (
                                    <View key={code} style={styles.currencyRow}>
                                        <View style={styles.currencyMeta}>
                                            <Text style={styles.currencyFlag}>{conf.flag}</Text>
                                            <View>
                                                <Text style={styles.currencyName}>{conf.name}</Text>
                                                <Text style={styles.currencyCode}>{conf.code}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.currencyValueWrap}>
                                            <Text style={styles.convertedValue}>
                                                {conf.symbol}{' '}
                                                {convertedVal.toLocaleString('en-US', {
                                                    minimumFractionDigits: code === 'RWF' ? 0 : 2,
                                                    maximumFractionDigits: code === 'RWF' ? 0 : 2,
                                                })}
                                            </Text>

                                            <TouchableOpacity
                                                style={[
                                                    styles.setAppCurrencyBtn,
                                                    isCurrentAppCurrency && styles.activeAppCurrencyBtn,
                                                ]}
                                                onPress={() => setCurrency(code)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.setAppCurrencyText,
                                                        isCurrentAppCurrency &&
                                                        styles.activeAppCurrencyText,
                                                    ]}
                                                >
                                                    {isCurrentAppCurrency ? 'Active' : 'Set Default'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.lg,
        paddingTop: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF1F7',
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { padding: SIZES.lg, gap: 16 },

    inputCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: SIZES.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
    },
    inputLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    inputRow: { gap: 12 },
    textInput: {
        fontFamily: FONTS.mono,
        fontSize: 24,
        color: COLORS.text,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    sourceSelector: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    sourceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sourceChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    flagText: { fontSize: 14 },
    chipText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.text },
    chipTextActive: { color: '#FFFFFF' },

    ratesHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
    refreshText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.primary },

    conversionsList: { gap: 10 },
    currencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEF1F7',
    },
    currencyMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    currencyFlag: { fontSize: 24 },
    currencyName: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
    currencyCode: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
    currencyValueWrap: { alignItems: 'flex-end', gap: 4 },
    convertedValue: { fontFamily: FONTS.mono, fontSize: 15, color: COLORS.text, fontWeight: '700' },
    setAppCurrencyBtn: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    activeAppCurrencyBtn: { backgroundColor: `${COLORS.success}15` },
    setAppCurrencyText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.secondaryText },
    activeAppCurrencyText: { fontFamily: FONTS.bold, color: COLORS.success },
});
