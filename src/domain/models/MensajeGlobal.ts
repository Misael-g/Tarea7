export interface MensajeGlobal {
  id: string;
  contenido: string;
  usuario_id: string;
  foto_url?: string;
  leido: boolean;
  created_at: string;
  usuario?: {
    email: string;
    nombre?: string;
    rol: string;
    avatar_url?: string;
  };
}