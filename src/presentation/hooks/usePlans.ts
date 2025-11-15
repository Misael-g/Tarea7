import { useEffect, useState, useCallback } from "react";
import { Plan, PlanRutina } from "../../domain/models/Plan";
import { PlansUseCase } from "../../domain/useCases/plans/PlansUseCase";

const plansUseCase = new PlansUseCase();

export function usePlans() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);
  const [planActivo, setPlanActivo] = useState<Plan | null>(null);
  const [rutinasDelPlan, setRutinasDelPlan] = useState<PlanRutina[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPlanes();
    cargarPlanActivo();
  }, []);

  const cargarPlanes = async () => {
    setCargando(true);
    const data = await plansUseCase.obtenerPlanes();
    setPlanes(data);
    setCargando(false);
  };

  const cargarPlanActivo = async () => {
    const plan = await plansUseCase.obtenerPlanActivo();
    setPlanActivo(plan);
  };

  const obtenerPlanPorId = async (id: string) => {
    const plan = await plansUseCase.obtenerPlanPorId(id);
    setPlanSeleccionado(plan);
    return plan;
  };

  const obtenerUsuariosDisponibles = async () => {
    return await plansUseCase.obtenerUsuariosDisponibles();
  };

  const crear = async (
    nombre: string,
    descripcion: string,
    entrenadorId: string,
    usuarioId: string,
    fechaInicio: string,
    fechaFin: string | null,
    objetivo: string,
    notas: string
  ) => {
    const resultado = await plansUseCase.crearPlan(
      nombre,
      descripcion,
      entrenadorId,
      usuarioId,
      fechaInicio,
      fechaFin,
      objetivo,
      notas
    );
    if (resultado.success) {
      await cargarPlanes();
    }
    return resultado;
  };

  const actualizar = async (
    id: string,
    nombre: string,
    descripcion: string,
    fechaInicio: string,
    fechaFin: string | null,
    objetivo: string,
    notas: string,
    activo: boolean
  ) => {
    const resultado = await plansUseCase.actualizarPlan(
      id,
      nombre,
      descripcion,
      fechaInicio,
      fechaFin,
      objetivo,
      notas,
      activo
    );
    if (resultado.success) {
      await cargarPlanes();
      await cargarPlanActivo();
    }
    return resultado;
  };

  const eliminar = async (id: string) => {
    const resultado = await plansUseCase.eliminarPlan(id);
    if (resultado.success) {
      await cargarPlanes();
      await cargarPlanActivo();
    }
    return resultado;
  };

  const cambiarEstado = async (id: string, activo: boolean) => {
    const resultado = await plansUseCase.cambiarEstadoPlan(id, activo);
    if (resultado.success) {
      await cargarPlanes();
      await cargarPlanActivo();
    }
    return resultado;
  };

  // ============= RUTINAS DEL PLAN =============

  const cargarRutinasPlan = async (planId: string) => {
    const rutinas = await plansUseCase.obtenerRutinasPlan(planId);
    setRutinasDelPlan(rutinas);
    return rutinas;
  };

  const obtenerRutinasPorDia = async (planId: string, diaSemana: number) => {
    return await plansUseCase.obtenerRutinasPorDia(planId, diaSemana);
  };

  const asignarRutina = async (
    planId: string,
    rutinaId: string,
    diaSemana: number,
    orden: number
  ) => {
    const resultado = await plansUseCase.asignarRutina(
      planId,
      rutinaId,
      diaSemana,
      orden
    );
    if (resultado.success) {
      await cargarRutinasPlan(planId);
    }
    return resultado;
  };

  const actualizarRutinaPlan = async (
    id: string,
    diaSemana: number,
    orden: number,
    planId: string
  ) => {
    const resultado = await plansUseCase.actualizarRutinaPlan(
      id,
      diaSemana,
      orden
    );
    if (resultado.success) {
      await cargarRutinasPlan(planId);
    }
    return resultado;
  };

  const quitarRutina = async (id: string, planId: string) => {
    const resultado = await plansUseCase.quitarRutina(id);
    if (resultado.success) {
      await cargarRutinasPlan(planId);
    }
    return resultado;
  };

  // Obtener rutinas agrupadas por día de la semana
  const obtenerRutinasAgrupadasPorDia = useCallback((planRutinas: PlanRutina[]) => {
    const dias = [
      { numero: 1, nombre: "Lunes" },
      { numero: 2, nombre: "Martes" },
      { numero: 3, nombre: "Miércoles" },
      { numero: 4, nombre: "Jueves" },
      { numero: 5, nombre: "Viernes" },
      { numero: 6, nombre: "Sábado" },
      { numero: 7, nombre: "Domingo" },
    ];

    return dias.map((dia) => ({
      ...dia,
      rutinas: planRutinas
        .filter((pr) => pr.dia_semana === dia.numero)
        .sort((a, b) => a.orden - b.orden),
    }));
  }, []);

  return {
    planes,
    planSeleccionado,
    planActivo,
    rutinasDelPlan,
    cargando,
    cargarPlanes,
    cargarPlanActivo,
    obtenerPlanPorId,
    obtenerUsuariosDisponibles,
    crear,
    actualizar,
    eliminar,
    cambiarEstado,
    // Rutinas del plan
    cargarRutinasPlan,
    obtenerRutinasPorDia,
    asignarRutina,
    actualizarRutinaPlan,
    quitarRutina,
    obtenerRutinasAgrupadasPorDia,
  };
}