import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

export default function AppEntry() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Redirect href="/auth/login" />;
    }

    return <Redirect href="/(tabs)" />;
}

