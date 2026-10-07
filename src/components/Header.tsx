import { useState, useEffect, useRef } from 'react';
import {
  motion, AnimatePresence, animate, useMotionValue, useScroll, useTransform,
  type MotionStyle, type PanInfo,
} from 'framer-motion';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onViewResume: () => void;
  onViewSkills: () => void;
  // Set on pages without the home sections (404, skills): links go home instead of scrolling
  onNavigateHome?: (section?: string) => void;
}

// Pushing the open menu up by this much (after momentum) closes it
const MENU_CLOSE_PX = 48;
// Apple's momentum projection, tuned snappier than scrolling for a short menu
const project = (velocity: number, decelerationRate = 0.99) =>
  ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);

const NAV_LINKS = [
  { label: 'Projects',     href: '#projects'     },
  { label: 'Publications', href: '#publications' },
  { label: 'Contact',      href: '#contact'      },
] as const;

export default function Header({ theme, onToggleTheme, onViewResume, onViewSkills, onNavigateHome }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // 0 at the top of the page, 1 once content has scrolled well under the
  // header; CSS reads it to firm up the material and fade in the edge shadow
  const { scrollY } = useScroll();
  const solidity = useTransform(scrollY, [0, 80], [0, 1]);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 640) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // A smooth scroll started while the mobile menu collapses gets cancelled,
  // so when the menu is open, queue the scroll and run it on exit complete.
  const pendingScroll = useRef<(() => void) | null>(null);

  const runScroll = (scroll: () => void) => {
    if (mobileOpen) {
      pendingScroll.current = scroll;
      setMobileOpen(false);
    } else {
      scroll();
    }
  };

  const onMenuExitComplete = () => {
    pendingScroll.current?.();
    pendingScroll.current = null;
    menuY.set(0);
  };

  // The open menu can be pushed back up into the header with a finger
  const menuY = useMotionValue(0);
  const menuOpacity = useTransform(menuY, [-120, 0], [0.2, 1]);
  const draggedMenu = useRef(false);

  // These animations replace framer's own snap-back to the drag constraints
  const onMenuDragEnd = (_: PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    if (menuY.get() + project(velocity) < -MENU_CLOSE_PX) {
      // Keep travelling the way the finger was going while the menu collapses
      animate(menuY, -120, { type: 'spring', bounce: 0, duration: 0.3, velocity });
      setMobileOpen(false);
    } else {
      animate(menuY, 0, { type: 'spring', bounce: 0.25, duration: 0.4, velocity });
    }
    // The click (if any) fires right after pointerup; forget the drag after it
    setTimeout(() => { draggedMenu.current = false; }, 0);
  };

  // A drag that ends over a link must not also count as tapping it
  const swallowClickAfterDrag = (e: React.MouseEvent) => {
    if (!draggedMenu.current) return;
    draggedMenu.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const scrollTo = (href: string) =>
    runScroll(() => onNavigateHome
      ? onNavigateHome(href)
      : document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }));

  const scrollToTop = () =>
    runScroll(() => onNavigateHome
      ? onNavigateHome()
      : window.scrollTo({ top: 0, behavior: 'smooth' }));

  const handleResume = () => {
    setMobileOpen(false);
    onViewResume();
  };

  const handleSkills = () => {
    setMobileOpen(false);
    onViewSkills();
  };

  return (
    <motion.header
      className="header"
      style={{ '--header-p': solidity } as MotionStyle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="header-inner">

        {/* Logo / name */}
        <button className="header-logo" onClick={scrollToTop} aria-label={onNavigateHome ? 'Go to homepage' : 'Scroll to top'}>
          Tabish
        </button>

        {/* Desktop navigation */}
        <nav className="header-nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              className="nav-link"
              onClick={() => scrollTo(href)}
            >
              {label}
            </button>
          ))}
          <button className="nav-link" onClick={handleSkills}>
            Skills
          </button>
          <button className="nav-resume" onClick={handleResume}>
            Resume
          </button>
          <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '◐ Dark' : '◑ Light'}
          </button>
        </nav>

        {/* Hamburger — mobile only */}
        <button
          className={`hamburger${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
        </button>

      </div>

      {/* Mobile dropdown */}
      <AnimatePresence onExitComplete={onMenuExitComplete}>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <motion.div
              className="mobile-menu-inner"
              style={{ y: menuY, opacity: menuOpacity }}
              drag="y"
              // Free to move up (closing); resists being pulled down
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 1, bottom: 0.12 }}
              dragMomentum={false}
              onDragStart={() => { draggedMenu.current = true; }}
              onDragEnd={onMenuDragEnd}
              onClickCapture={swallowClickAfterDrag}
            >
              {NAV_LINKS.map(({ label, href }) => (
                <button
                  key={label}
                  className="mobile-nav-link"
                  onClick={() => scrollTo(href)}
                >
                  {label}
                </button>
              ))}
              <button className="mobile-nav-link" onClick={handleSkills}>
                Skills
              </button>
              <button className="mobile-nav-link" onClick={handleResume}>
                Resume
              </button>
              <button
                className="mobile-nav-link mobile-theme-toggle"
                onClick={() => { setMobileOpen(false); onToggleTheme(); }}
              >
                {theme === 'light' ? '◐ Dark mode' : '◑ Light mode'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
