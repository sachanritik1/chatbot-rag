// Environment configuration types
export interface AppConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// Default API URLs - override these in your app-specific config
export const DEFAULT_API_URLS = {
  development: {
    ios: "http://localhost:4000",
    android: "http://10.0.2.2:4000",
    web: "http://localhost:4000",
  },
  production: "https://your-deployed-api.com",
};
