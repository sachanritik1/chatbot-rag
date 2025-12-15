import "../styles/global.css";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";

import { ThemeProvider } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [_, setSession] = useState<Session | null>(null);

  async function handleAuthRedirect(url?: string) {
    const redirectUrl = url ?? (await Linking.getInitialURL());
    if (!redirectUrl) return;

    const parsed = new URL(redirectUrl);
    const code = parsed.searchParams.get("code");

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Cold start
    void handleAuthRedirect();

    // Warm start
    const sub = Linking.addEventListener("url", ({ url }) => {
      void handleAuthRedirect(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#2563eb",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: "Sign In",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/signup"
          options={{
            title: "Sign Up",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(app)/chat"
          options={{
            title: "AI Chat",
          }}
        />
        <Stack.Screen
          name="(app)/conversations"
          options={{
            title: "Conversations",
          }}
        />
        <Stack.Screen
          name="(app)/settings"
          options={{
            title: "Settings",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
