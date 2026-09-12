function observeUntil<T>(
  check: () => T | null | undefined,
  timeoutMs?: number,
): Promise<T | undefined> {
  return new Promise(resolve => {
    const result = check();
    if (result) return resolve(result);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      const result = check();
      if (result) {
        observer.disconnect();
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        resolve(result);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    if (timeoutMs !== undefined) {
      timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(undefined);
      }, timeoutMs);
    }
  });
}

export const waitForId = (id: string, timeoutMs?: number) =>
  observeUntil(() => document.getElementById(id), timeoutMs);

export const waitForClass = (className: string, timeoutMs?: number) =>
  observeUntil(() => {
    const els = document.getElementsByClassName(className);
    return els.length ? Array.from(els) : null;
  }, timeoutMs);

export const waitForSelector = (selector: string, timeoutMs?: number) =>
  observeUntil(() => document.querySelector(selector), timeoutMs);
