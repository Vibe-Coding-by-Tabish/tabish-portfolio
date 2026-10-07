import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type DockTarget = 'home' | '#projects' | '#publications' | 'skills' | '#contact';

const ITEMS: { id: DockTarget; label: string }[] = [
  { id: 'home',          label: 'Home'     },
  { id: '#projects',     label: 'Projects' },
  { id: '#publications', label: 'Papers'   },
  { id: 'skills',        label: 'Skills'   },
  { id: '#contact',      label: 'Contact'  },
];

// Near the top of a page the dock stays open so visitors see where they can go
const TOP_ZONE_PX = 80;
// Scrolling this far after opening it by hand tucks it away again
const CLOSE_ON_SCROLL_PX = 48;
// Clearance kept between the dock and anything it must not cover
const AVOID_MARGIN_PX = 12;

const SPRING = { type: 'spring', bounce: 0.15, duration: 0.45 } as const;

interface DockProps {
  // The section (or page) the visitor is on; null when none applies
  active: DockTarget | null;
  onSelect: (id: DockTarget) => void;
}

// Floating glass navigation. Compact, it shows only where you are: the current
// section's name plus a dot for each other one, in page order. Tap it (or reach
// it with the keyboard) and it opens to every section.
export default function Dock({ active, onSelect }: DockProps) {
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(() => window.scrollY < TOP_ZONE_PX);
  // True while the dock would sit on top of an element marked data-dock-avoid
  // (the hero's call-to-action on short screens); it slides away until then
  const [stepAside, setStepAside] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const openedAtY = useRef(0);

  const expanded = open || atTop || active === null;

  useEffect(() => {
    let frame = 0;
    // Where the dock rests, from layout offsets: they ignore transforms, so
    // the slide-away itself can't move the zone and make it flicker
    const checkCollision = () => {
      frame = 0;
      const wrap = wrapRef.current;
      const nav = navRef.current;
      if (!wrap || !nav) return;
      const top = wrap.offsetTop - AVOID_MARGIN_PX;
      const bottom = wrap.offsetTop + wrap.offsetHeight;
      const left = wrap.offsetLeft + nav.offsetLeft;
      const right = left + nav.offsetWidth;
      const hit = [...document.querySelectorAll('[data-dock-avoid]')].some(el => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.bottom > top && r.top < bottom && r.right > left && r.left < right;
      });
      setStepAside(hit);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(checkCollision); };

    const onScroll = () => {
      setAtTop(window.scrollY < TOP_ZONE_PX);
      if (Math.abs(window.scrollY - openedAtY.current) > CLOSE_ON_SCROLL_PX) setOpen(false);
      schedule();
    };
    schedule();
    // The hero animates in after load; re-check once it has settled
    const settle = window.setTimeout(schedule, 1200);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  // While opened by hand: a tap elsewhere or Escape closes it
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const expand = () => {
    openedAtY.current = window.scrollY;
    setOpen(true);
  };

  const handleClick = (id: DockTarget) => {
    if (!expanded) {
      expand();
      return;
    }
    setOpen(false);
    onSelect(id);
  };

  return (
    <motion.div
      ref={wrapRef}
      className="dock-wrap"
      animate={stepAside ? { y: 28, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={SPRING}
      // Hidden means hidden for everyone: no focus or taps on an invisible dock
      inert={stepAside}
    >
      <motion.nav
        ref={navRef}
        className={`dock${expanded ? ' is-open' : ''}`}
        aria-label="Sections"
        layout
        transition={SPRING}
        // Declared here so framer keeps the pill round while it resizes
        style={{ borderRadius: 999 }}
      >
        {ITEMS.map(({ id, label }) => {
          const isActive = id === active;
          const showLabel = expanded || isActive;
          return (
            <motion.button
              key={id}
              layout
              transition={SPRING}
              className={`dock-item${isActive ? ' is-active' : ''}${showLabel ? '' : ' is-dot'}`}
              aria-current={isActive ? 'location' : undefined}
              aria-label={showLabel ? undefined : `${label} (show all sections)`}
              onClick={() => handleClick(id)}
              // Keyboard users get the full dock as soon as they reach it
              onFocus={e => { if (!expanded && e.currentTarget.matches(':focus-visible')) expand(); }}
              style={{ borderRadius: 999 }}
            >
              {isActive && (
                <motion.span
                  className="dock-active-pill"
                  layoutId="dock-active-pill"
                  transition={SPRING}
                  style={{ borderRadius: 999 }}
                  aria-hidden="true"
                />
              )}
              {showLabel ? (
                <motion.span
                  className="dock-label"
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.08 }}
                >
                  {label}
                </motion.span>
              ) : (
                <motion.span className="dock-dot" layout="position" aria-hidden="true" />
              )}
            </motion.button>
          );
        })}
      </motion.nav>
    </motion.div>
  );
}
