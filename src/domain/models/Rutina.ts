export interface Rutina {
  id: string;
  titulo: string;
  descripcion?: string;
  entrenador_id: string;
  nivel?: "principiante" | "intermedio" | "avanzado";
  duracion_minutos?: number;
  video_url?: string;
  imagen_url?: string;
  created_at: string;
  ejercicios?: Ejercicio[];
}