import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "../lib/supabase";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(
    async function () {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/(app)/conversations");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
