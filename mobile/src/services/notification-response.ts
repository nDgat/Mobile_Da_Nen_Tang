import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });

export function subscribeToNotificationResponses(onUrl: (url: string) => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const url = response.notification.request.content.data.url;
    if (typeof url === "string") onUrl(url);
  });
  return () => subscription.remove();
}
