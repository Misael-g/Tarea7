export interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  rol: "entrenador" | "usuario";
  avatar_url?: string;
  created_at: string;
}