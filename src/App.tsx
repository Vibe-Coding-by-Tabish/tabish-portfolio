import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './components/Hero';
import Header from './components/Header';
import Projects from './components/Projects';
import ResumeViewer from './components/ResumeViewer';

type Page = 'home' | 'resume';
type Theme = 'light' | 'dark';

export default function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [page, setPage] = useState<Page>(
    window.location.pathname === '/resume' ? 'resume' : 'home'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
