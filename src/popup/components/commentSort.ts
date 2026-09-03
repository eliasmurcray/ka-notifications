import type { Store } from 'keysub';
import type { StorageData } from '../../types/extension';
import { StorageManager } from '../../lib/storage';
import { setupSelectDropdown } from './selectDropdown';

export function setupCommentSort(store: Store<StorageData>): void {
  const setCommentSort = setupSelectDropdown(
    'default-comment-sort-select-trigger',
    'default-comment-sort-select-menu',
    value => {
      StorageManager.set('commentSort', value);
    },
  );

  store.subscribe(['commentSort'], ({ commentSort }) => {
    if (!commentSort) return;
    setCommentSort(String(commentSort));
  });
}
