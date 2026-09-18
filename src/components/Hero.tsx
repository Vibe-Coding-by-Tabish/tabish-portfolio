import { useState, useEffect, useCallback } from 'react';
import { motion, type Variants, useReducedMotion } from 'framer-motion';
import { FaLinkedin, FaGithub, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

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

// Add photos to /public/images/ and list them here.
// Stored as WebP: the stills are resized to cover the 248x330 card at 2x DPR,
// and the two talk clips are animated WebP rather than multi-MB GIFs.
const IMAGES = [
  {
    src: '/images/anchoring.webp',
    alt: 'Tabish anchoring the NonStop io annual awards night',
  },
  {
    // TODO: confirm wording — described from the clip itself
    src: '/images/kafka.webp',
    alt: 'Tabish presenting "Kafka & Under the Hood" at NonStop io Technologies, Pune',
  },
  {
    src: '/images/iit_kgp_hoodie.webp',
    alt: 'Intel AI Hackathon finals at IIT Kharagpur',
  },
  {
    // TODO: confirm wording — described from the clip itself
    src: '/images/backend.webp',
    alt: 'Tabish hosting a quiz segment in front of an audience at a NonStop io event',
  },
  {
    src: '/images/isbnm.webp',
    alt: 'ISB&M Pune analytics case competition',
  },
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

// A drag past this distance (or flicked faster than this) advances the stack
const SWIPE_DISTANCE_PX = 60;
const SWIPE_VELOCITY = 450;

// ── Data ──────────────────────────────────────────────────────

const HIGHLIGHTS = [
  'Maintain a regulated clinical variant review platform across 5 environments for a US genomics laboratory',
  'Built InterGenix: HL7 v2, FHIR and OpenELIS integration for clinical data exchange',
  'StrixFlow: open-source orchestration across 5 workflow engines, 395 tests',
  'Top 10 All India, Intel AI Hackathon @ IEEE INDICON, IIT Kharagpur',
] as const;

// ── Component ─────────────────────────────────────────────────

export default function Hero() {
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
    <motion.main className="hero">
      {/* Ambient background accent */}
      {!prefersReducedMotion && (
        <motion.div
          className="hero-blob"
          animate={{ y: [0, -22, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

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
            Building systems for clinical genomics and health data
          </motion.h2>

          <motion.div className="hero-sub" variants={fadeUp}>
            <p>Health Data Infrastructure · Workflow Orchestration · Data Engineering · Machine Learning</p>
          </motion.div>

          <motion.p className="hero-description" variants={fadeUp}>
            End-to-End Product Development
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

            <div className="hero-social">
              {[
                { href: 'https://linkedin.com/in/tabishaliansari', icon: <FaLinkedin />, label: 'LinkedIn' },
                { href: 'https://github.com/tabishaliansari',      icon: <FaGithub />,   label: 'GitHub'   },
                { href: 'https://x.com/tabish_ali004',           icon: <FaXTwitter />, label: 'X'        },
                { href: 'https://youtube.com/@teammavericks-00',    icon: <FaYoutube />,  label: 'YouTube'  },
              ].map(({ href, icon, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn"
                  aria-label={label}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
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
            {IMAGES.map(({ src, alt }, i) => {
              const slot = getSlot(i, activeIndex, IMAGES.length);
              const transform = SLOT_TRANSFORM[slot];
              const isFront = slot === 'front';
              return (
                <motion.div
                  key={i}
                  className="stack-card"
                  style={{ zIndex: SLOT_Z[slot] }}
                  animate={transform}
                  transition={CARD_TRANSITION}
                  // Only the top card is draggable; constraints snap it back to
                  // the front slot's x: 0 so `animate` stays in charge afterwards
                  drag={isFront ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.5}
                  dragMomentum={false}
                  onDragStart={() => setPaused(true)}
                  onDragEnd={(_, info) => {
                    setPaused(false);
                    const { offset, velocity } = info;
                    if (offset.x < -SWIPE_DISTANCE_PX || velocity.x < -SWIPE_VELOCITY) next();
                    else if (offset.x > SWIPE_DISTANCE_PX || velocity.x > SWIPE_VELOCITY) prev();
                  }}
                >
                  <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    decoding="async"
                    // The first card is the hero's LCP candidate; the rest sit in
                    // the same box, so they load too — just behind it in the queue
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'low'}
                  />
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
