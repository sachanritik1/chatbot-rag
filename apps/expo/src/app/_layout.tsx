import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";

import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [_, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
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
    </Stack>
  );
}
