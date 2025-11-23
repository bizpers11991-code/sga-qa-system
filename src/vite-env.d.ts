/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_CLIENT_ID: string;
  readonly VITE_AZURE_TENANT_ID: string;
  readonly VITE_AZURE_REDIRECT_URI: string;
  readonly VITE_REDIS_URL: string;
  readonly VITE_REDIS_TOKEN: string;
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_S3_BUCKET_NAME: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_MS_GRAPH_CALENDAR_ID: string;
  readonly VITE_MS_GRAPH_SCOPE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
