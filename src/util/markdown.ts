interface MarkdownPattern {
	readonly reg: RegExp;
	readonly render?: (args: string[]) => string;
	readonly string?: string;
	readonly hasNestedParsing?: boolean;
	readonly onlyFirst?: boolean;
	readonly isCustomRendering?: boolean;
}

interface IntermediaryBestResult {
	readonly index: number;
	readonly type: number;
	readonly length: number;
	readonly hasNestedParsing: boolean;
	readonly isCustomRendering: boolean;
	readonly match: string[];
}

interface MarkdownAST {
	readonly type: number;
	readonly content: any;
}

const patterns: MarkdownPattern[] = [
  {
    reg: /(?:\n|^)`{3}\n?((.|\n)+?)`{3}/m,
    hasNestedParsing: false,
    string: "<div class=\"discussion-code-block\">$</div>",
  },
  {
    reg: /`([^\n]+?)`/,
    hasNestedParsing: false,
    string: "<span class=\"discussion-code-inline\">$</span>",
  },
  {
    reg: /\*([^\n]+?)\*/,
    hasNestedParsing: true,
    string: "<b>$</b>",
  },
  {
    reg: /_([^\n]+?)_/,
    hasNestedParsing: true,
    string: "<i>$</i>",
  },
  {
    reg: /~([^\n]+?)~/,
    hasNestedParsing: true,
    string: "<s>$</s>",
  },
  {
    reg: /&lt;((?:@).+?)&gt;/,
    hasNestedParsing: false,
    string: "<a class=\"hyperlink\" href=\"https://www.khanacademy.org/profile/$\" target=\"_blank\">$</a>",
  },
  {
    reg: /((?:http|ftp|https)(?:.*?))(?:\s|$)/,
    hasNestedParsing: false,
    string: "<a class=\"hyperlink\" href=\"$\" target=\"_blank\">$</a>"
  }
];

const ESCAPE_MAP: { [key:string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#x27;",
  // "`": "&#x60;",
  "=": "&#x3D;"
};

const ESCAPE_REGEXP = new RegExp(`[${ Object.keys(ESCAPE_MAP).join("") }]`, "g");

export function escapeHTML (text: string): string {
  return text.replace(ESCAPE_REGEXP, (t) =>ESCAPE_MAP[t] || "");
}

function parse (source: string, isNested = false): MarkdownAST[] {
  const result: MarkdownAST[] = [];
  let text: string = !isNested ? escapeHTML(source) : source;

  while (text.length > 0) {
    let i = 0;
    let current: MarkdownPattern = patterns[0];
    let best: IntermediaryBestResult = null;

    do {
      if (isNested && current.onlyFirst) {
        i++;
        current = patterns[i];
        continue;
      }

      const match: RegExpExecArray | null = current.reg.exec(text);

      if (match && (!best || best.index > match.index)) {
        best = {
          index: match.index,
          type: i,
          hasNestedParsing: Boolean(current.hasNestedParsing),
          isCustomRendering: Boolean(current.isCustomRendering),
          length: match[0].length,
          match: match.slice(1)
        };
      }

      i++;
      current = patterns[i];
    } while (i < patterns.length);

    if (!best) {
      result.push({ type: -1, content: text });
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
        : best.isCustomRendering
          ? best.match
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

    if (p.isCustomRendering) {
      return p.render(i.content);
    }

    return p.string.replace(/\$/g, p.hasNestedParsing ? render(i.content) : i.content);


  }).join("");
}

export function parseAndRender (txt: string): string {
  return render(parse(txt));
}
