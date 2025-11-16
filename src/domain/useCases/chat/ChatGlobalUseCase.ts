import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/src/data/services/supabaseClient";
import { MensajeGlobal } from "../../models/MensajeGlobal";
import { RealtimeChannel } from "@supabase/supabase-js";

export class ChatGlobalUseCase {
  private channel: RealtimeChannel | null = null;

  async obtenerMensajes(limite: number = 50): Promise<MensajeGlobal[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("mensajes_globales")
        .select(`
          *,
          usuario:usuarios(email, nombre, rol, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) {
        console.error("❌ Error al obtener mensajes:", error);
        throw error;
      }

      const mensajesFormateados = (data || []).map((msg: any) => ({
        id: msg.id,
        contenido: msg.contenido,
        usuario_id: msg.usuario_id,
        foto_url: msg.foto_url,
        leido: msg.leido,
        created_at: msg.created_at,
        usuario: msg.usuario
      }));

      return mensajesFormateados.reverse() as MensajeGlobal[];
    } catch (error) {
      console.error("❌ Error al obtener mensajes:", error);
      return [];
    }
  }

  async enviarMensaje(contenido: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      if (!contenido.trim()) {
        return { success: false, error: "El mensaje está vacío" };
      }

      const { error } = await supabase
        .from("mensajes_globales")
        .insert({
          contenido: contenido.trim(),
          usuario_id: user.id,
          leido: false,
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error("❌ Error al enviar mensaje:", error);
      return { success: false, error: error.message };
    }
  }

  async enviarMensajeConFoto(
    contenido: string,
    fotoUri: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const fotoUrl = await this.subirFoto(fotoUri, user.id);

      if (!fotoUrl) {
        return { success: false, error: "Error al subir la foto" };
      }

      const { error } = await supabase
        .from("mensajes_globales")
        .insert({
          contenido: contenido.trim() || "📷 Foto",
          usuario_id: user.id,
          foto_url: fotoUrl,
          leido: false,
        });

      if (error) {
        await this.eliminarFoto(fotoUrl);
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error("❌ Error al enviar mensaje con foto:", error);
      return { success: false, error: error.message };
    }
  }

  private async subirFoto(uri: string, usuarioId: string): Promise<string | null> {
    try {
      const extension = uri.split(".").pop();
      const nombreArchivo = `${usuarioId}/${Date.now()}.${extension}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from("chat-fotos")
        .upload(nombreArchivo, arrayBuffer, {
          contentType: `image/${extension}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("chat-fotos")
        .getPublicUrl(nombreArchivo);

      return urlData.publicUrl;
    } catch (error) {
      console.error("❌ Error al subir foto:", error);
      return null;
    }
  }

  private async eliminarFoto(fotoUrl: string): Promise<void> {
    try {
      const urlParts = fotoUrl.split("/");
      const nombreArchivo = urlParts.slice(-2).join("/");

      const { error } = await supabase.storage
        .from("chat-fotos")
        .remove([nombreArchivo]);

      if (error) {
        console.error("❌ Error al eliminar foto:", error);
      }
    } catch (error) {
      console.error("❌ Error completo al eliminar foto:", error);
    }
  }

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
      console.error("❌ Error al seleccionar foto:", error);
      return null;
    }
  }

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
      console.error("❌ Error al tomar foto:", error);
      return null;
    }
  }

  async eliminarMensaje(mensajeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const { data: mensaje } = await supabase
        .from("mensajes_globales")
        .select("foto_url, usuario_id")
        .eq("id", mensajeId)
        .single();

      if (!mensaje) {
        return { success: false, error: "Mensaje no encontrado" };
      }

      if (mensaje.usuario_id !== user.id) {
        return { success: false, error: "No tienes permiso para eliminar este mensaje" };
      }

      if (mensaje.foto_url) {
        await this.eliminarFoto(mensaje.foto_url);
      }

      const { error } = await supabase
        .from("mensajes_globales")
        .delete()
        .eq("id", mensajeId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("❌ Error al eliminar mensaje:", error);
      return { success: false, error: error.message };
    }
  }

  suscribirseAMensajes(callback: (mensaje: MensajeGlobal) => void) {
    this.channel = supabase.channel("chat-global");

    this.channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_globales'
        },
        async (payload) => {
          console.log('📨 Nuevo mensaje recibido!', payload.new);

          try {
            const { data, error } = await supabase
              .from("mensajes_globales")
              .select(`
                *,
                usuario:usuarios(email, nombre, rol, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('⚠️ Error al obtener mensaje completo:', error);
              const mensajeFallback: MensajeGlobal = {
                id: payload.new.id,
                contenido: payload.new.contenido,
                usuario_id: payload.new.usuario_id,
                foto_url: payload.new.foto_url,
                leido: payload.new.leido,
                created_at: payload.new.created_at,
                usuario: {
                  email: 'desconocido@usuario.com',
                  rol: 'usuario'
                }
              };
              callback(mensajeFallback);
              return;
            }

            if (data) {
              const mensajeFormateado: MensajeGlobal = {
                id: data.id,
                contenido: data.contenido,
                usuario_id: data.usuario_id,
                foto_url: data.foto_url,
                leido: data.leido,
                created_at: data.created_at,
                usuario: data.usuario || { email: 'desconocido@usuario.com', rol: 'usuario' }
              };
              callback(mensajeFormateado);
            }
          } catch (err) {
            console.error('❌ Error inesperado:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción chat global:', status);
      });

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }
}