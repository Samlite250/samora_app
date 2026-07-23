import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import { CURRENCIES, CurrencyCode, useCurrencyStore } from '../../store/useCurrencyStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const CurrencySelectorModal: React.FC<Props> = ({ visible, onClose }) => {
    const { currency, setCurrency } = useCurrencyStore();

    const handleSelect = (code: CurrencyCode) => {
        setCurrency(code);
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Ionicons name="globe-outline" size={22} color={COLORS.primary} />
                            <Text style={styles.title}>Select Currency</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={COLORS.secondaryText} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Choose your preferred display currency across Samora.</Text>

                    {/* Currency Options */}
                    <View style={styles.optionsList}>
                        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                            const item = CURRENCIES[code];
                            const isSelected = currency === code;

                            return (
                                <TouchableOpacity
                                    key={code}
                                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                    onPress={() => handleSelect(code)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.optionLeft}>
                                        <Text style={styles.flag}>{item.flag}</Text>
                                        <View>
                                            <View style={styles.nameRow}>
                                                <Text style={styles.currencyCode}>{item.code}</Text>
                                                {code === 'RWF' && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
                                            </View>
                                            <Text style={styles.currencyName}>{item.name} ({item.symbol})</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: SIZES.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F4F7FB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.secondaryText,
        marginBottom: SIZES.lg,
    },
    optionsList: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: SIZES.md,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
    },
    optionCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    flag: {
        fontSize: 28,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    currencyCode: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.text,
    },
    defaultBadge: {
        backgroundColor: `${COLORS.primary}15`,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    defaultBadgeText: {
        fontFamily: FONTS.semiBold,
        fontSize: 10,
        color: COLORS.primary,
    },
    currencyName: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.secondaryText,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
});
