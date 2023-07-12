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
}

export interface GraphQLBody {
  operationName: string;
  query: string;
  variables: GraphQLVariables;
}
