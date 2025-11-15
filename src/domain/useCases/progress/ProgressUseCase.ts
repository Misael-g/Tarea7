import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/src/data/services/supabaseClient";
import { Progreso } from "../../models/Progreso";

export class ProgressUseCase {
  // ============= OBTENER PROGRESO =============

  // Obtener todo el progreso del usuario
  async obtenerProgreso(usuarioId?: string): Promise<Progreso[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Si no se especifica usuarioId, usar el del usuario actual
      const targetUserId = usuarioId || user.id;

      const { data, error } = await supabase
        .from("progreso")
        .select(`
          *,
          rutina:rutinas(id, titulo, nivel)
        `)
        .eq("usuario_id", targetUserId)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener progreso:", error);
      return [];
    }
  }

  // Obtener progreso de una rutina específica
  async obtenerProgresoPorRutina(rutinaId: string): Promise<Progreso[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("progreso")
        .select(`
          *,
          rutina:rutinas(id, titulo, nivel)
        `)
        .eq("usuario_id", user.id)
        .eq("rutina_id", rutinaId)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener progreso por rutina:", error);
      return [];
    }
  }

  // Obtener progreso por fecha
  async obtenerProgresoPorFecha(fecha: string): Promise<Progreso[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("progreso")
        .select(`
          *,
          rutina:rutinas(id, titulo, nivel)
        `)
        .eq("usuario_id", user.id)
        .eq("fecha", fecha)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener progreso por fecha:", error);
      return [];
    }
  }

  // Obtener estadísticas del progreso
  async obtenerEstadisticas(usuarioId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const targetUserId = usuarioId || user.id;

      // Obtener todo el progreso
      const { data: progreso, error } = await supabase
        .from("progreso")
        .select("*")
        .eq("usuario_id", targetUserId);

      if (error) throw error;

      if (!progreso || progreso.length === 0) {
        return {
          totalSesiones: 0,
          sesionesCompletadas: 0,
          porcentajeCompletadas: 0,
          promedioCalificacion: 0,
          duracionTotal: 0,
          duracionPromedio: 0,
        };
      }

      const totalSesiones = progreso.length;
      const sesionesCompletadas = progreso.filter(p => p.completada).length;
      const porcentajeCompletadas = Math.round((sesionesCompletadas / totalSesiones) * 100);

      // Calcular promedio de calificación
      const calificaciones = progreso
        .filter(p => p.calificacion)
        .map(p => p.calificacion || 0);
      const promedioCalificacion = calificaciones.length > 0
        ? Math.round((calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length) * 10) / 10
        : 0;

      // Calcular duración total y promedio
      const duraciones = progreso
        .filter(p => p.duracion_minutos)
        .map(p => p.duracion_minutos || 0);
      const duracionTotal = duraciones.reduce((a, b) => a + b, 0);
      const duracionPromedio = duraciones.length > 0
        ? Math.round(duracionTotal / duraciones.length)
        : 0;

      return {
        totalSesiones,
        sesionesCompletadas,
        porcentajeCompletadas,
        promedioCalificacion,
        duracionTotal,
        duracionPromedio,
      };
    } catch (error) {
      console.log("❌ Error al obtener estadísticas:", error);
      return null;
    }
  }

  // ============= REGISTRAR PROGRESO =============

  // Registrar sesión de entrenamiento
  async registrarProgreso(
    rutinaId: string,
    fecha: string,
    completada: boolean,
    duracionMinutos?: number,
    pesoKg?: number,
    notas?: string,
    calificacion?: number,
    fotoUri?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      let fotoUrl = null;

      if (fotoUri) {
        fotoUrl = await this.subirFotoProgreso(fotoUri, user.id);
      }

      const { data, error } = await supabase
        .from("progreso")
        .insert({
          usuario_id: user.id,
          rutina_id: rutinaId,
          fecha,
          completada,
          duracion_minutos: duracionMinutos,
          peso_kg: pesoKg,
          notas,
          calificacion,
          foto_url: fotoUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, progreso: data };
    } catch (error: any) {
      console.log("❌ Error al registrar progreso:", error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar progreso existente
  async actualizarProgreso(
    id: string,
    completada: boolean,
    duracionMinutos?: number,
    pesoKg?: number,
    notas?: string,
    calificacion?: number,
    fotoUri?: string,
    fotoUrlAnterior?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      let fotoUrl = fotoUrlAnterior;

      if (fotoUri) {
        if (fotoUrlAnterior) {
          await this.eliminarFotoProgreso(fotoUrlAnterior);
        }
        fotoUrl = await this.subirFotoProgreso(fotoUri, user.id);
      }

      const { data, error } = await supabase
        .from("progreso")
        .update({
          completada,
          duracion_minutos: duracionMinutos,
          peso_kg: pesoKg,
          notas,
          calificacion,
          foto_url: fotoUrl,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, progreso: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Eliminar registro de progreso
  async eliminarProgreso(id: string) {
    try {
      const { data: progreso } = await supabase
        .from("progreso")
        .select("foto_url")
        .eq("id", id)
        .single();

      if (progreso?.foto_url) {
        await this.eliminarFotoProgreso(progreso.foto_url);
      }

      const { error } = await supabase
        .from("progreso")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Marcar rutina como completada (rápido)
  async marcarComoCompletada(rutinaId: string, fecha: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const { data, error } = await supabase
        .from("progreso")
        .insert({
          usuario_id: user.id,
          rutina_id: rutinaId,
          fecha,
          completada: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, progreso: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============= GESTIÓN DE FOTOS =============

  private async subirFotoProgreso(uri: string, usuarioId: string): Promise<string | null> {
    try {
      const extension = uri.split(".").pop();
      const nombreArchivo = `${usuarioId}/${Date.now()}.${extension}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from("fotos-progreso")
        .upload(nombreArchivo, arrayBuffer, {
          contentType: `image/${extension}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("fotos-progreso")
        .getPublicUrl(nombreArchivo);

      return urlData.publicUrl;
    } catch (error) {
      console.log("❌ Error al subir foto de progreso:", error);
      return null;
    }
  }

  private async eliminarFotoProgreso(fotoUrl: string): Promise<void> {
    try {
      const urlParts = fotoUrl.split("/");
      const nombreArchivo = urlParts.slice(-2).join("/"); // usuarioId/archivo.jpg

      const { error } = await supabase.storage
        .from("fotos-progreso")
        .remove([nombreArchivo]);

      if (error) {
        console.log("❌ Error al eliminar foto:", error);
      }
    } catch (error) {
      console.log("❌ Error completo al eliminar foto:", error);
    }
  }

  // Seleccionar foto de la galería
  async seleccionarFoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para acceder a tus fotos");
        return null;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("❌ Error al seleccionar foto:", error);
      return null;
    }
  }

  // Tomar foto con la cámara
  async tomarFoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para usar la cámara");
        return null;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("❌ Error al tomar foto:", error);
      return null;
    }
  }
}