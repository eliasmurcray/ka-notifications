import { formatWithCursor } from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as htmlPlugin from 'prettier/plugins/html';
import * as postcssPlugin from 'prettier/plugins/postcss';

if (!window.__kaFormatCode) {
  window.__kaFormatCode = async (code, options) => {
    return formatWithCursor(code, {
      parser: options.parser,
      plugins: [babelPlugin, estreePlugin, htmlPlugin, postcssPlugin],
      cursorOffset: options.cursorOffset,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
      printWidth: Infinity,
      semi: true,
      trailingComma: 'none',
      arrowParens: 'avoid',
      bracketSpacing: true,
    });
  };
  document.dispatchEvent(new CustomEvent('KA_FORMAT_CODE_READY'));
}
