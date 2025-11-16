import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useChat } from "../../src/presentation/hooks/useChat";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlans } from "../../src/presentation/hooks/usePlans";
import { Mensaje } from "../../src/domain/models/Mensaje";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function ChatScreen() {
  const { usuario, esEntrenador } = useAuth();
  const { planActivo } = usePlans();
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(true);

  // Hook de chat con destinatario específico
  const {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
    cargarConversaciones,
    mensajesNoLeidos,
    cargarMensajesNoLeidos,
  } = useChat(conversacionActiva || undefined);

  const [textoMensaje, setTextoMensaje] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      cargarListaConversaciones();
      cargarMensajesNoLeidos();
    }, [])
  );

  useEffect(() => {
    if (mensajes.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [mensajes]);

  const cargarListaConversaciones = async () => {
    setCargandoConversaciones(true);
    await cargarConversaciones();
    setCargandoConversaciones(false);

    // Si es usuario y tiene plan activo, abrir chat con entrenador automáticamente
    if (!esEntrenador && planActivo && planActivo.entrenador_id) {
      setConversacionActiva(planActivo.entrenador_id);
    }
  };

  const handleEnviar = async () => {
    if (!textoMensaje.trim() || enviando || !conversacionActiva) return;

    const mensaje = textoMensaje;
    setTextoMensaje("");

    const resultado = await enviarMensaje(mensaje);

    if (!resultado.success) {
      alert("Error: " + resultado.error);
      setTextoMensaje(mensaje);
    }
  };

  const renderMensaje = ({ item }: { item: Mensaje }) => {
    const esMio = item.usuario_id === usuario?.id;
    const emailUsuario = item.usuario?.email || "desconocido@usuario.com";
    const rolUsuario = item.usuario?.rol || "usuario";

    return (
      <View
        style={[
          styles.mensajeContainer,
          esMio ? styles.mensajeMio : styles.mensajeOtro,
        ]}
      >
        <View style={styles.headerMensaje}>
          <Text style={[styles.nombreUsuario, esMio && styles.nombreUsuarioMio]}>
            {esMio ? "Tú" : emailUsuario}
          </Text>
          {rolUsuario === "entrenador" && (
            <View style={[styles.badge, esMio ? styles.badgeMio : styles.badgeOtro]}>
              <Text style={styles.badgeText}>👨‍🏫 Entrenador</Text>
            </View>
          )}
        </View>

        <Text style={[styles.contenidoMensaje, esMio && styles.contenidoMensajeMio]}>
          {item.contenido}
        </Text>

        <Text style={[styles.horaMensaje, esMio && styles.horaMensajeMio]}>
          {new Date(item.created_at).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  // Vista cuando no hay conversación seleccionada
  if (!conversacionActiva) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          {mensajesNoLeidos > 0 && (
            <View style={globalStyles.badge}>
              <Text style={globalStyles.badgeText}>{mensajesNoLeidos}</Text>
            </View>
          )}
        </View>

        {cargandoConversaciones ? (
          <View style={globalStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={globalStyles.containerCentered}>
            {!esEntrenador && planActivo ? (
              <View style={styles.chatCard}>
                <Text style={styles.chatCardTitle}>
                  💬 Chat con tu Entrenador
                </Text>
                <Text style={globalStyles.textSecondary}>
                  {planActivo.entrenador?.email || "Tu entrenador"}
                </Text>
                <TouchableOpacity
                  style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
                  onPress={() => setConversacionActiva(planActivo.entrenador_id)}
                >
                  <Text style={globalStyles.buttonText}>Abrir Chat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={globalStyles.emptyState}>
                {esEntrenador
                  ? "Selecciona una conversación con tus usuarios"
                  : "No tienes un plan activo. Contacta a tu entrenador."}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // Vista de chat activo
  if (cargando) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.textoCargando}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setConversacionActiva(null)}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={mensajes}
        renderItem={renderMensaje}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={textoMensaje}
          onChangeText={setTextoMensaje}
          placeholder="Escribe un mensaje..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.botonEnviar,
            (!textoMensaje.trim() || enviando) && styles.botonDeshabilitado,
          ]}
          onPress={handleEnviar}
          disabled={!textoMensaje.trim() || enviando}
        >
          <Text style={styles.textoBotonEnviar}>
            {enviando ? "..." : "Enviar"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  textoCargando: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  listContainer: {
    padding: spacing.md,
  },
  mensajeContainer: {
    maxWidth: "75%",
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  mensajeMio: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  mensajeOtro: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerMensaje: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  nombreUsuario: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  nombreUsuarioMio: {
    color: "rgba(255, 255, 255, 0.95)",
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeMio: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  badgeOtro: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.white,
  },
  contenidoMensaje: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  contenidoMensajeMio: {
    color: colors.white,
  },
  horaMensaje: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  horaMensajeMio: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 20,
    fontSize: fontSize.md,
  },
  botonEnviar: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: "center",
  },
  botonDeshabilitado: {
    backgroundColor: colors.borderLight,
  },
  textoBotonEnviar: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  chatCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    margin: spacing.lg,
  },
  chatCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});