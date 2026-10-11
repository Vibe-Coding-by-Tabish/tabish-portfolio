/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Microsoft Clarity project ID, set in the Vercel project's environment variables
  readonly VITE_CLARITY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
