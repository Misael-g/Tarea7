import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { colors, fontSize, spacing, borderRadius } from "../../src/styles/theme";

export default function DetallePlanScreen() {
  const { id } = useLocalSearchParams();
  const { obtenerPlanPorId, planSeleccionado, cargarRutinasPlan, rutinasDelPlan, obtenerRutinasAgrupadasPorDia } = usePlans();
  const { marcarComoCompletada, estaCompletada } = useProgress();
  const { usuario, esEntrenador } = useAuth();
  const router = useRouter();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPlan();
  }, [id]);

  const cargarPlan = async () => {
    if (id) {
      setCargando(true);
      await obtenerPlanPorId(id as string);
      await cargarRutinasPlan(id as string);
      setCargando(false);
    }
  };

  const handleMarcarCompletada = async (rutinaId: string) => {
    const hoy = new Date().toISOString().split("T")[0];
    const yaCompletada = estaCompletada(rutinaId, hoy);

    if (yaCompletada) {
      Alert.alert("Info", "Esta rutina ya está completada hoy");
      return;
    }

    const resultado = await marcarComoCompletada(rutinaId, hoy);
    if (resultado.success) {
      Alert.alert("¡Éxito!", "Rutina marcada como completada");
    } else {
      Alert.alert("Error", resultado.error || "No se pudo marcar como completada");
    }
  };

  if (cargando) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!planSeleccionado) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.emptyState}>Plan no encontrado</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.lg }]}
          onPress={() => router.back()}
        >
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const plan = planSeleccionado;
  const diasConRutinas = obtenerRutinasAgrupadasPorDia(rutinasDelPlan);

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan de Entrenamiento</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={globalStyles.scrollContent}>
        {/* INFORMACIÓN DEL PLAN */}
        <View style={globalStyles.card}>
          <View style={globalStyles.rowBetween}>
            <Text style={globalStyles.cardTitle}>{plan.nombre}</Text>
            {plan.activo && (
              <View style={styles.activoBadge}>
                <Text style={styles.activoText}>ACTIVO</Text>
              </View>
            )}
          </View>

          {plan.descripcion && (
            <Text style={[globalStyles.textSecondary, { marginTop: spacing.sm }]}>
              {plan.descripcion}
            </Text>
          )}

          <View style={styles.infoContainer}>
            {esEntrenador && plan.usuario && (
              <Text style={globalStyles.textSecondary}>
                👤 Usuario: {plan.usuario.email}
              </Text>
            )}
            {!esEntrenador && plan.entrenador && (
              <Text style={globalStyles.textSecondary}>
                👨‍🏫 Entrenador: {plan.entrenador.email}
              </Text>
            )}
            <Text style={globalStyles.textSecondary}>
              📅 Inicio: {new Date(plan.fecha_inicio).toLocaleDateString()}
            </Text>
            {plan.fecha_fin && (
              <Text style={globalStyles.textSecondary}>
                🏁 Fin: {new Date(plan.fecha_fin).toLocaleDateString()}
              </Text>
            )}
          </View>

          {plan.objetivo && (
            <View style={styles.objetivoContainer}>
              <Text style={globalStyles.textBold}>🎯 Objetivo:</Text>
              <Text style={globalStyles.textSecondary}>{plan.objetivo}</Text>
            </View>
          )}

          {plan.notas && (
            <View style={styles.notasContainer}>
              <Text style={globalStyles.textBold}>📝 Notas:</Text>
              <Text style={globalStyles.textSecondary}>{plan.notas}</Text>
            </View>
          )}
        </View>

        {/* RUTINAS POR DÍA DE LA SEMANA */}
        <Text style={globalStyles.sectionTitle}>
          Rutinas de la Semana ({rutinasDelPlan.length})
        </Text>

        {rutinasDelPlan.length === 0 ? (
          <View style={globalStyles.card}>
            <Text style={globalStyles.textSecondary}>
              No hay rutinas asignadas a este plan.
            </Text>
            {esEntrenador && (
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
                onPress={() => Alert.alert("Info", "Funcionalidad de asignar rutinas próximamente")}
              >
                <Text style={globalStyles.buttonText}>+ Asignar Rutinas</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          diasConRutinas.map((dia) => (
            <View key={dia.numero} style={styles.diaContainer}>
              <View style={styles.diaHeader}>
                <Text style={styles.diaNombre}>{dia.nombre}</Text>
                {dia.rutinas.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{dia.rutinas.length}</Text>
                  </View>
                )}
              </View>

              {dia.rutinas.length === 0 ? (
                <View style={[globalStyles.card, styles.diaVacio]}>
                  <Text style={globalStyles.textSecondary}>Día de descanso 😴</Text>
                </View>
              ) : (
                dia.rutinas.map((planRutina) => {
                  const rutina = planRutina.rutina;
                  if (!rutina) return null;

                  const hoy = new Date().toISOString().split("T")[0];
                  const completada = estaCompletada(rutina.id, hoy);

                  return (
                    <View key={planRutina.id} style={globalStyles.card}>
                      <View style={globalStyles.rowBetween}>
                        <Text style={globalStyles.cardTitle}>{rutina.titulo}</Text>
                        {completada && (
                          <Text style={styles.completadaBadge}>✅ Hecho</Text>
                        )}
                      </View>

                      {rutina.descripcion && (
                        <Text style={globalStyles.cardSubtitle} numberOfLines={2}>
                          {rutina.descripcion}
                        </Text>
                      )}

                      <View style={styles.rutinaInfo}>
                        {rutina.nivel && (
                          <View style={styles.nivelChip}>
                            <Text style={styles.nivelText}>{rutina.nivel}</Text>
                          </View>
                        )}
                        {rutina.duracion_minutos && (
                          <Text style={globalStyles.textSecondary}>
                            ⏱️ {rutina.duracion_minutos} min
                          </Text>
                        )}
                      </View>

                      <View style={globalStyles.cardActions}>
                        <TouchableOpacity
                          style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnRutina]}
                          onPress={() => router.push(`/routine/detalle?id=${rutina.id}`)}
                        >
                          <Text style={globalStyles.buttonText}>Ver Detalle</Text>
                        </TouchableOpacity>

                        {!esEntrenador && !completada && (
                          <TouchableOpacity
                            style={[globalStyles.button, globalStyles.buttonAccent, styles.btnRutina]}
                            onPress={() => handleMarcarCompletada(rutina.id)}
                          >
                            <Text style={globalStyles.buttonText}>✓ Completar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ))
        )}

        {/* ACCIONES DEL ENTRENADOR */}
        {esEntrenador && plan.entrenador_id === usuario?.id && (
          <View style={styles.accionesContainer}>
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary]}
              onPress={() => router.push(`/plan/editar?id=${plan.id}`)}
            >
              <Text style={globalStyles.buttonText}>✏️ Editar Plan</Text>
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
  infoContainer: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  objetivoContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
  },
  notasContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  diaContainer: {
    marginBottom: spacing.lg,
  },
  diaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  diaNombre: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "bold",
  },
  diaVacio: {
    backgroundColor: colors.background,
    alignItems: "center",
    padding: spacing.lg,
  },
  completadaBadge: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: "bold",
  },
  rutinaInfo: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  nivelChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  nivelText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  btnRutina: {
    flex: 1,
  },
  accionesContainer: {
    marginTop: spacing.lg,
  },
});