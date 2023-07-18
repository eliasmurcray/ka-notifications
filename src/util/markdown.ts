/**
 * Converts markdown string into a formatted HTML string which can be used as an HTML insert.
 *
 * @param text Input string to parse to HTML markdown
 * @returns A formatted HTML string
 */
export function parseMarkdown(text: string) {
  text = cleanse(text);

  const codeBlocks: string[] = [];
  const codeInlines: string[] = [];

  // Store code blocks
  text = text.replace(/```([\s\S]*?)```/gm, (_match, codeBlock) => {
    codeBlocks.push(codeBlock);
    return `<codeblock-placeholder-${codeBlocks.length - 1}>`;
  });

  // Store code inlines
  text = text.replace(/`([^\n]+?)`/g, (_match, codeInline) => {
    codeInlines.push(codeInline);
    return `<codeinline-placeholder-${codeInlines.length - 1}>`;
  });

  let originalText = text;
  for (let i = 0; i < 100; i++) {
    // Bolds
    text = text.replace(/\*([^\n]+?)\*/g, "<b>$1</b>");
    // Italics
    text = text.replace(/_([^\n]+?)_/, "<i>$1</i>");
    // Strikethroughs
    text = text.replace(/~([^\n]+?)~/, "<s>$1</s>");
    if (text === originalText) {
      break;
    }
    originalText = text;
  }

  // Restore code blocks
  text = text.replace(/<codeblock-placeholder-(\d+)>/g, (_match, index) => {
    return `<pre><code>${codeBlocks[parseInt(index)]}</code></pre>`;
  });

  // Restore code inlines
  text = text.replace(/<codeinline-placeholder-(\d+)>/g, (_match, index) => {
    return `<code>${codeInlines[parseInt(index)]}</code>`;
  });

  // URLs
  text = text.replace(/((?:http|https)(?:.*?))(?:\s|$)/g, '<a class="hyperlink" href="$1" target="_blank">$1</a>');

  // @mentions (username 40 length max)
  text = text.replace(/@([a-zA-Z][a-zA-Z\d]{0,39})/g, '<a class="hyperlink" href="https://www.khanacademy.org/profile/$1" target="_blank">@$1</a>');

  return text;
}

/**
 * Cleans HTML tags from input
 *
 * @param text Input text
 * @returns HTML tag escaped text
 */
export function cleanse(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
}
