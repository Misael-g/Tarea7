import { useEffect, useState, useCallback } from "react";
import { Progreso } from "../../domain/models/Progreso";
import { ProgressUseCase } from "../../domain/useCases/progress/ProgressUseCase";

const progressUseCase = new ProgressUseCase();

interface Estadisticas {
  totalSesiones: number;
  sesionesCompletadas: number;
  porcentajeCompletadas: number;
  promedioCalificacion: number;
  duracionTotal: number;
  duracionPromedio: number;
}

export function useProgress(usuarioId?: string) {
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarProgreso();
    cargarEstadisticas();
  }, [usuarioId]);

  const cargarProgreso = async () => {
    setCargando(true);
    const data = await progressUseCase.obtenerProgreso(usuarioId);
    setProgreso(data);
    setCargando(false);
  };

  const cargarEstadisticas = async () => {
    const stats = await progressUseCase.obtenerEstadisticas(usuarioId);
    setEstadisticas(stats);
  };

  const obtenerProgresoPorRutina = async (rutinaId: string) => {
    return await progressUseCase.obtenerProgresoPorRutina(rutinaId);
  };

  const obtenerProgresoPorFecha = async (fecha: string) => {
    return await progressUseCase.obtenerProgresoPorFecha(fecha);
  };

  const registrar = async (
    rutinaId: string,
    fecha: string,
    completada: boolean,
    duracionMinutos?: number,
    pesoKg?: number,
    notas?: string,
    calificacion?: number,
    fotoUri?: string
  ) => {
    const resultado = await progressUseCase.registrarProgreso(
      rutinaId,
      fecha,
      completada,
      duracionMinutos,
      pesoKg,
      notas,
      calificacion,
      fotoUri
    );
    if (resultado.success) {
      await cargarProgreso();
      await cargarEstadisticas();
    }
    return resultado;
  };

  const actualizar = async (
    id: string,
    completada: boolean,
    duracionMinutos?: number,
    pesoKg?: number,
    notas?: string,
    calificacion?: number,
    fotoUri?: string,
    fotoUrlAnterior?: string
  ) => {
    const resultado = await progressUseCase.actualizarProgreso(
      id,
      completada,
      duracionMinutos,
      pesoKg,
      notas,
      calificacion,
      fotoUri,
      fotoUrlAnterior
    );
    if (resultado.success) {
      await cargarProgreso();
      await cargarEstadisticas();
    }
    return resultado;
  };

  const eliminar = async (id: string) => {
    const resultado = await progressUseCase.eliminarProgreso(id);
    if (resultado.success) {
      await cargarProgreso();
      await cargarEstadisticas();
    }
    return resultado;
  };

  const marcarComoCompletada = async (rutinaId: string, fecha: string) => {
    const resultado = await progressUseCase.marcarComoCompletada(rutinaId, fecha);
    if (resultado.success) {
      await cargarProgreso();
      await cargarEstadisticas();
    }
    return resultado;
  };

  // ============= FOTOS =============

  const seleccionarFoto = async () => {
    return await progressUseCase.seleccionarFoto();
  };

  const tomarFoto = async () => {
    return await progressUseCase.tomarFoto();
  };

  // ============= UTILIDADES =============

  // Verificar si una rutina está completada en una fecha
  const estaCompletada = useCallback((rutinaId: string, fecha: string) => {
    return progreso.some(
      (p) => p.rutina_id === rutinaId && p.fecha === fecha && p.completada
    );
  }, [progreso]);

  // Obtener progreso de hoy
  const obtenerProgresoHoy = useCallback(() => {
    const hoy = new Date().toISOString().split("T")[0];
    return progreso.filter((p) => p.fecha === hoy);
  }, [progreso]);

  // Obtener progreso de la semana actual
  const obtenerProgresoSemana = useCallback(() => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const inicioSemanaStr = inicioSemana.toISOString().split("T")[0];

    return progreso.filter((p) => p.fecha >= inicioSemanaStr);
  }, [progreso]);

  // Obtener progreso del mes actual
  const obtenerProgresoMes = useCallback(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesStr = inicioMes.toISOString().split("T")[0];

    return progreso.filter((p) => p.fecha >= inicioMesStr);
  }, [progreso]);

  // Agrupar progreso por mes
  const agruparPorMes = useCallback(() => {
    const grupos: { [key: string]: Progreso[] } = {};

    progreso.forEach((p) => {
      const fecha = new Date(p.fecha);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      
      if (!grupos[mes]) {
        grupos[mes] = [];
      }
      grupos[mes].push(p);
    });

    return Object.entries(grupos)
      .map(([mes, registros]) => ({
        mes,
        registros,
        total: registros.length,
        completadas: registros.filter((r) => r.completada).length,
      }))
      .sort((a, b) => b.mes.localeCompare(a.mes));
  }, [progreso]);

  return {
    progreso,
    estadisticas,
    cargando,
    cargarProgreso,
    cargarEstadisticas,
    obtenerProgresoPorRutina,
    obtenerProgresoPorFecha,
    registrar,
    actualizar,
    eliminar,
    marcarComoCompletada,
    // Fotos
    seleccionarFoto,
    tomarFoto,
    // Utilidades
    estaCompletada,
    obtenerProgresoHoy,
    obtenerProgresoSemana,
    obtenerProgresoMes,
    agruparPorMes,
  };
}