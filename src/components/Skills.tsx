import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, type PanInfo, type Variants } from 'framer-motion';
import { EMAIL, OPTIONS, optionById, optionFromHash, type OptionId, type SkillOption } from './skills/data';
import Glyph from './skills/Glyph';
import './skills/skills.css';

// Each centrepiece is its own chunk, fetched when its option is opened
const PipelineStage = lazy(() => import('./skills/PipelineStage'));
const SoftwareStage = lazy(() => import('./skills/SoftwareStage'));
const LineupStage = lazy(() => import('./skills/LineupStage'));
const InteropStage = lazy(() => import('./skills/InteropStage'));

interface SkillsProps {
  onViewResume: () => void;
  onNavigateHome: (section: string) => void;
}

const SPRING = { type: 'spring', bounce: 0.18, duration: 0.55 } as const;
// A sideways swipe this long (or this fast) moves to the next option
const SWIPE_PX = 70;
const SWIPE_VELOCITY = 450;

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stageVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 56 }),
  center: { opacity: 1, x: 0, transition: SPRING },
};

const mailto = (o: SkillOption) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(`${o.name}: let's talk`)}`;

// The parts of an option every reader (and crawler) gets: claim, numbers, proof
function OptionCopy({ option, headingLevel }: { option: SkillOption; headingLevel: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <>
      <p className="sk-eyebrow">{option.name}</p>
      <H className="sk-statement">{option.statement}</H>
      <p className="sk-sub">{option.sub}</p>
    </>
  );
}

function OptionProof({ option }: { option: SkillOption }) {
  return (
    <>
      <dl className="sk-stats">
        {option.stats.map(s => (
          <div key={s.label} className="sk-stat">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="sk-proof">
        <div>
          <p className="sk-proof-title">What I&rsquo;ve done</p>
          <ul className="sk-evidence">
            {option.evidence.map(line => <li key={line}>{line}</li>)}
          </ul>
        </div>
        <div>
          <p className="sk-proof-title">Shipped with</p>
          <ul className="project-tech" aria-label={`${option.name}: shipped with`}>
            {option.shipped.map(t => <li key={t} className="tech-tag">{t}</li>)}
          </ul>
          {option.familiar && (
            <>
              <p className="sk-proof-title sk-proof-title--quiet">Also worked with</p>
              <ul className="project-tech sk-familiar" aria-label={`${option.name}: also worked with`}>
                {option.familiar.map(t => <li key={t} className="tech-tag">{t}</li>)}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Centerpiece({ id, onNavigateHome }: { id: OptionId; onNavigateHome: (s: string) => void }) {
  const piece: Record<OptionId, ReactNode> = {
    'bioinformatics-pipelines': <PipelineStage />,
    'software-engineering': <SoftwareStage />,
    'ai-data-engineering': <LineupStage onOpen={onNavigateHome} />,
    'health-data-integration': <InteropStage />,
  };
  return (
    <div className="sk-floor">
      <Suspense fallback={<div className="sk-piece-loading" />}>{piece[id]}</Suspense>
    </div>
  );
}

export default function Skills({ onViewResume, onNavigateHome }: SkillsProps) {
  const reduced = useReducedMotion() ?? false;
  const [selected, setSelected] = useState<OptionId | null>(() => optionFromHash(window.location.hash));
  const [dir, setDir] = useState(1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);

  // Back and forward walk through the options picked so far
  useEffect(() => {
    const sync = () => setSelected(optionFromHash(window.location.hash));
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  // A direct link such as /skills#nextflow opens on that option's stage.
  // Two frames: the page's own scroll-to-top runs in the first one.
  useEffect(() => {
    if (!optionFromHash(window.location.hash)) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const anchor = anchorRef.current;
        if (anchor) window.scrollTo(0, Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - 150));
      });
    });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, []);

  const indexOf = (id: OptionId | null) => (id === null ? -1 : OPTIONS.findIndex(o => o.id === id));

  const select = (id: OptionId | null) => {
    if (id === selected) return;
    setDir(indexOf(id) >= indexOf(selected) ? 1 : -1);
    history.pushState(null, '', id ? `/skills#${id}` : '/skills');
    const from = selected;
    setSelected(id);
    requestAnimationFrame(() => {
      // The control just used (a tile, "All skill areas", "Next") is gone
      // from the new view; keep keyboard focus on its counterpart instead of
      // letting it fall back to the top of the page
      if (!document.activeElement || document.activeElement === document.body) {
        const target = id
          ? document.querySelector<HTMLElement>(`.sk-seg[data-option="${id}"]`)
          : document.querySelector<HTMLElement>(`.sk-tile[data-option="${from}"]`);
        target?.focus({ preventScroll: true });
      }

      // Bring the new option's opening line up under the sticky switcher
      const anchor = anchorRef.current;
      if (!anchor) return;
      const top = anchor.getBoundingClientRect().top + window.scrollY - 150;
      if (id === null || Math.abs(window.scrollY - top) > 40) {
        window.scrollTo({ top: id === null ? 0 : Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  };

  const step = (delta: 1 | -1) => {
    const i = indexOf(selected);
    const next = OPTIONS[(i + delta + OPTIONS.length) % OPTIONS.length];
    select(next.id);
  };

  const onSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX || info.velocity.x < -SWIPE_VELOCITY) step(1);
    else if (info.offset.x > SWIPE_PX || info.velocity.x > SWIPE_VELOCITY) step(-1);
  };

  const option = selected ? optionById(selected) : null;
  const next = option ? OPTIONS[(indexOf(selected) + 1) % OPTIONS.length] : null;

  return (
    <main className="sk" data-option={selected ?? 'overview'} aria-labelledby="sk-title">
      <div className="sk-aura" aria-hidden="true" />
      <div className="sk-container">

        <motion.header className="sk-hero" variants={heroVariants} initial="hidden" animate="visible">
          <motion.p className="projects-label" variants={itemVariants}>Skills &amp; services</motion.p>
          <motion.h1 id="sk-title" className="sk-title" variants={itemVariants}>
            What are you looking for?
          </motion.h1>
          <motion.p className="sk-lede" variants={itemVariants}>
            I&rsquo;m a software engineer and consultant in Pune. I build bioinformatics pipelines,
            production software, AI and data systems, and HL7 v2 / FHIR integrations for health data.
            Pick one, and I&rsquo;ll show you instead of telling you.
          </motion.p>
        </motion.header>

        {selected === null ? (
          // Overview: one glossy icon per option, standing on a mirrored shelf
          <motion.nav className="sk-shelf" aria-label="Skill areas" variants={heroVariants} initial="hidden" animate="visible">
            {OPTIONS.map(o => (
              <motion.button
                key={o.id}
                type="button"
                className="sk-tile"
                data-option={o.id}
                variants={itemVariants}
                whileHover={reduced ? undefined : { y: -6 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => select(o.id)}
              >
                <motion.span className="sk-icon" layoutId={`sk-icon-${o.id}`} transition={SPRING}>
                  <Glyph id={o.id} />
                </motion.span>
                <span className="sk-tile-name">{o.name}</span>
                <span className="sk-tile-blurb">{o.blurb}</span>
                <span className="sk-tile-stat"><b>{o.headline.value}</b> {o.headline.label}</span>
              </motion.button>
            ))}
          </motion.nav>
        ) : (
          // Chosen: the icons shrink into a sticky switcher
          <nav className="sk-switch" aria-label="Skill areas">
            <div className="sk-switch-track">
              <button
                type="button"
                className="sk-seg sk-seg--overview"
                onClick={() => select(null)}
                aria-label="All skill areas"
              >
                <span className="sk-seg-icon sk-seg-icon--overview"><Glyph id="overview" /></span>
              </button>
              {OPTIONS.map(o => {
                const on = o.id === selected;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`sk-seg${on ? ' is-on' : ''}`}
                    data-option={o.id}
                    aria-current={on ? 'true' : undefined}
                    aria-label={o.name}
                    onClick={() => select(o.id)}
                  >
                    {on && <motion.span className="sk-seg-pill" layoutId="sk-seg-pill" transition={SPRING} />}
                    <motion.span className="sk-seg-icon" layoutId={`sk-icon-${o.id}`} transition={SPRING}>
                      <Glyph id={o.id} />
                    </motion.span>
                    <span className="sk-seg-label">{o.short}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div ref={anchorRef} className="sk-anchor" />

        {/* No exit animations: an exit interrupted by Back or a quick second
            pick could leave the old stage stuck, invisible, in the page */}
        {option ? (
          <motion.section
            key={option.id}
            className="sk-stage"
            data-option={option.id}
            aria-labelledby={`${option.id}-statement`}
            custom={dir}
            variants={stageVariants}
            initial="enter"
            animate="center"
            // Phones: swipe sideways between options; vertical swipes still scroll
            drag={coarse && !reduced ? 'x' : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            onDragEnd={onSwipe}
          >
            <div className="sk-stage-head" id={`${option.id}-statement`}>
              <OptionCopy option={option} headingLevel={2} />
            </div>

            <Centerpiece id={option.id} onNavigateHome={onNavigateHome} />

            <OptionProof option={option} />

            <div className="sk-cta">
              <a className="btn btn-primary" href={mailto(option)}>Let&rsquo;s talk about {option.talk} →</a>
              <button type="button" className="btn btn-outline" onClick={onViewResume}>View my resume</button>
              {next && (
                <button type="button" className="sk-next" onClick={() => select(next.id)}>
                  Next: {next.name} <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
            {coarse && <p className="sk-swipe-hint">Swipe sideways for the next one</p>}
          </motion.section>
        ) : (
          <motion.div
            key="overview"
            className="sk-overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="sk-outro-text">Hiring, or looking for a consultant? I&rsquo;d like to hear about it.</p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => onNavigateHome('#contact')}>Get in touch →</button>
              <button className="btn btn-outline" onClick={onViewResume}>View my resume</button>
              <button className="btn btn-outline" onClick={() => onNavigateHome('#projects')}>See projects</button>
            </div>
          </motion.div>
        )}

        {/* Every option's words stay in the page for search engines and
            screen-reader skimming, even while only one is on show */}
        {OPTIONS.filter(o => o.id !== selected).map(o => (
          <section key={o.id} className="sk-offstage" hidden aria-label={o.name}>
            <OptionCopy option={o} headingLevel={3} />
            <OptionProof option={o} />
          </section>
        ))}

      </div>
    </main>
  );
}
