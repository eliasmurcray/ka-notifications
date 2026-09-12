import { waitForClass } from './lib/dom';
import { EditorSettings } from './types/extension';
import {
  FONTS_CACHE_NAME,
  SETTINGS_REQUEST_INTERVAL,
  SETTINGS_REQUEST_TIMEOUT,
  ACE_THEME_PATH,
  ACE_THEME_PREFIX,
  KA_NEW_PROGRAM_CACHE_PREFIX,
  KA_NEW_PROGRAM_URL_RE,
} from './lib/constants';

interface WindowWithAce extends Window {
  ace?: Ace;
}

interface AceConfig {
  config: {
    set: (key: string, value: string) => void;
  };
}

type Ace = typeof ace;

interface EditorState {
  editor: AceAjax.Editor | null;
  mainContent: HTMLDivElement | null;
  mainContentChild: HTMLDivElement | null;
  scratchpadWrapOuter: HTMLDivElement | null;
  scratchpadWrapOuterChild: HTMLDivElement | null;
  scratchpadWrap: HTMLDivElement | null;
  slimCursorStyle: HTMLStyleElement | null;
  initialized: boolean;
  formatButton: HTMLButtonElement | null;
  formatButtonObserver: MutationObserver | null;
}

function createEditorState(): EditorState {
  return {
    editor: null,
    mainContent: null,
    mainContentChild: null,
    scratchpadWrapOuter: null,
    scratchpadWrapOuterChild: null,
    scratchpadWrap: null,
    slimCursorStyle: null,
    initialized: false,
    formatButton: null,
    formatButtonObserver: null,
  };
}

let _ace: Ace;
let settings: EditorSettings;
let state = createEditorState();
let currentURL = window.location.href;
let editorObserver: MutationObserver | null = null;

let boundSaveProgram: (() => void) | null = null;
let boundHandleSaveClick: ((e: MouseEvent) => void) | null = null;
let saveBeforeUnload = false;

function teardown(): void {
  if (state.editor && boundSaveProgram) {
    state.editor.selection.off('changeCursor', boundSaveProgram);
    state.editor.off('change', boundSaveProgram);
  }
  if (boundSaveProgram && saveBeforeUnload) {
    window.removeEventListener('beforeunload', boundSaveProgram);
    saveBeforeUnload = false;
  }
  if (boundHandleSaveClick) {
    document.body.removeEventListener('mouseup', boundHandleSaveClick);
  }
  state.slimCursorStyle?.remove();
  state.formatButton?.remove();
  state.formatButtonObserver?.disconnect();
  editorObserver?.disconnect();
  editorObserver = null;
  boundSaveProgram = null;
  boundHandleSaveClick = null;
  state = createEditorState();
}

function observeEditorMount(): void {
  if (editorObserver) return;
  editorObserver = new MutationObserver(() => {
    const el = document.querySelector('.ace_editor');
    if (!el || !_ace || state.initialized) return;
    const existing = (el as HTMLElement & { env?: { editor?: AceAjax.Editor } })?.env?.editor;
    if (!existing) return;
    state.editor = existing;
    state.initialized = true;
    editorObserver?.disconnect();
    editorObserver = null;
    initializeEditor(window.location.href);
  });
  editorObserver.observe(document.body, { childList: true, subtree: true });
}

function onURLChange(): void {
  const newURL = window.location.href;
  if (newURL !== currentURL) {
    currentURL = newURL;
    teardown();
    observeEditorMount();
  }
}

const _pushState = history.pushState.bind(history);
history.pushState = function (...args: Parameters<typeof history.pushState>) {
  _pushState(...args);
  onURLChange();
};

const _replaceState = history.replaceState.bind(history);
history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
  _replaceState(...args);
  onURLChange();
};

window.addEventListener('popstate', onURLChange);

async function loadEditorFont(fontFamily: string, fontKey: string): Promise<void> {
  if (!fontFamily || fontFamily === 'default' || !fontKey) return;
  const id = `bunny-font-${fontKey}`;
  if (document.getElementById(id)) return;
  const url = `https://fonts.bunny.net/css?family=${fontKey}`;
  let css: string;
  try {
    const cache = await caches.open(FONTS_CACHE_NAME);
    let response = await cache.match(url);
    if (!response || !response.ok) {
      const fresh = await fetch(url);
      if (!fresh.ok) throw new Error(`Bunny Fonts returned ${fresh.status}`);
      cache.put(url, fresh.clone());
      response = fresh;
    }
    css = await response.text();
  } catch (error) {
    console.warn('[loadEditorFont] Failed to load font, falling back to system monospace:', error);
    return;
  }
  css = css.trim();
  if (!css) {
    console.warn('[loadEditorFont] Empty CSS response for font:', fontFamily);
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

async function cacheDOMReferences(): Promise<void> {
  state.mainContent = document.getElementById('main-content') as HTMLDivElement;
  state.mainContentChild = state.mainContent?.children[0] as HTMLDivElement;
  const [wrapOuterEls, wrapEls] = await Promise.all([
    waitForClass('scratchpad-wrap-outer'),
    waitForClass('scratchpad-wrap'),
  ]);
  state.scratchpadWrapOuter = wrapOuterEls?.[0] as HTMLDivElement;
  state.scratchpadWrapOuterChild = state.scratchpadWrapOuter?.children[0] as HTMLDivElement;
  state.scratchpadWrap = wrapEls?.[0] as HTMLDivElement;
  state.slimCursorStyle = document.createElement('style');
  state.slimCursorStyle.setAttribute('data-slim-cursor', 'true');
  state.slimCursorStyle.textContent = `
    .ace_cursor {
      border-left-width: 1px !important;
      margin-left: -0.5px !important;
    }
  `;
}

function isNewProgramURL(url: string): boolean {
  return KA_NEW_PROGRAM_URL_RE.test(url);
}

function findRequestHelpButton(): HTMLElement | null {
  if (!state.scratchpadWrap) return null;
  const candidates = state.scratchpadWrap.querySelectorAll('button, a, [role="button"]');
  for (const el of candidates) {
    if (el.textContent?.trim().toLowerCase() === 'request help') {
      return el as HTMLElement;
    }
  }
  return null;
}

function handleFormatCodeClick(event: MouseEvent): void {
  void formatCode(event.currentTarget as HTMLButtonElement);
}

function getButtonLabelEl(button: HTMLElement): HTMLElement {
  let labelEl = button;
  let current: HTMLElement = button;
  for (;;) {
    const children = Array.from(current.children) as HTMLElement[];
    const childWithText = children.find(child => (child.textContent ?? '').trim().length > 0);
    if (!childWithText) break;
    labelEl = childWithText;
    current = childWithText;
  }
  return labelEl;
}

function buildFormatButton(reference: HTMLElement): HTMLButtonElement {
  const button = reference.cloneNode(true) as HTMLButtonElement;
  button.removeAttribute('id');
  button.setAttribute('data-ka-format-code', 'true');
  getButtonLabelEl(button).textContent = 'Format Code';
  button.addEventListener('click', handleFormatCodeClick);
  return button;
}

function ensureFormatButton(): void {
  if (state.formatButton?.isConnected) return;
  const reference = findRequestHelpButton();
  if (!reference?.parentElement) return;
  if (reference.nextElementSibling?.hasAttribute('data-ka-format-code')) return;
  const button = buildFormatButton(reference);
  reference.insertAdjacentElement('afterend', button);
  state.formatButton = button;
}

function observeFormatButtonTarget(): void {
  if (state.formatButtonObserver || !state.scratchpadWrap) return;
  ensureFormatButton();
  state.formatButtonObserver = new MutationObserver(() => ensureFormatButton());
  state.formatButtonObserver.observe(state.scratchpadWrap, { childList: true, subtree: true });
}

let formatCodeReadyPromise: Promise<void> | null = null;

function ensureFormatCodeScriptLoaded(): Promise<void> {
  if (window.__kaFormatCode) return Promise.resolve();
  if (formatCodeReadyPromise) return formatCodeReadyPromise;
  formatCodeReadyPromise = new Promise(resolve => {
    const onReady = () => {
      document.removeEventListener('KA_FORMAT_CODE_READY', onReady);
      resolve();
    };
    document.addEventListener('KA_FORMAT_CODE_READY', onReady);
    document.dispatchEvent(new CustomEvent('KA_REQUEST_FORMAT_CODE_SCRIPT'));
  });
  return formatCodeReadyPromise;
}

const ACE_MODE_TO_PRETTIER_PARSER: Record<string, string> = {
  'ace/mode/javascript': 'babel',
  'ace/mode/html': 'html',
  'ace/mode/css': 'css',
  'ace/mode/less': 'less',
  'ace/mode/scss': 'scss',
};

function getPrettierParserForEditor(): string | null {
  const modeId = (state.editor?.session.getMode() as { $id?: string } | undefined)?.$id;
  if (!modeId) return null;
  return ACE_MODE_TO_PRETTIER_PARSER[modeId] ?? null;
}

async function formatCode(button: HTMLButtonElement): Promise<void> {
  if (!state.editor) return;
  const label = getButtonLabelEl(button);
  const originalLabel = label.textContent;

  const parser = getPrettierParserForEditor();
  if (!parser) {
    label.textContent = 'Unsupported file type';
    setTimeout(() => {
      label.textContent = originalLabel;
    }, 1500);
    return;
  }

  button.disabled = true;
  button.setAttribute('aria-disabled', 'true');
  label.textContent = 'Formatting...';
  try {
    await ensureFormatCodeScriptLoaded();
    if (!window.__kaFormatCode) throw new Error('Formatter failed to load');

    const code = state.editor.getValue();
    const cursorOffset = state.editor.session.doc.positionToIndex(
      state.editor.getCursorPosition(),
      0,
    );
    const { formatted, cursorOffset: newCursorOffset } = await window.__kaFormatCode(code, {
      parser,
      tabWidth: parseInt(settings?.tabSize ?? '2', 10),
      useTabs: !(settings?.softTabs ?? true),
      cursorOffset,
    });

    state.editor.setValue(formatted, -1);
    state.editor.moveCursorToPosition(state.editor.session.doc.indexToPosition(newCursorOffset, 0));
    state.editor.renderer.scrollCursorIntoView();
    button.disabled = false;
    button.setAttribute('aria-disabled', 'false');
    label.textContent = originalLabel;
  } catch (error) {
    console.error('[formatCode] Failed to format code:', error);
    label.textContent = 'Format failed';
    setTimeout(() => {
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
      label.textContent = originalLabel;
    }, 1500);
  }
}

async function fetchExtensionSettings(): Promise<void> {
  return new Promise(resolve => {
    const listener = () => {
      document.removeEventListener('EDITOR_SETTINGS', listener);
      clearInterval(interval);
      clearTimeout(timeout);
      resolve();
    };
    document.addEventListener('EDITOR_SETTINGS', listener);
    const interval = setInterval(() => {
      document.dispatchEvent(new CustomEvent('EDITOR_SETTINGS_REQUEST'));
    }, SETTINGS_REQUEST_INTERVAL);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      document.removeEventListener('EDITOR_SETTINGS', listener);
      console.warn('[fetchExtensionSettings] Timed out waiting for editor settings');
      resolve();
    }, SETTINGS_REQUEST_TIMEOUT);
    document.dispatchEvent(new CustomEvent('EDITOR_SETTINGS_REQUEST'));
  });
}

document.addEventListener('EDITOR_SETTINGS', (event: Event) => {
  const customEvent = event as CustomEvent;
  if (customEvent.detail?.settings) {
    settings = customEvent.detail.settings;
    updateEditorSettings();
  }
});

async function updateEditorSettings(): Promise<void> {
  if (!state.editor || !settings) return;

  const {
    editor,
    mainContent,
    mainContentChild,
    scratchpadWrapOuter,
    scratchpadWrapOuterChild,
    scratchpadWrap,
  } = state;

  const hasDOMRefs =
    mainContent &&
    mainContentChild &&
    scratchpadWrapOuter &&
    scratchpadWrapOuterChild &&
    scratchpadWrap;

  await loadEditorFont(settings.fontFamily ?? 'default', settings.fontKey ?? '');

  editor.container.style.fontSize = `${parseInt(settings.fontSize ?? '14', 10)}px`;
  editor.setOptions({
    fontFamily:
      settings.fontFamily && settings.fontFamily !== 'default'
        ? `'${settings.fontFamily}', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace`
        : `'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace`,
    theme: `${ACE_THEME_PREFIX}${settings.theme ?? 'textmate'}`,
    wrap: settings.wrap ?? true,
    showLineNumbers: settings.showLineNumbers ?? true,
    showGutter: settings.showGutter ?? true,
    behavioursEnabled: settings.behavioursEnabled ?? false,
    enableLiveAutocompletion: settings.autocompletion ?? false,
    enableBasicAutocompletion: settings.autocompletion ?? false,
    displayIndentGuides: settings.displayIndentGuides ?? false,
  });

  if (settings.slimCursor) {
    if (!state.slimCursorStyle?.isConnected) {
      document.head.appendChild(state.slimCursorStyle!);
    }
  } else {
    state.slimCursorStyle?.remove();
  }

  editor.getSession().setOptions({
    useSoftTabs: settings.softTabs ?? true,
    tabSize: parseInt(settings.tabSize ?? '2', 10),
  });

  editor.container.style.lineHeight = settings.lineHeight || 'normal';

  if (hasDOMRefs) {
    if (settings.wideEditor) {
      mainContentChild.style.margin = '0';
      scratchpadWrapOuter.style.margin = '0';
      scratchpadWrapOuterChild.style.margin = '0';
      scratchpadWrap.style.width = '100vw';
    } else {
      mainContentChild.style.margin = '';
      scratchpadWrapOuter.style.margin = '';
      scratchpadWrapOuterChild.style.margin = '';
      scratchpadWrap.style.width = '';
    }
    editor.resize();
  }

  editor.renderer.updateCursor();
}

function waitForEditor(): Promise<void> {
  return new Promise(resolve => {
    function patchEdit(editFn: typeof _ace.edit): void {
      const originalEdit = editFn.bind(_ace);
      _ace.edit = function (el: string | HTMLElement, ...rest: unknown[]) {
        _ace.edit = originalEdit;
        (_ace as unknown as AceConfig).config.set('themePath', ACE_THEME_PATH);
        const invokeEdit = originalEdit as (
          target: string | HTMLElement,
          ...args: unknown[]
        ) => AceAjax.Editor;
        state.editor = invokeEdit(el, ...rest);
        resolve();
        return state.editor;
      };
    }

    if (_ace.edit) {
      patchEdit(_ace.edit);
    } else {
      Object.defineProperty(_ace, 'edit', {
        configurable: true,
        enumerable: true,
        set(fn: typeof _ace.edit) {
          Object.defineProperty(_ace, 'edit', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: fn,
          });
          patchEdit(fn);
        },
      });
    }

    queueMicrotask(() => {
      const el = document.querySelector('.ace_editor');
      const existing = (el as (HTMLElement & { env?: { editor?: AceAjax.Editor } }) | null)?.env
        ?.editor;
      if (existing && !state.editor) {
        state.editor = existing;
        resolve();
      }
    });
  });
}

function restoreNewProgramCache(cacheName: string): void {
  const cached = localStorage.getItem(cacheName);
  if (!cached || !state.editor) return;
  try {
    const { content, cursor } = JSON.parse(cached);
    state.editor.session.setValue(content);
    state.editor.moveCursorToPosition(cursor);
    state.editor.renderer.scrollCursorIntoView();
  } catch (error) {
    console.error('[restoreNewProgramCache] Failed to restore cache:', error);
  }
}

function makeSaveProgram(cacheName: string): () => void {
  return function saveProgram() {
    if (!isNewProgramURL(window.location.href)) {
      if (state.editor) {
        state.editor.selection.off('changeCursor', boundSaveProgram!);
        state.editor.off('change', boundSaveProgram!);
      }
      window.removeEventListener('beforeunload', boundSaveProgram!);
      document.body.removeEventListener('mouseup', boundHandleSaveClick!);
      saveBeforeUnload = false;
      return;
    }
    if (!saveBeforeUnload) {
      window.addEventListener('beforeunload', boundSaveProgram!);
      saveBeforeUnload = true;
    }
    const content = state.editor?.getValue() ?? '';
    const cursor = state.editor?.getCursorPosition();
    if (content.length === 0) {
      localStorage.removeItem(cacheName);
    } else {
      localStorage.setItem(cacheName, JSON.stringify({ content, cursor }));
    }
  };
}

function makeHandleSaveClick(cacheName: string): (e: MouseEvent) => void {
  return function handleSaveClick(e: MouseEvent) {
    if (!isNewProgramURL(window.location.href)) {
      document.body.removeEventListener('mouseup', boundHandleSaveClick!);
      return;
    }
    const target = e.target as HTMLElement;
    const inDialog = !!target.closest(
      '[role="dialog"], [role="alertdialog"], [aria-modal="true"], .modal, .dialog, .popup',
    );
    const isSaveButton =
      target.textContent?.trim().toLowerCase() === 'save' ||
      !!target.closest('[data-test-id*="save"]');
    if (isSaveButton && inDialog) {
      window.removeEventListener('beforeunload', boundSaveProgram!);
      document.body.removeEventListener('mouseup', boundHandleSaveClick!);
      if (state.editor) {
        state.editor.selection.off('changeCursor', boundSaveProgram!);
        state.editor.off('change', boundSaveProgram!);
      }
      saveBeforeUnload = false;
      localStorage.removeItem(cacheName);
    }
  };
}

function attachNewProgramListeners(cacheName: string): void {
  boundSaveProgram = makeSaveProgram(cacheName);
  boundHandleSaveClick = makeHandleSaveClick(cacheName);
  state.editor!.selection.on('changeCursor', boundSaveProgram);
  state.editor!.on('change', boundSaveProgram);
  document.body.addEventListener('mouseup', boundHandleSaveClick);
}

async function initializeEditor(href: string): Promise<void> {
  if (!state.editor) {
    await waitForEditor();
  }
  (_ace as unknown as AceConfig).config.set('themePath', ACE_THEME_PATH);
  await Promise.all([cacheDOMReferences(), fetchExtensionSettings()]);
  await updateEditorSettings();
  observeFormatButtonTarget();

  if (!isNewProgramURL(href)) return;

  const programType = href.split('/')?.[5]?.toLowerCase();
  if (!programType) {
    console.warn('[initializeEditor] Could not parse programType from href, bailing');
    return;
  }

  const cacheName = `${KA_NEW_PROGRAM_CACHE_PREFIX}${programType}_cache__`;
  restoreNewProgramCache(cacheName);
  state.editor!.focus();
  attachNewProgramListeners(cacheName);
}

async function onAceSet(): Promise<void> {
  if (state.initialized) return;
  state.initialized = true;
  editorObserver?.disconnect();
  editorObserver = null;
  await initializeEditor(window.location.href);
}

const existingAce = (window as WindowWithAce).ace;
const descriptor = Object.getOwnPropertyDescriptor(window, 'ace');
if (!descriptor || descriptor.configurable) {
  delete (window as WindowWithAce).ace;
}

Object.defineProperty(window, 'ace', {
  configurable: true,
  get() {
    return _ace;
  },
  set(value: Ace) {
    if (!value) return;
    _ace = value;
    onAceSet();
  },
});

if (existingAce) {
  _ace = existingAce;
  onAceSet();
}
