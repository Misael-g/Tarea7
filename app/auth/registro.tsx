import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize } from "@/src/styles/theme";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<"entrenador" | "usuario">("usuario");
  const [cargando, setCargando] = useState(false);
  const { registrar } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !nombre) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    const resultado = await registrar(email, password, rol);
    setCargando(false);

    if (resultado.success) {
      Alert.alert(
        "¡Registro exitoso!",
        "Tu cuenta ha sido creada correctamente",
        [{ text: "OK", onPress: () => router.replace("/auth/login") }]
      );
    } else {
      Alert.alert("Error", resultado.error || "No se pudo registrar");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.rolContainer}>
        <Text style={styles.label}>Tipo de cuenta:</Text>
        <View style={styles.rolButtons}>
          <TouchableOpacity
            style={[styles.rolButton, rol === "usuario" && styles.rolButtonActive]}
            onPress={() => setRol("usuario")}
          >
            <Text style={[styles.rolText, rol === "usuario" && styles.rolTextActive]}>
              Usuario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rolButton, rol === "entrenador" && styles.rolButtonActive]}
            onPress={() => setRol("entrenador")}
          >
            <Text style={[styles.rolText, rol === "entrenador" && styles.rolTextActive]}>
              Entrenador
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, cargando && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={cargando}
      >
        <Text style={styles.buttonText}>
          {cargando ? "Registrando..." : "Registrarse"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    fontSize: fontSize.md,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
  rolContainer: {
    marginBottom: spacing.lg,
  },
  rolButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rolButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
  },
  rolButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rolText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  rolTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  link: {
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.lg,
    fontSize: fontSize.sm,
  },
});