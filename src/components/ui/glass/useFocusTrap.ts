"use client";

import * as React from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap — V2.5 accessibility.
 * While `active`, traps Tab/Shift+Tab inside the referenced container,
 * closes on Escape (via `onClose`), and restores focus to the previously
 * focused element when the trap deactivates.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onClose?: () => void) {
  const ref = React.useRef<T | null>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!active) return;
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const node = ref.current;
    const getItems = () =>
      Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Move focus into the dialog (first focusable, else the container).
    const first = getItems()[0];
    (first ?? node)?.focus?.();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = getItems();
      if (items.length === 0) {
        e.preventDefault();
        node.focus?.();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      const inside = activeEl != null && node.contains(activeEl);
      if (e.shiftKey) {
        if (!inside || activeEl === firstItem) {
          e.preventDefault();
          lastItem.focus();
        }
      } else if (!inside || activeEl === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const restore = restoreRef.current;
      if (restore && document.contains(restore)) restore.focus?.();
    };
  }, [active]);

  return ref;
}

export default useFocusTrap;
