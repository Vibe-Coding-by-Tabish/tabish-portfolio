import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './components/Hero';
import Header from './components/Header';
import Projects from './components/Projects';
import Publications from './components/Publications';
import Timeline from './components/Timeline';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ResumeViewer from './components/ResumeViewer';
import NotFound from './components/NotFound';

type Page = 'home' | 'resume' | 'notfound';
type Theme = 'light' | 'dark';

function pageFromPath(pathname: string): Page {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/index.html') return 'home';
  if (path === '/resume') return 'resume';
  return 'notfound';
}

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
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  // Where to land once the home page mounts after leaving the 404 page
  const pendingSection = useRef<string | null>(null);

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
      setPage(pageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (to: Exclude<Page, 'notfound'>) => {
    window.history.pushState(null, '', to === 'home' ? '/' : '/resume');
    setPage(to);
  };

  // From the 404 page: go home, then jump to the requested section (or the top)
  const goHome = (section?: string) => {
    pendingSection.current = section ?? 'top';
    navigate('home');
  };

  // Runs when the home tree mounts, after the 404 page's exit animation
  const landOnPendingSection = (el: HTMLDivElement | null) => {
    const target = pendingSection.current;
    if (!el || !target) return;
    pendingSection.current = null;
    requestAnimationFrame(() => {
      if (target === 'top') window.scrollTo(0, 0);
      else document.querySelector(target)?.scrollIntoView();
    });
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
      ) : page === 'notfound' ? (
        <motion.div
          key="notfound"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <Header theme={theme} onToggleTheme={toggleTheme} onViewResume={() => navigate('resume')} onNavigateHome={goHome} />
          <div style={{ paddingTop: 64 }}>
            <NotFound theme={theme} onGoHome={() => goHome()} onViewResume={() => navigate('resume')} />
            <Footer onViewResume={() => navigate('resume')} onNavigateHome={goHome} />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="home"
          ref={landOnPendingSection}
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
