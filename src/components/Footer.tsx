import { motion } from 'framer-motion';

interface FooterProps {
  onViewResume: () => void;
}

const NAV = [
  { label: 'Projects', href: '#projects' },
  { label: 'Contact',  href: '#contact'  },
] as const;

const fadeUp = {
  initial:    { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
  viewport:   { once: true, amount: 0.3 },
} as const;

const scrollTo = (href: string) =>
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer({ onViewResume }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-container">

        <motion.div className="footer-main" {...fadeUp}>

          {/* Left — identity */}
          <div className="footer-identity">
            <p className="footer-name">Tabish Ali Ansari</p>
            <p className="footer-tagline">Clinical genomics infrastructure · Pune, India</p>
          </div>

          {/* Right — nav */}
          <nav className="footer-nav" aria-label="Footer navigation">
            {NAV.map(({ label, href }) => (
              <button key={label} className="footer-link" onClick={() => scrollTo(href)}>
                {label}
              </button>
            ))}
            <button className="footer-link" onClick={onViewResume}>
              Resume
            </button>
          </nav>

        </motion.div>

        <motion.div className="footer-bottom" {...fadeUp} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}>
          <p className="footer-copy">© 2026 Tabish Ali Ansari</p>
        </motion.div>

      </div>
    </footer>
  );
}
