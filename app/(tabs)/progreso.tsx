import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useProgress } from "../../src/presentation/hooks/useProgress";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function ProgresoScreen() {
  const { esUsuario } = useAuth();
  const {
    progreso,
    estadisticas,
    cargando,
    cargarProgreso,
    cargarEstadisticas,
    registrar,
    marcarComoCompletada,
    eliminar,
    agruparPorMes,
    seleccionarFoto,
    tomarFoto,
  } = useProgress();

  const [refrescando, setRefrescando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [registroRapido, setRegistroRapido] = useState(false);

  // Estados para el modal de registro
  const [rutinaIdModal, setRutinaIdModal] = useState("");
  const [duracion, setDuracion] = useState("");
  const [peso, setPeso] = useState("");
  const [notas, setNotas] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    await cargarProgreso();
    await cargarEstadisticas();
  };

  const handleRefresh = async () => {
    setRefrescando(true);
    await cargarDatos();
    setRefrescando(false);
  };

  const abrirModalRegistro = () => {
    setModalVisible(true);
    setRegistroRapido(false);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setRutinaIdModal("");
    setDuracion("");
    setPeso("");
    setNotas("");
    setCalificacion(0);
    setFotoUri(null);
  };

  const handleSeleccionarFoto = async () => {
    Alert.alert(
      "Agregar Foto",
      "¿Cómo quieres obtener la foto?",
      [
        {
          text: "📷 Cámara",
          onPress: async () => {
            const uri = await tomarFoto();
            if (uri) setFotoUri(uri);
          },
        },
        {
          text: "🖼️ Galería",
          onPress: async () => {
            const uri = await seleccionarFoto();
            if (uri) setFotoUri(uri);
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleRegistrar = async () => {
    if (!rutinaIdModal) {
      Alert.alert("Error", "Debes especificar una rutina");
      return;
    }

    const hoy = new Date().toISOString().split("T")[0];
    const duracionNum = duracion ? parseInt(duracion) : undefined;
    const pesoNum = peso ? parseFloat(peso) : undefined;

    const resultado = await registrar(
      rutinaIdModal,
      hoy,
      true,
      duracionNum,
      pesoNum,
      notas,
      calificacion || undefined,
      fotoUri || undefined
    );

    if (resultado.success) {
      Alert.alert("¡Éxito!", "Progreso registrado correctamente");
      cerrarModal();
    } else {
      Alert.alert("Error", resultado.error || "No se pudo registrar");
    }
  };

  const handleEliminar = (progresoId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await eliminar(progresoId);
            if (resultado.success) {
              Alert.alert("Éxito", "Registro eliminado");
            }
          },
        },
      ]
    );
  };

  const progresoAgrupado = agruparPorMes();

  if (!esUsuario) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.emptyState}>
          Esta sección es solo para usuarios
        </Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Mi Progreso</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnRegistrar]}
          onPress={abrirModalRegistro}
        >
          <Text style={globalStyles.buttonText}>+ Registrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={handleRefresh} />
        }
      >
        {/* ESTADÍSTICAS */}
        {estadisticas && (
          <View style={styles.statsSection}>
            <View style={globalStyles.statsContainer}>
              <View style={globalStyles.statCard}>
                <Text style={globalStyles.statValue}>{estadisticas.totalSesiones}</Text>
                <Text style={globalStyles.statLabel}>Sesiones</Text>
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
                <Text style={globalStyles.statLabel}>⭐ Promedio</Text>
              </View>

              <View style={globalStyles.statCard}>
                <Text style={globalStyles.statValue}>
                  {estadisticas.duracionPromedio}
                </Text>
                <Text style={globalStyles.statLabel}>Min. Prom.</Text>
              </View>
            </View>
          </View>
        )}

        {/* HISTORIAL POR MES */}
        <View style={globalStyles.scrollContent}>
          {progresoAgrupado.length === 0 ? (
            <Text style={globalStyles.emptyState}>
              No tienes registros de progreso. ¡Empieza a entrenar!
            </Text>
          ) : (
            progresoAgrupado.map((grupo) => (
              <View key={grupo.mes} style={styles.mesContainer}>
                <Text style={globalStyles.sectionTitle}>
                  📅 {new Date(grupo.mes + "-01").toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                  })}
                </Text>
                <Text style={globalStyles.textSecondary}>
                  {grupo.completadas} de {grupo.total} sesiones completadas
                </Text>

                {grupo.registros.map((reg) => (
                  <View key={reg.id} style={globalStyles.card}>
                    <Text style={globalStyles.cardTitle}>
                      {reg.rutina?.titulo || "Rutina"}
                    </Text>
                    <Text style={globalStyles.textSecondary}>
                      📅 {new Date(reg.fecha).toLocaleDateString()}
                    </Text>

                    <View style={styles.progresoInfo}>
                      <Text style={globalStyles.textSecondary}>
                        {reg.completada ? "✅ Completada" : "⏳ Pendiente"}
                      </Text>
                      {reg.duracion_minutos && (
                        <Text style={globalStyles.textSecondary}>
                          ⏱️ {reg.duracion_minutos} min
                        </Text>
                      )}
                      {reg.peso_kg && (
                        <Text style={globalStyles.textSecondary}>
                          🏋️ {reg.peso_kg} kg
                        </Text>
                      )}
                      {reg.calificacion && (
                        <Text style={globalStyles.textSecondary}>
                          ⭐ {reg.calificacion}/5
                        </Text>
                      )}
                    </View>

                    {reg.notas && (
                      <Text style={[globalStyles.textSecondary, { marginTop: spacing.sm }]}>
                        📝 {reg.notas}
                      </Text>
                    )}

                    {reg.foto_url && (
                      <Image
                        source={{ uri: reg.foto_url }}
                        style={styles.fotoProgreso}
                        resizeMode="cover"
                      />
                    )}

                    <TouchableOpacity
                      style={[globalStyles.button, globalStyles.buttonDanger, { marginTop: spacing.sm }]}
                      onPress={() => handleEliminar(reg.id)}
                    >
                      <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL PARA REGISTRAR PROGRESO */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Registrar Progreso</Text>

            <Text style={globalStyles.inputLabel}>ID de Rutina *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Ingresa el ID de la rutina"
              value={rutinaIdModal}
              onChangeText={setRutinaIdModal}
            />

            <Text style={globalStyles.inputLabel}>Duración (minutos)</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Ej: 45"
              value={duracion}
              onChangeText={setDuracion}
              keyboardType="numeric"
            />

            <Text style={globalStyles.inputLabel}>Peso (kg)</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Ej: 75.5"
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
            />

            <Text style={globalStyles.inputLabel}>Calificación</Text>
            <View style={styles.calificacionContainer}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setCalificacion(num)}
                  style={styles.estrella}
                >
                  <Text style={styles.estrellaText}>
                    {calificacion >= num ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={globalStyles.inputLabel}>Notas</Text>
            <TextInput
              style={[globalStyles.input, globalStyles.inputMultiline]}
              placeholder="¿Cómo te sentiste?"
              value={notas}
              onChangeText={setNotas}
              multiline
            />

            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonSecondary]}
              onPress={handleSeleccionarFoto}
            >
              <Text style={globalStyles.buttonText}>
                {fotoUri ? "📷 Cambiar Foto" : "📷 Agregar Foto"}
              </Text>
            </TouchableOpacity>

            {fotoUri && (
              <Image source={{ uri: fotoUri }} style={styles.preview} />
            )}

            <View style={globalStyles.modalActions}>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonOutline, { flex: 1 }]}
                onPress={cerrarModal}
              >
                <Text style={globalStyles.buttonTextOutline}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonPrimary, { flex: 1 }]}
                onPress={handleRegistrar}
              >
                <Text style={globalStyles.buttonText}>Guardar</Text>
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
  btnRegistrar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statsSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  mesContainer: {
    marginBottom: spacing.xl,
  },
  progresoInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  fotoProgreso: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  calificacionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  estrella: {
    padding: spacing.sm,
  },
  estrellaText: {
    fontSize: 32,
  },
  preview: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: spacing.md,
  },
});