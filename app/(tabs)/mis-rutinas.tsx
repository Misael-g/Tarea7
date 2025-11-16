import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRoutines } from "../../src/presentation/hooks/useRoutines";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function MisRutinasScreen() {
  const { rutinas, cargando, cargarRutinas, eliminar } = useRoutines();
  const [refrescando, setRefrescando] = React.useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarRutinas();
    }, [])
  );

  const handleRefresh = async () => {
    setRefrescando(true);
    await cargarRutinas();
    setRefrescando(false);
  };

  const handleEliminar = (rutinaId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await eliminar(rutinaId);
            if (resultado.success) {
              Alert.alert("Éxito", "Rutina eliminada correctamente");
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

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Rutinas</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnCrear]}
          onPress={() => router.push("/routine/crear")}
        >
          <Text style={globalStyles.buttonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rutinas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <Text style={globalStyles.emptyState}>
            No tienes rutinas creadas. ¡Crea tu primera rutina!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            {item.imagen_url ? (
              <Image
                source={{ uri: item.imagen_url }}
                style={globalStyles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagenPlaceholder}>
                <Text style={styles.iconoPlaceholder}>🏋️</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={globalStyles.rowBetween}>
                <Text style={globalStyles.cardTitle}>{item.titulo}</Text>
                {item.nivel && (
                  <View style={[styles.nivelBadge, { backgroundColor: getNivelColor(item.nivel) }]}>
                    <Text style={styles.nivelText}>{item.nivel}</Text>
                  </View>
                )}
              </View>

              <Text style={globalStyles.cardSubtitle} numberOfLines={2}>
                {item.descripcion}
              </Text>

              <View style={styles.infoRow}>
                {item.duracion_minutos && (
                  <Text style={globalStyles.textSecondary}>
                    ⏱️ {item.duracion_minutos} min
                  </Text>
                )}
                {item.ejercicios && (
                  <Text style={globalStyles.textSecondary}>
                    💪 {item.ejercicios.length} ejercicios
                  </Text>
                )}
              </View>

              <View style={globalStyles.cardActions}>
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonSecondary, styles.btnAccion]}
                  onPress={() => router.push(`/routine/detalle?id=${item.id}`)}
                >
                  <Text style={globalStyles.buttonText}>Ver Detalle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonAccent, styles.btnAccion]}
                  onPress={() => router.push(`/routine/editar?id=${item.id}`)}
                >
                  <Text style={globalStyles.buttonText}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonDanger, styles.btnAccion]}
                  onPress={() => handleEliminar(item.id)}
                >
                  <Text style={globalStyles.buttonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
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
  btnCrear: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  imagenPlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  iconoPlaceholder: {
    fontSize: 48,
  },
  cardContent: {
    marginTop: spacing.sm,
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
  infoRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btnAccion: {
    flex: 1,
  },
});