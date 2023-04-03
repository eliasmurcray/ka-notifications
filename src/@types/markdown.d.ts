export interface MarkdownPattern {
	readonly regex: RegExp;
	readonly template: string;
	readonly shouldUseNestedParsing: boolean;
}

export interface IntermediaryBestResult {
	readonly index: number;
	readonly type: number;
	readonly length: number;
	readonly hasNestedParsing: boolean;
	readonly match: string[];
}

export interface MarkdownAST {
	readonly type: number;
	readonly content: string | MarkdownAST[];
}
