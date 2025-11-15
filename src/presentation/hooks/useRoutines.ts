import { useEffect, useState, useCallback } from "react";
import { Rutina } from "../../domain/models/Rutina";
import { RoutinesUseCase } from "../../domain/useCases/routines/RoutinesUseCase";

const routinesUseCase = new RoutinesUseCase();

export function useRoutines() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState<Rutina | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRutinas();
  }, []);

  const cargarRutinas = async () => {
    setCargando(true);
    const data = await routinesUseCase.obtenerRutinas();
    setRutinas(data);
    setCargando(false);
  };

  const obtenerRutinaPorId = async (id: string) => {
    const rutina = await routinesUseCase.obtenerRutinaPorId(id);
    setRutinaSeleccionada(rutina);
    return rutina;
  };

  const crear = async (
    titulo: string,
    descripcion: string,
    nivel: "principiante" | "intermedio" | "avanzado",
    duracionMinutos: number,
    entrenadorId: string,
    videoUri?: string,
    imagenUri?: string
  ) => {
    const resultado = await routinesUseCase.crearRutina(
      titulo,
      descripcion,
      nivel,
      duracionMinutos,
      entrenadorId,
      videoUri,
      imagenUri
    );
    if (resultado.success) {
      await cargarRutinas();
    }
    return resultado;
  };

  const actualizar = async (
    id: string,
    titulo: string,
    descripcion: string,
    nivel: "principiante" | "intermedio" | "avanzado",
    duracionMinutos: number,
    videoUri?: string,
    imagenUri?: string,
    videoUrlAnterior?: string,
    imagenUrlAnterior?: string
  ) => {
    const resultado = await routinesUseCase.actualizarRutina(
      id,
      titulo,
      descripcion,
      nivel,
      duracionMinutos,
      videoUri,
      imagenUri,
      videoUrlAnterior,
      imagenUrlAnterior
    );
    if (resultado.success) {
      await cargarRutinas();
    }
    return resultado;
  };

  const eliminar = async (id: string) => {
    const resultado = await routinesUseCase.eliminarRutina(id);
    if (resultado.success) {
      await cargarRutinas();
    }
    return resultado;
  };

  // ============= EJERCICIOS =============

  const agregarEjercicio = async (
    rutinaId: string,
    nombre: string,
    descripcion: string,
    series: number,
    repeticiones: string,
    descansoSegundos: number,
    orden: number,
    videoUri?: string
  ) => {
    const resultado = await routinesUseCase.agregarEjercicio(
      rutinaId,
      nombre,
      descripcion,
      series,
      repeticiones,
      descansoSegundos,
      orden,
      videoUri
    );
    if (resultado.success) {
      // Recargar la rutina específica para actualizar ejercicios
      await obtenerRutinaPorId(rutinaId);
    }
    return resultado;
  };

  const actualizarEjercicio = async (
    id: string,
    nombre: string,
    descripcion: string,
    series: number,
    repeticiones: string,
    descansoSegundos: number,
    videoUri?: string,
    videoUrlAnterior?: string
  ) => {
    const resultado = await routinesUseCase.actualizarEjercicio(
      id,
      nombre,
      descripcion,
      series,
      repeticiones,
      descansoSegundos,
      videoUri,
      videoUrlAnterior
    );
    return resultado;
  };

  const eliminarEjercicio = async (id: string, rutinaId: string) => {
    const resultado = await routinesUseCase.eliminarEjercicio(id);
    if (resultado.success) {
      await obtenerRutinaPorId(rutinaId);
    }
    return resultado;
  };

  // ============= ARCHIVOS =============

  const seleccionarArchivo = async (tipo: "video" | "imagen") => {
    return await routinesUseCase.seleccionarArchivo(tipo);
  };

  const grabarVideo = async () => {
    return await routinesUseCase.grabarVideo();
  };

  return {
    rutinas,
    rutinaSeleccionada,
    cargando,
    cargarRutinas,
    obtenerRutinaPorId,
    crear,
    actualizar,
    eliminar,
    // Ejercicios
    agregarEjercicio,
    actualizarEjercicio,
    eliminarEjercicio,
    // Archivos
    seleccionarArchivo,
    grabarVideo,
  };
}