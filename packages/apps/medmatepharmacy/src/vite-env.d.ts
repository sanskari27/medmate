/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PHARMACY_URL?: string;
  readonly VITE_PLAY_URL?: string;
  readonly VITE_IOS_URL?: string;
}

interface Window {
  dataLayer?: Record<string, unknown>[];
}
