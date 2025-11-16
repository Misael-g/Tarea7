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
  Switch,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlans } from "../../src/presentation/hooks/usePlans";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function EditarPlanScreen() {
  const { id } = useLocalSearchParams();
  const { usuario } = useAuth();
  const { obtenerPlanPorId, planSeleccionado, actualizar } = usePlans();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [notas, setNotas] = useState("");
  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarPlan();
  }, [id]);

  const cargarPlan = async () => {
    if (id) {
      setCargandoDatos(true);
      await obtenerPlanPorId(id as string);
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    if (planSeleccionado) {
      setNombre(planSeleccionado.nombre);
      setDescripcion(planSeleccionado.descripcion || "");
      setFechaInicio(planSeleccionado.fecha_inicio);
      setFechaFin(planSeleccionado.fecha_fin || "");
      setObjetivo(planSeleccionado.objetivo || "");
      setNotas(planSeleccionado.notas || "");
      setActivo(planSeleccionado.activo);
    }
  }, [planSeleccionado]);

  if (cargandoDatos) {
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

  if (planSeleccionado.entrenador_id !== usuario?.id) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoError}>
          No tienes permiso para editar este plan
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

  const handleGuardar = async () => {
    if (!nombre || !fechaInicio) {
      Alert.alert("Error", "Completa los campos requeridos");
      return;
    }

    setCargando(true);
    const resultado = await actualizar(
      id as string,
      nombre,
      descripcion,
      fechaInicio,
      fechaFin || null,
      objetivo,
      notas,
      activo
    );
    setCargando(false);

    if (resultado.success) {
      Alert.alert("¡Éxito!", "Plan actualizado correctamente", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo actualizar el plan");
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Plan</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={globalStyles.scrollContent}>
        <Text style={globalStyles.inputLabel}>Nombre del Plan *</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej: Plan de Fuerza 12 semanas"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={globalStyles.inputLabel}>Descripción</Text>
        <TextInput
          style={[globalStyles.input, globalStyles.inputMultiline]}
          placeholder="Describe el plan..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={3}
        />

        <Text style={globalStyles.inputLabel}>Fecha de Inicio *</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="YYYY-MM-DD"
          value={fechaInicio}
          onChangeText={setFechaInicio}
        />

        <Text style={globalStyles.inputLabel}>Fecha de Fin (opcional)</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="YYYY-MM-DD"
          value={fechaFin}
          onChangeText={setFechaFin}
        />

        <Text style={globalStyles.inputLabel}>Objetivo</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej: Ganar masa muscular"
          value={objetivo}
          onChangeText={setObjetivo}
        />

        <Text style={globalStyles.inputLabel}>Notas</Text>
        <TextInput
          style={[globalStyles.input, globalStyles.inputMultiline]}
          placeholder="Notas adicionales..."
          value={notas}
          onChangeText={setNotas}
          multiline
          numberOfLines={3}
        />

        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={globalStyles.inputLabel}>Estado del Plan</Text>
            <Text style={globalStyles.textSecondary}>
              {activo ? "Plan activo - visible para el usuario" : "Plan inactivo - oculto"}
            </Text>
          </View>
          <Switch
            value={activo}
            onValueChange={setActivo}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={activo ? colors.primary : colors.textTertiary}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={globalStyles.textSecondary}>
            • El usuario asignado es: {planSeleccionado.usuario?.email || "No especificado"}
          </Text>
          <Text style={globalStyles.textSecondary}>
            • Para cambiar las rutinas asignadas, ve al detalle del plan
          </Text>
          <Text style={globalStyles.textSecondary}>
            • Los cambios se reflejarán inmediatamente para el usuario
          </Text>
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
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  infoBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
});