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
import { borderRadius, colors, fontSize, spacing } from "../../src/styles/theme";

export default function RegistroScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rolSeleccionado, setRolSeleccionado] = useState<"entrenador" | "usuario">("usuario");
  const [cargando, setCargando] = useState(false);
  const { registrar } = useAuth();
  const router = useRouter();

  const handleRegistro = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    const resultado = await registrar(email, password, rolSeleccionado);
    setCargando(false);

    if (resultado.success) {
      const mensaje = resultado.needsEmailConfirmation
        ? "Cuenta creada. Por favor, revisa tu email para confirmar tu cuenta."
        : "Cuenta creada correctamente";

      Alert.alert("¡Éxito!", mensaje, [
        { text: "OK", onPress: () => router.replace("/auth/login") },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo crear la cuenta");
    }
  };

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Crear Cuenta</Text>
        </View>

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
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        <Text style={globalStyles.inputLabel}>Confirmar Contraseña</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        <Text style={styles.labelRol}>Selecciona tu rol:</Text>
        <View style={styles.contenedorRoles}>
          <TouchableOpacity
            style={[
              styles.botonRol,
              rolSeleccionado === "usuario" && styles.botonRolActivo,
            ]}
            onPress={() => setRolSeleccionado("usuario")}
          >
            <Text style={styles.emoji}>🏋️</Text>
            <Text
              style={[
                styles.textoRol,
                rolSeleccionado === "usuario" && styles.textoRolActivo,
              ]}
            >
              Usuario
            </Text>
            <Text style={styles.descripcionRol}>
              Recibe rutinas y planes de entrenamiento
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botonRol,
              rolSeleccionado === "entrenador" && styles.botonRolActivo,
            ]}
            onPress={() => setRolSeleccionado("entrenador")}
          >
            <Text style={styles.emoji}>👨‍🏫</Text>
            <Text
              style={[
                styles.textoRol,
                rolSeleccionado === "entrenador" && styles.textoRolActivo,
              ]}
            >
              Entrenador
            </Text>
            <Text style={styles.descripcionRol}>
              Crea rutinas y asigna planes a usuarios
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonPrimary,
            styles.registerButton,
          ]}
          onPress={handleRegistro}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  labelRol: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  contenedorRoles: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  botonRol: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  botonRolActivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  textoRol: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  textoRolActivo: {
    color: colors.primary,
    fontWeight: "bold",
  },
  descripcionRol: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  registerButton: {
    marginTop: spacing.md,
  },
});