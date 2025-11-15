import { supabase } from "@/src/data/services/supabaseClient";
import { Mensaje } from "../../models/Mensaje";
import { RealtimeChannel } from "@supabase/supabase-js";

export class ChatUseCase {
  private channel: RealtimeChannel | null = null;

  // ============= OBTENER MENSAJES =============

  // Obtener mensajes de una conversación entre dos usuarios
  async obtenerMensajes(destinatarioId: string, limite: number = 50): Promise<Mensaje[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("mensajes")
        .select(`
          *,
          usuario:usuarios(email, nombre, rol)
        `)
        .or(`and(usuario_id.eq.${user.id},destinatario_id.eq.${destinatarioId}),and(usuario_id.eq.${destinatarioId},destinatario_id.eq.${user.id})`)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) {
        console.error("❌ Error al obtener mensajes:", error);
        throw error;
      }

      console.log("📥 Mensajes obtenidos:", data?.length || 0);

      // Mapear y ordenar del más antiguo al más reciente
      const mensajesFormateados = (data || []).map((msg: any) => ({
        id: msg.id,
        contenido: msg.contenido,
        usuario_id: msg.usuario_id,
        destinatario_id: msg.destinatario_id,
        plan_id: msg.plan_id,
        leido: msg.leido,
        created_at: msg.created_at,
        usuario: msg.usuario
      }));

      return mensajesFormateados.reverse() as Mensaje[];
    } catch (error) {
      console.error("❌ Error al obtener mensajes:", error);
      return [];
    }
  }

  // Obtener mensajes de un plan específico
  async obtenerMensajesPlan(planId: string, limite: number = 50): Promise<Mensaje[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("mensajes")
        .select(`
          *,
          usuario:usuarios(email, nombre, rol)
        `)
        .eq("plan_id", planId)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) throw error;

      const mensajesFormateados = (data || []).map((msg: any) => ({
        id: msg.id,
        contenido: msg.contenido,
        usuario_id: msg.usuario_id,
        destinatario_id: msg.destinatario_id,
        plan_id: msg.plan_id,
        leido: msg.leido,
        created_at: msg.created_at,
        usuario: msg.usuario
      }));

      return mensajesFormateados.reverse() as Mensaje[];
    } catch (error) {
      console.error("❌ Error al obtener mensajes del plan:", error);
      return [];
    }
  }

  // Obtener lista de conversaciones (últimos mensajes con cada persona)
  async obtenerConversaciones() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Obtener todos los mensajes donde el usuario participa
      const { data, error } = await supabase
        .from("mensajes")
        .select(`
          *,
          usuario:usuarios!mensajes_usuario_id_fkey(id, email, nombre, rol, avatar_url),
          destinatario:usuarios!mensajes_destinatario_id_fkey(id, email, nombre, rol, avatar_url)
        `)
        .or(`usuario_id.eq.${user.id},destinatario_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Agrupar por conversación (con cada persona única)
      const conversacionesMap = new Map();

      data?.forEach((mensaje: any) => {
        const otroUsuarioId = mensaje.usuario_id === user.id 
          ? mensaje.destinatario_id 
          : mensaje.usuario_id;

        if (!conversacionesMap.has(otroUsuarioId)) {
          const otroUsuario = mensaje.usuario_id === user.id 
            ? mensaje.destinatario 
            : mensaje.usuario;

          conversacionesMap.set(otroUsuarioId, {
            usuarioId: otroUsuarioId,
            usuario: otroUsuario,
            ultimoMensaje: mensaje,
            noLeidos: 0,
          });
        }
      });

      // Contar mensajes no leídos
      for (const [usuarioId, conversacion] of conversacionesMap) {
        const { count } = await supabase
          .from("mensajes")
          .select("*", { count: "exact", head: true })
          .eq("usuario_id", usuarioId)
          .eq("destinatario_id", user.id)
          .eq("leido", false);

        conversacion.noLeidos = count || 0;
      }

      return Array.from(conversacionesMap.values());
    } catch (error) {
      console.error("❌ Error al obtener conversaciones:", error);
      return [];
    }
  }

  // Contar mensajes no leídos
  async contarMensajesNoLeidos(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("mensajes")
        .select("*", { count: "exact", head: true })
        .eq("destinatario_id", user.id)
        .eq("leido", false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("❌ Error al contar mensajes no leídos:", error);
      return 0;
    }
  }

  // ============= ENVIAR MENSAJES =============

  // Enviar mensaje
  async enviarMensaje(
    contenido: string,
    destinatarioId: string,
    planId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const { error } = await supabase
        .from("mensajes")
        .insert({
          contenido,
          usuario_id: user.id,
          destinatario_id: destinatarioId,
          plan_id: planId,
          leido: false,
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error("❌ Error al enviar mensaje:", error);
      return { success: false, error: error.message };
    }
  }

  // Marcar mensajes como leídos
  async marcarComoLeidos(usuarioId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Usuario no autenticado" };

      const { error } = await supabase
        .from("mensajes")
        .update({ leido: true })
        .eq("usuario_id", usuarioId)
        .eq("destinatario_id", user.id)
        .eq("leido", false);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============= REALTIME =============

  // Suscribirse a nuevos mensajes en tiempo real
  suscribirseAMensajes(destinatarioId: string, callback: (mensaje: Mensaje) => void) {
    const { data: { user } } = supabase.auth.getUser();
    
    user.then((userData) => {
      if (!userData.user) return;

      this.channel = supabase.channel(`chat-${userData.user.id}-${destinatarioId}`);

      this.channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensajes',
            filter: `or(and(usuario_id.eq.${userData.user.id},destinatario_id.eq.${destinatarioId}),and(usuario_id.eq.${destinatarioId},destinatario_id.eq.${userData.user.id}))`
          },
          async (payload) => {
            console.log('📨 Nuevo mensaje recibido!', payload.new);

            try {
              const { data, error } = await supabase
                .from("mensajes")
                .select(`
                  *,
                  usuario:usuarios(email, nombre, rol)
                `)
                .eq('id', payload.new.id)
                .single();

              if (error) {
                console.error('⚠️ Error al obtener mensaje completo:', error);

                const mensajeFallback: Mensaje = {
                  id: payload.new.id,
                  contenido: payload.new.contenido,
                  usuario_id: payload.new.usuario_id,
                  destinatario_id: payload.new.destinatario_id,
                  plan_id: payload.new.plan_id,
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
                const mensajeFormateado: Mensaje = {
                  id: data.id,
                  contenido: data.contenido,
                  usuario_id: data.usuario_id,
                  destinatario_id: data.destinatario_id,
                  plan_id: data.plan_id,
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
          console.log('📡 Estado de suscripción chat:', status);
        });
    });

    // Retornar función para desuscribirse
    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  // Suscribirse a mensajes de un plan
  suscribirseAMensajesPlan(planId: string, callback: (mensaje: Mensaje) => void) {
    this.channel = supabase.channel(`plan-chat-${planId}`);

    this.channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `plan_id=eq.${planId}`
        },
        async (payload) => {
          console.log('📨 Nuevo mensaje en plan!', payload.new);

          try {
            const { data, error } = await supabase
              .from("mensajes")
              .select(`
                *,
                usuario:usuarios(email, nombre, rol)
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && data) {
              const mensajeFormateado: Mensaje = {
                id: data.id,
                contenido: data.contenido,
                usuario_id: data.usuario_id,
                destinatario_id: data.destinatario_id,
                plan_id: data.plan_id,
                leido: data.leido,
                created_at: data.created_at,
                usuario: data.usuario
              };

              callback(mensajeFormateado);
            }
          } catch (err) {
            console.error('❌ Error al procesar mensaje:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción plan chat:', status);
      });

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  // Eliminar mensaje (opcional)
  async eliminarMensaje(mensajeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("mensajes")
        .delete()
        .eq('id', mensajeId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("❌ Error al eliminar mensaje:", error);
      return { success: false, error: error.message };
    }
  }
}