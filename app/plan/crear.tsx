import { useRouter } from "expo-router";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlans } from "../../src/presentation/hooks/usePlans";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function CrearPlanScreen() {
  const { usuario } = useAuth();
  const { crear, obtenerUsuariosDisponibles } = usePlans();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [notas, setNotas] = useState("");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
    // Fecha de hoy por defecto
    const hoy = new Date().toISOString().split("T")[0];
    setFechaInicio(hoy);
  }, []);

  const cargarUsuarios = async () => {
    const resultado = await obtenerUsuariosDisponibles();
    if (resultado.success) {
      setUsuarios(resultado.usuarios);
    }
  };

  const handleCrear = async () => {
    if (!nombre || !usuarioId || !fechaInicio) {
      Alert.alert("Error", "Completa los campos requeridos");
      return;
    }

    setCargando(true);
    const resultado = await crear(
      nombre,
      descripcion,
      usuario!.id,
      usuarioId,
      fechaInicio,
      fechaFin || null,
      objetivo,
      notas
    );
    setCargando(false);

    if (resultado.success) {
      Alert.alert("¡Éxito!", "Plan creado correctamente", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo crear el plan");
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Plan</Text>
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

        <Text style={globalStyles.inputLabel}>Asignar a Usuario *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={usuarioId}
            onValueChange={setUsuarioId}
            style={styles.picker}
          >
            <Picker.Item label="Selecciona un usuario" value="" />
            {usuarios.map((u) => (
              <Picker.Item key={u.id} label={u.email} value={u.id} />
            ))}
          </Picker>
        </View>

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
            <Text style={globalStyles.buttonText}>Crear Plan</Text>
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
  pickerContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  picker: {
    height: 50,
  },
});