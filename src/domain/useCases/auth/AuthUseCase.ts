import { supabase } from "@/src/data/services/supabaseClient";
import { Usuario } from "../../models/Usuario";

export class AuthUseCase {
  // Registrar nuevo usuario
  async registrar(email: string, password: string, rol: "entrenador" | "usuario") {
    try {
      console.log("🔵 Iniciando registro:", { email, rol });

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            rol: rol,
          },
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        console.log("❌ Error en auth.signUp:", authError);
        throw authError;
      }

      if (!authData.user) {
        console.log("❌ No se obtuvo usuario en la respuesta");
        throw new Error("No se pudo crear el usuario");
      }

      console.log("✅ Usuario creado en Auth:", {
        id: authData.user.id,
        email: authData.user.email,
        metadata: authData.user.user_metadata,
      });

      const needsConfirmation = authData.user.identities && authData.user.identities.length === 0;
      console.log("📧 Necesita confirmación de email:", needsConfirmation);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (usuarioError) {
        console.log("⚠️ Usuario no encontrado en tabla usuarios:", usuarioError.message);
      } else {
        console.log("✅ Usuario encontrado en tabla usuarios:", usuarioData);
      }

      return {
        success: true,
        user: authData.user,
        needsEmailConfirmation: needsConfirmation
      };
    } catch (error: any) {
      console.log("❌ Error en registrar:", error);
      return { success: false, error: error.message };
    }
  }

  // Iniciar sesión
  async iniciarSesion(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  async cerrarSesion() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Obtener usuario actual
  async obtenerUsuarioActual(): Promise<Usuario | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as Usuario;
    } catch (error) {
      console.log("Error al obtener usuario:", error);
      return null;
    }
  }

  // Escuchar cambios de autenticación
  onAuthStateChange(callback: (usuario: Usuario | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const usuario = await this.obtenerUsuarioActual();
        callback(usuario);
      } else {
        callback(null);
      }
    });
  }
}