import { build, context } from 'esbuild';
import { htmlPlugin } from '@craftamap/esbuild-plugin-html';
import fs from 'fs-extra';
import path from 'path';
import { readdirSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { mode: 'development', watch: false };
  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      result.mode = arg.replace('--mode=', '');
    } else if (arg === '--watch') {
      result.watch = true;
    }
  }
  return result;
}

const { mode, watch } = parseArgs();
const isProd = mode === 'production';

const config = {
  entryPoints: {
    popup: 'src/popup/index.ts',
    content: 'src/content.ts',
    background: 'src/background/index.ts',
    'fetch-override': 'src/fetch-override.ts',
    'ace-override': 'src/ace-override.ts',
    'format-code': 'src/format-code.ts',
  },
  outdir: 'chrome',
  bundle: true,
  format: 'iife',
  minify: isProd,
  sourcemap: !isProd,
  target: ['es2020'],
  entryNames: '[name]',
  loader: { '.css': 'css' },
  plugins: [
    htmlPlugin({
      files: [
        {
          entryPoints: ['src/popup/index.ts'],
          filename: 'popup.html',
          htmlTemplate: 'src/popup/index.html',
          minify: isProd,
          scriptLoading: 'module',
        },
      ],
    }),
  ],
  logLevel: 'info',
  legalComments: 'none',
  metafile: true,
  write: true,
};

async function copyStatic() {
  await fs.copy('src/manifest.json', 'chrome/manifest.json');
  const assetDir = 'src/assets';
  const assets = await fs.readdir(assetDir);
  for (const asset of assets) {
    await fs.copy(path.join(assetDir, asset), path.join('chrome/', asset), { overwrite: true });
  }
}

async function watchHtml(ctx) {
  const watcher = chokidar.watch(['src'], {
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true,
    persistent: true,
    depth: 99,
  });

  try {
    await ctx.rebuild();
    console.log('[watch] build finished, watching for changes...');
  } catch {
    console.error('[watch] build failed');
  }

  watcher
    .on('ready', () => console.log('[watch] watching for changes...'))
    .on('change', async file => {
      console.log(`[watch] build started (change: "${file}")`);
      try {
        await copyStatic();
        await ctx.rebuild();
        console.log('[watch] build finished, watching for changes...');
      } catch {
        console.error('[watch] build failed');
      }
    })
    .on('error', err => console.error('[watch]', err));
}

async function run() {
  await copyStatic();
  if (watch) {
    const ctx = await context(config);
    await watchHtml(ctx);
  } else {
    try {
      await build(config);
    } catch {
      console.error('build failed');
      process.exit(1);
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
