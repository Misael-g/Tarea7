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
  const { esEntrenador } = useAuth();
  const { planes, cargando, cargarPlanes, eliminar } = usePlans();
  const [refrescando, setRefrescando] = React.useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarPlanes();
    }, [])
  );

  const handleRefresh = async () => {
    setRefrescando(true);
    await cargarPlanes();
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
        <Text style={styles.headerTitle}>
          {esEntrenador ? "Planes de Entrenamiento" : "Mis Planes"}
        </Text>
        {esEntrenador && (
          <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnCrear]}
            onPress={() => router.push("/plan/crear")}
          >
            <Text style={globalStyles.buttonText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={planes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <Text style={globalStyles.emptyState}>
            {esEntrenador
              ? "No has creado planes. ¡Crea tu primer plan!"
              : "No tienes planes asignados. Contacta a tu entrenador."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <View style={globalStyles.cardHeader}>
              <Text style={globalStyles.cardTitle}>{item.nombre}</Text>
              {item.activo && (
                <View style={styles.activoBadge}>
                  <Text style={styles.activoText}>ACTIVO</Text>
                </View>
              )}
            </View>

            {item.descripcion && (
              <Text style={globalStyles.cardSubtitle} numberOfLines={2}>
                {item.descripcion}
              </Text>
            )}

            <View style={styles.infoContainer}>
              {esEntrenador && item.usuario && (
                <Text style={globalStyles.textSecondary}>
                  👤 Usuario: {item.usuario.email}
                </Text>
              )}
              {!esEntrenador && item.entrenador && (
                <Text style={globalStyles.textSecondary}>
                  👨‍🏫 Entrenador: {item.entrenador.email}
                </Text>
              )}
              <Text style={globalStyles.textSecondary}>
                📅 Inicio: {new Date(item.fecha_inicio).toLocaleDateString()}
              </Text>
              {item.fecha_fin && (
                <Text style={globalStyles.textSecondary}>
                  🏁 Fin: {new Date(item.fecha_fin).toLocaleDateString()}
                </Text>
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

              {esEntrenador && (
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
        )}
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
  btnCrear: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    marginTop: spacing.sm,
    gap: spacing.xs,
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