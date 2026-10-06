import { motion, type Variants } from 'framer-motion';

interface SkillsProps {
  onViewResume: () => void;
  onNavigateHome: (section: string) => void;
}

interface Role {
  id: string;
  title: string;
  pitch: string;
  evidence: string[];
  tools: string[];
}

// Every line here should be backed by the resume (public/resume.pdf)
const ROLES: Role[] = [
  {
    id: 'software-engineering',
    title: 'Software Engineering',
    pitch: 'Backend services, APIs, and the deployments that keep them running in production.',
    evidence: [
      'Maintain a FastAPI and PostgreSQL clinical variant review platform across five environments, from dev to prod.',
      'Wrote a 14-phase resumable deployment script that cut environment setup from three hours of manual steps to one command.',
      'Diagnosed and fixed five production incidents, including an nginx routing bug that returned 404 across the entire API.',
      'Built a validation harness covering all 65 API endpoints to catch contract regressions before UAT sign-off.',
      'Built InterGenix in Spring Boot 3 and Java 17 for HL7 v2 and FHIR data exchange.',
    ],
    tools: ['Python', 'Java', 'FastAPI', 'Spring Boot', 'PostgreSQL', 'REST APIs', 'Docker', 'Kubernetes', 'nginx', 'Linux', 'CI/CD'],
  },
  {
    id: 'data-engineering',
    title: 'Data Engineering',
    pitch: 'Pipelines that move and process large scientific datasets reliably, and recover when they fail.',
    evidence: [
      'Designed and ran genomics data workflows on 100–300 GB datasets.',
      'Ran pipelines on AWS Batch, EKS and HealthOmics as well as on local infrastructure.',
      'Built run tracking and event-based monitoring on PostgreSQL JSONB, with automated reruns and failure recovery.',
      'StrixFlow orchestrates Nextflow, Snakemake, CWL, WDL and Python pipelines without rewrites, backed by 395 unit tests.',
    ],
    tools: ['SQL', 'PostgreSQL', 'Apache Airflow', 'Nextflow', 'Snakemake', 'CWL', 'WDL', 'dbt', 'Snowflake', 'Databricks', 'RabbitMQ', 'AWS'],
  },
  {
    id: 'data-science',
    title: 'Data Science',
    pitch: 'Turning raw data into models, and models into decisions people can act on.',
    evidence: [
      'MetaboliQ AI: diabetes risk prediction at about 83% accuracy across preprocessing, training and evaluation. Led a team of four to the Top 10 at the Intel AI Hackathon, IIT Kharagpur.',
      'First Runner-Up, ISB&M Pune Analytics Case Study Competition.',
      'B.Tech in Artificial Intelligence & Data Science (CGPA 8.36), with coursework in machine learning, deep learning and NLP.',
    ],
    tools: ['Python', 'SQL', 'Scikit-learn', 'PyTorch', 'TensorFlow', 'Flask'],
  },
  {
    id: 'ai-ml-engineering',
    title: 'AI / ML Engineering',
    pitch: 'Models in production, with the versioning and tracking to trust what they output.',
    evidence: [
      'ADAPT: VGG-19 MRI classification with DVC for data and model versioning and MLflow for experiment tracking, shipped with Docker, FastAPI and React.',
      'GraphLM: retrieval combining RAG, vector search and a Neo4j knowledge graph for multi-hop questions, and the basis of a published survey.',
      'Built an LLM-assisted analysis system that turns structured reports into actionable summaries.',
      'First author of a peer-reviewed review on neurosymbolic AI. Most Innovative Award, QA AI Agent Hackathon 2026.',
    ],
    tools: ['PyTorch', 'Hugging Face Transformers', 'RAG', 'Qdrant', 'Neo4j', 'MLflow', 'DVC', 'FastAPI', 'Docker'],
  },
];

const introVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const roleVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Skills({ onViewResume, onNavigateHome }: SkillsProps) {
  return (
    <main className="sk" aria-labelledby="sk-title">
      <div className="sk-container">

        <motion.header className="sk-intro" variants={introVariants} initial="hidden" animate="visible">
          <motion.p className="projects-label" variants={itemVariants}>Skills</motion.p>
          <motion.h1 id="sk-title" className="sk-title" variants={itemVariants}>
            Software, data and AI/ML engineering
          </motion.h1>
          <motion.p className="sk-lede" variants={itemVariants}>
            I&rsquo;m a software engineer in Pune who works across backend engineering, data engineering,
            data science and machine learning. My day job is building clinical genomics platforms, where all
            four meet: APIs that can&rsquo;t go down, pipelines over hundreds of gigabytes, and models whose
            results have to be traceable.
          </motion.p>
          <motion.nav className="sk-jump" aria-label="Skill areas" variants={itemVariants}>
            {ROLES.map((role, i) => (
              <a key={role.id} href={`#${role.id}`} className="sk-jump-link">
                <span className="project-num">0{i + 1}</span> {role.title}
              </a>
            ))}
          </motion.nav>
        </motion.header>

        <div className="sk-roles">
          {ROLES.map((role, i) => (
            <motion.section
              key={role.id}
              id={role.id}
              className="sk-role"
              aria-labelledby={`${role.id}-title`}
              variants={roleVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              <div className="sk-role-head">
                <p className="project-num">0{i + 1}</p>
                <h2 id={`${role.id}-title`} className="project-title">{role.title}</h2>
                <p className="project-desc">{role.pitch}</p>
              </div>
              <div className="sk-role-body">
                <ul className="sk-evidence">
                  {role.evidence.map(line => <li key={line}>{line}</li>)}
                </ul>
                <ul className="project-tech" aria-label={`${role.title} tools`}>
                  {role.tools.map(tool => <li key={tool} className="tech-tag">{tool}</li>)}
                </ul>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          className="sk-outro"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="sk-outro-text">Hiring for software, data or AI/ML roles? I&rsquo;d like to hear about it.</p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => onNavigateHome('#contact')}>Get in touch →</button>
            <button className="btn btn-outline" onClick={onViewResume}>View my resume</button>
            <button className="btn btn-outline" onClick={() => onNavigateHome('#projects')}>See projects</button>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
