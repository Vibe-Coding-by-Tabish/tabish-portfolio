import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './components/Hero';
import Header from './components/Header';
import Projects from './components/Projects';
import Publications from './components/Publications';
import Timeline from './components/Timeline';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ResumeViewer from './components/ResumeViewer';

type Page = 'home' | 'resume';
type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark';

// The inline script in index.html already resolved this before first paint;
// read it back so React's state matches what's on screen.
function getInitialTheme(): Theme {
  const preset = document.documentElement.getAttribute('data-theme');
  if (isTheme(preset)) return preset;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [page, setPage] = useState<Page>(
    window.location.pathname === '/resume' ? 'resume' : 'home'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // Follow the OS while the visitor hasn't picked a theme themselves
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!storedTheme()) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setPage(window.location.pathname === '/resume' ? 'resume' : 'home');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (to: Page) => {
    window.history.pushState(null, '', to === 'home' ? '/' : '/resume');
    setPage(to);
  };

  // Only an explicit toggle is persisted — that's what marks the preference as
  // the visitor's own and stops the OS listener above from overriding it.
  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked — the choice still applies for this session */
    }
    setTheme(next);
  };

  return (
    <AnimatePresence mode="wait">
      {page === 'resume' ? (
        <ResumeViewer
          key="resume"
          theme={theme}
          onBack={() => navigate('home')}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <motion.div
          key="home"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <Header theme={theme} onToggleTheme={toggleTheme} onViewResume={() => navigate('resume')} />
          <div style={{ paddingTop: 64 }}>
            <Hero />
            <Projects />
            <Timeline />
            <Publications />
            <Contact />
            <Footer onViewResume={() => navigate('resume')} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
