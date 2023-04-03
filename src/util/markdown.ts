import { IntermediaryBestResult, MarkdownAST, MarkdownPattern } from "../@types/markdown";

const patterns: MarkdownPattern[] = [
  {
    regex: /(?:\n|^)`{3}\n?((.|\n)+?)`{3}/m,
    shouldUseNestedParsing: false,
    template: "<div class=\"discussion-code-block\">$</div>",
  },
  {
    regex: /`([^\n]+?)`/,
    shouldUseNestedParsing: false,
    template: "<span class=\"discussion-code-inline\">$</span>",
  },
  {
    regex: /\*([^\n]+?)\*/,
    shouldUseNestedParsing: true,
    template: "<b>$</b>",
  },
  {
    regex: /_([^\n]+?)_/,
    shouldUseNestedParsing: true,
    template: "<i>$</i>",
  },
  {
    regex: /~([^\n]+?)~/,
    shouldUseNestedParsing: true,
    template: "<s>$</s>",
  },
  {
    regex: /&lt;((?:@).+?)&gt;/,
    shouldUseNestedParsing: false,
    template: "<a class=\"hyperlink\" href=\"https://www.khanacademy.org/profile/$\" target=\"_blank\">$</a>",
  },
  {
    regex: /((?:http|ftp|https)(?:.*?))(?:\s|$)/,
    shouldUseNestedParsing: false,
    template: "<a class=\"hyperlink\" href=\"$\" target=\"_blank\">$</a>"
  }
];

const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "=": "&#x3D;"
};

const ESCAPE_REGEXP = new RegExp(`[${ Object.keys(ESCAPE_MAP).join("") }]`, "g");

export function escapeHTML (text: string): string {
  return text.replace(ESCAPE_REGEXP, (t) => String(ESCAPE_MAP[t] || ""));
}

function parse (source: string, isNested = false): MarkdownAST[] {
  const result: MarkdownAST[] = [];
  let text: string = !isNested ? escapeHTML(source) : source;
  while(text.length > 0) {
    let best: IntermediaryBestResult = null;
    for(let i = 0; i < patterns.length; i++) {
      const current: MarkdownPattern = patterns[i];
      if(isNested) {
        continue;
      }

      const match: RegExpExecArray = current.regex.exec(text);

      if(match && (!best || best.index > match.index)) {
        best = {
          index: match.index,
          type: i,
          hasNestedParsing: current.shouldUseNestedParsing,
          length: match[0].length,
          match: match.slice(1)
        };
      }
    }

    if(!best) {
      result.push({
        type: -1,
        content: text
      });
      return result;
    }

    if (best.index > 0) {
      result.push({
        type: -1,
        content: text.substring(0, best.index)
      });
    }

    result.push({
      type: best.type,
      content: best.hasNestedParsing
        ? parse(best.match.join(""), true)
        : best.match[0]
    });

    text = text.substring(best.index + best.length);
  }

  return result;
}

function render (result: MarkdownAST[]): string {
  let p: MarkdownPattern;
  return result.map((i: MarkdownAST) => {
    if (i.type === -1) {
      return i.content;
    }

    p = patterns[i.type];

    return p.template.replace(/\$/g, (p.shouldUseNestedParsing ? render(i.content as MarkdownAST[]) : i.content) as string);


  }).join("");
}

export function parseAndRender (txt: string): string {
  return render(parse(txt));
}
