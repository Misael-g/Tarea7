import { supabase } from "@/src/data/services/supabaseClient";
import { Plan, PlanRutina } from "../../models/Plan";

export class PlansUseCase {
  // ============= PLANES PÚBLICOS =============

  // Obtener todos los planes públicos (visible para todos)
  async obtenerPlanesPublicos(): Promise<Plan[]> {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .select(`
          *,
          entrenador:usuarios!planes_entrenamiento_entrenador_id_fkey(email, nombre)
        `)
        .eq("publico", true)
        .eq("activo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener planes públicos:", error);
      return [];
    }
  }

  // Obtener planes del entrenador (solo los que él creó)
  async obtenerMisPlanes(): Promise<Plan[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .select(`
          *,
          entrenador:usuarios!planes_entrenamiento_entrenador_id_fkey(email, nombre)
        `)
        .eq("entrenador_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener mis planes:", error);
      return [];
    }
  }

  // Obtener plan por ID
  async obtenerPlanPorId(planId: string): Promise<Plan | null> {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .select(`
          *,
          entrenador:usuarios!planes_entrenamiento_entrenador_id_fkey(email, nombre)
        `)
        .eq("id", planId)
        .single();

      if (error) throw error;
      return data as Plan;
    } catch (error) {
      console.log("❌ Error al obtener plan:", error);
      return null;
    }
  }

  // Crear plan público
  async crearPlan(
    nombre: string,
    descripcion: string,
    entrenadorId: string,
    fechaInicio: string,
    fechaFin: string | null,
    objetivo: string,
    notas: string
  ) {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .insert({
          nombre,
          descripcion,
          entrenador_id: entrenadorId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          objetivo,
          notas,
          activo: true,
          publico: true, // ✅ Siempre público
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, plan: data };
    } catch (error: any) {
      console.log("❌ Error al crear plan:", error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar plan
  async actualizarPlan(
    id: string,
    nombre: string,
    descripcion: string,
    fechaInicio: string,
    fechaFin: string | null,
    objetivo: string,
    notas: string,
    activo: boolean
  ) {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .update({
          nombre,
          descripcion,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          objetivo,
          notas,
          activo,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, plan: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Eliminar plan
  async eliminarPlan(id: string) {
    try {
      const { error } = await supabase
        .from("planes_entrenamiento")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Activar/Desactivar plan
  async cambiarEstadoPlan(id: string, activo: boolean) {
    try {
      const { error } = await supabase
        .from("planes_entrenamiento")
        .update({ activo })
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============= RUTINAS EN PLANES =============

  // Obtener rutinas asignadas a un plan
  async obtenerRutinasPlan(planId: string): Promise<PlanRutina[]> {
    try {
      const { data, error } = await supabase
        .from("plan_rutinas")
        .select(`
          *,
          rutina:rutinas(*)
        `)
        .eq("plan_id", planId)
        .order("dia_semana")
        .order("orden");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener rutinas del plan:", error);
      return [];
    }
  }

  // Asignar rutina a plan
  async asignarRutina(
    planId: string,
    rutinaId: string,
    diaSemana: number,
    orden: number
  ) {
    try {
      const { data, error } = await supabase
        .from("plan_rutinas")
        .insert({
          plan_id: planId,
          rutina_id: rutinaId,
          dia_semana: diaSemana,
          orden,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, planRutina: data };
    } catch (error: any) {
      console.log("❌ Error al asignar rutina:", error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar día/orden de rutina en plan
  async actualizarRutinaPlan(
    id: string,
    diaSemana: number,
    orden: number
  ) {
    try {
      const { data, error } = await supabase
        .from("plan_rutinas")
        .update({
          dia_semana: diaSemana,
          orden,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, planRutina: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Quitar rutina de plan
  async quitarRutina(id: string) {
    try {
      const { error } = await supabase
        .from("plan_rutinas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Obtener rutinas por día de la semana
  async obtenerRutinasPorDia(planId: string, diaSemana: number): Promise<PlanRutina[]> {
    try {
      const { data, error } = await supabase
        .from("plan_rutinas")
        .select(`
          *,
          rutina:rutinas(*)
        `)
        .eq("plan_id", planId)
        .eq("dia_semana", diaSemana)
        .order("orden");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener rutinas del día:", error);
      return [];
    }
  }
}