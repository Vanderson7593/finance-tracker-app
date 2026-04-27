// Push notifications disabled — no paid account
// Uncomment when upgrading to a paid Expo/EAS plan

// import { useEffect } from 'react';
// import { Platform } from 'react-native';
// import { useSettingsStore } from '../store/use-settings-store';

// let Notifications: typeof import('expo-notifications') | null = null;
// if (Platform.OS !== 'web') {
//   try {
//     Notifications = require('expo-notifications');
//     Notifications?.setNotificationHandler({
//       handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: false,
//         shouldShowBanner: true,
//         shouldShowList: true,
//       }),
//     });
//   } catch {
//     // expo-notifications not available
//   }
// }

// export async function requestNotificationPermissions(): Promise<boolean> {
//   if (!Notifications || Platform.OS === 'web') return false;
//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;
//   if (existingStatus !== 'granted') {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }
//   return finalStatus === 'granted';
// }

// export async function scheduleDailyReminder(time: string): Promise<void> {
//   if (!Notifications || Platform.OS === 'web') return;
//   await cancelDailyReminder();
//   const [hour, minute] = time.split(':').map(Number);
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: 'Kumbu+',
//       body: 'Não te esqueças de registar as tuas finanças hoje!',
//     },
//     trigger: {
//       hour: hour ?? 20,
//       minute: minute ?? 0,
//       repeats: true,
//     },
//   });
// }

// export async function cancelDailyReminder(): Promise<void> {
//   if (!Notifications || Platform.OS === 'web') return;
//   const scheduled = await Notifications.getAllScheduledNotificationsAsync();
//   for (const notif of scheduled) {
//     if (notif.content.title === 'Kumbu+') {
//       await Notifications.cancelScheduledNotificationAsync(notif.identifier);
//     }
//   }
// }

// export async function sendBudgetAlert(categoryName: string, percentage: number): Promise<void> {
//   if (!Notifications || Platform.OS === 'web') return;
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: 'Alerta de Orçamento',
//       body: `Atenção! Usaste ${percentage.toFixed(0)}% do orçamento de ${categoryName}.`,
//     },
//     trigger: null,
//   });
// }

// export function useNotificationSetup() {
//   const { settings } = useSettingsStore();
//   useEffect(() => {
//     if (settings.dailyReminder) {
//       requestNotificationPermissions().then((granted) => {
//         if (granted) {
//           scheduleDailyReminder(settings.dailyReminderTime);
//         }
//       });
//     } else {
//       cancelDailyReminder();
//     }
//   }, [settings.dailyReminder, settings.dailyReminderTime]);
// }

export async function requestNotificationPermissions(): Promise<boolean> { return false; }
export async function scheduleDailyReminder(_time: string): Promise<void> {}
export async function cancelDailyReminder(): Promise<void> {}
export async function sendBudgetAlert(_categoryName: string, _percentage: number): Promise<void> {}
export function useNotificationSetup() {}
