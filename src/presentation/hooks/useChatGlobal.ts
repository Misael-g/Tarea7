import { useState, useEffect, useCallback } from "react";
import { ChatGlobalUseCase } from "@/src/domain/useCases/chat/ChatGlobalUseCase";
import { MensajeGlobal } from "@/src/domain/models/MensajeGlobal";

const chatGlobalUseCase = new ChatGlobalUseCase();

export function useChatGlobal() {
  const [mensajes, setMensajes] = useState<MensajeGlobal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [realtimeConectado, setRealtimeConectado] = useState(false);

  // Cargar mensajes al inicio
  useEffect(() => {
    console.log("🔄 Iniciando carga de mensajes...");
    cargarMensajes();
  }, []);

  // Configurar Realtime
  useEffect(() => {
    console.log("🔔 Configurando suscripción Realtime...");
    
    const desuscribir = chatGlobalUseCase.suscribirseAMensajes((nuevoMensaje) => {
      console.log("📨 ¡Nuevo mensaje recibido por Realtime!", nuevoMensaje);
      
      setMensajes((prevMensajes) => {
        // Verificar si el mensaje ya existe
        const existe = prevMensajes.some((m) => m.id === nuevoMensaje.id);
        
        if (existe) {
          console.log("⚠️ Mensaje duplicado, ignorando...");
          return prevMensajes;
        }
        
        console.log("✅ Agregando nuevo mensaje al estado");
        return [...prevMensajes, nuevoMensaje];
      });
    });

    // Indicar que Realtime está conectado
    setRealtimeConectado(true);
    console.log("✅ Suscripción Realtime configurada");

    // Cleanup: desuscribirse al desmontar
    return () => {
      console.log("🔕 Cerrando suscripción Realtime");
      setRealtimeConectado(false);
      desuscribir();
    };
  }, []); // Solo una vez al montar

  const cargarMensajes = async () => {
    console.log("📥 Cargando mensajes desde la base de datos...");
    setCargando(true);
    
    try {
      const mensajesObtenidos = await chatGlobalUseCase.obtenerMensajes(100);
      console.log(`✅ ${mensajesObtenidos.length} mensajes cargados`);
      setMensajes(mensajesObtenidos);
    } catch (error) {
      console.error("❌ Error al cargar mensajes:", error);
    } finally {
      setCargando(false);
    }
  };

  const enviarMensaje = useCallback(
    async (contenido: string) => {
      if (!contenido.trim()) {
        console.log("⚠️ Mensaje vacío, cancelando envío");
        return { success: false, error: "El mensaje está vacío" };
      }

      console.log("📤 Enviando mensaje:", contenido);
      setEnviando(true);
      
      try {
        const resultado = await chatGlobalUseCase.enviarMensaje(contenido);
        
        if (resultado.success) {
          console.log("✅ Mensaje enviado exitosamente");
          // No es necesario agregar el mensaje manualmente,
          // Realtime lo hará automáticamente
        } else {
          console.error("❌ Error al enviar:", resultado.error);
        }
        
        return resultado;
      } catch (error) {
        console.error("❌ Error inesperado al enviar:", error);
        return { success: false, error: "Error inesperado" };
      } finally {
        setEnviando(false);
      }
    },
    []
  );

  const enviarMensajeConFoto = useCallback(
    async (contenido: string, fotoUri: string) => {
      console.log("📤 Enviando mensaje con foto");
      setEnviando(true);
      
      try {
        const resultado = await chatGlobalUseCase.enviarMensajeConFoto(contenido, fotoUri);
        
        if (resultado.success) {
          console.log("✅ Mensaje con foto enviado");
        } else {
          console.error("❌ Error al enviar foto:", resultado.error);
        }
        
        return resultado;
      } catch (error) {
        console.error("❌ Error inesperado:", error);
        return { success: false, error: "Error inesperado" };
      } finally {
        setEnviando(false);
      }
    },
    []
  );

  const seleccionarFoto = async () => {
    return await chatGlobalUseCase.seleccionarFoto();
  };

  const tomarFoto = async () => {
    return await chatGlobalUseCase.tomarFoto();
  };

  const eliminarMensaje = async (mensajeId: string) => {
    console.log("🗑️ Eliminando mensaje:", mensajeId);
    
    const resultado = await chatGlobalUseCase.eliminarMensaje(mensajeId);
    
    if (resultado.success) {
      console.log("✅ Mensaje eliminado");
      setMensajes((prev) => prev.filter((m) => m.id !== mensajeId));
    } else {
      console.error("❌ Error al eliminar:", resultado.error);
    }
    
    return resultado;
  };

  const esMiMensaje = useCallback((mensaje: MensajeGlobal, usuarioActualId: string) => {
    return mensaje.usuario_id === usuarioActualId;
  }, []);

  const formatearHora = useCallback((fecha: string) => {
    return new Date(fecha).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return {
    mensajes,
    cargando,
    enviando,
    realtimeConectado, // Nuevo: para mostrar el estado de conexión
    cargarMensajes,
    enviarMensaje,
    enviarMensajeConFoto,
    seleccionarFoto,
    tomarFoto,
    eliminarMensaje,
    esMiMensaje,
    formatearHora,
  };
}