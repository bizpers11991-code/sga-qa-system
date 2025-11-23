/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite built-in
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;

  // MSAL Authentication
  readonly VITE_MSAL_CLIENT_ID: string;
  readonly VITE_MSAL_AUTHORITY: string;
  readonly VITE_MSAL_REDIRECT_URI: string;

  // Azure AD (Legacy - keeping for backwards compatibility)
  readonly VITE_AZURE_CLIENT_ID: string;
  readonly VITE_AZURE_TENANT_ID: string;
  readonly VITE_AZURE_REDIRECT_URI: string;

  // API Configuration
  readonly VITE_API_BASE_URL: string;

  // Encryption
  readonly VITE_APP_ENCRYPTION_KEY: string;

  // Redis (for future use)
  readonly VITE_REDIS_URL: string;
  readonly VITE_REDIS_TOKEN: string;

  // AWS S3 (for document storage)
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_S3_BUCKET_NAME: string;

  // AI Services (for future features)
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;

  // Microsoft Graph
  readonly VITE_MS_GRAPH_CALENDAR_ID: string;
  readonly VITE_MS_GRAPH_SCOPE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
