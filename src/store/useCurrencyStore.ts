import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CurrencyCode = 'RWF' | 'USD';

export interface CurrencyConfig {
    code: CurrencyCode;
    name: string;
    symbol: string;
    rateToRwf: number; // 1 USD = 1380 RWF, 1 RWF = 1 RWF
    flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    RWF: {
        code: 'RWF',
        name: 'Rwandan Franc',
        symbol: 'FRw',
        rateToRwf: 1,
        flag: '🇷🇼',
    },
    USD: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        rateToRwf: 1380,
        flag: '🇺🇸',
    },
};

interface CurrencyState {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    formatAmount: (amountInRwf: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set, get) => ({
            currency: 'RWF',
            setCurrency: (code: CurrencyCode) => set({ currency: code }),
            formatAmount: (amountInRwf: number) => {
                const currentCode = get().currency;
                const config = CURRENCIES[currentCode];
                if (currentCode === 'RWF') {
                    const rounded = Math.round(amountInRwf);
                    return `${config.symbol} ${rounded.toLocaleString('en-US')}`;
                } else {
                    const inUsd = amountInRwf / config.rateToRwf;
                    return `${config.symbol}${inUsd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`;
                }
            },
        }),
        {
            name: 'samora_currency_store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
