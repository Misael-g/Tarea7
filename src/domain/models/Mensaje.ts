export interface Mensaje {
  id: string;
  contenido: string;
  usuario_id: string;
  destinatario_id?: string;
  plan_id?: string;
  leido: boolean;
  created_at: string;
  usuario?: {
    email: string;
    nombre?: string;
    rol: string;
  };
}