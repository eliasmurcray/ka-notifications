export interface GraphQLVariables {
  limit?: number;
  topicId?: string;
  feedbackType?: "QUESTION" | "COMMENT" | "REPLY" | "ANSWER";
  currentSort?: number;
  qaExpandKey?: string;
  focusKind?: string;
  parentKey?: string;
  textContent?: string;
  after?: string;
  fromVideoAuthor: boolean;
}

export interface GraphQLBody {
  operationName: string;
  query: string;
  variables: GraphQLVariables;
}

interface QuestionFeedback {
  key: string;
  expandKey?: string;
  answers: Array<{
    key: string;
  }>;
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
  flags: [];
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
    feedback: FeedbackReply[];
    isComplete: boolean;
  };
}

export interface FeedbackQueryResponse {
  data: {
    feedback: {
      cursor: null | string;
      feedback: QuestionFeedback[];
      isComplete: boolean;
      sortedByDate: boolean;
      __typename: "FeedbackForFocus";
    };
    errors: null;
  };
}
