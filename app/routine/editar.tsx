import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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

export default function EditarRutinaScreen() {
  const { id } = useLocalSearchParams();
  const { usuario } = useAuth();
  const { obtenerRutinaPorId, rutinaSeleccionada, actualizar, seleccionarArchivo, grabarVideo } = useRoutines();
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nivel, setNivel] = useState<"principiante" | "intermedio" | "avanzado">("intermedio");
  const [duracionMinutos, setDuracionMinutos] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [imagenUrlAnterior, setImagenUrlAnterior] = useState<string | undefined>();
  const [videoUrlAnterior, setVideoUrlAnterior] = useState<string | undefined>();
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarRutina();
  }, [id]);

  const cargarRutina = async () => {
    if (id) {
      setCargandoDatos(true);
      await obtenerRutinaPorId(id as string);
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    if (rutinaSeleccionada) {
      setTitulo(rutinaSeleccionada.titulo);
      setDescripcion(rutinaSeleccionada.descripcion || "");
      setNivel(rutinaSeleccionada.nivel || "intermedio");
      setDuracionMinutos(rutinaSeleccionada.duracion_minutos?.toString() || "");
      setImagenUrlAnterior(rutinaSeleccionada.imagen_url);
      setVideoUrlAnterior(rutinaSeleccionada.video_url);
    }
  }, [rutinaSeleccionada]);

  if (cargandoDatos) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!rutinaSeleccionada) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.emptyState}>Rutina no encontrada</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.lg }]}
          onPress={() => router.back()}
        >
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (rutinaSeleccionada.entrenador_id !== usuario?.id) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoError}>
          No tienes permiso para editar esta rutina
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.lg }]}
          onPress={() => router.back()}
        >
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  const handleGuardar = async () => {
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
    const resultado = await actualizar(
      id as string,
      titulo,
      descripcion,
      nivel,
      duracion,
      videoUri || undefined,
      imagenUri || undefined,
      videoUrlAnterior,
      imagenUrlAnterior
    );
    setCargando(false);

    if (resultado.success) {
      Alert.alert("¡Éxito!", "Rutina actualizada correctamente", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo actualizar la rutina");
    }
  };

  const imagenParaMostrar = imagenUri || imagenUrlAnterior;
  const tieneVideo = videoUri || videoUrlAnterior;

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Rutina</Text>
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

        {/* IMAGEN */}
        {imagenParaMostrar ? (
          <View>
            <Image source={{ uri: imagenParaMostrar }} style={styles.preview} />
            <View style={styles.botonesMultimedia}>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonSecondary, styles.btnMultimedia]}
                onPress={handleSeleccionarImagen}
              >
                <Text style={globalStyles.buttonText}>📷 Cambiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonDanger, styles.btnMultimedia]}
                onPress={() => {
                  setImagenUri(null);
                  setImagenUrlAnterior(undefined);
                }}
              >
                <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonSecondary]}
            onPress={handleSeleccionarImagen}
          >
            <Text style={globalStyles.buttonText}>📷 Agregar Imagen</Text>
          </TouchableOpacity>
        )}

        {/* VIDEO */}
        <View style={{ marginTop: spacing.md }}>
          {tieneVideo ? (
            <View>
              <Text style={globalStyles.textSecondary}>✅ Video cargado</Text>
              <View style={styles.botonesMultimedia}>
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonSecondary, styles.btnMultimedia]}
                  onPress={handleSeleccionarVideo}
                >
                  <Text style={globalStyles.buttonText}>🎥 Cambiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonDanger, styles.btnMultimedia]}
                  onPress={() => {
                    setVideoUri(null);
                    setVideoUrlAnterior(undefined);
                  }}
                >
                  <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonSecondary]}
              onPress={handleSeleccionarVideo}
            >
              <Text style={globalStyles.buttonText}>🎥 Agregar Video</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonPrimary,
            { marginTop: spacing.xl, marginBottom: spacing.xxl },
          ]}
          onPress={handleGuardar}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
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
  textoError: {
    fontSize: fontSize.lg,
    color: colors.error,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
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
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  botonesMultimedia: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  btnMultimedia: {
    flex: 1,
  },
});