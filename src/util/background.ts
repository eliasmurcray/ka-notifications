import {
  NotificationCountResponse,
  NotificationResponse,
} from "../@types/extension";
import { getUserKaasCookie, graphQLFetch } from "./graphql";

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
 *
 * @returns An object with an error if invalid, otherwise a value containing the notifications and the next cursor.
 */
export async function getNotificationData(
  kaas?: string
): Promise<NotificationResponse> {
  let cookie: string;
  if (kaas !== undefined) {
    cookie = kaas;
  } else {
    try {
      cookie = await getUserKaasCookie();
    } catch (e) {
      return {
        error: "cookie",
      };
    }
  }
  let response: Response;
  try {
    response = await graphQLFetch("getNotificationsForUser", cookie);
  } catch (e) {
    if (e.message === "Failed to fetch") {
      return {
        error: "network",
      };
    }
    return {
      error: "response",
      value: e.message,
    };
  }
  const json = await response.json();
  let notificationsResponse = json?.data?.user?.notifications;
  if (!notificationsResponse) {
    return {
      error: "no notifications",
    };
  }
  return {
    value: {
      notifications: notificationsResponse.notifications,
      cursor: notificationsResponse.pageInfo.nextCursor,
    },
  };
}

export async function getNotificationCount(
  kaas?: string
): Promise<NotificationCountResponse> {
  let cookie: string;
  if (kaas !== undefined) {
    cookie = kaas;
  } else {
    try {
      cookie = await getUserKaasCookie();
    } catch (e) {
      return {
        error: "cookie",
      };
    }
  }

  let response: Response;
  try {
    response = await graphQLFetch("getFullUserProfile", cookie);
  } catch (e) {
    if (e.message === "Failed to fetch") {
      return {
        error: "network",
      };
    }
    return {
      error: "response",
      value: e.message,
    };
  }

  const json = await response.json();

  return {
    value: json.data.user.newNotificationCount,
  };
}
