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
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlans } from "../../src/presentation/hooks/usePlans";
import { useRoutines } from "../../src/presentation/hooks/useRoutines";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing, borderRadius } from "../../src/styles/theme";

interface RutinaSimple {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: "principiante" | "intermedio" | "avanzado";
  duracionMinutos: number;
}

interface RutinaAsignada extends RutinaSimple {
  diaSemana: number;
  orden: number;
}

export default function CrearPlanScreen() {
  const { usuario } = useAuth();
  const { crear, asignarRutina } = usePlans();
  const { seleccionarArchivo } = useRoutines();
  const router = useRouter();

  // Datos del plan
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [notas, setNotas] = useState("");
  const [cargando, setCargando] = useState(false);

  // Rutinas del plan
  const [rutinasCreadas, setRutinasCreadas] = useState<RutinaAsignada[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Modal crear rutina
  const [tituloRutina, setTituloRutina] = useState("");
  const [descripcionRutina, setDescripcionRutina] = useState("");
  const [nivelRutina, setNivelRutina] = useState<"principiante" | "intermedio" | "avanzado">("intermedio");
  const [duracionRutina, setDuracionRutina] = useState("");
  const [diaSemana, setDiaSemana] = useState(1);

  const diasSemana = [
    { valor: 1, nombre: "Lunes" },
    { valor: 2, nombre: "Martes" },
    { valor: 3, nombre: "Miércoles" },
    { valor: 4, nombre: "Jueves" },
    { valor: 5, nombre: "Viernes" },
    { valor: 6, nombre: "Sábado" },
    { valor: 7, nombre: "Domingo" },
  ];

  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    setFechaInicio(hoy);
  }, []);

  const abrirModalRutina = () => {
    setModalVisible(true);
  };

  const cerrarModalRutina = () => {
    setModalVisible(false);
    setTituloRutina("");
    setDescripcionRutina("");
    setNivelRutina("intermedio");
    setDuracionRutina("");
    setDiaSemana(1);
  };

  const agregarRutina = () => {
    if (!tituloRutina || !duracionRutina) {
      Alert.alert("Error", "Completa al menos el título y duración");
      return;
    }

    const duracion = parseInt(duracionRutina);
    if (isNaN(duracion) || duracion <= 0) {
      Alert.alert("Error", "La duración debe ser un número válido");
      return;
    }

    const nuevaRutina: RutinaAsignada = {
      id: Date.now().toString(), // ID temporal
      titulo: tituloRutina,
      descripcion: descripcionRutina,
      nivel: nivelRutina,
      duracionMinutos: duracion,
      diaSemana: diaSemana,
      orden: rutinasCreadas.filter(r => r.diaSemana === diaSemana).length,
    };

    setRutinasCreadas([...rutinasCreadas, nuevaRutina]);
    cerrarModalRutina();
    Alert.alert("Éxito", "Rutina agregada al plan");
  };

  const eliminarRutina = (id: string) => {
    Alert.alert(
      "Confirmar",
      "¿Eliminar esta rutina del plan?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setRutinasCreadas(rutinasCreadas.filter(r => r.id !== id));
          },
        },
      ]
    );
  };

  const handleCrear = async () => {
    if (!nombre || !fechaInicio) {
      Alert.alert("Error", "Completa los campos requeridos del plan");
      return;
    }

    if (rutinasCreadas.length === 0) {
      Alert.alert("Error", "Debes agregar al menos una rutina al plan");
      return;
    }

    setCargando(true);

    try {
      // Importar dinámicamente el caso de uso de rutinas
      const { RoutinesUseCase } = await import("../../src/domain/useCases/routines/RoutinesUseCase");
      const routinesUseCase = new RoutinesUseCase();

      // 1. Crear el plan
      const resultadoPlan = await crear(
        nombre,
        descripcion,
        usuario!.id,
        fechaInicio,
        fechaFin || null,
        objetivo,
        notas
      );

      if (!resultadoPlan.success) {
        throw new Error(resultadoPlan.error || "No se pudo crear el plan");
      }

      const planId = resultadoPlan.plan.id;

      // 2. Crear cada rutina y asignarla al plan
      for (const rutina of rutinasCreadas) {
        // Primero creamos la rutina en la tabla rutinas
        const resultadoRutina = await routinesUseCase.crearRutina(
          rutina.titulo,
          rutina.descripcion,
          rutina.nivel,
          rutina.duracionMinutos,
          usuario!.id
        );

        if (resultadoRutina.success && resultadoRutina.rutina) {
          // Luego la asignamos al plan
          await asignarRutina(
            planId,
            resultadoRutina.rutina.id,
            rutina.diaSemana,
            rutina.orden
          );
        }
      }

      setCargando(false);

      Alert.alert(
        "¡Éxito!",
        `Plan "${nombre}" creado con ${rutinasCreadas.length} rutina(s)`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      setCargando(false);
      Alert.alert("Error", error.message || "No se pudo crear el plan");
    }
  };

  const rutinasAgrupadasPorDia = () => {
    return diasSemana.map(dia => ({
      ...dia,
      rutinas: rutinasCreadas.filter(r => r.diaSemana === dia.valor),
    }));
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "principiante": return colors.principiante;
      case "intermedio": return colors.intermedio;
      case "avanzado": return colors.avanzado;
      default: return colors.textSecondary;
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
        {/* INFORMACIÓN DEL PLAN */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>📋 Información del Plan</Text>

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
        </View>

        {/* RUTINAS DEL PLAN */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>
              💪 Rutinas ({rutinasCreadas.length})
            </Text>
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnAgregar]}
              onPress={abrirModalRutina}
            >
              <Text style={globalStyles.buttonText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>

          {rutinasCreadas.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={globalStyles.textSecondary}>
                No has agregado rutinas todavía
              </Text>
              <Text style={globalStyles.textTertiary}>
                Presiona "+ Agregar" para crear tu primera rutina
              </Text>
            </View>
          ) : (
            rutinasAgrupadasPorDia().map(dia => {
              if (dia.rutinas.length === 0) return null;
              
              return (
                <View key={dia.valor} style={styles.diaContainer}>
                  <Text style={styles.diaNombre}>{dia.nombre}</Text>
                  {dia.rutinas.map(rutina => (
                    <View key={rutina.id} style={globalStyles.card}>
                      <View style={styles.rutinaHeader}>
                        <Text style={globalStyles.cardTitle}>{rutina.titulo}</Text>
                        <View style={[styles.nivelBadge, { backgroundColor: getNivelColor(rutina.nivel) }]}>
                          <Text style={styles.nivelText}>{rutina.nivel}</Text>
                        </View>
                      </View>

                      {rutina.descripcion && (
                        <Text style={globalStyles.cardSubtitle} numberOfLines={2}>
                          {rutina.descripcion}
                        </Text>
                      )}

                      <Text style={[globalStyles.textSecondary, { marginTop: spacing.sm }]}>
                        ⏱️ {rutina.duracionMinutos} minutos
                      </Text>

                      <TouchableOpacity
                        style={[globalStyles.button, globalStyles.buttonDanger, { marginTop: spacing.sm }]}
                        onPress={() => eliminarRutina(rutina.id)}
                      >
                        <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>

        {/* BOTÓN CREAR */}
        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonPrimary,
            { marginTop: spacing.xl, marginBottom: spacing.xxl },
            (rutinasCreadas.length === 0 || !nombre) && styles.btnDeshabilitado
          ]}
          onPress={handleCrear}
          disabled={cargando || rutinasCreadas.length === 0 || !nombre}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>
              Crear Plan con {rutinasCreadas.length} Rutina(s)
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL AGREGAR RUTINA */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModalRutina}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Nueva Rutina</Text>

            <Text style={globalStyles.inputLabel}>Título *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Ej: Rutina de Piernas"
              value={tituloRutina}
              onChangeText={setTituloRutina}
            />

            <Text style={globalStyles.inputLabel}>Descripción</Text>
            <TextInput
              style={[globalStyles.input, globalStyles.inputMultiline]}
              placeholder="Describe la rutina..."
              value={descripcionRutina}
              onChangeText={setDescripcionRutina}
              multiline
              numberOfLines={3}
            />

            <Text style={globalStyles.inputLabel}>Nivel *</Text>
            <View style={styles.nivelesContainer}>
              {(["principiante", "intermedio", "avanzado"] as const).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.nivelBtn,
                    nivelRutina === n && styles.nivelBtnActivo,
                  ]}
                  onPress={() => setNivelRutina(n)}
                >
                  <Text style={[
                    styles.nivelBtnText,
                    nivelRutina === n && styles.nivelBtnTextActivo
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
              value={duracionRutina}
              onChangeText={setDuracionRutina}
              keyboardType="numeric"
            />

            <Text style={globalStyles.inputLabel}>Día de la semana *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={diaSemana}
                onValueChange={setDiaSemana}
                style={styles.picker}
              >
                {diasSemana.map(dia => (
                  <Picker.Item key={dia.valor} label={dia.nombre} value={dia.valor} />
                ))}
              </Picker>
            </View>

            <View style={globalStyles.modalActions}>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonOutline, { flex: 1 }]}
                onPress={cerrarModalRutina}
              >
                <Text style={globalStyles.buttonTextOutline}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonPrimary, { flex: 1 }]}
                onPress={agregarRutina}
              >
                <Text style={globalStyles.buttonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  seccion: {
    marginBottom: spacing.xl,
  },
  seccionTitulo: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  btnAgregar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyBox: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  diaContainer: {
    marginBottom: spacing.lg,
  },
  diaNombre: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  rutinaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  btnDeshabilitado: {
    opacity: 0.5,
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
  nivelBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  nivelBtnTextActivo: {
    color: colors.primary,
    fontWeight: "bold",
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