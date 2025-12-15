import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://elqzzbozuodnigzugvhd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscXp6Ym96dW9kbmlnenVndmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MTU1MDYsImV4cCI6MjA2MjI5MTUwNn0.7ngOBK5ti4Q8S8N1oLlenYuNHw7zHrPotNUCqfxzgus";

// Use AsyncStorage for all auth data (JWT tokens are too large for SecureStore which has a 2048 byte limit)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
