import { Notification } from "./notification";

export interface GetFullUserProfileResponse {
	data: {
		actorIsImpersonatingUser: boolean;
		hasAccessToAIGuideDev: boolean;
		isAIGuideEnabled: boolean;
		user: {
			__typename: "User";
			authEmails: string[];
			badgeCounts: string;
			bio: string;
			birthMonthYear: string;
			canAccessDistrictsHomepage: boolean;
			canHellban: boolean;
			canMessageUsers: boolean;
			canModifyCoaches: boolean;
			countVideosCompleted: number;
			email: string;
			gaUserId: string;
			hasChildren: boolean;
			hasClasses: boolean;
			hasCoach: boolean;
			hasStudents: boolean;
			hideVisual: boolean;
			homepageUrl: string;
			id: string;
			includesDistrictOwnedData: boolean;
			isChild: boolean;
			isCoachingLoggedInUser: boolean;
			isCreator: boolean;
			isCurator: boolean;
			isDataCollectible: boolean;
			isDeveloper: boolean;
			isMidsignupPhantom: boolean;
			isModerator: boolean;
			isOrphan: boolean;
			isParent: boolean;
			isPhantom: boolean;
			isPublisher: boolean;
			isSelf: boolean;
			isTeacher: boolean;
			joined: string;
			kaid: string;
			key: string;
			lastLoginCountry: string;
			muteVideos: boolean;
			newNotificationCount: number;
			nickname: string;
			noColorInVideos: boolean;
			pendingEmailVerifications: string[];
			points: number;
			preferredKaLocale: string | null;
			prefersReducedMotion: boolean;
			profile: {
				__typename: string;
				accessLevel: string;
			};
			profileRoot: string;
			shouldShowAgeCheck: boolean;
			showCaptions: boolean;
			signupDataIfUnverified: boolean;
			soundOn: boolean;
			tosAccepted: boolean;
			underAgeGate: boolean;
			userId: string;
			username: string;
		};
	};
}

export interface NotificationsResponse {
	notifications: Notification[];
	pageInfo: {
		nextCursor: string;
		__typename: "PageInfo";
	};
	__typename: "NotificationsPage";
}

export interface GetNotificationsForUserResponse {
	data: {
		user: {
			id: string;
			kaid: string;
			notifications: NotificationsResponse;
			__typename: "User";
		};
	};
}

export interface ClearBrandNewNotificationsResponse {
	data: {
		clearBrandNewNotifications: {
			__typename: "ClearBrandNewNotificationMutation";
			error: {
				code: string;
			}
		};
	};
}

interface QuestionFeedback {
	key: string;
	answers: {
		key: string;
	}[];
}

interface FeedbackReply {
	__typename: "BasicFeedback";
	appearsAsDeleted: boolean;
	author: {
		__typename: "User";
		avatar: {
			__typename: "Avatar";
			imageSrc: string;
			name: string;
		};
		id: string;
		kaid: string;
		nickname: string;
	};
	content: string;
	date: string;
	definitelyNotSpam: boolean;
	deleted: boolean;
	downVoted: boolean;
	expandKey: string;
	feedbackType: string;
	flaggedBy: [];
	flaggedByUser: boolean;
	flags: []
	focusUrl: string;
	fromVideoAuthor: boolean;
	isLocked: boolean;
	key: string;
	lowQualityScore: number;
	notifyOnAnswer: boolean;
	permalink: string;
	qualityKind: string;
	replyCount: number;
	replyExpandKeys: string[];
	showLowQualityNotice: boolean;
	sumVotesIncremented: number;
	upVoted: boolean;
}

export interface GetFeedbackRepliesPageResponse {
	data: {
		feedbackRepliesPaginated: {
			__typename: "Replies";
			cursor: string;
		};
		feedback: FeedbackReply[]
		isComplete: boolean;
	};
}

export interface FeedbackQueryResponse {
	data: {
		feedback: {
			cursor: null | string;
			feedback: null | QuestionFeedback[];
			isComplete: boolean;
			sortedByDate: boolean;
			__typename: "FeedbackForFocus";
		};
	};
}
