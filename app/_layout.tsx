import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../src/presentation/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../src/styles/theme";

export default function RootLayout() {
  const { usuario, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    const enAuth = segments[0] === "auth";

    if (!usuario && !enAuth) {
      // Usuario no autenticado, redirigir a login
      router.replace("/auth/login");
    } else if (usuario && enAuth) {
      // Usuario autenticado en páginas de auth, redirigir a home
      router.replace("/(tabs)");
    }
  }, [usuario, segments, cargando]);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="routine" options={{ headerShown: false }} />
      <Stack.Screen name="plan" options={{ headerShown: false }} />
    </Stack>
  );
}