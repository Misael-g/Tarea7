export interface Progreso {
  id: string;
  usuario_id: string;
  rutina_id: string;
  fecha: string;
  completada: boolean;
  duracion_minutos?: number;
  peso_kg?: number;
  notas?: string;
  foto_url?: string;
  calificacion?: number; // 1-5
  created_at: string;
  rutina?: {
    id: string;
    titulo: string;
    nivel?: string;
  };
}