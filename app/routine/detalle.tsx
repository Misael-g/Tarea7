import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoutines } from "../../src/presentation/hooks/useRoutines";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing, borderRadius } from "../../src/styles/theme";

export default function DetalleRutinaScreen() {
  const { id } = useLocalSearchParams();
  const { obtenerRutinaPorId, rutinaSeleccionada, eliminarEjercicio } = useRoutines();
  const { usuario, esEntrenador } = useAuth();
  const router = useRouter();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRutina();
  }, [id]);

  const cargarRutina = async () => {
    if (id) {
      setCargando(true);
      await obtenerRutinaPorId(id as string);
      setCargando(false);
    }
  };

  const handleEliminarEjercicio = (ejercicioId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de eliminar este ejercicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await eliminarEjercicio(ejercicioId, id as string);
            if (resultado.success) {
              Alert.alert("Éxito", "Ejercicio eliminado");
              cargarRutina();
            } else {
              Alert.alert("Error", resultado.error || "No se pudo eliminar");
            }
          },
        },
      ]
    );
  };

  const getNivelColor = (nivel?: string) => {
    switch (nivel) {
      case "principiante":
        return colors.principiante;
      case "intermedio":
        return colors.intermedio;
      case "avanzado":
        return colors.avanzado;
      default:
        return colors.textSecondary;
    }
  };

  if (cargando) {
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

  const rutina = rutinaSeleccionada;
  const ejerciciosOrdenados = rutina.ejercicios?.sort((a, b) => a.orden - b.orden) || [];

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Rutina</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={globalStyles.scrollContent}>
        {/* IMAGEN DE LA RUTINA */}
        {rutina.imagen_url ? (
          <Image
            source={{ uri: rutina.imagen_url }}
            style={styles.imagenPrincipal}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagenPlaceholder}>
            <Text style={styles.iconoPlaceholder}>🏋️</Text>
          </View>
        )}

        {/* INFORMACIÓN GENERAL */}
        <View style={globalStyles.card}>
          <View style={globalStyles.rowBetween}>
            <Text style={globalStyles.cardTitle}>{rutina.titulo}</Text>
            {rutina.nivel && (
              <View style={[styles.nivelBadge, { backgroundColor: getNivelColor(rutina.nivel) }]}>
                <Text style={styles.nivelText}>{rutina.nivel}</Text>
              </View>
            )}
          </View>

          <Text style={[globalStyles.textSecondary, { marginTop: spacing.sm }]}>
            {rutina.descripcion}
          </Text>

          <View style={styles.infoContainer}>
            {rutina.duracion_minutos && (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⏱️</Text>
                <Text style={globalStyles.textSecondary}>
                  {rutina.duracion_minutos} minutos
                </Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💪</Text>
              <Text style={globalStyles.textSecondary}>
                {ejerciciosOrdenados.length} ejercicios
              </Text>
            </View>
          </View>

          {rutina.video_url && (
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonSecondary, { marginTop: spacing.md }]}
              onPress={() => Alert.alert("Video", "Abrir video: " + rutina.video_url)}
            >
              <Text style={globalStyles.buttonText}>🎥 Ver Video Demostrativo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LISTA DE EJERCICIOS */}
        <Text style={globalStyles.sectionTitle}>
          Ejercicios ({ejerciciosOrdenados.length})
        </Text>

        {ejerciciosOrdenados.length === 0 ? (
          <View style={globalStyles.card}>
            <Text style={globalStyles.textSecondary}>
              No hay ejercicios en esta rutina.
            </Text>
            {esEntrenador && rutina.entrenador_id === usuario?.id && (
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
                onPress={() => Alert.alert("Info", "Funcionalidad de agregar ejercicios próximamente")}
              >
                <Text style={globalStyles.buttonText}>+ Agregar Ejercicio</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          ejerciciosOrdenados.map((ejercicio, index) => (
            <View key={ejercicio.id} style={globalStyles.card}>
              <View style={globalStyles.rowBetween}>
                <View style={styles.ejercicioNumero}>
                  <Text style={styles.ejercicioNumeroText}>{index + 1}</Text>
                </View>
                <Text style={[globalStyles.cardTitle, { flex: 1, marginLeft: spacing.md }]}>
                  {ejercicio.nombre}
                </Text>
              </View>

              {ejercicio.descripcion && (
                <Text style={[globalStyles.textSecondary, { marginTop: spacing.sm }]}>
                  {ejercicio.descripcion}
                </Text>
              )}

              <View style={styles.ejercicioInfo}>
                {ejercicio.series && (
                  <View style={styles.ejercicioInfoItem}>
                    <Text style={globalStyles.textBold}>Series:</Text>
                    <Text style={globalStyles.textSecondary}>{ejercicio.series}</Text>
                  </View>
                )}
                {ejercicio.repeticiones && (
                  <View style={styles.ejercicioInfoItem}>
                    <Text style={globalStyles.textBold}>Reps:</Text>
                    <Text style={globalStyles.textSecondary}>{ejercicio.repeticiones}</Text>
                  </View>
                )}
                {ejercicio.descanso_segundos && (
                  <View style={styles.ejercicioInfoItem}>
                    <Text style={globalStyles.textBold}>Descanso:</Text>
                    <Text style={globalStyles.textSecondary}>
                      {ejercicio.descanso_segundos}s
                    </Text>
                  </View>
                )}
              </View>

              {ejercicio.video_url && (
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonSecondary, { marginTop: spacing.sm }]}
                  onPress={() => Alert.alert("Video", "Abrir video: " + ejercicio.video_url)}
                >
                  <Text style={globalStyles.buttonText}>🎥 Ver Demostración</Text>
                </TouchableOpacity>
              )}

              {esEntrenador && rutina.entrenador_id === usuario?.id && (
                <View style={styles.ejercicioActions}>
                  <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonAccent, { flex: 1 }]}
                    onPress={() => Alert.alert("Info", "Editar ejercicio próximamente")}
                  >
                    <Text style={globalStyles.buttonText}>✏️ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonDanger, { flex: 1 }]}
                    onPress={() => handleEliminarEjercicio(ejercicio.id)}
                  >
                    <Text style={globalStyles.buttonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {/* ACCIONES DEL ENTRENADOR */}
        {esEntrenador && rutina.entrenador_id === usuario?.id && (
          <View style={styles.accionesContainer}>
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary]}
              onPress={() => router.push(`/routine/editar?id=${rutina.id}`)}
            >
              <Text style={globalStyles.buttonText}>✏️ Editar Rutina</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
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
  imagenPrincipal: {
    width: "100%",
    height: 250,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  imagenPlaceholder: {
    width: "100%",
    height: 250,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  iconoPlaceholder: {
    fontSize: 80,
  },
  nivelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  nivelText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoContainer: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoIcon: {
    fontSize: fontSize.lg,
  },
  ejercicioNumero: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ejercicioNumeroText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  ejercicioInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  ejercicioInfoItem: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  ejercicioActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  accionesContainer: {
    marginTop: spacing.lg,
  },
});