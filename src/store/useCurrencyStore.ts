import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CurrencyCode = 'RWF' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
    code: CurrencyCode;
    name: string;
    symbol: string;
    flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    RWF: { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', flag: '🇷🇼' },
    USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
};

interface CurrencyState {
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>; // How much 1 unit of Currency is worth in RWF. e.g., USD: 1380
    isFetchingRates: boolean;
    lastUpdated: string | null;

    setCurrency: (code: CurrencyCode) => void;
    fetchLiveRates: () => Promise<void>;
    formatAmount: (amountInRwf: number, forceCurrency?: CurrencyCode) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set, get) => ({
            currency: 'RWF',
            exchangeRates: { RWF: 1, USD: 1350, EUR: 1470, GBP: 1720 }, // Default fallbacks
            isFetchingRates: false,
            lastUpdated: null,

            setCurrency: (code: CurrencyCode) => set({ currency: code }),

            fetchLiveRates: async () => {
                set({ isFetchingRates: true });
                try {
                    // Using free exchange rate API (Base RWF)
                    const response = await fetch('https://open.er-api.com/v6/latest/RWF');
                    const data = await response.json();

                    if (data && data.rates) {
                        const ratesInRwf = {
                            RWF: 1,
                            USD: 1 / data.rates.USD,
                            EUR: 1 / data.rates.EUR,
                            GBP: 1 / data.rates.GBP,
                        };
                        set({ exchangeRates: ratesInRwf, lastUpdated: new Date().toISOString() });
                    }
                } catch (error) {
                    console.warn('[CurrencyStore] Failed to fetch live rates, using cached values.', error);
                } finally {
                    set({ isFetchingRates: false });
                }
            },

            formatAmount: (amountInRwf: number, forceCurrency?: CurrencyCode) => {
                const targetCurrency = forceCurrency || get().currency;
                const config = CURRENCIES[targetCurrency];
                const rate = get().exchangeRates[targetCurrency] || 1;

                if (targetCurrency === 'RWF') {
                    const rounded = Math.round(amountInRwf);
                    return `${config.symbol} ${rounded.toLocaleString('en-US')}`;
                } else {
                    const converted = amountInRwf / rate;
                    return `${config.symbol}${converted.toLocaleString('en-US', {
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
