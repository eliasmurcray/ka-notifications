import { KaNotification } from "./notification";

export interface graphQLVariables {
  limit?: 100;
  topicId?: string;
  feedbackType?: "QUESTION" | "COMMENT" | "REPLY" | "ANSWER";
  currentSort?: number;
  qaExpandKey?: string;
  focusKind?: string;
  parentKey?: string;
  textContent?: string;
  after?: string;
}

export interface NotificationResponse {
  error?: string;
  value?: {
    notifications: KaNotification[];
    cursor: string;
  };
}

export interface NotificationCountResponse {
  error?: string;
  value?: number;
}
