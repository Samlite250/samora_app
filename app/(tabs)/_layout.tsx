import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CustomTabBar } from '../../src/presentation/navigation/CustomTabBar';

export default function TabLayout() {
    return (
        <View style={styles.container}>
            <Tabs
                tabBar={(props) => <CustomTabBar {...(props as any)} />}
                screenOptions={{
                    headerShown: false,
                    sceneStyle: { backgroundColor: '#F4F7FB' },
                }}>
                <Tabs.Screen name="index" options={{ title: 'Home' }} />
                <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
                <Tabs.Screen name="add" options={{ title: 'Add' }} />
                <Tabs.Screen name="planner" options={{ title: 'Planner' }} />
                <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
                {/* Hidden screens accessible via navigation */}
                <Tabs.Screen name="analytics" options={{ title: 'Analytics', href: null }} />
                <Tabs.Screen name="transactions" options={{ title: 'Transactions', href: null }} />
                <Tabs.Screen name="budgets" options={{ title: 'Budgets', href: null }} />
                <Tabs.Screen name="bills" options={{ title: 'Bills', href: null }} />
                <Tabs.Screen name="goals" options={{ title: 'Goals', href: null }} />
                <Tabs.Screen name="reports" options={{ title: 'Reports', href: null }} />
                <Tabs.Screen name="financial-health" options={{ title: 'Financial Health', href: null }} />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FB',
    },
});
