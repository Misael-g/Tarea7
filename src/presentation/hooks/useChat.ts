import { useState, useEffect, useCallback } from "react";
import { ChatUseCase } from "@/src/domain/useCases/chat/ChatUseCase";
import { Mensaje } from "@/src/domain/models/Mensaje";

const chatUseCase = new ChatUseCase();

export function useChat(destinatarioId?: string, planId?: string) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Cargar mensajes cuando se proporciona destinatarioId o planId
  useEffect(() => {
    if (destinatarioId) {
      cargarMensajes();
    } else if (planId) {
      cargarMensajesPlan();
    }
  }, [destinatarioId, planId]);

  // Suscribirse a nuevos mensajes en tiempo real
  useEffect(() => {
    let desuscribir: (() => void) | undefined;

    if (destinatarioId) {
      desuscribir = chatUseCase.suscribirseAMensajes(destinatarioId, (nuevoMensaje) => {
        setMensajes((prev) => {
          // Evitar duplicados
          if (prev.some((m) => m.id === nuevoMensaje.id)) {
            return prev;
          }
          return [...prev, nuevoMensaje];
        });
      });
    } else if (planId) {
      desuscribir = chatUseCase.suscribirseAMensajesPlan(planId, (nuevoMensaje) => {
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevoMensaje.id)) {
            return prev;
          }
          return [...prev, nuevoMensaje];
        });
      });
    }

    return () => {
      if (desuscribir) {
        desuscribir();
      }
    };
  }, [destinatarioId, planId]);

  // ============= CARGAR MENSAJES =============

  const cargarMensajes = async () => {
    if (!destinatarioId) return;

    setCargando(true);
    const mensajesObtenidos = await chatUseCase.obtenerMensajes(destinatarioId);
    setMensajes(mensajesObtenidos);
    setCargando(false);

    // Marcar como leídos
    await chatUseCase.marcarComoLeidos(destinatarioId);
  };

  const cargarMensajesPlan = async () => {
    if (!planId) return;

    setCargando(true);
    const mensajesObtenidos = await chatUseCase.obtenerMensajesPlan(planId);
    setMensajes(mensajesObtenidos);
    setCargando(false);
  };

  const cargarConversaciones = async () => {
    setCargando(true);
    const conv = await chatUseCase.obtenerConversaciones();
    setConversaciones(conv);
    setCargando(false);
  };

  const cargarMensajesNoLeidos = async () => {
    const count = await chatUseCase.contarMensajesNoLeidos();
    setMensajesNoLeidos(count);
  };

  // ============= ENVIAR MENSAJES =============

  const enviarMensaje = useCallback(
    async (contenido: string) => {
      if (!contenido.trim()) {
        return { success: false, error: "El mensaje está vacío" };
      }

      if (!destinatarioId && !planId) {
        return { success: false, error: "No hay destinatario especificado" };
      }

      setEnviando(true);
      const resultado = await chatUseCase.enviarMensaje(
        contenido,
        destinatarioId!,
        planId
      );
      setEnviando(false);

      return resultado;
    },
    [destinatarioId, planId]
  );

  const marcarComoLeidos = async (usuarioId: string) => {
    const resultado = await chatUseCase.marcarComoLeidos(usuarioId);
    if (resultado.success) {
      await cargarMensajesNoLeidos();
    }
    return resultado;
  };

  const eliminarMensaje = async (mensajeId: string) => {
    const resultado = await chatUseCase.eliminarMensaje(mensajeId);
    if (resultado.success) {
      setMensajes((prev) => prev.filter((m) => m.id !== mensajeId));
    }
    return resultado;
  };

  // ============= UTILIDADES =============

  // Obtener último mensaje de una conversación
  const obtenerUltimoMensaje = useCallback((usuarioId: string) => {
    const mensajesConUsuario = mensajes.filter(
      (m) => m.usuario_id === usuarioId || m.destinatario_id === usuarioId
    );
    return mensajesConUsuario[mensajesConUsuario.length - 1];
  }, [mensajes]);

  // Contar mensajes no leídos de un usuario específico
  const contarNoLeidosDeUsuario = useCallback((usuarioId: string) => {
    return mensajes.filter(
      (m) => m.usuario_id === usuarioId && !m.leido
    ).length;
  }, [mensajes]);

  // Obtener mensajes agrupados por fecha
  const agruparPorFecha = useCallback(() => {
    const grupos: { [key: string]: Mensaje[] } = {};

    mensajes.forEach((mensaje) => {
      const fecha = new Date(mensaje.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(mensaje);
    });

    return Object.entries(grupos).map(([fecha, mensajes]) => ({
      fecha,
      mensajes,
    }));
  }, [mensajes]);

  // Verificar si hay mensajes nuevos
  const hayMensajesNuevos = useCallback(() => {
    return mensajesNoLeidos > 0;
  }, [mensajesNoLeidos]);

  return {
    mensajes,
    conversaciones,
    mensajesNoLeidos,
    cargando,
    enviando,
    // Cargar
    cargarMensajes,
    cargarMensajesPlan,
    cargarConversaciones,
    cargarMensajesNoLeidos,
    recargarMensajes: destinatarioId ? cargarMensajes : cargarMensajesPlan,
    // Enviar
    enviarMensaje,
    marcarComoLeidos,
    eliminarMensaje,
    // Utilidades
    obtenerUltimoMensaje,
    contarNoLeidosDeUsuario,
    agruparPorFecha,
    hayMensajesNuevos,
  };
}