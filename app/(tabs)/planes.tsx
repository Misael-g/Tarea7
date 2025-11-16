import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlans } from "../../src/presentation/hooks/usePlans";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function PlanesScreen() {
  const { esEntrenador, usuario } = useAuth();
  const { planes, misPlanes, cargando, cargarPlanesPublicos, cargarMisPlanes, eliminar } = usePlans();
  const [refrescando, setRefrescando] = React.useState(false);
  const [mostrarMisPlanes, setMostrarMisPlanes] = React.useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarPlanesPublicos();
      if (esEntrenador) {
        cargarMisPlanes();
      }
    }, [esEntrenador])
  );

  const handleRefresh = async () => {
    setRefrescando(true);
    await cargarPlanesPublicos();
    if (esEntrenador) {
      await cargarMisPlanes();
    }
    setRefrescando(false);
  };

  const handleEliminar = (planId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await eliminar(planId);
            if (resultado.success) {
              Alert.alert("Éxito", "Plan eliminado correctamente");
            } else {
              Alert.alert("Error", resultado.error || "No se pudo eliminar");
            }
          },
        },
      ]
    );
  };

  // Determinar qué planes mostrar
  const planesAMostrar = esEntrenador && mostrarMisPlanes ? misPlanes : planes;

  if (cargando) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Planes de Entrenamiento</Text>
          {esEntrenador && (
            <Text style={styles.headerSubtitle}>
              {mostrarMisPlanes ? "Mis Planes" : "Todos los Planes"}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {esEntrenador && (
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonSecondary, styles.btnToggle]}
              onPress={() => setMostrarMisPlanes(!mostrarMisPlanes)}
            >
              <Text style={globalStyles.buttonText}>
                {mostrarMisPlanes ? "📋 Todos" : "👤 Míos"}
              </Text>
            </TouchableOpacity>
          )}
          {esEntrenador && (
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnCrear]}
              onPress={() => router.push("/plan/crear")}
            >
              <Text style={globalStyles.buttonText}>+ Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={planesAMostrar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={globalStyles.emptyState}>
              {mostrarMisPlanes
                ? "No has creado planes. ¡Crea tu primer plan!"
                : "No hay planes disponibles todavía"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const esMiPlan = item.entrenador_id === usuario?.id;
          
          return (
            <View style={globalStyles.card}>
              <View style={globalStyles.cardHeader}>
                <View style={styles.planHeader}>
                  <Text style={globalStyles.cardTitle}>{item.nombre}</Text>
                  {item.activo && (
                    <View style={styles.activoBadge}>
                      <Text style={styles.activoText}>ACTIVO</Text>
                    </View>
                  )}
                </View>
                {esMiPlan && (
                  <View style={styles.miPlanBadge}>
                    <Text style={styles.miPlanText}>MÍO</Text>
                  </View>
                )}
              </View>

              {item.descripcion && (
                <Text style={globalStyles.cardSubtitle} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              )}

              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>👨‍🏫</Text>
                  <Text style={globalStyles.textSecondary}>
                    {item.entrenador?.nombre || item.entrenador?.email || "Entrenador"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📅</Text>
                  <Text style={globalStyles.textSecondary}>
                    {new Date(item.fecha_inicio).toLocaleDateString()}
                  </Text>
                </View>
                {item.fecha_fin && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🏁</Text>
                    <Text style={globalStyles.textSecondary}>
                      {new Date(item.fecha_fin).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {item.objetivo && (
                <View style={styles.objetivoContainer}>
                  <Text style={globalStyles.textBold}>🎯 Objetivo:</Text>
                  <Text style={globalStyles.textSecondary}>{item.objetivo}</Text>
                </View>
              )}

              <View style={globalStyles.cardActions}>
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnAccion]}
                  onPress={() => router.push(`/plan/detalle?id=${item.id}`)}
                >
                  <Text style={globalStyles.buttonText}>Ver Rutinas</Text>
                </TouchableOpacity>

                {esMiPlan && (
                  <>
                    <TouchableOpacity
                      style={[globalStyles.button, globalStyles.buttonAccent, styles.btnAccion]}
                      onPress={() => router.push(`/plan/editar?id=${item.id}`)}
                    >
                      <Text style={globalStyles.buttonText}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[globalStyles.button, globalStyles.buttonDanger, styles.btnAccion]}
                      onPress={() => handleEliminar(item.id)}
                    >
                      <Text style={globalStyles.buttonText}>🗑️</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  btnToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  btnCrear: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
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
  miPlanBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  miPlanText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },
  infoContainer: {
    marginTop: spacing.md,
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
  objetivoContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  btnAccion: {
    flex: 1,
  },
});