import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/src/data/services/supabaseClient";
import { Rutina, Ejercicio } from "../../models/Rutina";

export class RoutinesUseCase {
  // Obtener rutinas (entrenador ve las suyas, usuario ve las asignadas)
  async obtenerRutinas(): Promise<Rutina[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

      let query = supabase.from("rutinas").select("*, ejercicios(*)");

      if (usuario?.rol === "entrenador") {
        query = query.eq("entrenador_id", user.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("❌ Error al obtener rutinas:", error);
      return [];
    }
  }

  // Obtener una rutina por ID con ejercicios
  async obtenerRutinaPorId(rutinaId: string): Promise<Rutina | null> {
    try {
      const { data, error } = await supabase
        .from("rutinas")
        .select("*, ejercicios(*)")
        .eq("id", rutinaId)
        .single();

      if (error) throw error;
      return data as Rutina;
    } catch (error) {
      console.log("❌ Error al obtener rutina:", error);
      return null;
    }
  }

  // Crear rutina
  async crearRutina(
    titulo: string,
    descripcion: string,
    nivel: "principiante" | "intermedio" | "avanzado",
    duracionMinutos: number,
    entrenadorId: string,
    videoUri?: string,
    imagenUri?: string
  ) {
    try {
      let videoUrl = null;
      let imagenUrl = null;

      if (videoUri) {
        videoUrl = await this.subirVideo(videoUri);
      }

      if (imagenUri) {
        imagenUrl = await this.subirImagen(imagenUri);
      }

      const { data, error } = await supabase
        .from("rutinas")
        .insert({
          titulo,
          descripcion,
          nivel,
          duracion_minutos: duracionMinutos,
          entrenador_id: entrenadorId,
          video_url: videoUrl,
          imagen_url: imagenUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, rutina: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Actualizar rutina
  async actualizarRutina(
    id: string,
    titulo: string,
    descripcion: string,
    nivel: "principiante" | "intermedio" | "avanzado",
    duracionMinutos: number,
    videoUri?: string,
    imagenUri?: string,
    videoUrlAnterior?: string,
    imagenUrlAnterior?: string
  ) {
    try {
      let videoUrl = videoUrlAnterior;
      let imagenUrl = imagenUrlAnterior;

      if (videoUri) {
        if (videoUrlAnterior) {
          await this.eliminarVideo(videoUrlAnterior);
        }
        videoUrl = await this.subirVideo(videoUri);
      }

      if (imagenUri) {
        if (imagenUrlAnterior) {
          await this.eliminarImagen(imagenUrlAnterior);
        }
        imagenUrl = await this.subirImagen(imagenUri);
      }

      const { data, error } = await supabase
        .from("rutinas")
        .update({
          titulo,
          descripcion,
          nivel,
          duracion_minutos: duracionMinutos,
          video_url: videoUrl,
          imagen_url: imagenUrl,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, rutina: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Eliminar rutina
  async eliminarRutina(id: string) {
    try {
      const { data: rutina } = await supabase
        .from("rutinas")
        .select("video_url, imagen_url")
        .eq("id", id)
        .single();

      if (rutina?.video_url) {
        await this.eliminarVideo(rutina.video_url);
      }

      if (rutina?.imagen_url) {
        await this.eliminarImagen(rutina.imagen_url);
      }

      const { error } = await supabase.from("rutinas").delete().eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============= GESTIÓN DE EJERCICIOS =============

  // Agregar ejercicio a rutina
  async agregarEjercicio(
    rutinaId: string,
    nombre: string,
    descripcion: string,
    series: number,
    repeticiones: string,
    descansoSegundos: number,
    orden: number,
    videoUri?: string
  ) {
    try {
      let videoUrl = null;

      if (videoUri) {
        videoUrl = await this.subirVideo(videoUri);
      }

      const { data, error } = await supabase
        .from("ejercicios")
        .insert({
          rutina_id: rutinaId,
          nombre,
          descripcion,
          series,
          repeticiones,
          descanso_segundos: descansoSegundos,
          orden,
          video_url: videoUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, ejercicio: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Actualizar ejercicio
  async actualizarEjercicio(
    id: string,
    nombre: string,
    descripcion: string,
    series: number,
    repeticiones: string,
    descansoSegundos: number,
    videoUri?: string,
    videoUrlAnterior?: string
  ) {
    try {
      let videoUrl = videoUrlAnterior;

      if (videoUri) {
        if (videoUrlAnterior) {
          await this.eliminarVideo(videoUrlAnterior);
        }
        videoUrl = await this.subirVideo(videoUri);
      }

      const { data, error } = await supabase
        .from("ejercicios")
        .update({
          nombre,
          descripcion,
          series,
          repeticiones,
          descanso_segundos: descansoSegundos,
          video_url: videoUrl,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, ejercicio: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Eliminar ejercicio
  async eliminarEjercicio(id: string) {
    try {
      const { data: ejercicio } = await supabase
        .from("ejercicios")
        .select("video_url")
        .eq("id", id)
        .single();

      if (ejercicio?.video_url) {
        await this.eliminarVideo(ejercicio.video_url);
      }

      const { error } = await supabase.from("ejercicios").delete().eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============= GESTIÓN DE ARCHIVOS =============

  private async subirVideo(uri: string): Promise<string | null> {
    try {
      const extension = uri.split(".").pop();
      const nombreArchivo = `${Date.now()}.${extension}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from("videos-ejercicios")
        .upload(nombreArchivo, arrayBuffer, {
          contentType: `video/${extension}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("videos-ejercicios")
        .getPublicUrl(nombreArchivo);

      return urlData.publicUrl;
    } catch (error) {
      console.log("❌ Error al subir video:", error);
      return null;
    }
  }

  private async subirImagen(uri: string): Promise<string | null> {
    try {
      const extension = uri.split(".").pop();
      const nombreArchivo = `${Date.now()}.${extension}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from("videos-ejercicios")
        .upload(nombreArchivo, arrayBuffer, {
          contentType: `image/${extension}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("videos-ejercicios")
        .getPublicUrl(nombreArchivo);

      return urlData.publicUrl;
    } catch (error) {
      console.log("❌ Error al subir imagen:", error);
      return null;
    }
  }

  private async eliminarVideo(videoUrl: string): Promise<void> {
    try {
      const urlParts = videoUrl.split("/");
      const nombreArchivo = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from("videos-ejercicios")
        .remove([nombreArchivo]);

      if (error) {
        console.log("❌ Error al eliminar video:", error);
      }
    } catch (error) {
      console.log("❌ Error completo al eliminar video:", error);
    }
  }

  private async eliminarImagen(imagenUrl: string): Promise<void> {
    try {
      const urlParts = imagenUrl.split("/");
      const nombreArchivo = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from("videos-ejercicios")
        .remove([nombreArchivo]);

      if (error) {
        console.log("❌ Error al eliminar imagen:", error);
      }
    } catch (error) {
      console.log("❌ Error completo al eliminar imagen:", error);
    }
  }

  // Seleccionar video/imagen de la galería
  async seleccionarArchivo(tipo: "video" | "imagen"): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para acceder a tus archivos");
        return null;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: tipo === "video" 
          ? ImagePicker.MediaTypeOptions.Videos 
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("❌ Error al seleccionar archivo:", error);
      return null;
    }
  }

  // Grabar video con la cámara
  async grabarVideo(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para usar la cámara");
        return null;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("❌ Error al grabar video:", error);
      return null;
    }
  }
}