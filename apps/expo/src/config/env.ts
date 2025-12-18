import Constants from "expo-constants";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SUPABASE_URL: z.string().min(1),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    EXPO_PUBLIC_SUPABASE_URL: (Constants.expoConfig?.extra?.supabaseUrl ??
      process.env.EXPO_PUBLIC_SUPABASE_URL) as string | undefined,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: (Constants.expoConfig?.extra
      ?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) as
      | string
      | undefined,
  },
});
