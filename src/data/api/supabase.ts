import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Create a .env file in the project root and add your Supabase credentials:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[Samora] Supabase credentials missing. ' +
        'Create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Authentication features will be disabled until credentials are set.'
    );
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })
    : null;
