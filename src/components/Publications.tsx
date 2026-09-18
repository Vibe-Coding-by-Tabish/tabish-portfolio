import { motion, type Variants } from 'framer-motion';

// ── Variants ──────────────────────────────────────────────────

// Mirrors Projects: section rises into view and staggers its children
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── Data ──────────────────────────────────────────────────────

const PUBLICATIONS = [
  {
    title: 'GraphLM: A Comprehensive Survey on Knowledge Graphs for Intelligent Document Understanding',
    year: '2025',
    role: 'Co-author',
    summary:
      'Survey of knowledge graph and retrieval methods for extracting structured meaning from unstructured documents.',
    doi: 'https://doi.org/10.22214/ijraset.2025.75390',
  },
  {
    title: 'Advancing Neurosymbolic AI: A Comprehensive Review of Hybrid Reasoning Frameworks and Applications',
    year: '2025',
    role: 'First author',
    summary:
      'Review of hybrid symbolic and statistical reasoning approaches and their applications.',
    doi: 'https://doi.org/10.55248/gengpi.6.0525.1613',
  },
] as const;

// ── Component ─────────────────────────────────────────────────

export default function Publications() {
  return (
    <motion.section
      id="publications"
      className="pubs"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <div className="pubs-container">

        <motion.header className="pubs-header" variants={headerVariants}>
          <p className="pubs-label">Research</p>
          <h2 className="pubs-title">Publications</h2>
        </motion.header>

        <ul className="pubs-list">
          {PUBLICATIONS.map(pub => (
            <motion.li key={pub.doi} className="pub-item" variants={itemVariants}>
              <div className="pub-meta">
                <span className="pub-year">{pub.year}</span>
                <span className="pub-role">{pub.role}</span>
              </div>

              <h3 className="pub-title">{pub.title}</h3>
              <p className="pub-summary">{pub.summary}</p>

              <a
                href={pub.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link"
              >
                Paper ↗
              </a>
            </motion.li>
          ))}
        </ul>

      </div>
    </motion.section>
  );
}
