import { lazy, Suspense, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

// Each demo is its own chunk, fetched as the visitor scrolls toward it
const GraphLMDemo = lazy(() => import('./demos/GraphLMDemo'));
const ADAPTDemo = lazy(() => import('./demos/ADAPTDemo'));
const MetaboliQDemo = lazy(() => import('./demos/MetaboliQDemo'));

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

// Demo cards: the demo rises in first, its text follows
const riseVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
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
  title: string;
  /** What it does and why it matters, in three lines at most */
  story: string;
  /** The longer account, behind "How it's built" */
  build: string;
  tech: readonly string[];
  /** A live, interactive demo replaces the screenshot */
  demo?: 'graphlm' | 'adapt' | 'metaboliq';
  image?: string;
  github?: string;
  live?: string;
  youtube?: string;
  doi?: string;
  /** Small muted caveat under the tech tags, e.g. "Client work, source not public" */
  note?: string;
}

const PROJECTS: Project[] = [
  {
    id: 'graphlm',
    title: 'GraphLM: Knowledge-Graph-Augmented Retrieval',
    story:
      'Ask a question and GraphLM answers from a knowledge graph and a vector index together, so it can connect facts that sit pages apart. The demo runs it on my resume: ask something, tap a node, untick the source.',
    build:
      'Documents and GitHub repositories are indexed into a dual store: entities and relationships go into Neo4j, text chunks into Qdrant, and retrieval combines vector search with graph traversal for multi-hop answers. FastAPI and PostgreSQL behind a React workspace, with answers streamed over server-sent events. Formed the basis of a published survey on knowledge graphs for intelligent document understanding.',
    tech: ['FastAPI', 'React', 'PostgreSQL', 'Neo4j', 'Qdrant'],
    demo: 'graphlm',
    // TODO: add the GraphLM repo URL if the repo is public.
    doi: 'https://doi.org/10.22214/ijraset.2025.75390',
  },
  {
    id: 'adapt',
    title: 'ADAPT: Alzheimer\'s Disease Prediction System',
    story:
      'Classifies the stage of Alzheimer\'s disease from a brain MRI and shows where the model looked. The demo replays a real run: load the scan, analyze it, then drag across it to compare the MRI with its Grad-CAM heatmap.',
    build:
      'End-to-end MRI classification pipeline built on VGG-19, with DVC for data and model versioning and MLflow for experiment tracking. Containerised with Docker; FastAPI backend on Google App Engine and React frontend on Netlify.',
    tech: ['Python', 'VGG-19', 'DVC', 'MLflow', 'Docker', 'FastAPI', 'React'],
    demo: 'adapt',
    github: 'https://github.com/DA-workshop-101/Alzheimer-Stages-Classification-using-Deep-Learning',
    live: 'https://adapt-webapp-007.netlify.app/',
    youtube: 'https://www.youtube.com/watch?v=U3JPrEf1Syo',
  },
  {
    id: 'metaboliq',
    title: 'MetaboliQ AI: Diabetes Risk Prediction',
    story:
      'Four predictors behind one app: gestational diabetes, lifestyle risk, diabetes type and a projection of case numbers. The demo replays a real run of each. I led a team of four to the Top 10 of the Intel AI Hackathon at IEEE INDICON, IIT Kharagpur.',
    build:
      'Decision Trees for lifestyle risk and gestational diabetes, a Random Forest for the type of diabetes and linear regression for projecting cases, each with its own preprocessing, training and evaluation, reaching about 83% accuracy. Training and inference run on Intel’s oneDAL extension for scikit-learn; a Flask app serves the models alongside an NLP chatbot built on Hugging Face Transformers.',
    tech: ['Python', 'Scikit-learn', 'Intel oneDAL', 'Flask'],
    demo: 'metaboliq',
    github: 'https://github.com/tabishaliansari/MetaboliQ-AI',
    youtube: 'https://www.youtube.com/watch?v=sxvw4tzdTpY',
  },
];

const DEMOS = { graphlm: GraphLMDemo, adapt: ADAPTDemo, metaboliq: MetaboliQDemo } as const;

// ── Pieces ────────────────────────────────────────────────────

// Mounts the demo once the visitor is within a couple of screens of it, so
// the home page doesn't download every demo up front
function DemoSlot({ demo, title }: { demo: NonNullable<Project['demo']>; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: '1200px 0px' });
  const Demo = DEMOS[demo];
  return (
    <div ref={ref} className="project-demo" aria-label={`${title}: interactive demo`} role="region">
      {near && (
        <Suspense fallback={<div className={`project-demo-loading project-demo-loading--${demo}`} />}>
          <Demo />
        </Suspense>
      )}
      {!near && <div className={`project-demo-loading project-demo-loading--${demo}`} />}
    </div>
  );
}

function ProjectText({ project, num }: { project: Project; num: string }) {
  return (
    <>
      <p className="project-num">{num}</p>
      <h3 className="project-title">{project.title}</h3>
      <p className="project-desc">{project.story}</p>
    </>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <>
      <details className="project-build">
        <summary>How it&rsquo;s built</summary>
        <p>{project.build}</p>
      </details>

      <motion.ul className="project-tech" variants={tagListVariants}>
        {project.tech.map(tag => (
          <motion.li key={tag} className="tech-tag" variants={tagVariants}>
            {tag}
          </motion.li>
        ))}
      </motion.ul>

      {project.note && <p className="project-note">{project.note}</p>}

      <div className="project-links">
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
            GitHub ↗
          </a>
        )}
        {project.live && (
          <a href={project.live} target="_blank" rel="noopener noreferrer" className="project-link">
            Live ↗
          </a>
        )}
        {project.youtube && (
          <a href={project.youtube} target="_blank" rel="noopener noreferrer" className="project-link">
            YouTube ↗
          </a>
        )}
        {project.doi && (
          <a href={project.doi} target="_blank" rel="noopener noreferrer" className="project-link">
            Paper ↗
          </a>
        )}
      </div>
    </>
  );
}

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
          {PROJECTS.map((project, i) => {
            const num = String(i + 1).padStart(2, '0');

            // Demo first: the product is the headline, the text supports it
            if (project.demo) {
              return (
                <motion.article key={project.id} id={project.id} className="project-card project-card--demo" variants={cardVariants}>
                  <motion.div className="project-heading" variants={riseVariants}>
                    <ProjectText project={project} num={num} />
                  </motion.div>
                  <motion.div variants={riseVariants}>
                    <DemoSlot demo={project.demo} title={project.title} />
                  </motion.div>
                  <motion.div className="project-text project-meta" variants={riseVariants}>
                    <ProjectDetails project={project} />
                  </motion.div>
                </motion.article>
              );
            }

            return (
              <motion.article
                key={project.id}
                id={project.id}
                className="project-card"
                variants={cardVariants}
                whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
              >
                {/* Text — left side, appears first */}
                <motion.div className="project-text" variants={textVariants}>
                  <ProjectText project={project} num={num} />
                  <ProjectDetails project={project} />
                </motion.div>

                {/* Image — right side, follows text by 0.15s */}
                <motion.div className="project-image" variants={imageVariants}>
                  <img src={project.image} alt={project.title} loading="lazy" decoding="async" />
                </motion.div>
              </motion.article>
            );
          })}
        </div>

      </div>
    </motion.section>
  );
}
