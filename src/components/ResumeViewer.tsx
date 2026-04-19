import { motion } from 'framer-motion';

interface ResumeViewerProps {
  theme: 'light' | 'dark';
  onBack: () => void;
  onToggleTheme: () => void;
}

export default function ResumeViewer({ theme, onBack, onToggleTheme }: ResumeViewerProps) {
  return (
    <motion.div
      className="resume-viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.25 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <nav className="resume-nav">
        <button className="btn btn-outline" onClick={onBack}>
          ← Portfolio
        </button>

        <span className="resume-nav-title">Resume</span>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '◐ Dark' : '◑ Light'}
          </button>
          <a className="btn btn-primary" href="/resume.pdf" download="Resume.pdf">
            Download
          </a>
        </div>
      </nav>

      <iframe
        className="resume-iframe"
        src="/resume.pdf"
        title="Resume"
      />
    </motion.div>
  );
}
