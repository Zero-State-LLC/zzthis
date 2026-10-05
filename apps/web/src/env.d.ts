/// <reference types="astro/client" />

// Public build settings (spec 005 Web client, Build settings). Empty in a
// local build, so the sign-in page shows only signin.dev.
interface ImportMetaEnv {
  readonly PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
  readonly PUBLIC_APPLE_SERVICES_ID?: string;
  readonly PUBLIC_APPLE_REDIRECT_URI?: string;
  readonly PUBLIC_SUPPORT_EMAIL?: string;
  readonly PUBLIC_PRIVACY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
