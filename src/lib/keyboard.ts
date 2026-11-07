/**
 * Whether a single-key page shortcut (like "/" or "N") should be ignored for this event: a modifier
 * is held, the key is repeating, someone already handled it, the user is typing, or an overlay
 * (dialog, menu, select list) is open and owns the keyboard.
 */
export function shouldIgnoreShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat) return true;
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
    return true;
  return (
    document.querySelector(
      "[role=dialog], [role=alertdialog], [role=menu], [role=listbox]",
    ) !== null
  );
}
