import { useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "~/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function finishAuth() {
      // Wait until session is available

      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        router.replace("/(app)/conversations");
      } else {
        router.replace("/(auth)/login");
      }
    }

    // slight delay to allow exchangeCodeForSession to complete
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const t = setTimeout(finishAuth, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Signing you in…</Text>
    </View>
  );
}
