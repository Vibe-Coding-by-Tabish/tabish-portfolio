import { useState, useEffect, useCallback } from 'react';
import { motion, type Variants, useReducedMotion } from 'framer-motion';

interface HeroProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onViewResume: () => void;
}

// ── Animation Variants ────────────────────────────────────────

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
};

const nameVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: 'easeOut' } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const highlightList: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.08 },
  },
};

const highlightItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── Image Stack Logic ─────────────────────────────────────────

// Add photos to /public/images/ and list them here
const IMAGES = [
  '/images/anchoring.jpg',
  '/images/kafka.gif',
  '/images/iit_kgp_hoodie.png',
  '/images/backend.gif',
  '/images/isbnm.jpeg',
];

type Slot = 'front' | 'back-right' | 'back-left' | 'hidden';

function getSlot(index: number, active: number, total: number): Slot {
  const offset = (index - active + total) % total;
  if (offset === 0) return 'front';
  if (offset === 1) return 'back-right';
  if (offset === total - 1) return 'back-left';
  return 'hidden';
}

const SLOT_TRANSFORM: Record<Slot, { x: number; y: number; rotate: number; scale: number; opacity: number }> = {
  'front':      { x: 0,   y: 0,  rotate: 0,  scale: 1,    opacity: 1    },
  'back-right': { x: 26,  y: 16, rotate: 5,  scale: 0.93, opacity: 0.72 },
  'back-left':  { x: -18, y: 24, rotate: -4, scale: 0.89, opacity: 0.52 },
  'hidden':     { x: 0,   y: 0,  rotate: 0,  scale: 0.85, opacity: 0    },
};

const SLOT_Z: Record<Slot, number> = {
  'front': 10, 'back-right': 5, 'back-left': 3, 'hidden': 0,
};

const CARD_TRANSITION = { duration: 0.55, ease: 'easeInOut' } as const;
const AUTO_CYCLE_MS = 7000;

// ── Data ──────────────────────────────────────────────────────

const HIGHLIGHTS = [
  'Top 10 All India – Intel AI Hackathon @ IEEE Indicon, IIT KGP',
  '1.5+ yrs SDE @ NonStop io — shipped 5 PoCs, leading a product end-to-end',
  '1st Runner-Up – Data Analytics Case Competition, ISB&M Pune',
] as const;

// ── Component ─────────────────────────────────────────────────

export default function Hero({ theme, onToggleTheme, onViewResume }: HeroProps) {
  const prefersReducedMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setActiveIndex(i => (i + 1) % IMAGES.length),
    []
  );
  const prev = useCallback(
    () => setActiveIndex(i => (i - 1 + IMAGES.length) % IMAGES.length),
    []
  );

  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    const id = setInterval(next, AUTO_CYCLE_MS);
    return () => clearInterval(id);
  }, [paused, prefersReducedMotion, next]);

  const scrollToProjects = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.main
      className="hero"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {/* Ambient background accent */}
      {!prefersReducedMotion && (
        <motion.div
          className="hero-blob"
          animate={{ y: [0, -22, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      {/* Nav */}
      <nav className="hero-nav">
        <motion.button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.4 }}
        >
          {theme === 'light' ? '◐ Dark' : '◑ Light'}
        </motion.button>
      </nav>

      {/* Two-column layout */}
      <div className="hero-content">

        {/* ── Left: text ──────────────────────────────────────── */}
        <motion.div
          className="hero-left"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className="hero-name" variants={nameVariants}>
            Tabish Ali Ansari.
          </motion.h1>

          <motion.h2 className="hero-headline" variants={fadeUp}>
            Building and Shipping Products · End-to-End Product Development
          </motion.h2>

          <motion.div className="hero-sub" variants={fadeUp}>
            <p>Data Engineering · Data Science · Software Engineering · Machine Learning</p>
            <p>Public Speaking · Talks · Football · Table Tennis</p>
          </motion.div>

          <motion.p className="hero-description" variants={fadeUp}>
            Building scalable systems across Backend, Data, and AI.
          </motion.p>

          <motion.ul className="hero-highlights" variants={highlightList}>
            {HIGHLIGHTS.map((text, i) => (
              <motion.li key={text} variants={highlightItem}>
                <span className="highlight-num">0{i + 1}</span>
                <span className="highlight-text">{text}</span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div className="hero-cta" variants={fadeUp}>
            <motion.a
              href="#projects"
              className="btn btn-primary"
              onClick={scrollToProjects}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              View Projects
            </motion.a>
            <motion.button
              className="btn btn-outline"
              onClick={onViewResume}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Resume
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ── Right: image stack ──────────────────────────────── */}
        <motion.div
          className="hero-right"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
        >
          {/* Stack */}
          <div
            className="image-stack"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {IMAGES.map((src, i) => {
              const slot = getSlot(i, activeIndex, IMAGES.length);
              const transform = SLOT_TRANSFORM[slot];
              return (
                <motion.div
                  key={i}
                  className="stack-card"
                  style={{ zIndex: SLOT_Z[slot] }}
                  animate={transform}
                  transition={CARD_TRANSITION}
                >
                  <img src={src} alt="" draggable={false} />
                </motion.div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="stack-nav">
            <motion.button
              className="stack-nav-btn"
              onClick={prev}
              aria-label="Previous photo"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
            >
              ←
            </motion.button>

            <div className="stack-dots" role="tablist" aria-label="Select photo">
              {IMAGES.map((_, i) => (
                <button
                  key={i}
                  className={`stack-dot${i === activeIndex ? ' active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-selected={i === activeIndex}
                  role="tab"
                />
              ))}
            </div>

            <motion.button
              className="stack-nav-btn"
              onClick={next}
              aria-label="Next photo"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
            >
              →
            </motion.button>
          </div>
        </motion.div>

      </div>
    </motion.main>
  );
}
