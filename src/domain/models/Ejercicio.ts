export interface Ejercicio {
  id: string;
  rutina_id: string;
  nombre: string;
  descripcion?: string;
  series?: number;
  repeticiones?: string;
  descanso_segundos?: number;
  video_url?: string;
  orden: number;
  created_at: string;
}