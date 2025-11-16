import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  Image,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlans } from "../../src/presentation/hooks/usePlans";
import { useRoutines } from "../../src/presentation/hooks/useRoutines";
import { useProgress } from "../../src/presentation/hooks/useProgress";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing, borderRadius } from "../../src/styles/theme";

const { width } = Dimensions.get("window");

export default function DetallePlanScreen() {
  const { id } = useLocalSearchParams();
  const { obtenerPlanPorId, planSeleccionado, cargarRutinasPlan, rutinasDelPlan, obtenerRutinasAgrupadasPorDia, asignarRutina, quitarRutina } = usePlans();
  const { rutinas, cargarRutinas, crear: crearRutina, seleccionarArchivo, grabarVideo } = useRoutines();
  const { marcarComoCompletada, estaCompletada } = useProgress();
  const { usuario, esEntrenador } = useAuth();
  const router = useRouter();
  
  const [cargando, setCargando] = useState(true);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [modalRutinaDetalleVisible, setModalRutinaDetalleVisible] = useState(false);
  const [rutinaDetalleSeleccionada, setRutinaDetalleSeleccionada] = useState<any>(null);
  const [modalImagenVisible, setModalImagenVisible] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  
  // Para agregar rutina existente
  const [rutinaSeleccionadaId, setRutinaSeleccionadaId] = useState("");
  const [diaSemanaAgregar, setDiaSemanaAgregar] = useState(1);
  
  // Para crear nueva rutina
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nivel, setNivel] = useState<"principiante" | "intermedio" | "avanzado">("intermedio");
  const [duracionMinutos, setDuracionMinutos] = useState("");
  const [diaSemanaCrear, setDiaSemanaCrear] = useState(1);
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [creandoRutina, setCreandoRutina] = useState(false);

  const diasSemana = [
    { numero: 1, nombre: "Lunes" },
    { numero: 2, nombre: "Martes" },
    { numero: 3, nombre: "Miércoles" },
    { numero: 4, nombre: "Jueves" },
    { numero: 5, nombre: "Viernes" },
    { numero: 6, nombre: "Sábado" },
    { numero: 7, nombre: "Domingo" },
  ];

  useEffect(() => {
    cargarPlan();
    if (esEntrenador) {
      cargarRutinas();
    }
  }, [id]);

  const cargarPlan = async () => {
    if (id) {
      setCargando(true);
      await obtenerPlanPorId(id as string);
      await cargarRutinasPlan(id as string);
      setCargando(false);
    }
  };

  const handleAgregarRutinaExistente = async () => {
    if (!rutinaSeleccionadaId) {
      Alert.alert("Error", "Selecciona una rutina");
      return;
    }

    const orden = rutinasDelPlan.filter(r => r.dia_semana === diaSemanaAgregar).length;
    
    const resultado = await asignarRutina(
      id as string,
      rutinaSeleccionadaId,
      diaSemanaAgregar,
      orden
    );

    if (resultado.success) {
      Alert.alert("Éxito", "Rutina agregada al plan");
      setModalAgregarVisible(false);
      setRutinaSeleccionadaId("");
      await cargarRutinasPlan(id as string);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo agregar la rutina");
    }
  };

  const handleCrearNuevaRutina = async () => {
    if (!titulo || !duracionMinutos) {
      Alert.alert("Error", "Completa al menos el título y duración");
      return;
    }

    const duracion = parseInt(duracionMinutos);
    if (isNaN(duracion) || duracion <= 0) {
      Alert.alert("Error", "La duración debe ser un número válido");
      return;
    }

    setCreandoRutina(true);

    const resultado = await crearRutina(
      titulo,
      descripcion,
      nivel,
      duracion,
      usuario!.id,
      videoUri || undefined,
      imagenUri || undefined
    );

    if (resultado.success && resultado.rutina) {
      const orden = rutinasDelPlan.filter(r => r.dia_semana === diaSemanaCrear).length;
      
      await asignarRutina(
        id as string,
        resultado.rutina.id,
        diaSemanaCrear,
        orden
      );

      Alert.alert("Éxito", "Rutina creada y agregada al plan");
      setModalCrearVisible(false);
      limpiarFormularioCrear();
      await cargarRutinasPlan(id as string);
      await cargarRutinas();
    } else {
      Alert.alert("Error", resultado.error || "No se pudo crear la rutina");
    }

    setCreandoRutina(false);
  };

  const limpiarFormularioCrear = () => {
    setTitulo("");
    setDescripcion("");
    setNivel("intermedio");
    setDuracionMinutos("");
    setDiaSemanaCrear(1);
    setImagenUri(null);
    setVideoUri(null);
  };

  const handleEliminarRutinaDePlan = (planRutinaId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Quitar esta rutina del plan?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await quitarRutina(planRutinaId, id as string);
            if (resultado.success) {
              Alert.alert("Éxito", "Rutina eliminada del plan");
            } else {
              Alert.alert("Error", resultado.error || "No se pudo eliminar");
            }
          },
        },
      ]
    );
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

  const handleSeleccionarImagen = async () => {
    Alert.alert(
      "Agregar Imagen",
      "Elige cómo obtener la imagen",
      [
        {
          text: "📷 Tomar Foto",
          onPress: async () => {
            const uri = await seleccionarArchivo("imagen");
            if (uri) setImagenUri(uri);
          },
        },
        {
          text: "🖼️ Galería",
          onPress: async () => {
            const uri = await seleccionarArchivo("imagen");
            if (uri) setImagenUri(uri);
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleSeleccionarVideo = async () => {
    Alert.alert(
      "Seleccionar Video",
      "¿Cómo quieres obtener el video?",
      [
        {
          text: "🎥 Grabar",
          onPress: async () => {
            const uri = await grabarVideo();
            if (uri) setVideoUri(uri);
          },
        },
        {
          text: "📁 Galería",
          onPress: async () => {
            const uri = await seleccionarArchivo("video");
            if (uri) setVideoUri(uri);
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const abrirDetalleRutina = (planRutina: any) => {
    setRutinaDetalleSeleccionada(planRutina);
    setModalRutinaDetalleVisible(true);
  };

  const ampliarImagen = (imageUrl: string) => {
    setImagenAmpliada(imageUrl);
    setModalImagenVisible(true);
  };

  const getNivelColor = (nivel?: string) => {
    switch (nivel) {
      case "principiante": return colors.principiante;
      case "intermedio": return colors.intermedio;
      case "avanzado": return colors.avanzado;
      default: return colors.textSecondary;
    }
  };

  const getNivelIcon = (nivel?: string) => {
    switch (nivel) {
      case "principiante": return "🌱";
      case "intermedio": return "💪";
      case "avanzado": return "🔥";
      default: return "⭐";
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
  const esMiPlan = plan.entrenador_id === usuario?.id;

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan</Text>
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
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👨‍🏫</Text>
              <Text style={globalStyles.textSecondary}>
                {plan.entrenador?.nombre || plan.entrenador?.email || "Entrenador"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={globalStyles.textSecondary}>
                Inicio: {new Date(plan.fecha_inicio).toLocaleDateString()}
              </Text>
            </View>
            {plan.fecha_fin && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏁</Text>
                <Text style={globalStyles.textSecondary}>
                  Fin: {new Date(plan.fecha_fin).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {plan.objetivo && (
            <View style={styles.objetivoContainer}>
              <Text style={globalStyles.textBold}>🎯 Objetivo:</Text>
              <Text style={globalStyles.textSecondary}>{plan.objetivo}</Text>
            </View>
          )}
        </View>

        {/* RUTINAS DEL PLAN */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              💪 Rutinas de la Semana
            </Text>
            <Text style={styles.sectionSubtitle}>
              {rutinasDelPlan.length} {rutinasDelPlan.length === 1 ? "rutina" : "rutinas"} asignadas
            </Text>
          </View>
          {esEntrenador && esMiPlan && (
            <View style={styles.botonesAgregar}>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonSecondary, styles.btnAgregar]}
                onPress={() => setModalAgregarVisible(true)}
              >
                <Text style={globalStyles.buttonText}>📋</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonPrimary, styles.btnAgregar]}
                onPress={() => setModalCrearVisible(true)}
              >
                <Text style={globalStyles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {rutinasDelPlan.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No hay rutinas asignadas</Text>
            <Text style={globalStyles.textSecondary}>
              {esEntrenador && esMiPlan
                ? "Presiona los botones de arriba para agregar rutinas"
                : "El entrenador aún no ha asignado rutinas"}
            </Text>
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
                <View style={styles.diaVacioCard}>
                  <Text style={styles.diaVacioText}>Día de descanso 😴</Text>
                </View>
              ) : (
                dia.rutinas.map((planRutina) => {
                  const rutina = planRutina.rutina;
                  if (!rutina) return null;

                  const hoy = new Date().toISOString().split("T")[0];
                  const completada = estaCompletada(rutina.id, hoy);

                  return (
                    <TouchableOpacity
                      key={planRutina.id}
                      style={styles.rutinaCard}
                      onPress={() => abrirDetalleRutina(planRutina)}
                      activeOpacity={0.7}
                    >
                      {/* Imagen miniatura */}
                      {rutina.imagen_url ? (
                        <TouchableOpacity
                          onPress={() => ampliarImagen(rutina.imagen_url!)}
                          activeOpacity={0.9}
                        >
                          <Image
                            source={{ uri: rutina.imagen_url }}
                            style={styles.rutinaImagen}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.rutinaImagenPlaceholder}>
                          <Text style={styles.rutinaImagenIcon}>🏋️</Text>
                        </View>
                      )}

                      <View style={styles.rutinaContent}>
                        <View style={styles.rutinaHeader}>
                          <Text style={styles.rutinaTitulo} numberOfLines={2}>
                            {rutina.titulo}
                          </Text>
                          {rutina.nivel && (
                            <View style={[styles.nivelChip, { backgroundColor: getNivelColor(rutina.nivel) }]}>
                              <Text style={styles.nivelText}>
                                {getNivelIcon(rutina.nivel)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {rutina.descripcion && (
                          <Text style={styles.rutinaDescripcion} numberOfLines={2}>
                            {rutina.descripcion}
                          </Text>
                        )}

                        <View style={styles.rutinaInfo}>
                          {rutina.duracion_minutos && (
                            <View style={styles.rutinaInfoItem}>
                              <Text style={styles.rutinaInfoIcon}>⏱️</Text>
                              <Text style={styles.rutinaInfoText}>
                                {rutina.duracion_minutos} min
                              </Text>
                            </View>
                          )}
                          {rutina.video_url && (
                            <View style={styles.rutinaInfoItem}>
                              <Text style={styles.rutinaInfoIcon}>🎥</Text>
                              <Text style={styles.rutinaInfoText}>Con video</Text>
                            </View>
                          )}
                          {completada && (
                            <View style={styles.completadaBadge}>
                              <Text style={styles.completadaText}>✅ Hoy</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.rutinaActions}>
                          {!esEntrenador && !completada && (
                            <TouchableOpacity
                              style={styles.completarButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleMarcarCompletada(rutina.id);
                              }}
                            >
                              <Text style={styles.completarButtonText}>✓ Completar</Text>
                            </TouchableOpacity>
                          )}

                          {esEntrenador && esMiPlan && (
                            <TouchableOpacity
                              style={styles.eliminarButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleEliminarRutinaDePlan(planRutina.id);
                              }}
                            >
                              <Text style={styles.eliminarButtonText}>🗑️</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ))
        )}

        {esEntrenador && esMiPlan && (
          <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonAccent, { marginTop: spacing.lg }]}
            onPress={() => router.push(`/plan/editar?id=${plan.id}`)}
          >
            <Text style={globalStyles.buttonText}>✏️ Editar Plan</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* MODAL: AGREGAR RUTINA EXISTENTE */}
      <Modal
        visible={modalAgregarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAgregarVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Agregar Rutina Existente</Text>

            <Text style={globalStyles.inputLabel}>Selecciona una rutina *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={rutinaSeleccionadaId}
                onValueChange={setRutinaSeleccionadaId}
                style={styles.picker}
              >
                <Picker.Item label="Selecciona una rutina" value="" />
                {rutinas.map((r) => (
                  <Picker.Item key={r.id} label={r.titulo} value={r.id} />
                ))}
              </Picker>
            </View>

            <Text style={globalStyles.inputLabel}>Día de la semana *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={diaSemanaAgregar}
                onValueChange={setDiaSemanaAgregar}
                style={styles.picker}
              >
                {diasSemana.map(dia => (
                  <Picker.Item key={dia.numero} label={dia.nombre} value={dia.numero} />
                ))}
              </Picker>
            </View>

            <View style={globalStyles.modalActions}>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonOutline, { flex: 1 }]}
                onPress={() => setModalAgregarVisible(false)}
              >
                <Text style={globalStyles.buttonTextOutline}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonPrimary, { flex: 1 }]}
                onPress={handleAgregarRutinaExistente}
              >
                <Text style={globalStyles.buttonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: CREAR NUEVA RUTINA */}
      <Modal
        visible={modalCrearVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCrearVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={globalStyles.modalContent}>
              <Text style={globalStyles.modalTitle}>Crear Nueva Rutina</Text>

              <Text style={globalStyles.inputLabel}>Título *</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="Ej: Rutina de Piernas"
                value={titulo}
                onChangeText={setTitulo}
              />

              <Text style={globalStyles.inputLabel}>Descripción</Text>
              <TextInput
                style={[globalStyles.input, globalStyles.inputMultiline]}
                placeholder="Describe la rutina..."
                value={descripcion}
                onChangeText={setDescripcion}
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
                      nivel === n && styles.nivelBtnActivo,
                    ]}
                    onPress={() => setNivel(n)}
                  >
                    <Text style={[
                      styles.nivelBtnText,
                      nivel === n && styles.nivelBtnTextActivo
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
                value={duracionMinutos}
                onChangeText={setDuracionMinutos}
                keyboardType="numeric"
              />

              <Text style={globalStyles.inputLabel}>Día de la semana *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={diaSemanaCrear}
                  onValueChange={setDiaSemanaCrear}
                  style={styles.picker}
                >
                  {diasSemana.map(dia => (
                    <Picker.Item key={dia.numero} label={dia.nombre} value={dia.numero} />
                  ))}
                </Picker>
              </View>

              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonSecondary]}
                onPress={handleSeleccionarImagen}
              >
                <Text style={globalStyles.buttonText}>
                  {imagenUri ? "📷 Cambiar Imagen" : "📷 Agregar Imagen"}
                </Text>
              </TouchableOpacity>

              {imagenUri && (
                <Image source={{ uri: imagenUri }} style={styles.preview} />
              )}

              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonSecondary, { marginTop: spacing.sm }]}
                onPress={handleSeleccionarVideo}
              >
                <Text style={globalStyles.buttonText}>
                  {videoUri ? "🎥 Cambiar Video" : "🎥 Agregar Video"}
                </Text>
              </TouchableOpacity>

              {videoUri && (
                <Text style={[globalStyles.textSecondary, { marginTop: spacing.sm }]}>
                  ✅ Video seleccionado
                </Text>
              )}

              <View style={globalStyles.modalActions}>
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonOutline, { flex: 1 }]}
                  onPress={() => {
                    setModalCrearVisible(false);
                    limpiarFormularioCrear();
                  }}
                >
                  <Text style={globalStyles.buttonTextOutline}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonPrimary, { flex: 1 }]}
                  onPress={handleCrearNuevaRutina}
                  disabled={creandoRutina}
                >
                  {creandoRutina ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={globalStyles.buttonText}>Crear</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL: DETALLE DE RUTINA */}
      <Modal
        visible={modalRutinaDetalleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalRutinaDetalleVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={[globalStyles.modalContent, { maxWidth: 500 }]}>
              {rutinaDetalleSeleccionada?.rutina && (
                <>
                  <Text style={globalStyles.modalTitle}>
                    {rutinaDetalleSeleccionada.rutina.titulo}
                  </Text>

                  {rutinaDetalleSeleccionada.rutina.imagen_url && (
                    <TouchableOpacity
                      onPress={() => {
                        ampliarImagen(rutinaDetalleSeleccionada.rutina.imagen_url);
                        setModalRutinaDetalleVisible(false);
                      }}
                    >
                      <Image
                        source={{ uri: rutinaDetalleSeleccionada.rutina.imagen_url }}
                        style={styles.imagenDetalle}
                      />
                      <Text style={styles.ampliarHint}>👆 Toca para ampliar</Text>
                    </TouchableOpacity>
                  )}

                  {rutinaDetalleSeleccionada.rutina.descripcion && (
                    <Text style={[globalStyles.textSecondary, { marginBottom: spacing.md }]}>
                      {rutinaDetalleSeleccionada.rutina.descripcion}
                    </Text>
                  )}

                  <View style={styles.infoDetalle}>
                    {rutinaDetalleSeleccionada.rutina.nivel && (
                      <View style={styles.infoRow}>
                        <Text style={globalStyles.textBold}>Nivel:</Text>
                        <View style={[styles.nivelChip, { backgroundColor: getNivelColor(rutinaDetalleSeleccionada.rutina.nivel) }]}>
                          <Text style={styles.nivelText}>
                            {getNivelIcon(rutinaDetalleSeleccionada.rutina.nivel)} {rutinaDetalleSeleccionada.rutina.nivel}
                          </Text>
                        </View>
                      </View>
                    )}
                    {rutinaDetalleSeleccionada.rutina.duracion_minutos && (
                      <View style={styles.infoRow}>
                        <Text style={globalStyles.textBold}>Duración:</Text>
                        <Text style={globalStyles.textSecondary}>
                          {rutinaDetalleSeleccionada.rutina.duracion_minutos} minutos
                        </Text>
                      </View>
                    )}
                  </View>

                  {rutinaDetalleSeleccionada.rutina.video_url && (
                    <TouchableOpacity
                      style={[globalStyles.button, globalStyles.buttonSecondary, { marginTop: spacing.md }]}
                      onPress={() => Alert.alert("Video", "Abrir: " + rutinaDetalleSeleccionada.rutina.video_url)}
                    >
                      <Text style={globalStyles.buttonText}>🎥 Ver Video</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
                    onPress={() => setModalRutinaDetalleVisible(false)}
                  >
                    <Text style={globalStyles.buttonText}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL: IMAGEN AMPLIADA */}
      <Modal
        visible={modalImagenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalImagenVisible(false)}
      >
        <View style={styles.modalImagenContainer}>
          <TouchableOpacity
            style={styles.modalImagenCloseArea}
            activeOpacity={1}
            onPress={() => setModalImagenVisible(false)}
          >
            <View style={styles.modalImagenContent}>
              {imagenAmpliada && (
                <Image
                  source={{ uri: imagenAmpliada }}
                  style={styles.imagenAmpliada}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.modalImagenCloseButton}
                onPress={() => setModalImagenVisible(false)}
              >
                <Text style={styles.modalImagenCloseText}>✕ Cerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoIcon: {
    fontSize: fontSize.md,
  },
  objetivoContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  botonesAgregar: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  btnAgregar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 44,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  diaContainer: {
    marginBottom: spacing.lg,
  },
  diaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
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
  diaVacioCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: "center",
  },
  diaVacioText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  rutinaCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rutinaImagen: {
    width: "100%",
    height: 150,
  },
  rutinaImagenPlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  rutinaImagenIcon: {
    fontSize: 48,
  },
  rutinaContent: {
    padding: spacing.md,
  },
  rutinaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  rutinaTitulo: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  nivelChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  nivelText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  rutinaDescripcion: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  rutinaInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rutinaInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rutinaInfoIcon: {
    fontSize: fontSize.md,
  },
  rutinaInfoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  completadaBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  completadaText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },
  rutinaActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  completarButton: {
    flex: 1,
    backgroundColor: colors.success,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  completarButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  eliminarButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  eliminarButtonText: {
    fontSize: fontSize.md,
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
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
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
  preview: {
    width: "100%",
    height: 150,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  imagenDetalle: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  ampliarHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  infoDetalle: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalImagenContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImagenCloseArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalImagenContent: {
    width: "100%",
    alignItems: "center",
  },
  imagenAmpliada: {
    width: width - spacing.lg * 2,
    height: width - spacing.lg * 2,
    borderRadius: borderRadius.md,
  },
  modalImagenCloseButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  modalImagenCloseText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
});