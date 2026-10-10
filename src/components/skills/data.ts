// Content for the Skills page. Every claim must be backed by the resume
// (public/resume.pdf); illustrative centrepieces say so on screen.

export type OptionId =
  | 'bioinformatics-pipelines'
  | 'software-engineering'
  | 'ai-data-engineering'
  | 'health-data-integration';

export interface Stat {
  value: string;
  label: string;
}

export interface SkillOption {
  id: OptionId;
  /** Full name, as in the page's own copy */
  name: string;
  /** Segmented control label */
  short: string;
  /** Ends "Let’s talk about …" */
  talk: string;
  /** One line under the icon on the overview */
  blurb: string;
  /** The overview tile's single strongest number */
  headline: Stat;
  /** Keynote-style statement opening the option */
  statement: string;
  sub: string;
  stats: Stat[];
  evidence: string[];
  shipped: string[];
  /** Tools on the resume without a project above to point at */
  familiar?: string[];
}

export const OPTIONS: SkillOption[] = [
  {
    id: 'bioinformatics-pipelines',
    name: 'Bioinformatics Pipelines (Nextflow)',
    short: 'Pipelines',
    talk: 'your pipelines',
    blurb: 'Nextflow workflows for genomic data, from a laptop to AWS.',
    headline: { value: '300 GB', label: 'per dataset' },
    statement: 'Pipelines that pick up where they failed.',
    sub: 'Nextflow workflows over 100 to 300 GB of genomic data, run locally or on AWS Batch, EKS and HealthOmics, with automated recovery when a step falls over.',
    stats: [
      { value: '100–300 GB', label: 'genomic datasets per run' },
      { value: '4', label: 'executors: local, AWS Batch, EKS, HealthOmics' },
      { value: '5', label: 'workflow engines in StrixFlow' },
      { value: '395', label: 'unit tests behind StrixFlow' },
    ],
    evidence: [
      'Designed and ran genomics data workflows on 100–300 GB datasets, built for structured processing and pipeline reliability.',
      'Automated multi-step execution with failure recovery and re-run logic, so failed workflows no longer need a person to restart them.',
      'Built run tracking and event-based monitoring services on REST APIs and PostgreSQL JSONB.',
      'At NonStop io, contributed to StrixFlow: local-first orchestration across Nextflow, Snakemake, CWL, WDL and Python without rewriting pipelines, recovering the DAG through native engine introspection, with 395 unit tests and Playwright end-to-end coverage.',
    ],
    shipped: ['Nextflow', 'Snakemake', 'CWL', 'WDL', 'AWS Batch', 'AWS EKS', 'AWS HealthOmics', 'Docker', 'PostgreSQL', 'Python'],
    familiar: ['Apache Airflow', 'Kubernetes'],
  },
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    short: 'Software',
    talk: 'your software',
    blurb: 'FastAPI services, secured and shipped to production.',
    headline: { value: '1', label: 'command, down from 3 hours' },
    statement: 'Typed. Secured. Shipped.',
    sub: 'FastAPI services with validated contracts and machine-to-machine auth, shipped by a script that turned three hours of setup into one command.',
    stats: [
      { value: 'FastAPI', label: 'services with validated request contracts' },
      { value: 'OAuth 2.0', label: 'machine-to-machine auth with Okta' },
      { value: '3 h → 1', label: 'environment setup, now one command' },
      { value: '65', label: 'API endpoints under a validation harness' },
    ],
    evidence: [
      'Build FastAPI services, including an ETL service that handles data ingestion and transformation for a bioinformatics workflow, running alongside a clinical review API and PostgreSQL.',
      'Secure service-to-service calls with Okta machine-to-machine auth (OAuth 2.0 client credentials), keeping ETL execution and clinical review separated across services.',
      'Own maintenance and deployment of a FastAPI and PostgreSQL clinical variant review platform across dev, QA, UAT, staging and prod on Oracle Linux, with systemd, nginx, uvicorn, SELinux and Azure Pipelines.',
      'Wrote genie.sh, a 14-phase resumable bootstrap and deployment script with SELinux, firewalld and GIT_ASKPASS handling. Its hard assertions come from five past production incidents.',
      'Fixed an nginx named-location bug that returned 404 across the entire API, an Entra v1/v2 token mismatch causing 401s, and a primary-key mismatch that needed a live ALTER TABLE on a clinical database.',
      'Built a Swagger-driven validation harness over all 65 endpoints and designed the CI/CD architecture for all five environments.',
    ],
    shipped: ['Python', 'FastAPI', 'Pydantic', 'PostgreSQL', 'Okta', 'OAuth 2.0', 'Java', 'Spring Boot', 'nginx', 'systemd', 'SELinux', 'Linux', 'Bash', 'Docker', 'Azure Pipelines', 'OpenTelemetry'],
    familiar: ['Kubernetes', 'RabbitMQ'],
  },
  {
    id: 'ai-data-engineering',
    name: 'AI & Data Engineering',
    short: 'AI & Data',
    talk: 'your AI and data work',
    blurb: 'Models, retrieval and the data plumbing under them.',
    headline: { value: '3', label: 'live demos to try' },
    statement: 'Don’t take my word for it. Try them.',
    sub: 'Three projects you can use right now on the home page: knowledge-graph retrieval, MRI classification and diabetes risk prediction.',
    stats: [
      { value: '~92%', label: 'ADAPT test accuracy, VGG-19' },
      { value: '~83%', label: 'MetaboliQ AI accuracy' },
      { value: 'Top 10', label: 'Intel AI Hackathon, IIT Kharagpur' },
      { value: '2', label: 'published papers' },
    ],
    evidence: [
      'GraphLM: retrieval that combines RAG, vector search in Qdrant and a Neo4j knowledge graph for multi-hop questions, and the basis of a published survey.',
      'ADAPT: Alzheimer’s stage classification from MRI on VGG-19, with DVC and MLflow tracing every result back to its data and weights.',
      'MetaboliQ AI: four scikit-learn predictors for diabetes risk. Led a team of four to the Top 10 of the Intel AI Hackathon.',
      'At NonStop io, built an LLM-assisted system that turns structured reports into actionable summaries.',
      'First author of a review on neurosymbolic AI. First Runner-Up, ISB&M Pune Analytics Case Study Competition; Most Innovative Award, QA AI Agent Hackathon 2026.',
    ],
    shipped: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Hugging Face', 'RAG', 'Qdrant', 'Neo4j', 'MLflow', 'DVC', 'SQL', 'PostgreSQL'],
    familiar: ['Databricks', 'Snowflake', 'dbt', 'Apache Airflow'],
  },
  {
    id: 'health-data-integration',
    name: 'Health Data Integration (HL7 v2 / FHIR)',
    short: 'Health data',
    talk: 'your health data',
    blurb: 'HL7 v2 and FHIR, validated and moving between systems.',
    headline: { value: 'HL7 → FHIR', label: 'in production' },
    statement: 'HL7 v2 in. FHIR out.',
    sub: 'I built InterGenix, the layer that validates lab messages and moves them between a lab system, an integration engine and a FHIR server.',
    stats: [
      { value: '4', label: 'systems connected end to end' },
      { value: 'HAPI', label: 'HL7 v2 parsing and validation' },
      { value: 'Java 17', label: 'Spring Boot 3 service' },
      { value: 'Live', label: 'in a production clinical pipeline' },
    ],
    evidence: [
      'At NonStop io, built InterGenix, a Spring Boot 3 and Java 17 service that acts as the validation and orchestration layer alongside Mirth Connect.',
      'Parses and validates HL7 v2 messages with HAPI, exchanges data with a Medplum FHIR server and polls OpenELIS for laboratory results.',
      'The pipeline reached full operational status in a production clinical setting.',
      'Maintain a regulated clinical variant review platform for a US genomics laboratory.',
    ],
    shipped: ['HL7 v2', 'HAPI', 'FHIR', 'Medplum', 'Mirth Connect', 'OpenELIS', 'Java 17', 'Spring Boot 3'],
  },
];

export const optionById = (id: OptionId) => OPTIONS.find(o => o.id === id)!;

// Hashes from older links (and handy short ones) that land on an option
const ALIASES: Record<string, OptionId> = {
  nextflow: 'bioinformatics-pipelines',
  bioinformatics: 'bioinformatics-pipelines',
  pipelines: 'bioinformatics-pipelines',
  software: 'software-engineering',
  'data-engineering': 'ai-data-engineering',
  'data-science': 'ai-data-engineering',
  'ai-ml-engineering': 'ai-data-engineering',
  ai: 'ai-data-engineering',
  hl7: 'health-data-integration',
  fhir: 'health-data-integration',
};

export function optionFromHash(hash: string): OptionId | null {
  const key = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase();
  if (OPTIONS.some(o => o.id === key)) return key as OptionId;
  return ALIASES[key] ?? null;
}

export const EMAIL = 'ansaritabishali1@gmail.com';
