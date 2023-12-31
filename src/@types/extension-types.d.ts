export type KhanAPIVariables = {
  limit?: number;
  topicId?: number;
  feedbackType?: "QUESTION" | "COMMENT" | "REPLY" | "ANSWER";
  currentSort?: number;
  qaExpandKey?: string;
  focusKind?: string;
  parentKey?: string;
  textContent?: string;
  after?: string;
  fromVideoAuthor?: boolean;
  shownLowQualityNotice?: boolean;
};
