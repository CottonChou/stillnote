// Content script for x.com and twitter.com. It only remembers which tweet was
// under the pointer so a later menu click can save that post. No imports:
// content scripts are classic scripts, and this file is also injected again
// after the user grants access.
(() => {
  const root = globalThis as typeof globalThis & { __stillnoteTweetTarget?: boolean };
  if (root.__stillnoteTweetTarget) return;
  root.__stillnoteTweetTarget = true;

  document.addEventListener("contextmenu", (event) => {
    const rawTarget = event.target;
    const element = rawTarget instanceof Element
      ? rawTarget
      : rawTarget instanceof Node
        ? rawTarget.parentElement
        : null;
    if (!element) return;
    const article = element.closest('article[data-testid="tweet"]');
    for (const node of document.querySelectorAll("[data-stillnote-tweet-target]")) {
      node.removeAttribute("data-stillnote-tweet-target");
    }
    if (article) article.setAttribute("data-stillnote-tweet-target", "1");
  }, true);
})();
