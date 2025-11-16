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
import { colors, fontSize, spacing, borderRadius } from "../../src/styles/theme";

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
    Alert.alert(
      "Agregar Imagen",
      "Elige cómo quieres obtener la imagen",
      [
        {
          text: "📷 Tomar Foto",
          onPress: async () => {
            const uri = await seleccionarArchivo("imagen");
            if (uri) setImagenUri(uri);
          },
        },
        {
          text: "🖼️ Galería",
          onPress: async () => {
            const uri = await seleccionarArchivo("imagen");
            if (uri) setImagenUri(uri);
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleSeleccionarVideo = async () => {
    Alert.alert(
      "Agregar Video",
      "Elige cómo quieres obtener el video",
      [
        {
          text: "🎥 Grabar Video",
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
      Alert.alert(
        "¡Éxito!",
        "Rutina creada correctamente",
        [{ text: "OK", onPress: () => router.back() }]
      );
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

        {/* SECCIÓN DE MULTIMEDIA MEJORADA */}
        <View style={styles.multimediaSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎨 Multimedia</Text>
            <Text style={styles.sectionSubtitle}>
              Agrega imágenes y videos para inspirar a tus usuarios
            </Text>
          </View>

          {/* IMAGEN */}
          <View style={styles.mediaCard}>
            <View style={styles.mediaHeader}>
              <Text style={styles.mediaTitle}>📷 Imagen de Portada</Text>
              {imagenUri && (
                <TouchableOpacity
                  onPress={() => setImagenUri(null)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>🗑️ Quitar</Text>
                </TouchableOpacity>
              )}
            </View>

            {imagenUri ? (
              <View style={styles.previewContainer}>
                <Image 
                  source={{ uri: imagenUri }} 
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={handleSeleccionarImagen}
                >
                  <Text style={styles.changeButtonText}>🔄 Cambiar Imagen</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleSeleccionarImagen}
              >
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadText}>Agregar Imagen</Text>
                <Text style={styles.uploadHint}>
                  Toca para tomar una foto o elegir de la galería
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* VIDEO */}
          <View style={styles.mediaCard}>
            <View style={styles.mediaHeader}>
              <Text style={styles.mediaTitle}>🎥 Video Demostrativo</Text>
              {videoUri && (
                <TouchableOpacity
                  onPress={() => setVideoUri(null)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>🗑️ Quitar</Text>
                </TouchableOpacity>
              )}
            </View>

            {videoUri ? (
              <View style={styles.previewContainer}>
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoIcon}>🎬</Text>
                  <Text style={styles.videoText}>Video cargado</Text>
                  <Text style={styles.videoHint}>
                    Los usuarios podrán ver este video al abrir la rutina
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={handleSeleccionarVideo}
                >
                  <Text style={styles.changeButtonText}>🔄 Cambiar Video</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleSeleccionarVideo}
              >
                <Text style={styles.uploadIcon}>🎥</Text>
                <Text style={styles.uploadText}>Agregar Video</Text>
                <Text style={styles.uploadHint}>
                  Graba un video o elige uno de tu galería
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* TIPS */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Consejos</Text>
            <Text style={styles.tipText}>
              • Las imágenes ayudan a los usuarios a visualizar el entrenamiento
            </Text>
            <Text style={styles.tipText}>
              • Los videos demostrativos mejoran la técnica y reducen lesiones
            </Text>
            <Text style={styles.tipText}>
              • Usa buena iluminación y ángulos claros en tus videos
            </Text>
          </View>
        </View>

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

  // Multimedia Section
  multimediaSection: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Media Card
  mediaCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  mediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  mediaTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeButtonText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },

  // Upload Button
  uploadButton: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  uploadText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  uploadHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Preview Container
  previewContainer: {
    gap: spacing.sm,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
  },
  videoPlaceholder: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  videoText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.success,
    marginBottom: spacing.xs,
  },
  videoHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  changeButton: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  changeButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },

  // Tips Card
  tipsCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});