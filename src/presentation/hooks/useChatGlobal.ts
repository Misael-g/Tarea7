import { useState, useEffect, useCallback } from "react";
import { ChatGlobalUseCase } from "@/src/domain/useCases/chat/ChatGlobalUseCase";
import { MensajeGlobal } from "@/src/domain/models/MensajeGlobal";

const chatGlobalUseCase = new ChatGlobalUseCase();

export function useChatGlobal() {
  const [mensajes, setMensajes] = useState<MensajeGlobal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarMensajes();
  }, []);

  useEffect(() => {
    const desuscribirNuevos = chatGlobalUseCase.suscribirseAMensajes((nuevoMensaje) => {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === nuevoMensaje.id)) {
          return prev;
        }
        return [...prev, nuevoMensaje];
      });
    });

    return () => {
      desuscribirNuevos();
    };
  }, []);

  const cargarMensajes = async () => {
    setCargando(true);
    const mensajesObtenidos = await chatGlobalUseCase.obtenerMensajes(50);
    setMensajes(mensajesObtenidos);
    setCargando(false);
  };

  const enviarMensaje = useCallback(
    async (contenido: string) => {
      if (!contenido.trim()) {
        return { success: false, error: "El mensaje está vacío" };
      }

      setEnviando(true);
      const resultado = await chatGlobalUseCase.enviarMensaje(contenido);
      setEnviando(false);

      return resultado;
    },
    []
  );

  const enviarMensajeConFoto = useCallback(
    async (contenido: string, fotoUri: string) => {
      setEnviando(true);
      const resultado = await chatGlobalUseCase.enviarMensajeConFoto(contenido, fotoUri);
      setEnviando(false);

      return resultado;
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
    const resultado = await chatGlobalUseCase.eliminarMensaje(mensajeId);
    if (resultado.success) {
      setMensajes((prev) => prev.filter((m) => m.id !== mensajeId));
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