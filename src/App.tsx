import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import Hero from './components/Hero';
import Header from './components/Header';
import Projects from './components/Projects';
import Publications from './components/Publications';
import Timeline from './components/Timeline';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ResumeViewer from './components/ResumeViewer';
import NotFound from './components/NotFound';
import Skills from './components/Skills';
import Dock, { type DockTarget } from './components/Dock';
import { useActiveSection } from './useActiveSection';
import { PAGE_META } from './pageMeta';
import { applyPageMeta } from './headMeta';

type Page = 'home' | 'resume' | 'skills' | 'notfound';
type Theme = 'light' | 'dark';

// Home-page sections the dock tracks, in page order
const HOME_SECTIONS = ['#projects', '#publications', '#contact'] as const;

function pageFromPath(pathname: string): Page {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/index.html') return 'home';
  if (path === '/resume') return 'resume';
  if (path === '/skills') return 'skills';
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
  const homeSection = useActiveSection(HOME_SECTIONS, page === 'home');
  const dockActive: DockTarget | null = page === 'skills' ? 'skills' : homeSection;

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
    if (page === 'notfound') document.title = '404 · Variant of unknown significance | Tabish Ali Ansari';
    else applyPageMeta(PAGE_META[page]);
  }, [page]);

  useEffect(() => {
    const handlePop = () => {
      setPage(pageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (to: Exclude<Page, 'notfound'>) => {
    const path = PAGE_META[to].path;
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
    if (to === page) window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage(to);
  };

  // From a page without the home sections: go home, then jump to the requested section (or the top)
  const goHome = (section?: string) => {
    pendingSection.current = section ?? 'top';
    navigate('home');
  };

  // Runs when the home tree mounts, after the previous page's exit animation
  const landOnPendingSection = (el: HTMLDivElement | null) => {
    const target = pendingSection.current;
    if (!el || !target) return;
    pendingSection.current = null;
    requestAnimationFrame(() => {
      if (target === 'top') window.scrollTo(0, 0);
      else document.querySelector(target)?.scrollIntoView();
    });
  };

  // Sub-pages mount after the previous page's exit; open them at the top
  // (or at the #fragment in a direct link like /skills#data-engineering)
  // Stable identity: an inline ref callback would re-run on every render
  const startAtTop = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    requestAnimationFrame(() => {
      const target = window.location.hash && document.querySelector(window.location.hash);
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    });
  }, []);

  const selectFromDock = (id: DockTarget) => {
    if (id === 'skills') navigate('skills');
    else if (page === 'home') document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    else goHome(id);
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
    // Visitors who ask their OS for reduced motion get fades instead of
    // slides, scales and springs, site-wide
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {page === 'resume' ? (
          <ResumeViewer
            key="resume"
            theme={theme}
            onBack={() => navigate('home')}
            onToggleTheme={toggleTheme}
          />
        ) : page === 'notfound' || page === 'skills' ? (
          <motion.div
            key={page}
            ref={startAtTop}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <Header theme={theme} onToggleTheme={toggleTheme} onViewResume={() => navigate('resume')} onNavigateHome={() => goHome()} />
            <div style={{ paddingTop: 64 }}>
              {page === 'skills'
                ? <Skills onViewResume={() => navigate('resume')} onNavigateHome={goHome} />
                : <NotFound theme={theme} onGoHome={() => goHome()} onViewResume={() => navigate('resume')} />}
              <Footer onViewResume={() => navigate('resume')} onViewSkills={() => navigate('skills')} onNavigateHome={goHome} />
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
              <Footer onViewResume={() => navigate('resume')} onViewSkills={() => navigate('skills')} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {page !== 'resume' && <Dock active={dockActive} onSelect={selectFromDock} />}
    </MotionConfig>
  );
}
