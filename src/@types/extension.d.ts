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

export interface graphQLBody {
	operationName: string;
	query: string;
	variables: graphQLVariables;
}

export interface ExtensionLocalStorage {
	notificationsTheme: string;
	notificationsCache: {
		cursor: string;
		preloadString: string;
	};
	commentSort: string;
}
