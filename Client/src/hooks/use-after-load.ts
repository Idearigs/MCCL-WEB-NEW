import { useEffect, useState } from "react";

/**
 * True once the page has finished loading and the browser is idle.
 * Used to fetch code and media nobody needs for the first paint (chat, drawers, the
 * search panel, the hero film) without competing with the page itself.
 */
let settled = false;
const listeners = new Set<() => void>();

const settle = () => {
  if (settled) return;
  settled = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
};

if (typeof window !== "undefined") {
  const idle = () => {
    const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
    if (ric) ric(settle, { timeout: 2500 });
    else setTimeout(settle, 300);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
  // Never wait forever (a slow third-party request can hold the load event back).
  setTimeout(settle, 6000);
}

export const useAfterLoad = (): boolean => {
  const [ready, setReady] = useState(settled);
  useEffect(() => {
    if (settled) { setReady(true); return; }
    const fn = () => setReady(true);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return ready;
};

export default useAfterLoad;
