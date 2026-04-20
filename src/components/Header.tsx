import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onViewResume: () => void;
}

const NAV_LINKS = [
  { label: 'Projects', href: '#projects' },
  { label: 'About',    href: '#about'    },
  { label: 'Contact',  href: '#contact'  },
] as const;

export default function Header({ theme, onToggleTheme, onViewResume }: HeaderProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detect scroll to apply blur/shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 640) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResume = () => {
    setMobileOpen(false);
    onViewResume();
  };

  return (
    <motion.header
      className={`header${scrolled ? ' scrolled' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="header-inner">

        {/* Logo / name */}
        <button className="header-logo" onClick={scrollToTop} aria-label="Scroll to top">
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="mobile-menu-inner">
              {NAV_LINKS.map(({ label, href }) => (
                <button
                  key={label}
                  className="mobile-nav-link"
                  onClick={() => scrollTo(href)}
                >
                  {label}
                </button>
              ))}
              <button className="mobile-nav-link" onClick={handleResume}>
                Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
