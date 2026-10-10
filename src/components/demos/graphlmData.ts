// Content for the GraphLM demo: a small knowledge graph of resume.pdf and three
// prewritten answers. Every fact here comes from public/resume.pdf; keep the
// two in step when the resume changes.

export type QuestionId = 'graphs' | 'production' | 'ml';

export type NodeKind = 'person' | 'org' | 'project' | 'paper' | 'tech' | 'fact' | 'award';

export interface GraphNode {
  id: string;
  label: string;
  /** Label for the compact (phone) graph, where width is scarce */
  short: string;
  kind: NodeKind;
  /** One line shown when the node is selected */
  detail: string;
  /** Position in the wide graph pane, 0..1 */
  wide: [number, number];
  /** Position in the compact graph pane, 0..1 */
  compact: [number, number];
  /** The question that explains this node, if any */
  q?: QuestionId;
}

export interface GraphEdge {
  from: string;
  to: string;
  rel: string;
}

export interface Answer {
  id: QuestionId;
  question: string;
  /** Short label for the suggestion chip */
  chip: string;
  /** Edge indexes into EDGES, in the order the traversal lights them */
  path: number[];
  /** Spoken as a chain while the graph is traversed */
  hops: string[];
  paragraphs: string[];
  citations: string[];
  /** Lower-case words that route typed questions here */
  keywords: string[];
}

export const SOURCE = 'resume.pdf';

export const NODES: GraphNode[] = [
  { id: 'tabish',    label: 'Tabish Ali Ansari',       short: 'Tabish',          kind: 'person',  wide: [0.50, 0.50], compact: [0.50, 0.50], detail: 'Software Development Engineer, Pune, India' },
  { id: 'nonstop',   label: 'NonStop io',              short: 'NonStop io',      kind: 'org',     wide: [0.21, 0.44], compact: [0.17, 0.50], detail: 'Software Development Engineer since May 2026, intern from Feb 2025', q: 'production' },
  { id: 'variant',   label: 'Variant review platform', short: 'Variant app',     kind: 'project', wide: [0.27, 0.20], compact: [0.20, 0.25], detail: 'FastAPI/PostgreSQL clinical variant review platform', q: 'production' },
  { id: 'envs',      label: '5 environments',          short: '5 envs',          kind: 'fact',    wide: [0.15, 0.06], compact: [0.12, 0.06], detail: 'dev, QA, UAT, staging and prod on Oracle Linux 8.10', q: 'production' },
  { id: 'genie',     label: 'genie.sh',                short: 'genie.sh',        kind: 'tech',    wide: [0.09, 0.29], compact: [0.42, 0.10], detail: '14-phase resumable bootstrap and deployment script', q: 'production' },
  { id: 'incidents', label: '5 prod incidents',        short: '5 incidents',     kind: 'fact',    wide: [0.12, 0.63], compact: [0.18, 0.76], detail: 'Diagnosed and resolved on QA/UAT, from nginx routing to Entra tokens', q: 'production' },
  { id: 'llm',       label: 'LLM report summaries',    short: 'LLM summaries',   kind: 'project', wide: [0.18, 0.90], compact: [0.16, 0.62], detail: 'LLM-assisted system that turns structured reports into summaries', q: 'ml' },
  { id: 'fastapi',   label: 'FastAPI',                 short: 'FastAPI',         kind: 'tech',    wide: [0.50, 0.30], compact: [0.50, 0.28], detail: 'Shared by the variant platform, GraphLM and ADAPT' },
  { id: 'graphlm',   label: 'GraphLM',                 short: 'GraphLM',         kind: 'project', wide: [0.71, 0.27], compact: [0.76, 0.30], detail: 'Knowledge-graph-augmented retrieval over documents', q: 'graphs' },
  { id: 'neo4j',     label: 'Neo4j',                   short: 'Neo4j',           kind: 'tech',    wide: [0.90, 0.12], compact: [0.90, 0.08], detail: 'Graph database: entities and their relationships', q: 'graphs' },
  { id: 'qdrant',    label: 'Qdrant',                  short: 'Qdrant',          kind: 'tech',    wide: [0.92, 0.38], compact: [0.90, 0.52], detail: 'Vector database: semantic search over text chunks', q: 'graphs' },
  { id: 'survey',    label: 'KG survey (2025)',        short: 'KG survey',       kind: 'paper',   wide: [0.58, 0.07], compact: [0.68, 0.08], detail: 'GraphLM: A Comprehensive Survey on Knowledge Graphs for Intelligent Document Understanding', q: 'graphs' },
  { id: 'neuro',     label: 'Neurosymbolic review',    short: 'Neuro review',    kind: 'paper',   wide: [0.84, 0.55], compact: [0.64, 0.64], detail: 'First author: a review of hybrid reasoning frameworks (2025)' },
  { id: 'adapt',     label: 'ADAPT',                   short: 'ADAPT',           kind: 'project', wide: [0.68, 0.72], compact: [0.68, 0.76], detail: "Alzheimer's stage classification from MRI scans", q: 'ml' },
  { id: 'vgg',       label: 'VGG-19',                  short: 'VGG-19',          kind: 'tech',    wide: [0.90, 0.75], compact: [0.90, 0.72], detail: 'Convolutional network behind the ADAPT classifier', q: 'ml' },
  { id: 'mlops',     label: 'DVC + MLflow',            short: 'DVC+MLflow',      kind: 'tech',    wide: [0.82, 0.93], compact: [0.84, 0.93], detail: 'Data and model versioning plus experiment tracking', q: 'ml' },
  { id: 'metaboliq', label: 'MetaboliQ AI',            short: 'MetaboliQ',       kind: 'project', wide: [0.46, 0.75], compact: [0.40, 0.80], detail: 'Diabetes risk prediction at ~83% accuracy, team of 4', q: 'ml' },
  { id: 'intel',     label: 'Intel AI Hackathon',      short: 'Intel hackathon', kind: 'award',   wide: [0.52, 0.94], compact: [0.28, 0.95], detail: 'Top 10 finalist, IEEE INDICON, IIT Kharagpur', q: 'ml' },
];

export const EDGES: GraphEdge[] = [
  /*  0 */ { from: 'tabish',    to: 'nonstop',   rel: 'WORKS_AT' },
  /*  1 */ { from: 'tabish',    to: 'variant',   rel: 'MAINTAINS' },
  /*  2 */ { from: 'variant',   to: 'envs',      rel: 'DEPLOYED_ACROSS' },
  /*  3 */ { from: 'tabish',    to: 'genie',     rel: 'AUTHORED' },
  /*  4 */ { from: 'genie',     to: 'variant',   rel: 'DEPLOYS' },
  /*  5 */ { from: 'tabish',    to: 'incidents', rel: 'RESOLVED' },
  /*  6 */ { from: 'incidents', to: 'genie',     rel: 'HARDENED' },
  /*  7 */ { from: 'variant',   to: 'fastapi',   rel: 'BUILT_ON' },
  /*  8 */ { from: 'tabish',    to: 'llm',       rel: 'BUILT' },
  /*  9 */ { from: 'llm',       to: 'nonstop',   rel: 'BUILT_AT' },
  /* 10 */ { from: 'tabish',    to: 'graphlm',   rel: 'BUILT' },
  /* 11 */ { from: 'graphlm',   to: 'neo4j',     rel: 'GRAPH_IN' },
  /* 12 */ { from: 'graphlm',   to: 'qdrant',    rel: 'VECTORS_IN' },
  /* 13 */ { from: 'graphlm',   to: 'fastapi',   rel: 'BUILT_ON' },
  /* 14 */ { from: 'graphlm',   to: 'survey',    rel: 'BASIS_FOR' },
  /* 15 */ { from: 'tabish',    to: 'survey',    rel: 'CO_AUTHORED' },
  /* 16 */ { from: 'tabish',    to: 'neuro',     rel: 'FIRST_AUTHOR' },
  /* 17 */ { from: 'tabish',    to: 'adapt',     rel: 'BUILT' },
  /* 18 */ { from: 'adapt',     to: 'vgg',       rel: 'CLASSIFIES_WITH' },
  /* 19 */ { from: 'adapt',     to: 'mlops',     rel: 'TRACKED_WITH' },
  /* 20 */ { from: 'adapt',     to: 'fastapi',   rel: 'SERVED_BY' },
  /* 21 */ { from: 'tabish',    to: 'metaboliq', rel: 'LED' },
  /* 22 */ { from: 'metaboliq', to: 'intel',     rel: 'FINALIST_AT' },
];

export const ANSWERS: Answer[] = [
  {
    id: 'graphs',
    question: 'What has he built with knowledge graphs?',
    chip: 'Knowledge graphs',
    path: [10, 11, 12, 14, 15],
    hops: ['Tabish', 'GraphLM', 'Neo4j + Qdrant', 'KG survey'],
    paragraphs: [
      'He built GraphLM, a retrieval system that combines RAG, vector search and a knowledge graph to answer multi-hop questions over unstructured research documents.',
      'Entities and relationships go into Neo4j and text chunks into Qdrant, and every answer draws on both.',
      'GraphLM became the basis for a published survey on knowledge graphs for intelligent document understanding (2025).',
    ],
    citations: ['Projects', 'Publications'],
    keywords: ['graph', 'graphs', 'knowledge', 'rag', 'neo4j', 'qdrant', 'vector', 'retrieval', 'graphlm', 'paper', 'papers', 'publication', 'publications', 'research', 'survey', 'published'],
  },
  {
    id: 'production',
    question: 'What production work has he shipped?',
    chip: 'Production work',
    path: [0, 1, 2, 7, 3, 4, 5, 6],
    hops: ['Tabish', 'NonStop io', 'Variant platform', 'genie.sh'],
    paragraphs: [
      'Yes. As a Software Development Engineer at NonStop io he maintains a FastAPI/PostgreSQL clinical variant review platform across 5 environments, dev through prod.',
      'He wrote genie.sh, a 14-phase resumable deployment script that cut 3 hours of manual setup to a single command.',
      'Its hard checks come from 5 production incidents he diagnosed, including an nginx bug that returned 404 across the entire API.',
    ],
    citations: ['Experience'],
    keywords: ['production', 'prod', 'deploy', 'deployed', 'deployment', 'ship', 'shipped', 'job', 'work', 'works', 'experience', 'nonstop', 'incident', 'incidents', 'devops', 'linux', 'nginx', 'backend', 'genie', 'infra', 'infrastructure', 'company', 'employer', 'current'],
  },
  {
    id: 'ml',
    question: 'What machine learning work has he done?',
    chip: 'Machine learning',
    path: [17, 18, 19, 21, 22, 8],
    hops: ['Tabish', 'ADAPT', 'MetaboliQ AI', 'LLM summaries'],
    paragraphs: [
      "ADAPT classifies Alzheimer's stages from MRI scans with VGG-19, and DVC plus MLflow trace every result back to the data and weights behind it.",
      'He led a team of 4 on MetaboliQ AI, a diabetes risk model at ~83% accuracy that made the Top 10 of the Intel AI Hackathon at IIT Kharagpur.',
      'At NonStop io he built an LLM-assisted system that turns structured reports into actionable summaries.',
    ],
    citations: ['Projects', 'Experience'],
    keywords: ['ml', 'machine', 'learning', 'model', 'models', 'ai', 'deep', 'alzheimer', 'alzheimers', 'adapt', 'diabetes', 'metaboliq', 'hackathon', 'vgg', 'mlflow', 'llm', 'llms', 'science', 'scientist', 'prediction', 'neural', 'pytorch', 'tensorflow'],
  },
];

export const answerById = (id: QuestionId) => ANSWERS.find(a => a.id === id)!;

// Routes a typed question to the answer whose keywords it mentions most;
// null when it mentions none, so the demo can say what it knows instead
export function routeQuestion(text: string): QuestionId | null {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  let best: QuestionId | null = null;
  let bestScore = 0;
  for (const answer of ANSWERS) {
    const score = words.filter(w => answer.keywords.includes(w)).length;
    if (score > bestScore) {
      best = answer.id;
      bestScore = score;
    }
  }
  return best;
}
