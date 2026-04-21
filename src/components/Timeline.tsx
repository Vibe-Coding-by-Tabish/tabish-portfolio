import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

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
      subtitle: 'AISSMS Institute of Information Technology',
      detail: 'Relevant coursework · GPA x.x / 10',
    },
    right: {
      period: 'Feb 2025 – Present',
      title: 'Software Development Engineer',
      subtitle: 'Company Name',
      detail: 'Shipped 5 PoCs · leading product end-to-end',
    },
  },
  {
    left: {
      period: 'Aug 2020 – June 2022',
      title: 'Higher Secondary Education',
      subtitle: 'Sinhgad City School',
      detail: 'Science - PCM · 92%',
    },
    right: {
      period: '2023 – Present',
      title: 'Hackathons',
      subtitle: 'Multiple competitions',
      detail: 'Top 10 All India · Intel AI @ IIT KGP · 2nd @ ISB&M Pune',
    },
  },
  {
    left: {
      period: '2019 – 20202',
      title: 'Secondary School - 10th Grade',
      subtitle: 'Sinhgad City School',
      detail: 'CBSE - 96% · Mathematics All India Top 0.1%',
    },
    right: {
      period: '2024 – Present',
      title: 'Open Source',
      subtitle: 'GitHub',
      detail: 'Contributions to data science projects',
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

// ── Component ─────────────────────────────────────────────────

export default function Timeline() {
  const spineRef = useRef(null);
  const spineInView = useInView(spineRef, { once: true, amount: 0.05 });

  return (
    <section id="about" className="tl-section">
      <div className="tl-container">

        <div className="tl-header">
          <p className="tl-label">Background</p>
          <h2 className="tl-heading">Experience &amp; Education</h2>
        </div>

        <div className="tl-body">

          {/* Column labels */}
          <div className="tl-col-labels">
            <span className="tl-col-label tl-col-label-left">Education</span>
            <span />
            <span className="tl-col-label tl-col-label-right">Experience</span>
          </div>

          {/* Vertical spine */}
          <motion.div
            ref={spineRef}
            className="tl-spine"
            initial={{ scaleY: 0 }}
            animate={spineInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.4, ease: 'easeOut' }}
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
              <motion.div
                className="tl-dot-col"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.1 + 0.05 }}
              >
                <span className="tl-dot" />
              </motion.div>

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
