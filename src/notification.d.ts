export type AssignmentCreatedNotification = {
  numAssignments: string;
  contentTitle: string;
  coachAvatarURL: string;
  coachName: string;
  curationNodeIconURL: string;
  className: string;
}

export type AssignmentDueDateNotification = {
  numAssignments: string;
  dueDate: string;
  contentTitle: string;
  curationNodeIconURL: string;
}

export type AvatarNotification = {
  name: string;
  thumbnailSrc: string;
}

export type Badge = {
  __typename: "Badge";
  badgeCategory?: number;
  description: string;
  fullDescription: string;
  relativeUrl?: string;
  icons: {
    __typename: "BadgeIcons";
    compactUrl: string;
  };
  name: string;
}

export type BadgeNotification = {
  badge: Badge;
  badgeName: string;
}

export type BasicNotification = {
  __typename: string;
  brandNew: boolean;
  class_: Array<string>;
  date: string;
  kaid: string;
  read: boolean;
  url: string;
  urlsafeKey: string;
}

export type CoachRequestAcceptedNotification = {
  isMultipleClassrooms: boolean;
  student: {
    id: string;
    email: string;
    nickname: string;
  };
  classroom: {
    cacheId: string;
    id: string;
    name: string;
    topics: {
      id: string;
      slug: string;
      iconUrl: string;
      key: string;
      translatedStandaloneTitle: string;
    }
  };
}

export type CoachRequestNotification = {
  coachIsParent: boolean;
  coach: {
    id: string;
    kaid: string;
    nickname: string;
  };
}

export type CourseMasteryGoalCreatedNotification = {
  curationNodeIconURL: string;
  curationNodeTranslatedTitle: string;
  masteryPercentage: string;
}

export type GroupedBadgeNotification = {
  badgeNotifications: {
    __typename: "BadgeNotification";
    badge: Badge;
  }[];
}

export type InfoNotification = {
  notificationType: string
}

export type ModeratorNotification = {
  text: string;
}

export type ResponseFeedbackNotification = {
  authorAvatarUrl: string;
  authorNickname: string;
  content: string;
  feedbackType: string;
  focusTranslatedTitle: string;
  sumVotesIncremented: number;
}

export type ProgramFeedbackNotification = {
  authorAvatarSrc: string;
  authorNickname: string;
  content: string;
  feedbackType: string;
  translatedScratchpadTitle: string;
}

export type Notification = AssignmentCreatedNotification & AssignmentDueDateNotification & AvatarNotification & BadgeNotification & CoachRequestAcceptedNotification & CoachRequestNotification & CourseMasteryGoalCreatedNotification & GroupedBadgeNotification & InfoNotification & ModeratorNotification & ProgramFeedbackNotification & ResponseFeedbackNotification & BasicNotification;

export type NotificationsResponse = {
  notifications: Notification[];
  pageInfo: {
    nextCursor: string;
  }
}