import { Tabs } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { CustomTabBar } from '../../src/presentation/navigation/CustomTabBar';

export default function TabLayout() {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
                style={styles.background}
                imageStyle={{ opacity: 0.12 }}
                resizeMode="cover"
            >
                <Tabs
                    tabBar={(props) => <CustomTabBar {...(props as any)} />}
                    screenOptions={{
                        headerShown: false,
                        sceneStyle: { backgroundColor: 'transparent' },
                        // @ts-expect-error valid bottom tabs option but missing in expo-router types
                        unmountOnBlur: true,
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
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Clean base for the opacity
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    }
});
