export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
}

export type Environment = "development" | "production";
