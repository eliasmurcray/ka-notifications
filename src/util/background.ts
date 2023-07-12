import { NotificationCountResponse, NotificationResponse } from "../@types/extension";
import { graphQLFetchJsonResponse } from "./graphql";

/**
	Creates a new heartbeat window.
*/
export async function createOffscreenHeartbeat(): Promise<void> {
  // If a document already exists do not create another
  if (await chrome.offscreen.hasDocument?.()) {
    return;
  }
  // Or else create a heartbeat document to keep service worker alive
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("heartbeat.html"),
    reasons: [chrome.offscreen.Reason.BLOBS],
    justification: "Keep service worker alive.",
  });
}

/**
 * Get the current users notifications.
 * @param kaas - optional cookie to speed up requests.
 * @returns An object with an error if invalid, otherwise a value containing the notifications and the next cursor.
 */
export async function getNotificationData(kaas?: string): Promise<NotificationResponse> {
  const response = await graphQLFetchJsonResponse("getNotificationsForUser", kaas);

  // Nonexistent cookie
  if (response.cookieError === true) {
    return {
      error: "cookie",
    };
  }

  // Error has been handled
  if (response.value === undefined) {
    return;
  }

  // No notifications
  let notificationsResponse = response.value?.data?.user?.notifications;
  if (!notificationsResponse) {
    return {
      error: "!notifications",
    };
  }

  return {
    value: {
      notifications: notificationsResponse.notifications,
      cursor: notificationsResponse.pageInfo.nextCursor,
    },
  };
}

/**
 * Get the current users notification count.
 * @param kaas - optional cookie to speed up requests.
 * @returns An object with an error if invalid, otherwise a value containing the notification count.
 */
export async function getNotificationCount(kaas?: string): Promise<NotificationCountResponse> {
  const response = await graphQLFetchJsonResponse("getFullUserProfile", kaas);

  // Error has been handled
  if (response.value === undefined) {
    return;
  }

  // User is not defined
  let userResponse = response.value?.data?.user;
  if (!userResponse) {
    return {
      error: "!user",
      value: userResponse,
    };
  }

  return {
    value: userResponse.newNotificationCount,
  };
}
