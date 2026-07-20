import { Redirect } from 'expo-router';

// DEMO MODE: Skip auth check — go straight to the dashboard.
// Re-enable auth routing once Supabase credentials are configured.
export default function AppEntry() {
    return <Redirect href="/(tabs)" />;
}
