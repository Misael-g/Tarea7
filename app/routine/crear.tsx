import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRoutines } from "../../src/presentation/hooks/useRoutines";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function CrearRutinaScreen() {
  const { usuario } = useAuth();
  const { crear, seleccionarArchivo, grabarVideo } = useRoutines();
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nivel, setNivel] = useState<"principiante" | "intermedio" | "avanzado">("intermedio");
  const [duracionMinutos, setDuracionMinutos] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSeleccionarImagen = async () => {
    const uri = await seleccionarArchivo("imagen");
    if (uri) setImagenUri(uri);
  };

  const handleSeleccionarVideo = async () => {
    Alert.alert(
      "Seleccionar Video",
      "¿Cómo quieres obtener el video?",
      [
        {
          text: "📹 Grabar",
          onPress: async () => {
            const uri = await grabarVideo();
            if (uri) setVideoUri(uri);
          },
        },
        {
          text: "📁 Galería",
          onPress: async () => {
            const uri = await seleccionarArchivo("video");
            if (uri) setVideoUri(uri);
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleCrear = async () => {
    if (!titulo || !descripcion || !duracionMinutos) {
      Alert.alert("Error", "Completa todos los campos requeridos");
      return;
    }

    const duracion = parseInt(duracionMinutos);
    if (isNaN(duracion) || duracion <= 0) {
      Alert.alert("Error", "La duración debe ser un número válido");
      return;
    }

    setCargando(true);
    const resultado = await crear(
      titulo,
      descripcion,
      nivel,
      duracion,
      usuario!.id,
      videoUri || undefined,
      imagenUri || undefined
    );
    setCargando(false);

    if (resultado.success) {
      Alert.alert("¡Éxito!", "Rutina creada correctamente", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo crear la rutina");
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Rutina</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={globalStyles.scrollContent}>
        <Text style={globalStyles.inputLabel}>Título *</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej: Rutina de Piernas"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={globalStyles.inputLabel}>Descripción *</Text>
        <TextInput
          style={[globalStyles.input, globalStyles.inputMultiline]}
          placeholder="Describe los objetivos de esta rutina..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
        />

        <Text style={globalStyles.inputLabel}>Nivel *</Text>
        <View style={styles.nivelesContainer}>
          {(["principiante", "intermedio", "avanzado"] as const).map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.nivelBtn,
                nivel === n && styles.nivelBtnActivo,
              ]}
              onPress={() => setNivel(n)}
            >
              <Text style={[
                styles.nivelText,
                nivel === n && styles.nivelTextActivo
              ]}>
                {n.charAt(0).toUpperCase() + n.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={globalStyles.inputLabel}>Duración (minutos) *</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej: 45"
          value={duracionMinutos}
          onChangeText={setDuracionMinutos}
          keyboardType="numeric"
        />

        <Text style={globalStyles.sectionTitle}>Multimedia</Text>

        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonSecondary]}
          onPress={handleSeleccionarImagen}
        >
          <Text style={globalStyles.buttonText}>
            {imagenUri ? "📷 Cambiar Imagen" : "📷 Agregar Imagen"}
          </Text>
        </TouchableOpacity>

        {imagenUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imagenUri }} style={styles.preview} />
            <TouchableOpacity
              style={styles.btnEliminar}
              onPress={() => setImagenUri(null)}
            >
              <Text style={styles.btnEliminarText}>🗑️ Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonSecondary, { marginTop: spacing.sm }]}
          onPress={handleSeleccionarVideo}
        >
          <Text style={globalStyles.buttonText}>
            {videoUri ? "🎥 Cambiar Video" : "🎥 Agregar Video"}
          </Text>
        </TouchableOpacity>

        {videoUri && (
          <View style={styles.previewContainer}>
            <Text style={globalStyles.textSecondary}>✅ Video seleccionado</Text>
            <TouchableOpacity
              style={styles.btnEliminar}
              onPress={() => setVideoUri(null)}
            >
              <Text style={styles.btnEliminarText}>🗑️ Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonPrimary,
            { marginTop: spacing.xl, marginBottom: spacing.xxl },
          ]}
          onPress={handleCrear}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Crear Rutina</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  nivelesContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nivelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  nivelBtnActivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  nivelText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  nivelTextActivo: {
    color: colors.primary,
    fontWeight: "bold",
  },
  previewContainer: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  btnEliminar: {
    marginTop: spacing.sm,
  },
  btnEliminarText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
});