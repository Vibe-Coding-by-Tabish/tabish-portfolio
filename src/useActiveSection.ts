import { useEffect, useState } from 'react';

// A section counts as current once its top passes this height in the viewport
const READ_LINE = 0.4;

// Scroll spy for the home page: the last of `ids` whose top has passed the
// reading line, or the final one once the page is scrolled to the bottom (a
// short last section may never reach the line). null above the first section.
export function useActiveSection<T extends string>(ids: readonly T[], enabled: boolean): T | null {
  const [active, setActive] = useState<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * READ_LINE;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current: T | null = null;
      for (const id of ids) {
        const el = document.querySelector(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      if (atBottom && document.querySelector(ids[ids.length - 1])) current = ids[ids.length - 1];
      setActive(current);
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ids, enabled]);

  return enabled ? active : null;
}
