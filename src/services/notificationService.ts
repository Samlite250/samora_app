import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure default notification handler behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const scheduleBillNotification = async (
    billTitle: string,
    amountFormatted: string,
    dueDate: string
) => {
    try {
        if (Platform.OS === 'web') {
            console.log(`[Notification Web Mock] Bill Reminder Set for ${billTitle}: ${amountFormatted} due on ${dueDate}`);
            alert(`Reminder scheduled for ${billTitle} (${amountFormatted}) on ${dueDate}!`);
            return;
        }

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            alert('Notification permissions are needed to set bill payment reminders.');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📅 Upcoming Bill Payment Reminder',
                body: `Your bill "${billTitle}" for ${amountFormatted} is due on ${dueDate}.`,
                data: { billTitle, dueDate },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 5, // Trigger sample reminder 5 seconds after setting
            },
        });

        alert(`Notification set! You will be reminded for ${billTitle}.`);
    } catch (error) {
        console.warn('[Notification Error]:', error);
    }
};

