import "../styles/global.css";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { ThemeProvider } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [_, setSession] = useState<Session | null>(null);

  async function handleAuthRedirect(url?: string) {
    const redirectUrl = url ?? (await Linking.getInitialURL());
    if (!redirectUrl) return;

    const parsed = new URL(redirectUrl);
    const code = parsed.searchParams.get("code");

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log("🔁 EXCHANGE RESULT:", data, error);
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
    void handleAuthRedirect();

    const sub = Linking.addEventListener("url", ({ url }) => {
      void handleAuthRedirect(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="(app)/chat" />
        <Stack.Screen name="(app)/conversations" />
        <Stack.Screen name="(app)/settings" />
      </Stack>
    </ThemeProvider>
  );
}
