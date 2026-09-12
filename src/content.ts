import { waitForId } from './lib/dom';
import { EditorSettings } from './types/extension';

const pathSegments = window.location.pathname.split('/');
const isComputerSciencePage =
  pathSegments[1] === 'computer-programming' || pathSegments[1] === 'cs';
const projectId = pathSegments[3]?.split('?')?.[0];

async function initializeContentScript(): Promise<void> {
  await new Promise<void>(resolve => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      window.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    }
  });

  function getTabIdForExpandType(expandType: string | null): string {
    switch (expandType) {
      case 'question':
      case 'answer':
        return 'questions-tab';
      case 'project_help_question':
        return 'projecthelp-tab';
      default:
        return 'comments-tab';
    }
  }

  function attachEditorSettingsSync(): void {
    const postEditorSettings = (settings: EditorSettings) => {
      document.dispatchEvent(
        new CustomEvent('EDITOR_SETTINGS', {
          detail: { settings },
        }),
      );
    };

    document.addEventListener('EDITOR_SETTINGS_REQUEST', () => {
      chrome.storage.local.get('editorSettings', ({ editorSettings }) => {
        postEditorSettings(editorSettings || {});
      });
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes['editorSettings']) {
        postEditorSettings(changes['editorSettings'].newValue);
      }
    });
  }

  function injectScriptFile(filename: string): void {
    const scriptElement = document.createElement('script');
    scriptElement.src = chrome.runtime.getURL(filename);
    document.body.appendChild(scriptElement);
  }

  function attachFormatCodeLoader(): void {
    document.addEventListener('KA_REQUEST_FORMAT_CODE_SCRIPT', () => {
      injectScriptFile('format-code.js');
    });
  }

  const TAB_SELECTION_TIMEOUT_MS = 5000;

  async function selectDefaultCommentTab(): Promise<void> {
    const expandType = new URLSearchParams(location.search).get('qa_expand_type');
    const tabId = getTabIdForExpandType(expandType);
    const qaTabElement = await waitForId(tabId, TAB_SELECTION_TIMEOUT_MS);
    if (!qaTabElement) return;

    if (qaTabElement instanceof HTMLButtonElement) {
      qaTabElement.click();

      const { defaultCommentSort = 'Top Voted' } =
        await chrome.storage.local.get('defaultCommentSort');
      const sortButton = await waitForId('sortBy', TAB_SELECTION_TIMEOUT_MS);
      if (sortButton instanceof HTMLButtonElement) {
        sortButton.click();
        const dropdown = await waitForId('\\:r8\\:', TAB_SELECTION_TIMEOUT_MS);
        if (!dropdown) return;
        const sortButtons = dropdown.getElementsByTagName('button');

        for (const button of sortButtons) {
          if (button.textContent.includes(defaultCommentSort)) {
            button.click();
            sortButton.blur();
            break;
          }
        }

        for (const element of document.querySelectorAll('div')) {
          const computedStyle = getComputedStyle(element);
          if (
            (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') &&
            element.scrollHeight > element.clientHeight
          ) {
            element.scrollTo(0, 0);
            break;
          }
        }
      }
    }
  }

  if (isComputerSciencePage && /^\d{16}$/.test(projectId || '')) {
    injectScriptFile('fetch-override.js');
    attachEditorSettingsSync();
    attachFormatCodeLoader();
    injectScriptFile('ace-override.js');

    void selectDefaultCommentTab();
  } else if (isComputerSciencePage && pathSegments[2] === 'new') {
    attachEditorSettingsSync();
    attachFormatCodeLoader();
    injectScriptFile('ace-override.js');
  }
}

initializeContentScript();
