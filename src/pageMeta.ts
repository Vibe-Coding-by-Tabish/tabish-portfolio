// Single source for each route's <head> metadata. vite.config.ts bakes these
// into the built HTML (what crawlers and link previews read); App.tsx applies
// them again on client-side navigation.

export const SITE_URL = 'https://tabishaliansari.vercel.app';

export interface PageMeta {
  path: string;
  title: string;
  description: string;
}

export const PAGE_META = {
  home: {
    path: '/',
    title: 'Tabish Ali Ansari | Clinical Genomics Software Engineer',
    description:
      'Tabish Ali Ansari: software engineer in Pune across backend, data engineering and AI/ML, building clinical genomics platforms and HL7 v2 / FHIR integrations.',
  },
  skills: {
    path: '/skills',
    title: 'Software, Data & AI/ML Engineer | Tabish Ali Ansari',
    description:
      'Tabish Ali Ansari in software, data engineering, data science and AI/ML: FastAPI and Spring Boot APIs, 100–300 GB data pipelines, MLOps and RAG systems.',
  },
  resume: {
    path: '/resume',
    title: 'Resume | Tabish Ali Ansari, Software Engineer',
    description:
      'Resume of Tabish Ali Ansari, Software Development Engineer at NonStop io: clinical genomics, HL7 v2 and FHIR, AWS genomics pipelines, B.Tech AI & Data Science.',
  },
} satisfies Record<string, PageMeta>;
