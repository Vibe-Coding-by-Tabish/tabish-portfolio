import { motion, type Variants } from 'framer-motion';

// ── Variants ──────────────────────────────────────────────────

// Section rises into view and staggers its direct children
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

// Card is a pass-through — no own animation, participates in section stagger
// and propagates the visible state to text + image below
const cardVariants: Variants = {
  hidden: {},
  visible: {},
};

// Text LEFT side → slides in from left, leads the sequence
const textVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// Image RIGHT side → slides from right + scale-in, follows text by 0.15s
const imageVariants: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.15 },
  },
};

// Tech tags: container staggers, each tag rises from below
const tagListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const tagVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Data ──────────────────────────────────────────────────────

interface Project {
  id: string;
  num: string;
  title: string;
  description: string;
  tech: readonly string[];
  image: string;
  github?: string;
  live?: string;
  youtube?: string;
  doi?: string;
  /** Small muted caveat under the tech tags, e.g. "Client work, source not public" */
  note?: string;
}

const PROJECTS: Project[] = [
  {
    id: 'strixflow',
    num: '01',
    title: 'StrixFlow: Local-First Genomics Workflow Orchestration',
    description:
      'Orchestration platform that runs pipelines across five scientific workflow engines (Nextflow, Snakemake, CWL, WDL and custom Python) without rewriting them. Built for clinical and research institutions where genomic data cannot leave the building for legal or governance reasons. Recovers DAG structure through native engine introspection rather than a reimplemented parser, so the graph you see is the graph the engine actually executed. Validated by 395 unit tests plus Playwright end-to-end coverage.',
    tech: ['Python', 'Nextflow', 'Snakemake', 'CWL', 'WDL', 'Playwright', 'ruff'],
    image: '/projects/strixflow.png', // TODO: screenshot of the DAG view — file does not exist yet
    // TODO: add the StrixFlow repo URL. Omitted rather than stubbed so no
    // broken "GitHub" link renders in the meantime.
  },
  {
    id: 'intergenix',
    num: '02',
    title: 'InterGenix: Clinical Healthcare Integration Service',
    description:
      'Healthcare interoperability service acting as the validation and orchestration layer alongside Mirth Connect. Parses and validates HL7 v2 messages through HAPI, exchanges data with a Medplum FHIR server, and polls OpenELIS for laboratory results. Reached full operational status in a production clinical pipeline.',
    tech: ['Java 17', 'Spring Boot 3', 'HAPI HL7v2', 'FHIR / Medplum', 'Mirth Connect', 'OpenELIS'],
    image: '/projects/intergenix.png', // TODO: architecture diagram, not a screenshot — file does not exist yet
    // TODO: confirm what you are permitted to disclose about this engagement,
    // then set `note` (the spec's current safe phrasing is
    // "A clinical genomics laboratory in the United States").
  },
  {
    id: 'graphlm',
    num: '03',
    title: 'GraphLM: Knowledge-Graph-Augmented Retrieval',
    description:
      'Retrieval system combining RAG, vector search and knowledge graphs to support multi-hop contextual reasoning over unstructured research documents. Formed the basis of a published survey on knowledge graphs for intelligent document understanding.',
    tech: ['FastAPI', 'React', 'PostgreSQL', 'Neo4j', 'Qdrant'],
    image: '/projects/graphlm.png', // TODO: file does not exist yet
    // TODO: add the GraphLM repo URL if the repo is public.
    doi: 'https://doi.org/10.22214/ijraset.2025.75390',
  },
  {
    id: 'adapt',
    num: '04',
    title: 'ADAPT: Alzheimer\'s Disease Prediction System',
    description:
      'End-to-end MRI classification pipeline built on VGG-19, with DVC for data and model versioning and MLflow for experiment tracking, so any result can be traced back to the exact data and weights that produced it. Containerised with Docker; FastAPI backend and React frontend deployed to production.',
    tech: ['Python', 'VGG-19', 'DVC', 'MLflow', 'Docker', 'FastAPI', 'React'],
    image: '/projects/adapt.png',
    github: 'https://github.com/DA-workshop-101/Alzheimer-Stages-Classification-using-Deep-Learning',
    live: 'https://adapt-webapp-007.netlify.app/',
    youtube: 'https://www.youtube.com/watch?v=U3JPrEf1Syo',
  },
  {
    id: 'metaboliq',
    num: '05',
    title: 'MetaboliQ AI: Diabetes Risk Prediction',
    description:
      'ML platform for diabetes risk classification reaching approximately 83% accuracy across a full preprocessing, training and evaluation workflow. Led a team of four. Top 10 Finalist, Intel AI Hackathon, IEEE INDICON, IIT Kharagpur.',
    tech: ['Python', 'Scikit-learn', 'Flask'],
    image: '/projects/metaboliq.png',
    github: 'https://github.com/tabishaliansari/MetaboliQ-AI',
    youtube: 'https://www.youtube.com/watch?v=sxvw4tzdTpY',
  },
];

// ── Component ─────────────────────────────────────────────────

export default function Projects() {
  return (
    <motion.section
      id="projects"
      className="projects"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <div className="projects-container">

        <motion.header className="projects-header" variants={headerVariants}>
          <p className="projects-label">Selected Work</p>
          <h2 className="projects-title">Projects</h2>
        </motion.header>

        <div className="projects-list">
          {PROJECTS.map((project) => (
            <motion.article
              key={project.id}
              className="project-card"
              variants={cardVariants}
              whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
            >
              {/* Text — left side, appears first */}
              <motion.div className="project-text" variants={textVariants}>
                <p className="project-num">{project.num}</p>
                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>

                <motion.ul
                  className="project-tech"
                  variants={tagListVariants}
                >
                  {project.tech.map(tag => (
                    <motion.li key={tag} className="tech-tag" variants={tagVariants}>
                      {tag}
                    </motion.li>
                  ))}
                </motion.ul>

                {project.note && <p className="project-note">{project.note}</p>}

                <div className="project-links">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      GitHub ↗
                    </a>
                  )}
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      Live ↗
                    </a>
                  )}
                  {project.youtube && (
                    <a
                      href={project.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      YouTube ↗
                    </a>
                  )}
                  {project.doi && (
                    <a
                      href={project.doi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      Paper ↗
                    </a>
                  )}
                </div>
              </motion.div>

              {/* Image — right side, follows text by 0.15s */}
              <motion.div
                className="project-image"
                variants={imageVariants}
              >
                {/* Three screenshots are still outstanding (see the TODOs in
                    PROJECTS). Until they land, hide the broken <img> so the card
                    falls back to the panel's own background instead of showing a
                    broken-image icon. Safe to delete once all files exist. */}
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </motion.div>
            </motion.article>
          ))}
        </div>

      </div>
    </motion.section>
  );
}
