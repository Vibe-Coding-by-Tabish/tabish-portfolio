import { motion, type Variants } from 'framer-motion';

interface NotFoundProps {
  theme: 'light' | 'dark';
  onGoHome: () => void;
  onViewResume: () => void;
}

const EMAIL = 'ansaritabishali1@gmail.com';
const MAX_PATH = 80;

const plateVariants: Variants = {
  hidden:  { opacity: 0, y: 24, rotate: -1.5 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const textVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.08, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Let modified clicks (new tab / window) fall through to the real href
const isPlainClick = (e: React.MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

// Malformed escapes (e.g. "/%E0%A4") make decodeURI throw; show those raw
function readablePath(): string {
  const raw = window.location.pathname + window.location.search;
  try {
    return decodeURI(raw);
  } catch {
    return raw;
  }
}

export default function NotFound({ theme, onGoHome, onViewResume }: NotFoundProps) {
  const rawPath = readablePath();
  const path = rawPath.length > MAX_PATH ? `${rawPath.slice(0, MAX_PATH)}…` : rawPath;
  const homeUrl = `${window.location.host}/`;

  const reportHref =
    `mailto:${EMAIL}` +
    `?subject=${encodeURIComponent(`Broken link on your portfolio: ${path}`)}` +
    `&body=${encodeURIComponent(
      `Hi Tabish,\n\nThis URL didn't work: ${window.location.href}\n` +
      `I got there from: ${document.referrer || 'typed it in / unknown'}\n`
    )}`;

  const goHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    onGoHome();
  };

  return (
    <main className="nf" aria-labelledby="nf-title">
      <div className="nf-inner">

        <motion.figure className="nf-plate" variants={plateVariants} initial="hidden" animate="visible">
          <img
            src={theme === 'dark' ? '/images/404_dark_theme.webp' : '/images/404_light_theme.webp'}
            alt="Illustration of a DNA double helix with one bent, mismatched base pair labelled 'your URL'. Caption: Fig. 404, a harmless typo. No DNA was harmed."
            width={900}
            height={1205}
            decoding="async"
          />
        </motion.figure>

        <motion.div className="nf-text" variants={textVariants} initial="hidden" animate="visible">
          <motion.p className="nf-label" variants={itemVariants}>Error 404</motion.p>
          <motion.h1 id="nf-title" className="nf-title" variants={itemVariants}>
            Variant of unknown significance
          </motion.h1>
          <motion.p className="nf-sub" variants={itemVariants}>
            <code className="nf-path">{path}</code> didn&rsquo;t align to anything in the reference genome.
            We ran it through every pipeline we have. Nothing.
          </motion.p>
          <motion.p className="nf-redirect" variants={itemVariants}>
            The reference sequence lives at{' '}
            <a href="/" onClick={goHome} className="nf-home-url">{homeUrl}</a>
          </motion.p>

          <motion.div className="hero-cta nf-cta" variants={itemVariants}>
            <a href="/" onClick={goHome} className="btn btn-primary">Return to reference →</a>
            <button className="btn btn-outline" onClick={onViewResume}>View my resume</button>
            <a href={reportHref} className="btn btn-outline">Report this variant</a>
          </motion.div>
        </motion.div>

      </div>
    </main>
  );
}
