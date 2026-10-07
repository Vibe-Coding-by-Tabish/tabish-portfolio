import { motion, useScroll, useTransform, type MotionStyle } from 'framer-motion';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onViewResume: () => void;
  // Set on pages without the home sections (404, skills): the logo goes home
  onNavigateHome?: () => void;
}

// Section navigation lives in the floating Dock; the header keeps identity,
// the resume and the theme switch.
export default function Header({ theme, onToggleTheme, onViewResume, onNavigateHome }: HeaderProps) {
  // 0 at the top of the page, 1 once content has scrolled well under the
  // header; CSS reads it to firm up the material and fade in the edge shadow
  const { scrollY } = useScroll();
  const solidity = useTransform(scrollY, [0, 80], [0, 1]);

  const scrollToTop = () =>
    onNavigateHome ? onNavigateHome() : window.scrollTo({ top: 0, behavior: 'smooth' });

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

        <div className="header-actions">
          <button className="nav-resume" onClick={onViewResume}>
            Resume
          </button>
          <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '◐ Dark' : '◑ Light'}
          </button>
        </div>

      </div>
    </motion.header>
  );
}
