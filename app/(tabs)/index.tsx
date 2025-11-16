import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlans } from "../../src/presentation/hooks/usePlans";
import { useProgress } from "../../src/presentation/hooks/useProgress";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function HomeScreen() {
  const { usuario, cerrarSesion, esEntrenador } = useAuth();
  const { planes, cargarPlanesPublicos } = usePlans();
  const { estadisticas, cargarEstadisticas, obtenerProgresoHoy } = useProgress();
  const [progresoHoy, setProgresoHoy] = useState<any[]>([]);
  const [refrescando, setRefrescando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    await cargarPlanesPublicos();
    if (!esEntrenador) {
      await cargarEstadisticas();
      const progreso = obtenerProgresoHoy();
      setProgresoHoy(progreso);
    }
  };

  const handleRefresh = async () => {
    setRefrescando(true);
    await cargarDatos();
    setRefrescando(false);
  };

  const handleCerrarSesion = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await cerrarSesion();
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={handleRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>¡Hola! 👋</Text>
          <Text style={globalStyles.textSecondary}>{usuario?.email}</Text>
          <Text style={styles.rol}>
            {esEntrenador ? "👨‍🏫 Entrenador" : "🏋️ Usuario"}
          </Text>
        </View>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonDanger, styles.botonCerrar]}
          onPress={handleCerrarSesion}
        >
          <Text style={globalStyles.buttonText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.scrollContent}>
        {/* ESTADÍSTICAS (Solo para usuarios) */}
        {!esEntrenador && estadisticas && (
          <View style={styles.section}>
            <Text style={globalStyles.sectionTitle}>Resumen General</Text>
            <View style={globalStyles.statsContainer}>
              <View style={globalStyles.statCard}>
                <Text style={globalStyles.statValue}>{estadisticas.totalSesiones}</Text>
                <Text style={globalStyles.statLabel}>Sesiones Totales</Text>
              </View>

              <View style={globalStyles.statCard}>
                <Text style={globalStyles.statValue}>
                  {estadisticas.porcentajeCompletadas}%
                </Text>
                <Text style={globalStyles.statLabel}>Completadas</Text>
              </View>

              <View style={globalStyles.statCard}>
                <Text style={globalStyles.statValue}>
                  {estadisticas.promedioCalificacion}
                </Text>
                <Text style={globalStyles.statLabel}>Calificación</Text>
              </View>

              <View style={globalStyles.statCard}>
                <Text style={globalStyles.statValue}>
                  {estadisticas.duracionPromedio}
                </Text>
                <Text style={globalStyles.statLabel}>Min. Promedio</Text>
              </View>
            </View>
          </View>
        )}

        {/* PLANES DISPONIBLES (Para usuarios) */}
        {!esEntrenador && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={globalStyles.sectionTitle}>Planes Disponibles</Text>
              <TouchableOpacity
                onPress={() => router.push("/planes")}
              >
                <Text style={styles.verTodos}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            
            {planes.length === 0 ? (
              <View style={globalStyles.card}>
                <Text style={globalStyles.textSecondary}>
                  No hay planes disponibles todavía.
                </Text>
              </View>
            ) : (
              planes.slice(0, 3).map((plan) => (
                <View key={plan.id} style={globalStyles.card}>
                  <View style={styles.planHeader}>
                    <Text style={globalStyles.cardTitle}>{plan.nombre}</Text>
                    {plan.activo && (
                      <View style={styles.activoBadge}>
                        <Text style={styles.activoText}>ACTIVO</Text>
                      </View>
                    )}
                  </View>
                  
                  {plan.descripcion && (
                    <Text style={globalStyles.cardSubtitle} numberOfLines={2}>
                      {plan.descripcion}
                    </Text>
                  )}
                  
                  <View style={styles.planInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>👨‍🏫</Text>
                      <Text style={globalStyles.textSecondary}>
                        {plan.entrenador?.nombre || plan.entrenador?.email}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>📅</Text>
                      <Text style={globalStyles.textSecondary}>
                        {new Date(plan.fecha_inicio).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
                    onPress={() => router.push(`/plan/detalle?id=${plan.id}`)}
                  >
                    <Text style={globalStyles.buttonText}>Ver Rutinas</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* PROGRESO DE HOY (Solo para usuarios) */}
        {!esEntrenador && progresoHoy.length > 0 && (
          <View style={styles.section}>
            <Text style={globalStyles.sectionTitle}>Progreso de Hoy</Text>
            {progresoHoy.map((prog) => (
              <View key={prog.id} style={globalStyles.card}>
                <Text style={globalStyles.cardTitle}>
                  {prog.rutina?.titulo || "Rutina"}
                </Text>
                <Text style={globalStyles.textSecondary}>
                  {prog.completada ? "✅ Completada" : "⏳ Pendiente"}
                </Text>
                {prog.duracion_minutos && (
                  <Text style={globalStyles.textSecondary}>
                    ⏱️ {prog.duracion_minutos} minutos
                  </Text>
                )}
                {prog.calificacion && (
                  <Text style={globalStyles.textSecondary}>
                    ⭐ {prog.calificacion}/5
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ENTRENADOR: ACCESOS RÁPIDOS */}
        {esEntrenador && (
          <View style={styles.section}>
            <Text style={globalStyles.sectionTitle}>Accesos Rápidos</Text>
            
            <TouchableOpacity
              style={[globalStyles.card, styles.accesoCard]}
              onPress={() => router.push("/plan/crear")}
            >
              <Text style={styles.accesoEmoji}>📋</Text>
              <View style={styles.accesoInfo}>
                <Text style={globalStyles.cardTitle}>Nuevo Plan</Text>
                <Text style={globalStyles.textSecondary}>
                  Crea un plan con rutinas
                </Text>
              </View>
              <Text style={styles.accesoFlecha}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.card, styles.accesoCard]}
              onPress={() => router.push("/(tabs)/planes")}
            >
              <Text style={styles.accesoEmoji}>📚</Text>
              <View style={styles.accesoInfo}>
                <Text style={globalStyles.cardTitle}>Mis Planes</Text>
                <Text style={globalStyles.textSecondary}>
                  Ver y gestionar planes
                </Text>
              </View>
              <Text style={styles.accesoFlecha}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  saludo: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  rol: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs / 2,
    fontWeight: "500",
  },
  botonCerrar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  verTodos: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activoBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  activoText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },
  planInfo: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoIcon: {
    fontSize: fontSize.md,
  },
  accesoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  accesoEmoji: {
    fontSize: 40,
  },
  accesoInfo: {
    flex: 1,
  },
  accesoFlecha: {
    fontSize: fontSize.xl,
    color: colors.primary,
  },
});