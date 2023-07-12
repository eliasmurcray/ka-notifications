export interface AssignmentCreatedNotification {
  numAssignments: string;
  contentTitle: string;
  coachAvatarURL: string;
  coachName: string;
  curationNodeIconURL: string;
  className: string;
}

export interface AssignmentDueDateNotification {
  numAssignments: string;
  dueDate: string;
  contentTitle: string;
  curationNodeIconURL: string;
}

export interface AvatarNotification {
  name: string;
  thumbnailSrc: string;
}

export interface Badge {
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

export interface BadgeNotification {
  badge: Badge;
  badgeName: string;
}

export interface BasicNotification {
  __typename: string;
  brandNew: boolean;
  class_: Array<string>;
  date: string;
  kaid: string;
  read: boolean;
  url: string;
  urlsafeKey: string;
}

export interface CoachRequestAcceptedNotification {
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
    };
  };
}

export interface CoachRequestNotification {
  coachIsParent: boolean;
  coach: {
    id: string;
    kaid: string;
    nickname: string;
  };
}

export interface CourseMasteryGoalCreatedNotification {
  curationNodeIconURL: string;
  curationNodeTranslatedTitle: string;
  masteryPercentage: string;
}

export interface GroupedBadgeNotification {
  badgeNotifications: {
    __typename: "BadgeNotification";
    badge: Badge;
  }[];
}

export interface InfoNotification {
  notificationinterface: string;
}

export interface ModeratorNotification {
  text: string;
}

export interface ResponseFeedbackNotification {
  authorAvatarUrl: string;
  authorNickname: string;
  content: string;
  feedbackType: string;
  focusTranslatedTitle: string;
  sumVotesIncremented: number;
}

export interface ProgramFeedbackNotification {
  authorAvatarSrc: string;
  authorNickname: string;
  content: string;
  feedbackType: string;
  translatedScratchpadTitle: string;
}

export interface KaNotification extends AssignmentCreatedNotification, AssignmentDueDateNotification, AvatarNotification, BadgeNotification, CoachRequestAcceptedNotification, CoachRequestNotification, CourseMasteryGoalCreatedNotification, GroupedBadgeNotification, InfoNotification, ModeratorNotification, ProgramFeedbackNotification, ResponseFeedbackNotification, BasicNotification {
  __typename: string;
}
