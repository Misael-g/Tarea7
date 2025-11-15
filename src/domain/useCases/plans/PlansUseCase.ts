import { supabase } from "@/src/data/services/supabaseClient";
import { Plan, PlanRutina } from "../../models/Plan";

export class PlansUseCase {
  // ============= PLANES =============

  // Obtener planes (entrenador ve los suyos, usuario ve los asignados)
  async obtenerPlanes(): Promise<Plan[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

      let query = supabase
        .from("planes_entrenamiento")
        .select(`
          *,
          entrenador:usuarios!planes_entrenamiento_entrenador_id_fkey(email, nombre),
          usuario:usuarios!planes_entrenamiento_usuario_id_fkey(email, nombre)
        `);

      if (usuario?.rol === "entrenador") {
        query = query.eq("entrenador_id", user.id);
      } else {
        query = query.eq("usuario_id", user.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener planes:", error);
      return [];
    }
  }

  // Obtener plan por ID con rutinas asignadas
  async obtenerPlanPorId(planId: string): Promise<Plan | null> {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .select(`
          *,
          entrenador:usuarios!planes_entrenamiento_entrenador_id_fkey(email, nombre),
          usuario:usuarios!planes_entrenamiento_usuario_id_fkey(email, nombre)
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

  // Obtener usuarios disponibles (para asignar plan)
  async obtenerUsuariosDisponibles() {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, email, nombre")
        .eq("rol", "usuario")
        .order("email");

      if (error) throw error;
      return { success: true, usuarios: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, usuarios: [] };
    }
  }

  // Crear plan de entrenamiento
  async crearPlan(
    nombre: string,
    descripcion: string,
    entrenadorId: string,
    usuarioId: string,
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
          usuario_id: usuarioId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          objetivo,
          notas,
          activo: true,
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

  // Obtener plan activo del usuario
  async obtenerPlanActivo(): Promise<Plan | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .select(`
          *,
          entrenador:usuarios!planes_entrenamiento_entrenador_id_fkey(email, nombre)
        `)
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No hay plan activo
          return null;
        }
        throw error;
      }

      return data as Plan;
    } catch (error) {
      console.log("❌ Error al obtener plan activo:", error);
      return null;
    }
  }
}