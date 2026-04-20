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
}

// Replace placeholder text and links with your actual project details
const PROJECTS: Project[] = [
  {
    id: 'intel-ai-hackathon',
    num: '01',
    title: 'Intel AI Hackathon — IIT KGP',
    description:
      'Top 10 All India at IEEE Indicon 2024, IIT Kharagpur. Built [brief description of what the project does]. [Add 1–2 sentences about the problem, approach, and outcome.]',
    tech: ['Python', 'FastAPI', 'Machine Learning', 'Intel OpenVINO'],
    image: '/images/iit_kgp_hoodie.png',
    github: 'https://github.com',
  },
  {
    id: 'nonstop-product',
    num: '02',
    title: 'End-to-End Product @ NonStop io',
    description:
      'Shipped 5 PoCs and currently leading a product end-to-end — from architecture to deployment. [Describe what the product does, your key contributions, and the technical challenges solved.]',
    tech: ['Node.js', 'PostgreSQL', 'Kafka', 'Docker', 'TypeScript'],
    image: '/images/kafka.gif',
    live: 'https://nonstopio.com',
  },
  {
    id: 'data-analytics',
    num: '03',
    title: 'Data Analytics Case — ISB&M Pune',
    description:
      '1st Runner-Up at the Data Analytics Case Competition 2024. Analyzed [dataset/business problem] to surface [key insight or recommendation]. [Add methodology and impact.]',
    tech: ['Python', 'Pandas', 'SQL', 'Tableau'],
    image: '/images/isbnm.jpeg',
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
