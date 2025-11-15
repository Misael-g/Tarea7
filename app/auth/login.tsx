import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    setCargando(true);
    const resultado = await iniciarSesion(email, password);
    setCargando(false);

    if (resultado.success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Error", resultado.error || "No se pudo iniciar sesión");
    }
  };

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>💪</Text>
          <Text style={styles.appName}>FitTrainer</Text>
          <Text style={styles.tagline}>Tu entrenador personal</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={globalStyles.inputLabel}>Correo electrónico</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={globalStyles.inputLabel}>Contraseña</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[
              globalStyles.button,
              globalStyles.buttonPrimary,
              styles.loginButton,
            ]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={globalStyles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/auth/registro")}
          >
            <Text style={styles.registerLinkText}>
              ¿No tienes cuenta?{" "}
              <Text style={styles.registerLinkTextBold}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  formContainer: {
    width: "100%",
  },
  loginButton: {
    marginTop: spacing.md,
  },
  registerLink: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  registerLinkText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  registerLinkTextBold: {
    color: colors.primary,
    fontWeight: "600",
  },
});