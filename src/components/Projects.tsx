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
}

const PROJECTS: Project[] = [
  {
    id: 'adapt',
    num: '01',
    title: 'ADAPT: Alzheimer\'s Disease Prediction System',
    description:
      'End-to-end deep learning system for MRI-based Alzheimer\'s classification. Built a VGG-19 pipeline with a FastAPI backend and React frontend, enabling real-time inference. Deployed across cloud platforms for accessible diagnosis workflows.',
    tech: ['Python', 'VGG-19', 'FastAPI', 'React', 'MLOps', 'GitHub Actions'],
    image: '/projects/adapt.png',
    github: 'https://github.com/DA-workshop-101/Alzheimer-Stages-Classification-using-Deep-Learning',
    live: 'https://adapt-webapp-007.netlify.app/',
    youtube: 'https://www.youtube.com/watch?v=U3JPrEf1Syo'
  },
  {
    id: 'metaboliq',
    num: '02',
    title: 'MetaboliQ AI: Diabetes Risk Prediction',
    description:
      'ML platform for diabetes risk classification achieving 83% accuracy. Designed the full pipeline from preprocessing to evaluation. Top 10 Finalist at the Intel AI Hackathon, IEEE INDICON, IIT Kharagpur.',
    tech: ['Python', 'Scikit-learn', 'Flask', 'Machine Learning', 'Model Deployment'],
    image: '/projects/metaboliq.png',
    github: 'https://github.com/tabishaliansari/MetaboliQ-AI',
    youtube: 'https://www.youtube.com/watch?v=sxvw4tzdTpY'
  },
  {
    id: 'power-forecast',
    num: '03',
    title: 'Power Consumption Forecasting',
    description:
      'Time-series forecasting system on real-world electrical consumption data. SARIMAX models achieved an RMSE of 1.35; also explored LSTM for temporal pattern learning. Emphasis on feature engineering and trend decomposition.',
    tech: ['Python', 'SARIMAX', 'Time Series Analysis', 'Databricks', 'Supabase'],
    image: '/projects/power.png',
    github: 'https://github.com/orgs/Power-Consumption-org/repositories',
    youtube: 'https://www.youtube.com/watch?v=3m64id9M-rU'
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
                </div>
              </motion.div>

              {/* Image — right side, follows text by 0.15s */}
              <motion.div
                className="project-image"
                variants={imageVariants}
                whileHover={{ scale: 1.03, transition: { duration: 0.25 } }}
              >
                <img src={project.image} alt={project.title} />
              </motion.div>
            </motion.article>
          ))}
        </div>

      </div>
    </motion.section>
  );
}
