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
    title: 'Nextflow, Software, AI & FHIR Engineer | Tabish Ali Ansari',
    description:
      'Engineer and consultant in Pune: Nextflow bioinformatics pipelines on AWS, production backends, AI and data engineering, and HL7 v2 / FHIR health data integration.',
  },
  resume: {
    path: '/resume',
    title: 'Resume | Tabish Ali Ansari, Software Engineer',
    description:
      'Resume of Tabish Ali Ansari, Software Development Engineer at NonStop io: clinical genomics, HL7 v2 and FHIR, AWS genomics pipelines, B.Tech AI & Data Science.',
  },
} satisfies Record<string, PageMeta>;
