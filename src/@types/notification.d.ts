type BaseNotification = {
  __typename: string;
  brandNew: boolean;
  class_: string[];
  date: string;
  kaid: string;
  read: boolean;
  url: string;
  urlsafeKey: string;
};

type AssignmentCreatedNotificationType = BaseNotification & {
  numAssignments: number;
  contentTitle: string;
  curationNodeIconURL: string;
  className: string;
};

type AssignmentDueDateNotificationType = BaseNotification & {
  numAssignments: number;
  dueDate: string;
  contentTitle: string;
  curationNodeIconURL: string;
};

type AvatarNotificationType = BaseNotification & {
  name: string;
  thumbnailSrc: string;
};

type BadgeNotificationType = BaseNotification & {
  badgeName: string;
  badge: {
    description: string;
    fullDescription: string;
    name: string;
    relativeUrl: string;
    icons: {
      compactUrl: string;
    };
  };
};

type CoachRequestAcceptedNotificationType = BaseNotification & {
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
    topics: Array<{
      id: string;
      slug: string;
      iconUrl: string;
      key: string;
      translatedStandaloneTitle: string;
    }>;
  };
};

type CoachRequestNotificationType = BaseNotification & {
  coachIsParent: boolean;
  coach: {
    id: string;
    kaid: string;
    nickname: string;
  };
};

type CourseMasteryDueDateCreatedNotificationType = BaseNotification & {
  dueDate: string;
  course: {
    id: string;
    iconUrl: string;
    translatedStandaloneTitle: string;
  };
};

type CourseMasteryGoalCreatedNotificationType = BaseNotification & {
  curationNodeIconURL: string;
  curationNodeTranslatedTitle: string;
  masteryPercentage: number;
};

type GroupedBadgeNotificationType = BaseNotification & {
  badgeNotifications: Array<{
    badge: {
      badgeCategory: string;
      description: string;
      fullDescription: string;
      name: string;
      icons: {
        compactUrl: string;
      };
    };
  }>;
};

type InfoNotificationType = BaseNotification & {
  notificationType: string;
};

type MasteryGoalDueDateApproachingCreatedNotificationType = BaseNotification & {
  classroomInfo: {
    id: string;
    cacheId: string;
  };
};

type ModeratorNotificationType = BaseNotification & {
  text: string;
};

type ProgramFeedbackNotificationType = BaseNotification & {
  authorAvatarSrc: string;
  authorNickname: string;
  feedbackType: string;
  translatedScratchpadTitle: string;
  content: string;
};

type ResponseFeedbackNotificationType = BaseNotification & {
  authorAvatarUrl: string;
  authorNickname: string;
  feedbackType: string;
  focusTranslatedTitle: string;
  content: string;
  sumVotesIncremented: number;
};

type ThreadCreatedNotificationType = BaseNotification & {
  coachee: {
    id: string;
    kaid: string;
    nickname: string;
  };
  threadId: string;
  flagged: boolean;
};

type UnitMasteryDueDateCreatedNotificationType = BaseNotification & {
  dueDate: string;
  unit: {
    id: string;
    iconUrl: string;
    translatedStandaloneTitle: string;
  };
};

type UnitMasteryGoalCreatedNotificationType = BaseNotification & {
  numAssignmentsCount: number;
  classroomInfo: {
    cacheId: string;
    id: string;
    coach: {
      id: string;
      nickname: string;
    };
  };
  unit: {
    id: string;
    iconUrl: string;
    parent: {
      id: string;
      iconUrl: string;
    };
  };
};

export type KhanAcademyNotification = AssignmentCreatedNotificationType &
  AssignmentDueDateNotificationType &
  AvatarNotificationType &
  BadgeNotificationType &
  BasicNotificationType &
  CoachRequestAcceptedNotificationType &
  CoachRequestNotificationType &
  CourseMasteryDueDateCreatedNotificationType &
  CourseMasteryGoalCreatedNotificationType &
  GroupedBadgeNotificationType &
  InfoNotificationType &
  MasteryGoalDueDateApproachingCreatedNotificationType &
  ModeratorNotificationType &
  ProgramFeedbackNotificationType &
  ResponseFeedbackNotificationType &
  ThreadCreatedNotificationType &
  UnitMasteryDueDateCreatedNotificationType &
  UnitMasteryGoalCreatedNotificationType;
