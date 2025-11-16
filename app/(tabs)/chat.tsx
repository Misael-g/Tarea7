import React, { useState, useRef, useEffect } from "react";
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
  Image,
  Alert,
} from "react-native";
import { useChatGlobal } from "../../src/presentation/hooks/useChatGlobal";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { colors, fontSize, spacing, borderRadius } from "../../src/styles/theme";


export default function ChatScreen() {
  const { usuario } = useAuth();
  const {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
    enviarMensajeConFoto,
    seleccionarFoto,
    tomarFoto,
    eliminarMensaje,
    esMiMensaje,
    formatearHora,
  } = useChatGlobal();

  const [textoMensaje, setTextoMensaje] = useState("");
  const [fotoSeleccionada, setFotoSeleccionada] = useState<string | null>(null);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (mensajes.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [mensajes.length]);

  const handleEnviar = async () => {
    if (!textoMensaje.trim() && !fotoSeleccionada) return;

    let resultado;
    if (fotoSeleccionada) {
      resultado = await enviarMensajeConFoto(textoMensaje, fotoSeleccionada);
      setFotoSeleccionada(null);
    } else {
      resultado = await enviarMensaje(textoMensaje);
    }

    if (resultado.success) {
      setTextoMensaje("");
    } else {
      Alert.alert("Error", resultado.error || "No se pudo enviar el mensaje");
    }
  };

  const handleSeleccionarFoto = async () => {
    setMostrarOpciones(false);
    const uri = await seleccionarFoto();
    if (uri) {
      setFotoSeleccionada(uri);
    }
  };

  const handleTomarFoto = async () => {
    setMostrarOpciones(false);
    const uri = await tomarFoto();
    if (uri) {
      setFotoSeleccionada(uri);
    }
  };

  const handleEliminarMensaje = (mensajeId: string) => {
    Alert.alert(
      "Eliminar mensaje",
      "¿Estás seguro de que quieres eliminar este mensaje?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await eliminarMensaje(mensajeId);
            if (!resultado.success) {
              Alert.alert("Error", resultado.error || "No se pudo eliminar el mensaje");
            }
          },
        },
      ]
    );
  };

  const renderMensaje = ({ item }: { item: any }) => {
    const esMio = esMiMensaje(item, usuario?.id || "");
    
    return (
      <View style={[styles.mensajeContainer, esMio && styles.mensajeContainerPropio]}>
        {!esMio && (
          <View style={styles.avatarContainer}>
            {item.usuario?.avatar_url ? (
              <Image source={{ uri: item.usuario.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.usuario?.nombre?.[0] || item.usuario?.email[0] || "?"}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.mensajeBubble, esMio && styles.mensajeBubblePropio]}>
          {!esMio && (
            <Text style={styles.nombreUsuario}>
              {item.usuario?.nombre || item.usuario?.email}
              {item.usuario?.rol === "entrenador" && " 🏋️"}
            </Text>
          )}

          {item.foto_url && (
            <Image source={{ uri: item.foto_url }} style={styles.fotoMensaje} />
          )}

          {item.contenido && (
            <Text style={[styles.textoMensaje, esMio && styles.textoMensajePropio]}>
              {item.contenido}
            </Text>
          )}

          <View style={styles.metadataContainer}>
            <Text style={[styles.horaMensaje, esMio && styles.horaMensajePropio]}>
              {formatearHora(item.created_at)}
            </Text>
          </View>

          {esMio && (
            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => handleEliminarMensaje(item.id)}
            >
              <Text style={styles.botonEliminarText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>💬</Text>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Chat Global</Text>
            <Text style={styles.headerSubtitle}>
              {mensajes.length} {mensajes.length === 1 ? "mensaje" : "mensajes"}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={mensajes}
        renderItem={renderMensaje}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No hay mensajes aún</Text>
            <Text style={styles.emptySubtext}>¡Sé el primero en enviar un mensaje!</Text>
          </View>
        }
      />

      {/* Preview de foto seleccionada */}
      {fotoSeleccionada && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: fotoSeleccionada }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.botonEliminarPreview}
            onPress={() => setFotoSeleccionada(null)}
          >
            <Text style={styles.botonEliminarPreviewText}>❌</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Opciones de foto */}
      {mostrarOpciones && (
        <View style={styles.opcionesContainer}>
          <TouchableOpacity style={styles.opcionBoton} onPress={handleTomarFoto}>
            <Text style={styles.opcionTexto}>📷 Tomar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.opcionBoton} onPress={handleSeleccionarFoto}>
            <Text style={styles.opcionTexto}>🖼️ Galería</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input de mensaje */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.botonAdjuntar}
          onPress={() => setMostrarOpciones(!mostrarOpciones)}
        >
          <Text style={styles.botonAdjuntarText}>
            {mostrarOpciones ? "✖️" : "➕"}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textTertiary}
          value={textoMensaje}
          onChangeText={setTextoMensaje}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[
            styles.botonEnviar,
            (!textoMensaje.trim() && !fotoSeleccionada) && styles.botonEnviarDeshabilitado,
          ]}
          onPress={handleEnviar}
          disabled={(!textoMensaje.trim() && !fotoSeleccionada) || enviando}
        >
          {enviando ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.botonEnviarText}>📤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  mensajeContainer: {
    flexDirection: "row",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  mensajeContainerPropio: {
    justifyContent: "flex-end",
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "bold",
  },
  mensajeBubble: {
    maxWidth: "75%",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    position: "relative",
  },
  mensajeBubblePropio: {
    backgroundColor: colors.primary,
  },
  nombreUsuario: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fotoMensaje: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  textoMensaje: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  textoMensajePropio: {
    color: colors.white,
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  horaMensaje: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  horaMensajePropio: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  botonEliminar: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  botonEliminarText: {
    fontSize: 14,
  },
  previewContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    position: "relative",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  botonEliminarPreview: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.error,
    borderRadius: borderRadius.round,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  botonEliminarPreviewText: {
    fontSize: 16,
  },
  opcionesContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  opcionBoton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  opcionTexto: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  botonAdjuntar: {
    padding: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  botonAdjuntarText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  botonEnviar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  botonEnviarDeshabilitado: {
    backgroundColor: colors.borderLight,
  },
  botonEnviarText: {
    fontSize: 20,
  },
});