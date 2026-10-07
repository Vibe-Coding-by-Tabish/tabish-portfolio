import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';

// ── Data ──────────────────────────────────────────────────────

interface Entry {
  period: string;
  title: string;
  subtitle: string;
  detail?: string;
}

const ROWS: { left: Entry; right: Entry }[] = [
  {
    left: {
      period: 'September 2022 – June 2026',
      title: 'B.Tech in Artificial Intelligence & Data Science',
      subtitle: 'AISSMS Institute of Information Technology, Pune',
      detail: 'CGPA 8.36 / 10 · Machine Learning, Deep Learning, NLP, MLOps',
    },
    right: {
      period: 'June 2026 – Present',
      title: 'Software Development Engineer',
      subtitle: 'NonStop io Technologies',
      detail: 'Clinical genomics platform · HL7 v2 and FHIR integration · 5 environments',
    },
  },
  {
    left: {
      period: 'February 2025 – June 2026',
      title: 'Software Development Engineer, Intern',
      subtitle: 'NonStop io Technologies',
      detail: 'Genomics data workflows · 100–300 GB datasets · AWS Batch, EKS, HealthOmics',
    },
    right: {
      period: '2025 – Present',
      title: 'Publications',
      subtitle: 'Two peer-reviewed survey papers',
      detail: 'Knowledge graphs for document understanding · Neurosymbolic AI',
    },
  },
  {
    left: {
      period: '2023 – Present',
      title: 'Hackathons & Competitions',
      subtitle: 'National level',
      detail: 'Top 10 All India, Intel AI @ IIT Kharagpur · 1st Runner-Up, ISB&M Pune',
    },
    right: {
      period: '2025 – Present',
      title: 'Speaking & Community',
      subtitle: 'NonStop io Technologies',
      detail: 'Host of the monthly meetup, 10+ editions · Anchored the annual awards night',
    },
  },
];

// ── Sub-component ─────────────────────────────────────────────

function EntryBlock({ entry }: { entry: Entry }) {
  return (
    <>
      <p className="tl-period">{entry.period}</p>
      <p className="tl-title">{entry.title}</p>
      <p className="tl-sub">{entry.subtitle}</p>
      {entry.detail && <p className="tl-detail">{entry.detail}</p>}
    </>
  );
}

// The line's tip sits at this height in the viewport; a dot fills as the tip
// reaches it. Both are tied 1:1 to scroll, so scrolling back up undraws them.
const READ_LINE = '60%';

function Dot() {
  const ref = useRef<HTMLSpanElement>(null);
  // Fills over a few percent of scroll centred on the line's tip, so it
  // reads as the line arriving rather than a switch flipping
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 63%', 'start 57%'],
  });
  return (
    <span ref={ref} className="tl-dot">
      <motion.span className="tl-dot-fill" style={{ scale: scrollYProgress }} />
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────

export default function Timeline() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: bodyRef,
    offset: [`start ${READ_LINE}`, `end ${READ_LINE}`],
  });

  return (
    <section id="about" className="tl-section">
      <div className="tl-container">

        <div className="tl-header">
          <p className="tl-label">Background</p>
          <h2 className="tl-heading">Experience &amp; Education</h2>
        </div>

        <div className="tl-body" ref={bodyRef}>

          {/* Column labels removed: the two columns are no longer split
              Education / Experience — each side now mixes roles, study,
              publications and community work. */}

          {/* Vertical spine: a faint track, inked as you scroll */}
          <div className="tl-spine" aria-hidden="true" />
          <motion.div
            className="tl-spine tl-spine-fill"
            style={{ scaleY: scrollYProgress }}
            aria-hidden="true"
          />

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div key={i} className="tl-row">

              {/* Left — Education */}
              <motion.div
                className="tl-left"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
              >
                <EntryBlock entry={row.left} />
              </motion.div>

              {/* Dot */}
              <div className="tl-dot-col">
                <Dot />
              </div>

              {/* Right — Experience */}
              <motion.div
                className="tl-right"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
              >
                <EntryBlock entry={row.right} />
              </motion.div>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
