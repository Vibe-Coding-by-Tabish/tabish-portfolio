import { useEffect, useState, type RefObject } from 'react';
import { useInView } from 'framer-motion';

// True once the element is in view and the page has stopped scrolling for
// `idleMs`; stays true after that. Demos start driving themselves only then,
// so a visitor (or a dock jump) flying past never sets one off, and a demo
// never grows under a scroll that's still on its way somewhere else.
export function useSettledInView(ref: RefObject<Element | null>, amount = 0.35, idleMs = 300) {
  const inView = useInView(ref, { amount });
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (settled || !inView) return;
    let timer = window.setTimeout(() => setSettled(true), idleMs);
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSettled(true), idleMs);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [inView, settled, idleMs]);

  return settled;
}
