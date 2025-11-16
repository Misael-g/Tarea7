export interface Plan {
  id: string;
  nombre: string;
  descripcion?: string;
  entrenador_id: string;
  usuario_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  objetivo?: string;
  notas?: string;
  activo: boolean;
  created_at: string;
  // Datos relacionados
  entrenador?: {
    email: string;
    nombre?: string;
  };
  usuario?: {
    email: string;
    nombre?: string;
  };
}

// Exportar también PlanRutina aquí para evitar importaciones circulares
export interface PlanRutina {
  id: string;
  plan_id: string;
  rutina_id: string;
  dia_semana: number;
  orden: number;
  created_at: string;
  rutina?: {
    id: string;
    titulo: string;
    descripcion?: string;
    entrenador_id: string;
    nivel?: "principiante" | "intermedio" | "avanzado";
    duracion_minutos?: number;
    video_url?: string;
    imagen_url?: string;
    created_at: string;
  };
}