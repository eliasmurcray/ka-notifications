import { NotificationCountResponse, NotificationResponse } from "../@types/extension";
import { graphQLFetchJsonResponse } from "./graphql";

/**
 * Creates a new offscreen heartbeat window if one doesn't already exist.
 */
export async function createOffscreenHeartbeat(): Promise<void> {
  chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("heartbeat.html"),
    reasons: ["BLOBS"],
    justification: "Keep service worker alive.",
  });
}

/**
 * Get the current users notifications.
 * @param kaas - optional cookie to speed up requests.
 * @returns An object with an error if invalid, otherwise a value containing the notifications and the next cursor.
 */
export async function getNotificationData(
  kaas: string,
  cursor?: string,
): Promise<NotificationResponse> {
  const response = await graphQLFetchJsonResponse(
    "getNotificationsForUser",
    kaas,
    cursor === undefined ? undefined : { after: cursor },
  );

  // Nonexistent cookie
  if (response?.cookieError) {
    return {
      error: "cookie",
    };
  }

  // Error has been handled
  if (!response?.value) {
    return {};
  }

  // No notifications
  const notificationsResponse = response.value?.data?.user?.notifications;
  if (!notificationsResponse) {
    return {
      error: "nonotifications",
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
export async function getNotificationCount(kaas: string): Promise<NotificationCountResponse> {
  const response = await graphQLFetchJsonResponse("getFullUserProfile", kaas);

  // Error has been handled
  if (!response?.value) {
    return {};
  }

  // User is not defined
  const userResponse = response.value?.data?.user;
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
