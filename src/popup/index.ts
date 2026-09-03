// @ts-expect-error - CSS import not typed
import './index.css';

import { createAppStore } from '../lib/store';
import { renderAvatar } from './components/avatar';
import { renderUnauthenticated } from './components/unauthenticated';
import { setupDropdown } from './components/dropdown';
import { setupSignoutDropdown } from './components/signoutDropdown';
import { setupCommentSort } from './components/commentSort';
import { setupSync } from './components/sync';
import { setupSwitches } from './components/switches';
import { setupSettingsModal } from './components/settingsModal';
import { setupTheme } from './components/theme';
import { setupMarkAllRead } from './components/markAllRead';
import { setupSelectDropdown } from './components/selectDropdown';
import { setupNotificationsList } from './components/notificationsList';
import { setupFontFamily } from './components/setupFontFamily';
import { setupEditorSettings } from './components/editorSettings';
import { setupThemeSelect } from './components/themeSelect';
import { onThemeChanged } from './theme';
import { StorageManager } from '../lib/storage';
import type { StorageData } from '../types/extension';

async function main() {
  const store = await createAppStore();
  const root = document.documentElement;
  root.classList.add('no-transition');
  store.subscribe(['darkTheme'], onThemeChanged);
  requestAnimationFrame(() => {
    void root.offsetWidth;
    root.classList.remove('no-transition');
  });
  root.classList.remove('no-transition');
  store.subscribe(['authenticated', 'profileLoaded'], renderUnauthenticated);
  store.subscribe(['avatarSrc', 'nickname'], renderAvatar);
  store.subscribe(['nickname'], ({ nickname }) => {
    const el = document.getElementById('nickname');
    if (el) {
      el.textContent = nickname;
    }
  });
  store.subscribe(
    ['subtitle', 'points', 'badgeCounts', 'streak'],
    ({ points, badgeCounts, subtitle, streak }) => {
      const el = document.getElementById('subtext');
      if (!el) return;
      switch (subtitle) {
        case 'badges':
          el.innerHTML = `<img class="badge" src="https://cdn.kastatic.org/khanacademy/images/9cd8eb34517f0b63-master-challenge-blue-small.png">${badgeCounts[5]}<img class="badge" src="https://cdn.kastatic.org/khanacademy/images/82110aa4c173fbfd-eclipse-small.png">${badgeCounts[4]}<img class="badge" src="https://cdn.kastatic.org/khanacademy/images/ef5234d92d438910-sun-small.png">${badgeCounts[3]}<img class="badge" src="https://cdn.kastatic.org/khanacademy/images/998a03825ec956fa-earth-small.png">${badgeCounts[2]}<img class="badge" src="https://cdn.kastatic.org/khanacademy/images/101dded2e8338832-moon-small.png">${badgeCounts[1]}<img class="badge" src='https://cdn.kastatic.org/khanacademy/images/86fb03a065d69d3c-meteorite-small.png'>${badgeCounts[0]}`;
          break;
        case 'points':
          el.innerText = points.toLocaleString() + ' pts';
          break;
        case 'streak':
          el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="12px" viewBox="0 -960 960 960" width="12px" fill="currentColor"><path d="M160-400q0-105 50-187t110-138q60-56 110-85.5l50-29.5v132q0 37 25 58.5t56 21.5q17 0 32.5-7t28.5-23l18-22q72 42 116 116.5T800-400q0 88-43 160.5T644-125q17-24 26.5-52.5T680-238q0-40-15-75.5T622-377L480-516 339-377q-29 29-44 64t-15 75q0 32 9.5 60.5T316-125q-70-42-113-114.5T160-400Zm320-4 85 83q17 17 26 38t9 45q0 49-35 83.5T480-120q-50 0-85-34.5T360-238q0-23 9-44.5t26-38.5l85-83Z"/></svg> ${streak} week streak`;
          break;
        default:
          el.innerHTML = '';
      }
    },
  );
  store.subscribe(['username'], ({ username }) => {
    const el = document.getElementById('profile-link') as HTMLAnchorElement | null;
    if (el) {
      el.href = 'https://khanacademy.org/profile/' + username;
    }
  });
  const setSubtitle = setupSelectDropdown(
    'subtitle-select-trigger',
    'subtitle-select-menu',
    value => StorageManager.set('subtitle', value as StorageData['subtitle']),
  );
  store.subscribe(['subtitle'], ({ subtitle }) => setSubtitle(subtitle));
  setupDropdown();
  setupSettingsModal();
  setupSwitches();
  setupSync(store);
  setupSignoutDropdown();
  setupTheme();
  setupMarkAllRead();
  setupNotificationsList(store);
  setupFontFamily(store);
  setupEditorSettings(store);
  setupThemeSelect(store);
  setupCommentSort(store);
}

main();
